import React, { useState, useEffect, useCallback } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.tsx';
import { CartProvider } from './context/CartContext.tsx';
import { Navbar } from './components/Navbar.tsx';
import { MenuDisplay } from './components/student/MenuDisplay.tsx';
import { ItemDetailModal } from './components/student/ItemDetailModal.tsx';
import { CartDrawer } from './components/student/CartDrawer.tsx';
import { CheckoutModal } from './components/student/CheckoutModal.tsx';
import { OrderTrackingModal } from './components/student/OrderTrackingModal.tsx';
import { OrderHistory } from './components/student/OrderHistory.tsx';
import { WishlistView } from './components/student/WishlistView.tsx';
import { StaffDashboard } from './components/staff/StaffDashboard.tsx';
import { StaffMenuManagement } from './components/staff/StaffMenuManagement.tsx';
import { StaffAnalytics } from './components/staff/StaffAnalytics.tsx';
import { MenuItem, Order } from './types/index.ts';

function MainCanteenApp() {
  const { user, role } = useAuth();
  const [currentTab, setCurrentTab] = useState<
    'menu' | 'active-orders' | 'history' | 'wishlist' | 'staff-orders' | 'staff-menu' | 'staff-analytics'
  >('menu');
  const [staffMode, setStaffMode] = useState<boolean>(false);

  // Data states
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loadingMenu, setLoadingMenu] = useState(true);
  const [orders, setOrders] = useState<Order[]>([]);
  const [wishlistIds, setWishlistIds] = useState<number[]>([]);

  // Modals & Panels
  const [selectedDetailItem, setSelectedDetailItem] = useState<MenuItem | null>(null);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [activeTrackingOrderNumber, setActiveTrackingOrderNumber] = useState<string | null>(null);

  // Fetch Menu Items
  const fetchMenu = useCallback(async () => {
    try {
      const res = await fetch('/api/menu');
      if (res.ok) {
        const data = await res.json();
        setMenuItems(data);
      }
    } catch (e) {
      console.error('Failed to fetch menu:', e);
    } finally {
      setLoadingMenu(false);
    }
  }, []);

  // Fetch Orders
  const fetchOrders = useCallback(async () => {
    try {
      const url = staffMode ? '/api/orders?view=staff' : '/api/orders';
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setOrders(data);
      }
    } catch (e) {
      console.error('Failed to fetch orders:', e);
    }
  }, [staffMode]);

  // Fetch Wishlist
  const fetchWishlist = useCallback(async () => {
    try {
      const res = await fetch('/api/wishlist');
      if (res.ok) {
        const data = await res.json();
        setWishlistIds(data);
      }
    } catch (e) {
      // Ignore
    }
  }, []);

  useEffect(() => {
    fetchMenu();
    fetchOrders();
    fetchWishlist();
  }, [fetchMenu, fetchOrders, fetchWishlist]);

  // Refresh orders on interval for live updates
  useEffect(() => {
    const timer = setInterval(() => {
      fetchOrders();
    }, 5000);
    return () => clearInterval(timer);
  }, [fetchOrders]);

  // Handle Wishlist Toggle
  const handleToggleWishlist = async (menuItemId: number) => {
    try {
      const res = await fetch(`/api/wishlist/${menuItemId}`, { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setWishlistIds(prev =>
          data.wishlisted ? [...prev, menuItemId] : prev.filter(id => id !== menuItemId)
        );
      } else {
        // Optimistic toggle for guest
        setWishlistIds(prev =>
          prev.includes(menuItemId) ? prev.filter(id => id !== menuItemId) : [...prev, menuItemId]
        );
      }
    } catch (e) {
      setWishlistIds(prev =>
        prev.includes(menuItemId) ? prev.filter(id => id !== menuItemId) : [...prev, menuItemId]
      );
    }
  };

  const handleOrderPlaced = (order: Order) => {
    fetchOrders();
    setActiveTrackingOrderNumber(order.orderNumber);
  };

  const wishlistedItems = menuItems.filter(m => wishlistIds.includes(m.id));

  return (
    <div className="min-h-screen bg-gray-50/50 flex flex-col font-sans text-gray-900 selection:bg-emerald-500 selection:text-white">
      {/* Navigation Header */}
      <Navbar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        staffMode={staffMode}
        setStaffMode={setStaffMode}
        wishlistCount={wishlistIds.length}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {!staffMode ? (
          /* Student Views */
          <>
            {currentTab === 'menu' && (
              <MenuDisplay
                items={menuItems}
                loading={loadingMenu}
                wishlistIds={wishlistIds}
                onToggleWishlist={handleToggleWishlist}
                onOpenDetails={item => setSelectedDetailItem(item)}
              />
            )}

            {currentTab === 'active-orders' && (
              <OrderHistory
                orders={orders.filter(o =>
                  ['placed', 'confirmed', 'preparing', 'ready'].includes(o.status)
                )}
                allMenuItems={menuItems}
                onTrackOrder={orderNum => setActiveTrackingOrderNumber(orderNum)}
                onExploreMenu={() => setCurrentTab('menu')}
              />
            )}

            {currentTab === 'history' && (
              <OrderHistory
                orders={orders}
                allMenuItems={menuItems}
                onTrackOrder={orderNum => setActiveTrackingOrderNumber(orderNum)}
                onExploreMenu={() => setCurrentTab('menu')}
              />
            )}

            {currentTab === 'wishlist' && (
              <WishlistView
                items={wishlistedItems}
                onToggleWishlist={handleToggleWishlist}
                onExploreMenu={() => setCurrentTab('menu')}
                onOpenDetails={item => setSelectedDetailItem(item)}
              />
            )}
          </>
        ) : (
          /* Staff Kitchen Views */
          <>
            {currentTab === 'staff-orders' && (
              <StaffDashboard orders={orders} onRefreshOrders={fetchOrders} />
            )}

            {currentTab === 'staff-menu' && (
              <StaffMenuManagement items={menuItems} onRefreshMenu={fetchMenu} />
            )}

            {currentTab === 'staff-analytics' && <StaffAnalytics />}
          </>
        )}
      </main>

      {/* Cart Drawer */}
      <CartDrawer onProceedToCheckout={() => setIsCheckoutOpen(true)} />

      {/* Checkout Modal */}
      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        onOrderPlaced={handleOrderPlaced}
      />

      {/* Item Detail & Reviews Modal */}
      {selectedDetailItem && (
        <ItemDetailModal
          item={selectedDetailItem}
          onClose={() => setSelectedDetailItem(null)}
          isWishlisted={wishlistIds.includes(selectedDetailItem.id)}
          onToggleWishlist={handleToggleWishlist}
        />
      )}

      {/* Order Tracking & QR Pass Modal */}
      {activeTrackingOrderNumber && (
        <OrderTrackingModal
          orderNumber={activeTrackingOrderNumber}
          onClose={() => setActiveTrackingOrderNumber(null)}
          onOrderUpdated={fetchOrders}
        />
      )}

      {/* Footer */}
      <footer className="border-t border-gray-100 bg-white py-6 mt-12 text-center text-xs text-gray-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="font-medium">
            QuickBite Canteen Pre-Order System • Built with PostgreSQL & Real-time Live Tracking
          </p>
          <div className="flex items-center gap-4 text-gray-400">
            <span>Pickup Counter #1</span>
            <span>•</span>
            <span>Operating Hours: 12:00-14:00 & 18:00-20:00</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <MainCanteenApp />
      </CartProvider>
    </AuthProvider>
  );
}
