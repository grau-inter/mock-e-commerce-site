# Cart Management Feature Spec

## Summary

Users can open a cart view from the existing cart button in the header, review the items currently in their cart, see line totals and cart subtotal, update item quantities, remove items, and clear the cart before checkout. The cart remains a pre-checkout review surface only; an actual checkout flow is out of scope.

This spec is aligned to the current repo structure:
- Frontend: React single-page app under `src/frontend`.
- Backend: minimal API under `src/backend/MockEcommerce.Api`.
- Cart data: server-owned, in-memory cart state.

## Scope

In scope:
- Open and close a cart panel from the header cart icon.
- Fetch and render cart contents.
- Show pricing information for each line item and the cart subtotal.
- Add items to the cart, subject to validation.
- Update the quantity of an existing cart item through `PUT /api/cart/{productId}`.
- Remove a single cart item.
- Clear all cart items.
- Enforce a maximum quantity of `5` per product.

Out of scope:
- Authentication or per-user carts.
- Persistence beyond the lifetime of the running backend process.
- Taxes, shipping, discounts, promo codes, or currency switching.
- A real checkout screen, navigation, or backend checkout endpoint.

## Resolved Ambiguities

### Cart entry point

The existing header cart button opens a cart side panel in the current page instead of navigating to a separate route. The panel can be closed by:
- clicking the cart button again,
- clicking a close button inside the panel,
- pressing `Escape`.

### Cart count in the header

The header badge shows the total quantity of units across all cart lines, not the number of distinct products.

Example:
- 2 headphones + 1 keyboard => header count is `3`.

### Quantity rule

The maximum allowed quantity for any single product in the cart is `5`.

This limit applies to:
- adding a new item,
- adding more of an item already in the cart,
- updating an existing item through `PUT /api/cart/{productId}`.

Requests that would make a cart line exceed `5` are rejected. The server does not clamp or partially apply the request.

### Stock rule

Product stock still matters. The effective maximum allowed quantity for a product is:
- `min(5, product.stock)`.

If the requested quantity exceeds available stock, the request is rejected even if it is `<= 5`.

### Quantity value semantics

`POST /api/cart` and `PUT /api/cart/{productId}` both require a positive integer quantity between `1` and `5` inclusive.

`PUT` with quantity `0` is rejected as invalid input. Removing an item must use `DELETE /api/cart/{productId}`.

### Cart loading behavior

The frontend fetches the cart on initial app load so the header count and cart panel reflect server state after page refreshes.

## User Experience

## Header cart button

- The existing button remains the cart entry point.
- The accessible name continues to describe the current total quantity.
- When the cart panel is open, the button should reflect that state with appropriate accessibility attributes such as `aria-expanded` and a relationship to the panel.

## Cart panel states

The cart panel has four states:

### Loading

- Shown while the initial cart request is in flight.

### Empty

- Message indicating the cart is empty.
- No subtotal beyond `$0.00`.
- No quantity controls.

### Loaded

Each cart line shows:
- product name,
- unit price,
- current quantity,
- line total,
- quantity controls,
- remove action.

The cart summary shows:
- total items,
- subtotal.

### Error

- Display a visible error message when cart fetch or mutation fails.
- Previously loaded cart data remains visible when possible.

## Add to cart behavior

When a user adds a product from the catalog:
- the frontend calls `POST /api/cart`,
- on success, the header count updates to the latest total quantity,
- the success message remains visible as a transient status message,
- if the cart panel is open, it updates immediately.

If the request is rejected because the item would exceed the limit or stock:
- the cart is unchanged,
- the user sees a clear validation message.

Recommended validation copy:
- `You can add up to 5 of this item.`
- `Only X units are available for this item.`

## Update quantity behavior

Users can change the quantity of an item already in the cart from the cart panel.

Expected interaction:
- the UI offers increment and decrement controls and may also use a numeric input,
- any attempted change is constrained to the valid range of `1` through `5`,
- the change is saved via `PUT /api/cart/{productId}` using the desired absolute quantity,
- while the request is in flight, controls for that row are disabled,
- on success, the line item, subtotal, and header count update,
- on failure, the UI restores the prior value and shows an error message.

## Remove and clear behavior

- Removing a single line calls `DELETE /api/cart/{productId}`.
- Clearing the cart calls `DELETE /api/cart`.
- Both actions update the header count and subtotal immediately after success.

## API Contract

## Shared models

### Cart item response

```json
{
  "productId": 1,
  "productName": "Wireless Headphones",
  "unitPrice": 79.99,
  "quantity": 2,
  "totalPrice": 159.98
}
```

`totalPrice` is server-computed as `unitPrice * quantity`.

### Quantity request body

```json
{
  "quantity": 3
}
```

## GET `/api/cart`

Returns all cart items in insertion order.

### Success

- Status: `200 OK`
- Body: `CartItem[]`

### Example

```json
[
  {
    "productId": 1,
    "productName": "Wireless Headphones",
    "unitPrice": 79.99,
    "quantity": 2,
    "totalPrice": 159.98
  }
]
```

## POST `/api/cart`

Adds a product to the cart.

Request body:

```json
{
  "productId": 1,
  "quantity": 1
}
```

Behavior:
- If the product is not already in the cart, create a new line.
- If the product is already in the cart, increment the existing line quantity by the request quantity.
- Reject the request if the resulting quantity would exceed the allowed max or stock.

### Success

- `201 Created` when a new cart line is created.
- `200 OK` when an existing cart line is incremented.
- Body: updated `CartItem`.

### Errors

- `404 Not Found` if the product does not exist.
- `400 Bad Request` with validation details if:
  - `quantity < 1`,
  - `quantity > 5`,
  - resulting line quantity would exceed `5`,
  - resulting line quantity would exceed available stock.

## PUT `/api/cart/{productId}`

Sets the absolute quantity for an existing cart line.

Path parameter:
- `productId`: integer product identifier.

Request body:

```json
{
  "quantity": 4
}
```

Behavior:
- Updates the cart line to the requested quantity.
- Does not create a new line if the product is not already in the cart.

### Success

- `200 OK`
- Body: updated `CartItem`

### Errors

- `404 Not Found` if the product does not exist or is not currently in the cart.
- `400 Bad Request` with validation details if:
  - `quantity < 1`,
  - `quantity > 5`,
  - `quantity > product.stock`.

## DELETE `/api/cart/{productId}`

Removes one cart line.

### Success

- `204 No Content`

### Errors

- `404 Not Found` if the product is not currently in the cart.

## DELETE `/api/cart`

Clears the full cart.

### Success

- `204 No Content`

## Validation and Error Shape

For validation failures, the backend should use `ValidationProblem` with an `errors` object keyed by field name.

Example:

```json
{
  "errors": {
    "quantity": [
      "You can add up to 5 of this item."
    ]
  }
}
```

For not-found cases where the minimal API currently returns a typed not-found result, the body may be empty unless the endpoint already uses a string payload. The frontend must not rely on a structured error body for `404` responses.

## Frontend Data Rules

- The frontend treats the backend as the source of truth for cart contents.
- The header count is derived from the server-backed cart state.
- The subtotal is computed client-side from returned cart lines by summing `totalPrice`.
- All money displays use two decimal places in USD formatting consistent with the current UI.

## Edge Cases

1. Adding a sixth unit of the same product is rejected and leaves the cart unchanged.
2. Adding a quantity that would exceed stock is rejected and leaves the cart unchanged.
3. Updating a cart line to `5` succeeds if stock permits.
4. Updating a cart line to `6` fails validation.
5. Updating a cart line to `0` fails validation; the user must remove the item instead.
6. Updating a product that is not in the cart returns `404`.
7. Reloading the page preserves cart state as long as the backend process remains running.
8. Restarting the backend resets the cart because storage is in memory only.
9. If the cart becomes empty after a removal or clear action, the empty state is shown and the header count becomes `0`.
10. If a product exists in the cart and later catalog stock becomes lower than the cart quantity, the next update attempt must validate against current stock and fail until the quantity is reduced to an allowed value.

## Acceptance Criteria

1. Clicking the header cart button opens and closes the cart panel.
2. The cart panel shows current cart items, quantities, line totals, total item count, and subtotal.
3. The header badge reflects total quantity across all cart lines.
4. Adding an item already in the cart increments its quantity only when the resulting quantity is valid.
5. Any attempt to exceed quantity `5` for a product is rejected with a visible validation message.
6. Users can update an existing cart line quantity through the UI, backed by `PUT /api/cart/{productId}`.
7. Users can remove a single item and clear the whole cart.
8. Reloading the frontend rehydrates the cart state from `GET /api/cart`.
9. Backend tests cover add, update, remove, clear, quantity-limit, and stock-validation paths.
10. Frontend tests cover cart panel visibility, rendered totals, quantity updates, limit-error handling, and header count synchronization.