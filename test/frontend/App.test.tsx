import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { App } from '../../src/frontend/src/App';
import type { Product, CartItem } from '../../src/frontend/src/types';

const mockProducts: Product[] = [
  {
    id: 1,
    name: 'Test Headphones',
    description: 'Great sound quality.',
    price: 79.99,
    category: 'Electronics',
    stock: 10,
    imageUrl: 'https://example.com/headphones.jpg',
  },
];

vi.mock('../../src/frontend/src/hooks/useProducts');
vi.mock('../../src/frontend/src/hooks/useCart');

import { useProducts } from '../../src/frontend/src/hooks/useProducts';
import { useCart } from '../../src/frontend/src/hooks/useCart';

const mockedUseProducts = vi.mocked(useProducts);
const mockedUseCart = vi.mocked(useCart);

const cartItems: CartItem[] = [
  {
    productId: 1,
    productName: 'Test Headphones',
    unitPrice: 79.99,
    quantity: 1,
    totalPrice: 79.99,
  },
];

const addItem = vi.fn();
const updateQuantity = vi.fn();
const removeItem = vi.fn();
const clearAll = vi.fn();

function mockCart(overrides?: Partial<ReturnType<typeof useCart>>) {
  mockedUseCart.mockReturnValue({
    items: [],
    loading: false,
    error: null,
    totalQuantity: 0,
    subtotal: 0,
    addItem,
    updateQuantity,
    removeItem,
    clearAll,
    reload: vi.fn(),
    ...overrides,
  });
}

describe('App', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    addItem.mockReset();
    updateQuantity.mockReset();
    removeItem.mockReset();
    clearAll.mockReset();
  });

  it('renders the header with shop name', () => {
    mockedUseProducts.mockReturnValue({ products: [], loading: false, error: null });
    mockCart();

    render(<App />);

    expect(screen.getByText('Mock Shop')).toBeInTheDocument();
  });

  it('renders the hero banner', () => {
    mockedUseProducts.mockReturnValue({ products: [], loading: false, error: null });
    mockCart();

    render(<App />);

    expect(screen.getByText(/discover quality products/i)).toBeInTheDocument();
  });

  it('renders the products section heading', () => {
    mockedUseProducts.mockReturnValue({ products: [], loading: false, error: null });
    mockCart();

    render(<App />);

    expect(screen.getByRole('heading', { name: /our products/i })).toBeInTheDocument();
  });

  it('shows loading state', () => {
    mockedUseProducts.mockReturnValue({ products: [], loading: true, error: null });
    mockCart();

    render(<App />);

    expect(screen.getByText(/loading products/i)).toBeInTheDocument();
  });

  it('shows error state', () => {
    mockedUseProducts.mockReturnValue({ products: [], loading: false, error: 'Network error' });
    mockCart();

    render(<App />);

    expect(screen.getByText(/error: network error/i)).toBeInTheDocument();
  });

  it('renders product list when loaded', () => {
    mockedUseProducts.mockReturnValue({ products: mockProducts, loading: false, error: null });
    mockCart();

    render(<App />);

    expect(screen.getByText('Test Headphones')).toBeInTheDocument();
  });

  it('shows notification after adding to cart', async () => {
    mockedUseProducts.mockReturnValue({ products: mockProducts, loading: false, error: null });
    addItem.mockResolvedValue(cartItems[0]);
    mockCart({ totalQuantity: 1, items: cartItems, subtotal: 79.99 });

    render(<App />);
    await userEvent.click(screen.getByRole('button', { name: /add test headphones to cart/i }));

    expect(await screen.findByRole('status')).toHaveTextContent('"Test Headphones" added to cart!');
  });

  it('shows error notification when add to cart fails', async () => {
    mockedUseProducts.mockReturnValue({ products: mockProducts, loading: false, error: null });
    addItem.mockRejectedValue(new Error('Server error'));
    mockCart();

    render(<App />);
    await userEvent.click(screen.getByRole('button', { name: /add test headphones to cart/i }));

    expect(await screen.findByRole('status')).toHaveTextContent('Server error');
  });

  it('opens cart panel from header cart button', async () => {
    mockedUseProducts.mockReturnValue({ products: mockProducts, loading: false, error: null });
    mockCart({ totalQuantity: 1, items: cartItems, subtotal: 79.99 });

    render(<App />);

    await userEvent.click(screen.getByRole('button', { name: /shopping cart with 1 items/i }));

    expect(screen.getByRole('dialog', { name: /your cart/i })).toBeInTheDocument();
    expect(screen.getByText('Subtotal: $79.99')).toBeInTheDocument();
  });
});
