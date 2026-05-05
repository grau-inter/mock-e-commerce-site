using Microsoft.AspNetCore.Http.HttpResults;
using MockEcommerce.Api.Models;
using MockEcommerce.Api.Services;

namespace MockEcommerce.Api.Endpoints;

/// <summary>
/// Maps shopping cart endpoints under <c>/api/cart</c>.
/// </summary>
public static class CartEndpoints
{
    private const int MaxQuantityPerProduct = 5;

    /// <summary>Registers cart-related routes on the given endpoint route builder.</summary>
    public static void MapCartEndpoints(this WebApplication app)
    {
        var group = app.MapGroup("api/cart")
            .WithTags("Cart");

        group.MapGet("/", GetCart)
            .WithName("GetCart")
            .WithSummary("Returns all items currently in the cart.");

        group.MapPost("/", AddToCart)
            .WithName("AddToCart")
            .WithSummary("Adds a product to the cart or increments quantity if already present.");

        group.MapPut("/{productId:int}", UpdateCartQuantity)
            .WithName("UpdateCartQuantity")
            .WithSummary("Updates quantity for a single cart item.");

        group.MapDelete("/{productId:int}", RemoveFromCart)
            .WithName("RemoveFromCart")
            .WithSummary("Removes a single product from the cart by its product ID.");

        group.MapDelete("/", ClearCart)
            .WithName("ClearCart")
            .WithSummary("Removes all items from the cart.");
    }

    /// <summary>Returns all items currently in the cart.</summary>
    internal static Ok<IEnumerable<CartItem>> GetCart(ICartService cartService)
    {
        return TypedResults.Ok(cartService.GetAll());
    }

    /// <summary>Adds a product to the cart or increments quantity if already present.</summary>
    internal static Results<Created<CartItem>, Ok<CartItem>, NotFound<string>, ValidationProblem> AddToCart(
        AddToCartRequest request,
        IProductService productService,
        ICartService cartService)
    {
        if (request.Quantity < 1)
        {
            return TypedResults.ValidationProblem(CreateQuantityError("Quantity must be at least 1."));
        }

        if (request.Quantity > MaxQuantityPerProduct)
        {
            return TypedResults.ValidationProblem(CreateQuantityError($"You can add up to {MaxQuantityPerProduct} of this item."));
        }

        var product = productService.GetById(request.ProductId);
        if (product is null)
        {
            return TypedResults.NotFound("Product not found.");
        }

        var existingItem = cartService.GetByProductId(request.ProductId);
        var resultingQuantity = (existingItem?.Quantity ?? 0) + request.Quantity;

        if (resultingQuantity > MaxQuantityPerProduct)
        {
            return TypedResults.ValidationProblem(CreateQuantityError($"You can add up to {MaxQuantityPerProduct} of this item."));
        }

        if (resultingQuantity > product.Stock)
        {
            return TypedResults.ValidationProblem(CreateQuantityError($"Only {product.Stock} units are available for this item."));
        }

        var updatedItem = cartService.Add(new CartItem
        {
            ProductId = product.Id,
            ProductName = product.Name,
            UnitPrice = product.Price,
            Quantity = request.Quantity,
        });

        return existingItem is null
            ? TypedResults.Created($"/api/cart/{updatedItem.ProductId}", updatedItem)
            : TypedResults.Ok(updatedItem);
    }

    /// <summary>Updates quantity for a single cart item.</summary>
    internal static Results<Ok<CartItem>, NotFound<string>, ValidationProblem> UpdateCartQuantity(
        int productId,
        UpdateCartQuantityRequest request,
        IProductService productService,
        ICartService cartService)
    {
        if (request.Quantity < 1)
        {
            return TypedResults.ValidationProblem(CreateQuantityError("Quantity must be at least 1."));
        }

        if (request.Quantity > MaxQuantityPerProduct)
        {
            return TypedResults.ValidationProblem(CreateQuantityError($"You can add up to {MaxQuantityPerProduct} of this item."));
        }

        var product = productService.GetById(productId);
        if (product is null)
        {
            return TypedResults.NotFound("Product not found.");
        }

        if (request.Quantity > product.Stock)
        {
            return TypedResults.ValidationProblem(CreateQuantityError($"Only {product.Stock} units are available for this item."));
        }

        var updatedItem = cartService.UpdateQuantity(productId, request.Quantity);
        if (updatedItem is null)
        {
            return TypedResults.NotFound("Cart item not found.");
        }

        return TypedResults.Ok(updatedItem);
    }

    /// <summary>Removes a single product from the cart by its product ID.</summary>
    internal static Results<NoContent, NotFound> RemoveFromCart(int productId, ICartService cartService)
    {
        return cartService.Remove(productId)
            ? TypedResults.NoContent()
            : TypedResults.NotFound();
    }

    /// <summary>Removes all items from the cart.</summary>
    internal static NoContent ClearCart(ICartService cartService)
    {
        cartService.Clear();
        return TypedResults.NoContent();
    }

    private static Dictionary<string, string[]> CreateQuantityError(string message)
    {
        return new Dictionary<string, string[]>
        {
            ["quantity"] = [message],
        };
    }
}

/// <summary>Request body for adding a product to the cart.</summary>
public record AddToCartRequest(int ProductId, int Quantity);

/// <summary>Request body for updating quantity of an existing cart item.</summary>
public record UpdateCartQuantityRequest(int Quantity);
