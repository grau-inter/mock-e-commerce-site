import type {
  Product,
  AddToCartRequest,
  UpdateCartQuantityRequest,
  CartItem,
} from '../types';

const BASE_URL = '/api';

interface ValidationErrorResponse {
  errors?: Record<string, string[]>;
}

async function getErrorMessage(response: Response, fallback: string): Promise<string> {
  try {
    const body = (await response.json()) as ValidationErrorResponse | { message?: string };
    if ('errors' in body && body.errors)
    {
      const firstKey = Object.keys(body.errors)[0];
      if (firstKey && body.errors[firstKey]?.length)
      {
        return body.errors[firstKey][0];
      }
    }

    if ('message' in body && body.message)
    {
      return body.message;
    }
  } catch {
    return fallback;
  }

  return fallback;
}

export async function fetchProducts(): Promise<Product[]> {
  const response = await fetch(`${BASE_URL}/products`);
  if (!response.ok) throw new Error('Failed to fetch products');
  return response.json();
}

export async function fetchProductById(id: number): Promise<Product> {
  const response = await fetch(`${BASE_URL}/products/${id}`);
  if (!response.ok) throw new Error(`Failed to fetch product ${id}`);
  return response.json();
}

export async function addToCart(request: AddToCartRequest): Promise<CartItem> {
  const response = await fetch(`${BASE_URL}/cart`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });
  if (!response.ok) {
    throw new Error(await getErrorMessage(response, 'Failed to add item to cart'));
  }

  return response.json();
}

export async function fetchCart(): Promise<CartItem[]> {
  const response = await fetch(`${BASE_URL}/cart`);
  if (!response.ok) {
    throw new Error(await getErrorMessage(response, 'Failed to fetch cart'));
  }

  return response.json();
}

export async function updateCartItemQuantity(
  productId: number,
  request: UpdateCartQuantityRequest,
): Promise<CartItem> {
  const response = await fetch(`${BASE_URL}/cart/${productId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw new Error(await getErrorMessage(response, 'Failed to update cart quantity'));
  }

  return response.json();
}

export async function removeCartItem(productId: number): Promise<void> {
  const response = await fetch(`${BASE_URL}/cart/${productId}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    throw new Error(await getErrorMessage(response, 'Failed to remove cart item'));
  }
}

export async function clearCart(): Promise<void> {
  const response = await fetch(`${BASE_URL}/cart`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    throw new Error(await getErrorMessage(response, 'Failed to clear cart'));
  }
}

