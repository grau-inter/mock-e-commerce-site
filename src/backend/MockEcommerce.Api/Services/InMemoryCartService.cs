using MockEcommerce.Api.Models;

namespace MockEcommerce.Api.Services;

/// <summary>
/// Thread-safe in-memory cart storage. Registered as Singleton for demo purposes;
/// all users share a single cart. Replace with a per-user scoped implementation
/// when authentication is added.
/// </summary>
public class InMemoryCartService : ICartService
{
    private readonly List<CartItem> _cart = [];
    private readonly Lock _lock = new();

    /// <inheritdoc />
    public IEnumerable<CartItem> GetAll()
    {
        lock (_lock)
        {
            return _cart.Select(CloneItem).ToList();
        }
    }

    /// <inheritdoc />
    public CartItem? GetByProductId(int productId)
    {
        lock (_lock)
        {
            var existingItem = _cart.FirstOrDefault(item => item.ProductId == productId);
            return existingItem is null ? null : CloneItem(existingItem);
        }
    }

    /// <inheritdoc />
    public CartItem Add(CartItem item)
    {
        lock (_lock)
        {
            var existingItem = _cart.FirstOrDefault(cartItem => cartItem.ProductId == item.ProductId);
            if (existingItem is null)
            {
                var newItem = CloneItem(item);
                _cart.Add(newItem);
                return CloneItem(newItem);
            }

            existingItem.Quantity += item.Quantity;
            existingItem.ProductName = item.ProductName;
            existingItem.UnitPrice = item.UnitPrice;

            return CloneItem(existingItem);
        }
    }

    /// <inheritdoc />
    public CartItem? UpdateQuantity(int productId, int quantity)
    {
        lock (_lock)
        {
            var existingItem = _cart.FirstOrDefault(item => item.ProductId == productId);
            if (existingItem is null)
            {
                return null;
            }

            existingItem.Quantity = quantity;
            return CloneItem(existingItem);
        }
    }

    /// <inheritdoc />
    public bool Remove(int productId)
    {
        lock (_lock)
        {
            var existingItem = _cart.FirstOrDefault(item => item.ProductId == productId);
            if (existingItem is null)
            {
                return false;
            }

            _cart.Remove(existingItem);
            return true;
        }
    }

    /// <inheritdoc />
    public void Clear()
    {
        lock (_lock)
        {
            _cart.Clear();
        }
    }

    private static CartItem CloneItem(CartItem item)
    {
        return new CartItem
        {
            ProductId = item.ProductId,
            ProductName = item.ProductName,
            UnitPrice = item.UnitPrice,
            Quantity = item.Quantity,
        };
    }
}
