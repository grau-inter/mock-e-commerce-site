import { useEffect, useRef, useState } from 'react';
import type { Product } from './types';
import { Header } from './components/Header';
import { HeroBanner } from './components/HeroBanner';
import { ProductList } from './components/ProductList';
import { CartPanel } from './components/CartPanel';
import { useProducts } from './hooks/useProducts';
import { useCart } from './hooks/useCart';
import './App.css';

export function App() {
  const { products, loading, error } = useProducts();
  const {
    items,
    loading: cartLoading,
    error: cartError,
    totalQuantity,
    subtotal,
    addItem,
    updateQuantity,
    removeItem,
    clearAll,
  } = useCart();
  const [cartMessage, setCartMessage] = useState<string | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsCartOpen(false);
      }
    }

    if (!isCartOpen) {
      return;
    }

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isCartOpen]);

  async function handleAddToCart(product: Product) {
    try {
      await addItem(product.id, 1);
      setCartMessage(`"${product.name}" added to cart!`);
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      timerRef.current = setTimeout(() => setCartMessage(null), 3000);
    } catch (err: unknown) {
      setCartMessage(err instanceof Error ? err.message : 'Failed to add item to cart.');
    }
  }

  async function handleUpdateQuantity(productId: number, quantity: number) {
    await updateQuantity(productId, quantity);
  }

  async function handleRemoveItem(productId: number) {
    await removeItem(productId);
  }

  async function handleClearCart() {
    await clearAll();
  }

  return (
    <div className="app">
      <Header
        cartItemCount={totalQuantity}
        onCartClick={() => setIsCartOpen((open) => !open)}
        isCartOpen={isCartOpen}
      />
      <HeroBanner />

      <CartPanel
        isOpen={isCartOpen}
        items={items}
        loading={cartLoading}
        error={cartError}
        totalQuantity={totalQuantity}
        subtotal={subtotal}
        onClose={() => setIsCartOpen(false)}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveItem}
        onClearCart={handleClearCart}
      />

      <main className="app__main">
        <h1 className="app__section-heading">Our products</h1>

        {cartMessage && (
          <div className="app__notification" role="status">
            {cartMessage}
          </div>
        )}

        {loading && <p className="app__loading">Loading products...</p>}
        {error && <p className="app__error">Error: {error}</p>}
        {!loading && !error && (
          <ProductList products={products} onAddToCart={handleAddToCart} />
        )}
      </main>
    </div>
  );
}
