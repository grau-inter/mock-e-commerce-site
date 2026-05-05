using MockEcommerce.Api.Models;
using MockEcommerce.Api.Services;

namespace MockEcommerce.Api.Tests.Services;

public class InMemoryCartServiceTests
{
    [Fact]
    public void Add_WithNewProduct_AddsNewCartLine()
    {
        var service = new InMemoryCartService();

        var addedItem = service.Add(new CartItem
        {
            ProductId = 1,
            ProductName = "Wireless Headphones",
            UnitPrice = 79.99m,
            Quantity = 1,
        });

        Assert.Equal(1, addedItem.ProductId);
        Assert.Equal(1, addedItem.Quantity);
        Assert.Single(service.GetAll());
    }

    [Fact]
    public void Add_WithExistingProduct_IncrementsQuantity()
    {
        var service = new InMemoryCartService();

        service.Add(new CartItem
        {
            ProductId = 1,
            ProductName = "Wireless Headphones",
            UnitPrice = 79.99m,
            Quantity = 1,
        });

        var updatedItem = service.Add(new CartItem
        {
            ProductId = 1,
            ProductName = "Wireless Headphones",
            UnitPrice = 79.99m,
            Quantity = 2,
        });

        Assert.Equal(3, updatedItem.Quantity);
        Assert.Single(service.GetAll());
    }

    [Fact]
    public void UpdateQuantity_WithExistingItem_UpdatesQuantity()
    {
        var service = new InMemoryCartService();

        service.Add(new CartItem
        {
            ProductId = 1,
            ProductName = "Wireless Headphones",
            UnitPrice = 79.99m,
            Quantity = 1,
        });

        var updatedItem = service.UpdateQuantity(1, 4);

        Assert.NotNull(updatedItem);
        Assert.Equal(4, updatedItem.Quantity);
    }

    [Fact]
    public void Remove_WithExistingProduct_RemovesCartLine()
    {
        var service = new InMemoryCartService();

        service.Add(new CartItem
        {
            ProductId = 1,
            ProductName = "Wireless Headphones",
            UnitPrice = 79.99m,
            Quantity = 1,
        });

        var removed = service.Remove(1);

        Assert.True(removed);
        Assert.Empty(service.GetAll());
    }

    [Fact]
    public void Clear_RemovesAllCartItems()
    {
        var service = new InMemoryCartService();

        service.Add(new CartItem
        {
            ProductId = 1,
            ProductName = "Wireless Headphones",
            UnitPrice = 79.99m,
            Quantity = 1,
        });
        service.Add(new CartItem
        {
            ProductId = 2,
            ProductName = "Running Shoes",
            UnitPrice = 59.99m,
            Quantity = 1,
        });

        service.Clear();

        Assert.Empty(service.GetAll());
    }
}