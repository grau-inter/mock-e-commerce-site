import { act, renderHook, waitFor } from '@testing-library/react';
import { useCart } from '../../../src/frontend/src/hooks/useCart';
import type { CartItem } from '../../../src/frontend/src/types';

const mockCartItems: CartItem[] = [
  {
    productId: 1,
    productName: 'Headphones',
    unitPrice: 79.99,
    quantity: 2,
    totalPrice: 159.98,
  },
];

vi.mock('../../../src/frontend/src/api', () => ({
  fetchCart: vi.fn(),
  addToCart: vi.fn(),
  updateCartItemQuantity: vi.fn(),
  removeCartItem: vi.fn(),
  clearCart: vi.fn(),
}));

import {
  fetchCart,
  addToCart,
  updateCartItemQuantity,
  removeCartItem,
  clearCart,
} from '../../../src/frontend/src/api';

const mockedFetchCart = vi.mocked(fetchCart);
const mockedAddToCart = vi.mocked(addToCart);
const mockedUpdateCartItemQuantity = vi.mocked(updateCartItemQuantity);
const mockedRemoveCartItem = vi.mocked(removeCartItem);
const mockedClearCart = vi.mocked(clearCart);

describe('useCart', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('loads cart on mount and exposes totals', async () => {
    mockedFetchCart.mockResolvedValue(mockCartItems);

    const { result } = renderHook(() => useCart());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.items).toEqual(mockCartItems);
    expect(result.current.totalQuantity).toBe(2);
    expect(result.current.subtotal).toBe(159.98);
  });

  it('adds item and updates local state', async () => {
    mockedFetchCart.mockResolvedValue([]);
    mockedAddToCart.mockResolvedValue(mockCartItems[0]);

    const { result } = renderHook(() => useCart());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.addItem(1, 2);
    });

    expect(mockedAddToCart).toHaveBeenCalledWith({ productId: 1, quantity: 2 });
    expect(result.current.items).toEqual(mockCartItems);
  });

  it('updates quantity through API and state', async () => {
    mockedFetchCart.mockResolvedValue(mockCartItems);
    mockedUpdateCartItemQuantity.mockResolvedValue({
      ...mockCartItems[0],
      quantity: 3,
      totalPrice: 239.97,
    });

    const { result } = renderHook(() => useCart());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.updateQuantity(1, 3);
    });

    expect(mockedUpdateCartItemQuantity).toHaveBeenCalledWith(1, { quantity: 3 });
    expect(result.current.items[0].quantity).toBe(3);
  });

  it('removes item from state', async () => {
    mockedFetchCart.mockResolvedValue(mockCartItems);
    mockedRemoveCartItem.mockResolvedValue();

    const { result } = renderHook(() => useCart());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.removeItem(1);
    });

    expect(mockedRemoveCartItem).toHaveBeenCalledWith(1);
    expect(result.current.items).toEqual([]);
  });

  it('clears items from state', async () => {
    mockedFetchCart.mockResolvedValue(mockCartItems);
    mockedClearCart.mockResolvedValue();

    const { result } = renderHook(() => useCart());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.clearAll();
    });

    expect(mockedClearCart).toHaveBeenCalled();
    expect(result.current.items).toEqual([]);
  });
});
