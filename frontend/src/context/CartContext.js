import { createContext, useContext, useState, useMemo, useCallback } from 'react';

const CartContext = createContext(null);

function getAuthHeaders() {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
}

export function CartProvider({ children }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchCart = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/store/cart`, {
        headers: getAuthHeaders(),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch cart');
      }
      setItems(data.items || data);
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const addToCart = useCallback(async (productId, quantity = 1) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/store/cart/add`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ productId, quantity }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to add to cart');
      }
      await fetchCart();
      return data;
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  }, [fetchCart]);

  const updateCartItem = useCallback(async (cartItemId, quantity) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/store/cart/update`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ cartItemId, quantity }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to update cart item');
      }
      await fetchCart();
      return data;
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  }, [fetchCart]);

  const removeFromCart = useCallback(async (cartItemId) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/store/cart/remove/${cartItemId}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to remove from cart');
      }
      await fetchCart();
      return data;
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  }, [fetchCart]);

  const cartCount = useMemo(
    () => items.reduce((sum, item) => sum + item.quantity, 0),
    [items]
  );

  const cartTotal = useMemo(
    () => items.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [items]
  );

  return (
    <CartContext.Provider
      value={{ items, loading, fetchCart, addToCart, updateCartItem, removeFromCart, cartCount, cartTotal }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
