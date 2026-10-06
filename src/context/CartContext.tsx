import React, { createContext, useContext, useState, useEffect } from 'react';
import { CartItem, MenuItem, OrderItem } from '../types/index.ts';
import { sound } from '../utils/sound.ts';

interface CartContextType {
  cart: CartItem[];
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  addItem: (item: MenuItem, quantity?: number, instructions?: string) => void;
  removeItem: (menuItemId: number) => void;
  updateQuantity: (menuItemId: number, quantity: number) => void;
  updateInstructions: (menuItemId: number, instructions: string) => void;
  clearCart: () => void;
  reorder: (items: OrderItem[], allMenuItems: MenuItem[]) => void;
  totalItems: number;
  subtotal: number;
  estimatedPrepTime: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = sessionStorage.getItem('quickbite_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    try {
      sessionStorage.setItem('quickbite_cart', JSON.stringify(cart));
    } catch (e) {
      // Ignore
    }
  }, [cart]);

  const addItem = (item: MenuItem, quantity = 1, instructions = '') => {
    sound.playClick();
    setCart(prev => {
      const existingIndex = prev.findIndex(ci => ci.menuItem.id === item.id);
      if (existingIndex > -1) {
        const next = [...prev];
        next[existingIndex] = {
          ...next[existingIndex],
          quantity: next[existingIndex].quantity + quantity,
          specialInstructions: instructions || next[existingIndex].specialInstructions,
        };
        return next;
      } else {
        return [...prev, { menuItem: item, quantity, specialInstructions: instructions }];
      }
    });
  };

  const removeItem = (menuItemId: number) => {
    sound.playClick();
    setCart(prev => prev.filter(ci => ci.menuItem.id !== menuItemId));
  };

  const updateQuantity = (menuItemId: number, quantity: number) => {
    if (quantity <= 0) {
      removeItem(menuItemId);
      return;
    }
    setCart(prev =>
      prev.map(ci => (ci.menuItem.id === menuItemId ? { ...ci, quantity } : ci))
    );
  };

  const updateInstructions = (menuItemId: number, instructions: string) => {
    setCart(prev =>
      prev.map(ci =>
        ci.menuItem.id === menuItemId ? { ...ci, specialInstructions: instructions } : ci
      )
    );
  };

  const clearCart = () => {
    setCart([]);
  };

  const reorder = (items: OrderItem[], allMenuItems: MenuItem[]) => {
    const itemMap = new Map(allMenuItems.map(m => [m.id, m]));
    const newCart: CartItem[] = [];

    items.forEach(it => {
      const found = itemMap.get(it.menuItemId);
      if (found && found.availabilityStatus !== 'unavailable') {
        newCart.push({
          menuItem: found,
          quantity: it.quantity,
          specialInstructions: it.specialInstructions || '',
        });
      }
    });

    if (newCart.length > 0) {
      setCart(newCart);
      setIsOpen(true);
      sound.playClick();
    }
  };

  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  const subtotal = cart.reduce(
    (sum, item) => sum + Number(item.menuItem.price) * item.quantity,
    0
  );

  const estimatedPrepTime = cart.reduce(
    (max, item) => Math.max(max, item.menuItem.preparationTimeMinutes || 15),
    10
  );

  return (
    <CartContext.Provider
      value={{
        cart,
        isOpen,
        setIsOpen,
        addItem,
        removeItem,
        updateQuantity,
        updateInstructions,
        clearCart,
        reorder,
        totalItems,
        subtotal,
        estimatedPrepTime,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
