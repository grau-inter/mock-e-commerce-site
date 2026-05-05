import { useCallback, useEffect, useMemo, useState } from 'react';
import type { CartItem } from '../types';
import {
  addToCart,
  clearCart,
  fetchCart,
  removeCartItem,
  updateCartItemQuantity,
} from '../api';

interface UseCartResult {
  items: CartItem[];
  loading: boolean;
  error: string | null;
  totalQuantity: number;
  subtotal: number;
  addItem: (productId: number, quantity?: number) => Promise<CartItem>;
  updateQuantity: (productId: number, quantity: number) => Promise<CartItem>;
  removeItem: (productId: number) => Promise<void>;
  clearAll: () => Promise<void>;
  reload: () => Promise<void>;
}

export function useCart(): UseCartResult {
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadCart = useCallback(async () => {
    setLoading(true);
    try {
      const cartItems = await fetchCart();
      setItems(cartItems);
      setError(null);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to fetch cart');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadCart();
  }, [loadCart]);

  const addItem = useCallback(async (productId: number, quantity = 1) => {
    try {
      const updated = await addToCart({ productId, quantity });
      setItems((prev) => {
        const existing = prev.find((item) => item.productId === updated.productId);
        if (existing) {
          return prev.map((item) => (item.productId === updated.productId ? updated : item));
        }

        return [...prev, updated];
      });
      setError(null);
      return updated;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to add item to cart';
      setError(message);
      throw new Error(message);
    }
  }, []);

  const updateQuantity = useCallback(async (productId: number, quantity: number) => {
    try {
      const updated = await updateCartItemQuantity(productId, { quantity });
      setItems((prev) =>
        prev.map((item) => (item.productId === updated.productId ? updated : item)),
      );
      setError(null);
      return updated;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to update cart quantity';
      setError(message);
      throw new Error(message);
    }
  }, []);

  const removeItem = useCallback(async (productId: number) => {
    try {
      await removeCartItem(productId);
      setItems((prev) => prev.filter((item) => item.productId !== productId));
      setError(null);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to remove cart item';
      setError(message);
      throw new Error(message);
    }
  }, []);

  const clearAll = useCallback(async () => {
    try {
      await clearCart();
      setItems([]);
      setError(null);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to clear cart';
      setError(message);
      throw new Error(message);
    }
  }, []);

  const totalQuantity = useMemo(
    () => items.reduce((sum, item) => sum + item.quantity, 0),
    [items],
  );

  const subtotal = useMemo(
    () => items.reduce((sum, item) => sum + item.totalPrice, 0),
    [items],
  );

  return {
    items,
    loading,
    error,
    totalQuantity,
    subtotal,
    addItem,
    updateQuantity,
    removeItem,
    clearAll,
    reload: loadCart,
  };
}
