using System.Net;
using System.Net.Http.Json;
using Microsoft.AspNetCore.Mvc.Testing;
using MockEcommerce.Api.Models;

namespace MockEcommerce.Api.Tests.Endpoints;

public class CartEndpointTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly HttpClient _client;

    public CartEndpointTests(WebApplicationFactory<Program> factory)
    {
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task AddToCart_WithNewProduct_ReturnsCreated()
    {
        await ResetCart();

        var response = await _client.PostAsJsonAsync("/api/cart", new
        {
            productId = 1,
            quantity = 1,
        });

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);

        var cartItem = await response.Content.ReadFromJsonAsync<CartItem>();
        Assert.NotNull(cartItem);
        Assert.Equal(1, cartItem.ProductId);
        Assert.Equal(1, cartItem.Quantity);
    }

    [Fact]
    public async Task AddToCart_WithExistingProduct_ReturnsOkAndIncrementsQuantity()
    {
        await ResetCart();
        await _client.PostAsJsonAsync("/api/cart", new
        {
            productId = 1,
            quantity = 1,
        });

        var response = await _client.PostAsJsonAsync("/api/cart", new
        {
            productId = 1,
            quantity = 2,
        });

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var cartItem = await response.Content.ReadFromJsonAsync<CartItem>();
        Assert.NotNull(cartItem);
        Assert.Equal(3, cartItem.Quantity);
    }

    [Fact]
    public async Task AddToCart_WithInvalidQuantity_ReturnsBadRequest()
    {
        await ResetCart();

        var response = await _client.PostAsJsonAsync("/api/cart", new
        {
            productId = 1,
            quantity = 0,
        });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task AddToCart_AboveMaxQuantity_ReturnsBadRequest()
    {
        await ResetCart();

        var response = await _client.PostAsJsonAsync("/api/cart", new
        {
            productId = 1,
            quantity = 6,
        });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task AddToCart_WithUnknownProduct_ReturnsNotFound()
    {
        await ResetCart();

        var response = await _client.PostAsJsonAsync("/api/cart", new
        {
            productId = 9999,
            quantity = 1,
        });

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task UpdateCartQuantity_WithValidQuantity_ReturnsOk()
    {
        await ResetCart();
        await _client.PostAsJsonAsync("/api/cart", new
        {
            productId = 1,
            quantity = 1,
        });

        var response = await _client.PutAsJsonAsync("/api/cart/1", new
        {
            quantity = 4,
        });

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var cartItem = await response.Content.ReadFromJsonAsync<CartItem>();
        Assert.NotNull(cartItem);
        Assert.Equal(4, cartItem.Quantity);
    }

    [Fact]
    public async Task UpdateCartQuantity_WithMissingCartLine_ReturnsNotFound()
    {
        await ResetCart();

        var response = await _client.PutAsJsonAsync("/api/cart/1", new
        {
            quantity = 2,
        });

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task RemoveFromCart_WithExistingItem_ReturnsNoContent()
    {
        await ResetCart();
        await _client.PostAsJsonAsync("/api/cart", new
        {
            productId = 1,
            quantity = 1,
        });

        var response = await _client.DeleteAsync("/api/cart/1");

        Assert.Equal(HttpStatusCode.NoContent, response.StatusCode);
    }

    [Fact]
    public async Task GetCart_ReturnsCurrentItems()
    {
        await ResetCart();
        await _client.PostAsJsonAsync("/api/cart", new
        {
            productId = 1,
            quantity = 1,
        });

        var response = await _client.GetAsync("/api/cart");

        response.EnsureSuccessStatusCode();
        var items = await response.Content.ReadFromJsonAsync<List<CartItem>>();
        Assert.NotNull(items);
        Assert.Single(items);
    }

    [Fact]
    public async Task ClearCart_RemovesAllItems()
    {
        await ResetCart();
        await _client.PostAsJsonAsync("/api/cart", new
        {
            productId = 1,
            quantity = 1,
        });

        var clearResponse = await _client.DeleteAsync("/api/cart");
        Assert.Equal(HttpStatusCode.NoContent, clearResponse.StatusCode);

        var getResponse = await _client.GetAsync("/api/cart");
        var items = await getResponse.Content.ReadFromJsonAsync<List<CartItem>>();
        Assert.NotNull(items);
        Assert.Empty(items);
    }

    private async Task ResetCart()
    {
        await _client.DeleteAsync("/api/cart");
    }
}