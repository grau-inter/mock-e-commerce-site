import { useState } from 'react';
import type { CartItem } from '../../types';

interface CartPanelProps {
  isOpen: boolean;
  items: CartItem[];
  loading: boolean;
  error: string | null;
  totalQuantity: number;
  subtotal: number;
  onClose: () => void;
  onUpdateQuantity: (productId: number, quantity: number) => Promise<void>;
  onRemoveItem: (productId: number) => Promise<void>;
  onClearCart: () => Promise<void>;
}

export function CartPanel({
  isOpen,
  items,
  loading,
  error,
  totalQuantity,
  subtotal,
  onClose,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
}: CartPanelProps) {
  const [pendingIds, setPendingIds] = useState<number[]>([]);
  const [isClearing, setIsClearing] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  if (!isOpen) {
    return null;
  }

  async function withPending(productId: number, action: () => Promise<void>) {
    setPendingIds((prev) => [...prev, productId]);
    setActionError(null);

    try {
      await action();
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : 'Cart action failed.');
    } finally {
      setPendingIds((prev) => prev.filter((id) => id !== productId));
    }
  }

  async function handleClear() {
    setIsClearing(true);
    setActionError(null);

    try {
      await onClearCart();
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : 'Cart action failed.');
    } finally {
      setIsClearing(false);
    }
  }

  return (
    <aside className="cart-panel" id="cart-panel" role="dialog" aria-labelledby="cart-panel-title">
      <div className="cart-panel__header">
        <h2 id="cart-panel-title" className="cart-panel__title">Your cart</h2>
        <button className="cart-panel__close" onClick={onClose} aria-label="Close cart">
          x
        </button>
      </div>

      {(error || actionError) && (
        <p className="cart-panel__error" role="alert">
          {actionError ?? error}
        </p>
      )}

      {loading ? (
        <p className="cart-panel__loading">Loading cart...</p>
      ) : items.length === 0 ? (
        <p className="cart-panel__empty">Your cart is empty.</p>
      ) : (
        <>
          <ul className="cart-panel__list" aria-label="Cart items">
            {items.map((item) => {
              const pending = pendingIds.includes(item.productId);

              return (
                <li key={item.productId} className="cart-panel__item">
                  <div className="cart-panel__item-row">
                    <h3 className="cart-panel__item-name">{item.productName}</h3>
                    <button
                      className="cart-panel__remove"
                      onClick={() => withPending(item.productId, () => onRemoveItem(item.productId))}
                      disabled={pending}
                      aria-label={`Remove ${item.productName} from cart`}
                    >
                      Remove
                    </button>
                  </div>
                  <p className="cart-panel__price">${item.unitPrice.toFixed(2)} each</p>
                  <div className="cart-panel__item-row">
                    <div className="cart-panel__quantity-controls" aria-label={`Quantity controls for ${item.productName}`}>
                      <button
                        onClick={() => withPending(item.productId, () => onUpdateQuantity(item.productId, item.quantity - 1))}
                        disabled={pending || item.quantity <= 1}
                        aria-label={`Decrease quantity for ${item.productName}`}
                      >
                        -
                      </button>
                      <span className="cart-panel__quantity">{item.quantity}</span>
                      <button
                        onClick={() => withPending(item.productId, () => onUpdateQuantity(item.productId, item.quantity + 1))}
                        disabled={pending || item.quantity >= 5}
                        aria-label={`Increase quantity for ${item.productName}`}
                      >
                        +
                      </button>
                    </div>
                    <p className="cart-panel__line-total">${item.totalPrice.toFixed(2)}</p>
                  </div>
                </li>
              );
            })}
          </ul>

          <div className="cart-panel__summary">
            <p>Total items: {totalQuantity}</p>
            <p>Subtotal: ${subtotal.toFixed(2)}</p>
          </div>

          <button className="cart-panel__clear" onClick={handleClear} disabled={isClearing}>
            {isClearing ? 'Clearing...' : 'Clear cart'}
          </button>
        </>
      )}
    </aside>
  );
}
