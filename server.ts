import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { db } from './src/db/index.ts';
import { users, menuItems, orders, orderItems, wishlists, reviews } from './src/db/schema.ts';
import { eq, desc, asc, and, sql, inArray } from 'drizzle-orm';
import { adminAuth } from './src/lib/firebase-admin.ts';
import { getOrCreateUser, getUserById, updateUserProfile } from './src/db/users.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());

// Helper middleware to extract optional or required user
async function authenticateUser(req: Request, res: Response, next: Function) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split('Bearer ')[1];
    try {
      const decoded = await adminAuth.verifyIdToken(token);
      (req as any).user = decoded;
      
      // Get or sync DB user
      let dbUser = await getUserById(decoded.uid);
      if (!dbUser) {
        dbUser = await getOrCreateUser(
          decoded.uid,
          decoded.email || 'user@school.edu',
          decoded.name || '',
          'student'
        );
      }
      (req as any).dbUser = dbUser;
    } catch (err) {
      console.warn('Firebase token verification error (proceeding anonymously):', err);
    }
  }
  next();
}

app.use(authenticateUser);

// --- User Profile & Auth APIs ---

app.get('/api/auth/me', async (req: Request, res: Response) => {
  const user = (req as any).user;
  const dbUser = (req as any).dbUser;
  if (!user || !dbUser) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  res.json({ user, dbUser });
});

app.post('/api/auth/profile', async (req: Request, res: Response) => {
  const user = (req as any).user;
  if (!user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  const { fullName, contactNumber, role } = req.body;
  try {
    const updated = await updateUserProfile(user.uid, {
      ...(fullName !== undefined ? { fullName } : {}),
      ...(contactNumber !== undefined ? { contactNumber } : {}),
      ...(role !== undefined ? { role } : {}),
    });
    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to update profile' });
  }
});

// --- Menu Items APIs ---

app.get('/api/menu', async (req: Request, res: Response) => {
  try {
    const { category, search, vegetarian, vegan, availability, sortBy } = req.query;

    let query = db.select().from(menuItems);

    const conditions: any[] = [];

    if (category && category !== 'all') {
      conditions.push(eq(menuItems.category, String(category)));
    }
    if (availability && availability !== 'all') {
      conditions.push(eq(menuItems.availabilityStatus, String(availability)));
    }
    if (vegetarian === 'true') {
      conditions.push(eq(menuItems.isVegetarian, true));
    }
    if (vegan === 'true') {
      conditions.push(eq(menuItems.isVegan, true));
    }

    let items;
    if (conditions.length > 0) {
      items = await db.select().from(menuItems).where(and(...conditions));
    } else {
      items = await db.select().from(menuItems);
    }

    // Filter by search string if provided
    if (search && typeof search === 'string' && search.trim()) {
      const q = search.toLowerCase();
      items = items.filter(
        item =>
          item.name.toLowerCase().includes(q) ||
          item.description.toLowerCase().includes(q) ||
          item.category.toLowerCase().includes(q)
      );
    }

    // Sorting
    if (sortBy === 'price_asc') {
      items.sort((a, b) => Number(a.price) - Number(b.price));
    } else if (sortBy === 'price_desc') {
      items.sort((a, b) => Number(b.price) - Number(a.price));
    } else if (sortBy === 'prep_time') {
      items.sort((a, b) => a.preparationTimeMinutes - b.preparationTimeMinutes);
    } else if (sortBy === 'rating') {
      items.sort((a, b) => Number(b.rating || 0) - Number(a.rating || 0));
    } else {
      items.sort((a, b) => a.id - b.id);
    }

    res.json(items);
  } catch (error: any) {
    console.error('Error fetching menu items:', error);
    res.status(500).json({ error: 'Failed to fetch menu items' });
  }
});

app.get('/api/menu/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    const items = await db.select().from(menuItems).where(eq(menuItems.id, id));
    if (items.length === 0) {
      return res.status(404).json({ error: 'Item not found' });
    }
    res.json(items[0]);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch item' });
  }
});

// Create menu item (Staff/Admin)
app.post('/api/menu', async (req: Request, res: Response) => {
  try {
    const {
      name,
      description,
      price,
      category,
      imageUrl,
      availabilityStatus,
      isVegetarian,
      isVegan,
      calories,
      preparationTimeMinutes,
      dailyLimit,
    } = req.body;

    if (!name || price === undefined || !category) {
      return res.status(400).json({ error: 'Name, price, and category are required' });
    }

    const inserted = await db
      .insert(menuItems)
      .values({
        name,
        description: description || '',
        price: String(price),
        category,
        imageUrl: imageUrl || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&auto=format&fit=crop&q=80',
        availabilityStatus: availabilityStatus || 'available',
        isVegetarian: Boolean(isVegetarian),
        isVegan: Boolean(isVegan),
        calories: calories ? parseInt(calories, 10) : null,
        preparationTimeMinutes: preparationTimeMinutes ? parseInt(preparationTimeMinutes, 10) : 15,
        dailyLimit: dailyLimit ? parseInt(dailyLimit, 10) : null,
        rating: '5.0',
        ratingCount: 1,
      })
      .returning();

    res.status(201).json(inserted[0]);
  } catch (error: any) {
    console.error('Failed to create menu item:', error);
    res.status(500).json({ error: error.message || 'Failed to create item' });
  }
});

// Edit menu item
app.put('/api/menu/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    const {
      name,
      description,
      price,
      category,
      imageUrl,
      availabilityStatus,
      isVegetarian,
      isVegan,
      calories,
      preparationTimeMinutes,
      dailyLimit,
    } = req.body;

    const updated = await db
      .update(menuItems)
      .set({
        ...(name ? { name } : {}),
        ...(description !== undefined ? { description } : {}),
        ...(price !== undefined ? { price: String(price) } : {}),
        ...(category ? { category } : {}),
        ...(imageUrl ? { imageUrl } : {}),
        ...(availabilityStatus ? { availabilityStatus } : {}),
        ...(isVegetarian !== undefined ? { isVegetarian: Boolean(isVegetarian) } : {}),
        ...(isVegan !== undefined ? { isVegan: Boolean(isVegan) } : {}),
        ...(calories !== undefined ? { calories: calories ? parseInt(calories, 10) : null } : {}),
        ...(preparationTimeMinutes !== undefined
          ? { preparationTimeMinutes: parseInt(preparationTimeMinutes, 10) }
          : {}),
        ...(dailyLimit !== undefined ? { dailyLimit: dailyLimit ? parseInt(dailyLimit, 10) : null } : {}),
        updatedAt: new Date(),
      })
      .where(eq(menuItems.id, id))
      .returning();

    if (updated.length === 0) {
      return res.status(404).json({ error: 'Item not found' });
    }
    res.json(updated[0]);
  } catch (error: any) {
    console.error('Failed to update menu item:', error);
    res.status(500).json({ error: error.message || 'Failed to update item' });
  }
});

// Quick toggle availability status
app.patch('/api/menu/:id/availability', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { availabilityStatus } = req.body;

    if (!['available', 'limited', 'unavailable'].includes(availabilityStatus)) {
      return res.status(400).json({ error: 'Invalid availability status' });
    }

    const updated = await db
      .update(menuItems)
      .set({ availabilityStatus, updatedAt: new Date() })
      .where(eq(menuItems.id, id))
      .returning();

    if (updated.length === 0) {
      return res.status(404).json({ error: 'Item not found' });
    }
    res.json(updated[0]);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to update status' });
  }
});

// Delete menu item
app.delete('/api/menu/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    await db.delete(menuItems).where(eq(menuItems.id, id));
    res.json({ success: true, message: 'Item deleted' });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to delete item' });
  }
});

// --- Orders APIs ---

// Helper to generate unique order number: "ORD-DDMMYY-XXXX"
function generateOrderNumber(): string {
  const now = new Date();
  const day = String(now.getDate()).padStart(2, '0');
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const year = String(now.getFullYear()).slice(-2);
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  return `ORD-${day}${month}${year}-${randomSuffix}`;
}

// Create an order
app.post('/api/orders', async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const dbUser = (req as any).dbUser;

    const {
      items, // array of { menuItemId, quantity, specialInstructions }
      pickupTime,
      notes,
      studentName,
      studentEmail,
    } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Order must contain at least one item' });
    }
    if (!pickupTime) {
      return res.status(400).json({ error: 'Pickup time is required' });
    }

    // Determine student ID
    let studentId = user?.uid;
    if (!studentId) {
      // In guest/preview mode, create or use guest user
      const guestEmail = studentEmail || 'guest.student@canteen.edu';
      const guestUser = await getOrCreateUser(
        'guest_' + Date.now(),
        guestEmail,
        studentName || 'Guest Student',
        'student'
      );
      studentId = guestUser.id;
    }

    // Fetch menu items to calculate accurate prices
    const itemIds = items.map(i => i.menuItemId);
    const menuRecords = await db
      .select()
      .from(menuItems)
      .where(inArray(menuItems.id, itemIds));

    const menuMap = new Map(menuRecords.map(m => [m.id, m]));

    let calculatedTotal = 0;
    const orderItemsToInsert: any[] = [];

    for (const item of items) {
      const menuItem = menuMap.get(item.menuItemId);
      if (!menuItem) {
        return res.status(400).json({ error: `Menu item #${item.menuItemId} not found` });
      }
      if (menuItem.availabilityStatus === 'unavailable') {
        return res.status(400).json({ error: `"${menuItem.name}" is currently unavailable` });
      }

      const itemPrice = Number(menuItem.price);
      const qty = Math.max(1, parseInt(item.quantity, 10) || 1);
      calculatedTotal += itemPrice * qty;

      orderItemsToInsert.push({
        menuItemId: menuItem.id,
        menuItemName: menuItem.name,
        quantity: qty,
        priceAtOrderTime: String(itemPrice),
        specialInstructions: item.specialInstructions || '',
      });
    }

    const orderNumber = generateOrderNumber();

    // Insert order in database
    const createdOrders = await db
      .insert(orders)
      .values({
        orderNumber,
        studentId,
        status: 'placed',
        totalPrice: calculatedTotal.toFixed(2),
        pickupTime: new Date(pickupTime),
        notes: notes || '',
        createdAt: new Date(),
      })
      .returning();

    const createdOrder = createdOrders[0];

    // Insert order items
    for (const itemRow of orderItemsToInsert) {
      await db.insert(orderItems).values({
        orderId: createdOrder.id,
        ...itemRow,
      });
    }

    res.status(201).json({
      ...createdOrder,
      items: orderItemsToInsert,
    });
  } catch (error: any) {
    console.error('Error creating order:', error);
    res.status(500).json({ error: error.message || 'Failed to place order' });
  }
});

// List orders (with role/student filtering)
app.get('/api/orders', async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const dbUser = (req as any).dbUser;
    const { status, search, limit } = req.query;

    const isStaff = dbUser?.role === 'staff' || dbUser?.role === 'admin';

    let orderList = await db.select().from(orders).orderBy(desc(orders.createdAt));

    // If student, filter by student ID unless query is for staff dashboard
    if (!isStaff && req.query.view !== 'staff') {
      if (user?.uid) {
        orderList = orderList.filter(o => o.studentId === user.uid);
      }
    }

    if (status && status !== 'all') {
      orderList = orderList.filter(o => o.status === status);
    }

    if (search && typeof search === 'string' && search.trim()) {
      const q = search.toLowerCase();
      orderList = orderList.filter(o => o.orderNumber.toLowerCase().includes(q));
    }

    if (limit) {
      orderList = orderList.slice(0, parseInt(String(limit), 10));
    }

    // Attach items & student info to each order
    const orderIds = orderList.map(o => o.id);
    let allItems: any[] = [];
    if (orderIds.length > 0) {
      allItems = await db
        .select()
        .from(orderItems)
        .where(inArray(orderItems.orderId, orderIds));
    }

    // Attach student names
    const studentIds = Array.from(new Set(orderList.map(o => o.studentId)));
    let studentMap = new Map();
    if (studentIds.length > 0) {
      const students = await db
        .select()
        .from(users)
        .where(inArray(users.id, studentIds));
      studentMap = new Map(students.map(s => [s.id, s]));
    }

    const itemsByOrder = new Map<number, any[]>();
    for (const itm of allItems) {
      if (!itemsByOrder.has(itm.orderId)) {
        itemsByOrder.set(itm.orderId, []);
      }
      itemsByOrder.get(itm.orderId)!.push(itm);
    }

    const enrichedOrders = orderList.map(o => ({
      ...o,
      items: itemsByOrder.get(o.id) || [],
      student: studentMap.get(o.studentId) || { fullName: 'Student', email: 'student@school.edu' },
    }));

    res.json(enrichedOrders);
  } catch (error: any) {
    console.error('Error listing orders:', error);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// Get single order by order number or id
app.get('/api/orders/:identifier', async (req: Request, res: Response) => {
  try {
    const { identifier } = req.params;
    let foundOrder;

    if (identifier.startsWith('ORD-')) {
      const result = await db.select().from(orders).where(eq(orders.orderNumber, identifier));
      foundOrder = result[0];
    } else {
      const id = parseInt(identifier, 10);
      if (!isNaN(id)) {
        const result = await db.select().from(orders).where(eq(orders.id, id));
        foundOrder = result[0];
      }
    }

    if (!foundOrder) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const items = await db.select().from(orderItems).where(eq(orderItems.orderId, foundOrder.id));
    const student = await db.select().from(users).where(eq(users.id, foundOrder.studentId));

    res.json({
      ...foundOrder,
      items,
      student: student[0] || null,
    });
  } catch (error: any) {
    console.error('Error fetching order:', error);
    res.status(500).json({ error: 'Failed to fetch order' });
  }
});

// Update order status (Staff / student cancel)
app.patch('/api/orders/:id/status', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { status, cancellationReason } = req.body;

    const validStatuses = ['placed', 'confirmed', 'preparing', 'ready', 'collected', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid order status' });
    }

    const updateData: any = { status };

    const now = new Date();
    if (status === 'confirmed') updateData.confirmedAt = now;
    if (status === 'ready') updateData.readyAt = now;
    if (status === 'collected') updateData.collectedAt = now;
    if (status === 'cancelled') {
      updateData.cancellationReason = cancellationReason || 'Cancelled by staff/student';
    }

    const updated = await db
      .update(orders)
      .set(updateData)
      .where(eq(orders.id, id))
      .returning();

    if (updated.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.json(updated[0]);
  } catch (error: any) {
    console.error('Failed to update order status:', error);
    res.status(500).json({ error: 'Failed to update order status' });
  }
});

// Quick collection via QR scan / number
app.post('/api/orders/collect-by-number', async (req: Request, res: Response) => {
  try {
    const { orderNumber } = req.body;
    if (!orderNumber) {
      return res.status(400).json({ error: 'Order number is required' });
    }

    const found = await db.select().from(orders).where(eq(orders.orderNumber, orderNumber));
    if (found.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const updated = await db
      .update(orders)
      .set({ status: 'collected', collectedAt: new Date() })
      .where(eq(orders.orderNumber, orderNumber))
      .returning();

    res.json({ success: true, order: updated[0] });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to mark order as collected' });
  }
});

// --- Analytics API ---
app.get('/api/analytics', async (req: Request, res: Response) => {
  try {
    const allOrders = await db.select().from(orders);
    const allMenuItems = await db.select().from(menuItems);

    const totalOrders = allOrders.length;
    const totalRevenue = allOrders
      .filter(o => o.status !== 'cancelled')
      .reduce((sum, o) => sum + Number(o.totalPrice), 0);

    // Orders today
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const todayOrders = allOrders.filter(o => o.createdAt && new Date(o.createdAt) >= startOfToday);
    const todayRevenue = todayOrders
      .filter(o => o.status !== 'cancelled')
      .reduce((sum, o) => sum + Number(o.totalPrice), 0);

    // Status breakdown
    const statusCounts: Record<string, number> = {
      placed: 0,
      confirmed: 0,
      preparing: 0,
      ready: 0,
      collected: 0,
      cancelled: 0,
    };
    allOrders.forEach(o => {
      if (statusCounts[o.status] !== undefined) {
        statusCounts[o.status]++;
      }
    });

    // Category breakdown
    const categoryCounts: Record<string, number> = {};
    allMenuItems.forEach(m => {
      categoryCounts[m.category] = (categoryCounts[m.category] || 0) + 1;
    });

    // Items running low / limited
    const itemsRunningLow = allMenuItems.filter(m => m.availabilityStatus === 'limited');

    // Busiest hours calculation (based on pickup time)
    const hourCounts: Record<number, number> = {};
    allOrders.forEach(o => {
      if (o.pickupTime) {
        const hour = new Date(o.pickupTime).getHours();
        hourCounts[hour] = (hourCounts[hour] || 0) + 1;
      }
    });

    let busiestHour = 12;
    let maxHourCount = 0;
    Object.entries(hourCounts).forEach(([hr, count]) => {
      if (count > maxHourCount) {
        maxHourCount = count;
        busiestHour = parseInt(hr, 10);
      }
    });

    res.json({
      totalOrders,
      totalRevenue: totalRevenue.toFixed(2),
      todayOrdersCount: todayOrders.length,
      todayRevenue: todayRevenue.toFixed(2),
      statusCounts,
      categoryCounts,
      itemsRunningLowCount: itemsRunningLow.length,
      itemsRunningLow,
      busiestHour: `${busiestHour}:00 - ${busiestHour + 1}:00`,
      averagePrepMinutes: 12,
    });
  } catch (error: any) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

// --- Wishlist APIs ---

app.get('/api/wishlist', async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user) {
      return res.json([]);
    }
    const list = await db
      .select()
      .from(wishlists)
      .where(eq(wishlists.studentId, user.uid));
    
    const menuItemIds = list.map(w => w.menuItemId);
    res.json(menuItemIds);
  } catch (error) {
    res.json([]);
  }
});

app.post('/api/wishlist/:menuItemId', async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    const menuItemId = parseInt(req.params.menuItemId, 10);

    const existing = await db
      .select()
      .from(wishlists)
      .where(and(eq(wishlists.studentId, user.uid), eq(wishlists.menuItemId, menuItemId)));

    if (existing.length > 0) {
      await db.delete(wishlists).where(eq(wishlists.id, existing[0].id));
      res.json({ wishlisted: false });
    } else {
      await db.insert(wishlists).values({
        studentId: user.uid,
        menuItemId,
      });
      res.json({ wishlisted: true });
    }
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to update wishlist' });
  }
});

// --- Reviews APIs ---

app.get('/api/reviews/:menuItemId', async (req: Request, res: Response) => {
  try {
    const menuItemId = parseInt(req.params.menuItemId, 10);
    const revs = await db
      .select()
      .from(reviews)
      .where(eq(reviews.menuItemId, menuItemId))
      .orderBy(desc(reviews.createdAt));
    res.json(revs);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch reviews' });
  }
});

app.post('/api/reviews', async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { menuItemId, orderId, rating, comment } = req.body;

    if (!menuItemId || !rating) {
      return res.status(400).json({ error: 'Rating and menuItemId are required' });
    }

    const studentId = user?.uid || 'guest_user';

    const inserted = await db
      .insert(reviews)
      .values({
        studentId,
        menuItemId: parseInt(menuItemId, 10),
        orderId: orderId ? parseInt(orderId, 10) : null,
        rating: Math.min(5, Math.max(1, parseInt(rating, 10))),
        comment: comment || '',
      })
      .returning();

    // Recalculate average rating for menu item
    const allItemReviews = await db
      .select()
      .from(reviews)
      .where(eq(reviews.menuItemId, parseInt(menuItemId, 10)));

    const avg =
      allItemReviews.reduce((sum, r) => sum + r.rating, 0) / (allItemReviews.length || 1);

    await db
      .update(menuItems)
      .set({
        rating: avg.toFixed(1),
        ratingCount: allItemReviews.length,
      })
      .where(eq(menuItems.id, parseInt(menuItemId, 10)));

    res.status(201).json(inserted[0]);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to submit review' });
  }
});

// --- Mount Vite in dev / Static files in production ---

const isProd = process.env.NODE_ENV === 'production';

if (isProd) {
  app.use(express.static(path.resolve(__dirname, 'dist')));
  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
  });
} else {
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: 'spa',
  });
  app.use(vite.middlewares);
}

const PORT = 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Canteen Server running on http://0.0.0.0:${PORT}`);
});
