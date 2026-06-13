import React, {
  createContext, useContext, useState, useEffect, useCallback
} from 'react';
import { useAuth } from '../auth/AuthContext';

const CartContext = createContext();

export function CartProvider({ children }) {
  const { user, authFetch } = useAuth();
  const [items, setItems]   = useState([]);
  const [loading, setLoading] = useState(false);

  const localKey = 'himalix-cart';

  /* Load cart: server if logged in, localStorage if guest */
  const fetchCart = useCallback(async () => {
    if (user) {
      try {
        setLoading(true);
        const res  = await authFetch('/api/store/cart');
        const data = await res.json();
        if (data.success) setItems(data.cart || []);
      } catch (e) { /* swallow */ }
      finally { setLoading(false); }
    } else {
      try {
        const saved = JSON.parse(localStorage.getItem(localKey) || '[]');
        setItems(saved);
      } catch { setItems([]); }
    }
  }, [user, authFetch]);

  useEffect(() => { fetchCart(); }, [fetchCart]);

  /* Merge local guest cart to server on login */
  useEffect(() => {
    if (user) {
      const localItems = JSON.parse(localStorage.getItem(localKey) || '[]');
      if (localItems.length > 0) {
        const syncGuestCart = async () => {
          for (const item of localItems) {
            try {
              await authFetch('/api/store/cart', {
                method: 'POST',
                body: JSON.stringify({ product_id: item.product_id, quantity: item.quantity })
              });
            } catch (err) {
              console.error('Failed to sync guest cart item:', err);
            }
          }
          localStorage.removeItem(localKey);
          fetchCart();
        };
        syncGuestCart();
      }
    }
  }, [user, authFetch, fetchCart]);

  /* Sync guest cart to localStorage */
  useEffect(() => {
    if (!user) localStorage.setItem(localKey, JSON.stringify(items));
  }, [items, user]);

  /* Add or increment */
  const addToCart = useCallback(async (product, qty = 1) => {
    if (user) {
      await authFetch('/api/store/cart', {
        method: 'POST',
        body: JSON.stringify({ product_id: product.id, quantity: qty })
      });
      fetchCart();
    } else {
      setItems(prev => {
        const ex = prev.find(i => i.product_id === product.id);
        if (ex) return prev.map(i =>
          i.product_id === product.id
            ? { ...i, quantity: i.quantity + qty }
            : i
        );
        return [...prev, {
          product_id: product.id,
          quantity: qty,
          product_name: product.name,
          price: product.price,
          image_url: product.image_url,
        }];
      });
    }
  }, [user, authFetch, fetchCart]);

  /* Update quantity */
  const updateQty = useCallback(async (productId, qty) => {
    if (qty < 1) return;
    if (user) {
      await authFetch(`/api/store/cart/${productId}`, {
        method: 'PUT',
        body: JSON.stringify({ quantity: qty })
      });
      fetchCart();
    } else {
      setItems(prev =>
        prev.map(i => i.product_id === productId ? { ...i, quantity: qty } : i)
      );
    }
  }, [user, authFetch, fetchCart]);

  /* Remove item */
  const removeItem = useCallback(async (productId) => {
    if (user) {
      await authFetch(`/api/store/cart/${productId}`, { method: 'DELETE' });
      fetchCart();
    } else {
      setItems(prev => prev.filter(i => i.product_id !== productId));
    }
  }, [user, authFetch, fetchCart]);

  /* Clear cart */
  const clearCart = useCallback(async () => {
    if (user) {
      await authFetch('/api/store/cart', { method: 'DELETE' });
    }
    setItems([]);
  }, [user, authFetch]);

  const itemCount   = items.reduce((sum, i) => sum + i.quantity, 0);
  const totalAmount = items.reduce((sum, i) => sum + i.price * i.quantity, 0);

  return (
    <CartContext.Provider value={{
      items, loading, itemCount, totalAmount,
      addToCart, updateQty, removeItem, clearCart, fetchCart
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used inside CartProvider');
  return ctx;
}
