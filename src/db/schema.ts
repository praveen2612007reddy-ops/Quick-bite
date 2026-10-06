import { relations } from 'drizzle-orm';
import {
  boolean,
  integer,
  numeric,
  pgTable,
  serial,
  text,
  timestamp,
} from 'drizzle-orm/pg-core';

// Users table - maps id to Firebase Auth UID
export const users = pgTable('users', {
  id: text('id').primaryKey(), // Firebase Auth UID
  email: text('email').notNull().unique(),
  fullName: text('full_name').notNull().default(''),
  role: text('role').notNull().default('student'), // 'student', 'staff', 'admin'
  contactNumber: text('contact_number'),
  createdAt: timestamp('created_at').defaultNow(),
  isActive: boolean('is_active').default(true),
});

// Menu items table
export const menuItems = pgTable('menu_items', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description').notNull().default(''),
  price: numeric('price', { precision: 10, scale: 2 }).notNull(),
  category: text('category').notNull(), // 'breakfast', 'lunch', 'snacks', 'beverages', 'desserts'
  imageUrl: text('image_url').notNull().default(''),
  availabilityStatus: text('availability_status').notNull().default('available'), // 'available', 'limited', 'unavailable'
  isVegetarian: boolean('is_vegetarian').notNull().default(false),
  isVegan: boolean('is_vegan').notNull().default(false),
  calories: integer('calories'),
  preparationTimeMinutes: integer('preparation_time_minutes').notNull().default(15),
  dailyLimit: integer('daily_limit'),
  rating: numeric('rating', { precision: 3, scale: 1 }).default('4.8'),
  ratingCount: integer('rating_count').default(10),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Orders table
export const orders = pgTable('orders', {
  id: serial('id').primaryKey(),
  orderNumber: text('order_number').notNull().unique(), // ORD-DDMMYY-XXXX
  studentId: text('student_id')
    .references(() => users.id)
    .notNull(),
  status: text('status').notNull().default('placed'), // 'placed', 'confirmed', 'preparing', 'ready', 'collected', 'cancelled'
  totalPrice: numeric('total_price', { precision: 10, scale: 2 }).notNull(),
  pickupTime: timestamp('pickup_time').notNull(),
  notes: text('notes'),
  cancellationReason: text('cancellation_reason'),
  createdAt: timestamp('created_at').defaultNow(),
  confirmedAt: timestamp('confirmed_at'),
  readyAt: timestamp('ready_at'),
  collectedAt: timestamp('collected_at'),
});

// Order items table
export const orderItems = pgTable('order_items', {
  id: serial('id').primaryKey(),
  orderId: integer('order_id')
    .references(() => orders.id, { onDelete: 'cascade' })
    .notNull(),
  menuItemId: integer('menu_item_id')
    .references(() => menuItems.id)
    .notNull(),
  menuItemName: text('menu_item_name').notNull(),
  quantity: integer('quantity').notNull().default(1),
  priceAtOrderTime: numeric('price_at_order_time', { precision: 10, scale: 2 }).notNull(),
  specialInstructions: text('special_instructions'),
});

// Wishlists table
export const wishlists = pgTable('wishlists', {
  id: serial('id').primaryKey(),
  studentId: text('student_id')
    .references(() => users.id)
    .notNull(),
  menuItemId: integer('menu_item_id')
    .references(() => menuItems.id)
    .notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

// Reviews table
export const reviews = pgTable('reviews', {
  id: serial('id').primaryKey(),
  orderId: integer('order_id').references(() => orders.id),
  studentId: text('student_id')
    .references(() => users.id)
    .notNull(),
  menuItemId: integer('menu_item_id')
    .references(() => menuItems.id)
    .notNull(),
  rating: integer('rating').notNull(),
  comment: text('comment'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  orders: many(orders),
  wishlists: many(wishlists),
  reviews: many(reviews),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  student: one(users, {
    fields: [orders.studentId],
    references: [users.id],
  }),
  items: many(orderItems),
  reviews: many(reviews),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.id],
  }),
  menuItem: one(menuItems, {
    fields: [orderItems.menuItemId],
    references: [menuItems.id],
  }),
}));

export const menuItemsRelations = relations(menuItems, ({ many }) => ({
  orderItems: many(orderItems),
  wishlists: many(wishlists),
  reviews: many(reviews),
}));
