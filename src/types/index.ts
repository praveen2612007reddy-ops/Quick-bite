export type Category = 'breakfast' | 'lunch' | 'dinner' | 'snacks' | 'beverages' | 'desserts';

export type AvailabilityStatus = 'available' | 'limited' | 'unavailable';

export type OrderStatus = 'placed' | 'confirmed' | 'preparing' | 'ready' | 'collected' | 'cancelled';

export interface MenuItem {
  id: number;
  name: string;
  description: string;
  price: string;
  category: Category;
  imageUrl: string;
  availabilityStatus: AvailabilityStatus;
  isVegetarian: boolean;
  isVegan: boolean;
  calories: number | null;
  preparationTimeMinutes: number;
  dailyLimit: number | null;
  rating: string | null;
  ratingCount: number | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface OrderItem {
  id?: number;
  orderId?: number;
  menuItemId: number;
  menuItemName: string;
  quantity: number;
  priceAtOrderTime: string;
  specialInstructions?: string;
}

export interface Order {
  id: number;
  orderNumber: string;
  studentId: string;
  status: OrderStatus;
  totalPrice: string;
  pickupTime: string;
  notes?: string;
  cancellationReason?: string;
  createdAt: string;
  confirmedAt?: string;
  readyAt?: string;
  collectedAt?: string;
  items?: OrderItem[];
  student?: {
    id?: string;
    fullName: string;
    email: string;
    contactNumber?: string;
  };
}

export interface CartItem {
  menuItem: MenuItem;
  quantity: number;
  specialInstructions: string;
}

export interface Review {
  id: number;
  orderId?: number | null;
  studentId: string;
  menuItemId: number;
  rating: number;
  comment: string | null;
  createdAt: string;
}

export interface AnalyticsData {
  totalOrders: number;
  totalRevenue: string;
  todayOrdersCount: number;
  todayRevenue: string;
  statusCounts: Record<OrderStatus, number>;
  categoryCounts: Record<string, number>;
  itemsRunningLowCount: number;
  itemsRunningLow: MenuItem[];
  busiestHour: string;
  averagePrepMinutes: number;
}
