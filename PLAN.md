# Cart Management Implementation Plan

## Objective

Implement a cart review and management flow that is reachable from the existing header cart button, supports quantity updates through `PUT /api/cart/{productId}`, enforces a per-product max quantity of `5`, and keeps the frontend synchronized with server cart state.

## Delivery Strategy

Implement the backend contract first, then connect a dedicated frontend cart state layer, then add the cart UI and tests. This order reduces rework because the frontend behavior depends on final API semantics.

## Step 1: Lock shared rules and types

1. Add a shared backend constant or clearly named rule for maximum cart quantity (`5`) to avoid magic numbers.
2. Add a request model for quantity updates, for example `UpdateCartItemQuantityRequest(int Quantity)`.
3. Move the frontend `CartItem` type out of the API file and into `src/frontend/src/types` so cart state and UI components can share it.
4. Add any frontend request types needed for `PUT` and cart fetch behavior.

## Step 2: Expand backend service contract

1. Update `ICartService` to support the operations required by the feature.
2. Keep `GetAll`, `Add`, `Remove`, and `Clear`.
3. Add an explicit update operation for setting the absolute quantity of an existing item.
4. Decide whether validation stays in endpoints or is partially centralized in the service, but keep the split consistent.

Recommended shape:
- endpoints own HTTP validation and result mapping,
- service owns cart state mutation and lookup behavior.

## Step 3: Implement `InMemoryCartService`

1. Implement read access with safe copying so callers do not mutate internal cart state accidentally.
2. Implement `GetByProductId`.
3. Implement `Add` so existing lines are incremented instead of duplicated.
4. Implement the new quantity-update operation.
5. Implement `Remove` and `Clear`.
6. Preserve thread safety with the existing lock.

Important details:
- Keep insertion order stable for `GetAll`.
- Ensure returned line items reflect updated `Quantity` and computed `TotalPrice`.

## Step 4: Implement cart endpoints

1. Finish `GET /api/cart` to return all cart items.
2. Finish `POST /api/cart` with these branches:
   - `404` when the product does not exist,
   - `400 ValidationProblem` when quantity is invalid or would exceed limit or stock,
   - `201` when creating a new line,
   - `200` when incrementing an existing line.
3. Add `PUT /api/cart/{productId}`.
4. Implement `DELETE /api/cart/{productId}` and `DELETE /api/cart`.
5. Reuse consistent validation messages so frontend tests can assert stable behavior.

Suggested validation rules:
- quantity must be an integer from `1` to `5`,
- effective line quantity must not exceed `5`,
- effective line quantity must not exceed `product.Stock`.

## Step 5: Add backend tests before wiring the UI

1. Add service tests for:
   - adding a new line,
   - incrementing an existing line,
   - updating an existing line quantity,
   - removing a line,
   - clearing the cart.
2. Add endpoint integration tests for:
   - `GET /api/cart` empty and populated cases,
   - `POST /api/cart` create and increment cases,
   - `POST /api/cart` invalid quantity, over-limit, over-stock, and unknown-product cases,
   - `PUT /api/cart/{productId}` success, invalid quantity, over-limit, over-stock, and missing-line cases,
   - delete single-item and clear-cart behavior.

This step should leave the backend green before any frontend integration work begins.

## Step 6: Build a dedicated frontend cart API layer

1. Extend `src/frontend/src/api/index.ts` with:
   - `fetchCart()`,
   - `updateCartItemQuantity(productId, request)`,
   - `removeCartItem(productId)`,
   - `clearCart()`.
2. Normalize API error handling so validation errors can surface useful messages in the UI.
3. Keep product-fetching functions unchanged unless type sharing requires a small cleanup.

## Step 7: Add frontend cart state management

1. Create a dedicated hook such as `useCart`.
2. The hook should:
   - fetch cart contents on mount,
   - expose `items`, `loading`, `error`, `subtotal`, and `totalQuantity`,
   - expose actions for add, update quantity, remove, and clear,
   - keep the backend as the source of truth.
3. Preserve the current transient notification behavior in `App.tsx`, but update it to use cart-action outcomes.

Recommended behavior:
- after successful mutations, reconcile state from the response when possible,
- fall back to refetching only when necessary,
- keep row-level pending state for quantity updates and removals.

## Step 8: Add cart UI components

1. Update `Header` so the cart button can toggle the cart panel.
2. Add a cart panel component under `src/frontend/src/components`, for example `CartPanel`.
3. Render the panel from `App.tsx` to keep cart state close to the header and product list.
4. Show these UI sections:
   - panel header with close button,
   - loading state,
   - empty state,
   - item list,
   - summary with total items and subtotal,
   - clear-cart action.
5. For each row, include:
   - product name,
   - unit price,
   - quantity controls,
   - line total,
   - remove button.

Accessibility requirements:
- the cart button should expose expanded state,
- the panel should have a visible title and accessible relationship from the trigger,
- keyboard users must be able to close the panel with `Escape`.

## Step 9: Integrate catalog add-to-cart behavior with cart state

1. Replace the local `cartItemCount` state in `App.tsx` with the derived `totalQuantity` from cart state.
2. Update the existing add-to-cart flow to call the cart hook action instead of directly calling the API helper.
3. Keep the current success message behavior for successful adds.
4. Surface limit and stock validation messages from the server instead of collapsing every failure into a generic message.

## Step 10: Add frontend tests

1. Update `App.test.tsx` to cover cart-state-driven header count.
2. Add tests for opening and closing the cart panel from the header.
3. Add tests for rendering empty and populated cart states.
4. Add tests for subtotal and line-total rendering.
5. Add tests for quantity updates and remove actions.
6. Add tests for validation errors when attempting to exceed quantity `5`.
7. Add hook tests for `useCart` covering load, success, validation failure, and synchronization behavior.

## Step 11: Final validation and cleanup

1. Run backend tests with `dotnet test test/backend/MockEcommerce.Api.Tests/MockEcommerce.Api.Tests.csproj` from the repository root.
2. Install frontend dependencies if needed, then run the relevant Vitest scope.
3. Verify the cart panel manually in the browser for:
   - initial load,
   - add flow,
   - update flow,
   - over-limit rejection,
   - remove and clear flows,
   - page refresh cart rehydration.
4. Keep copy, labels, and roles stable unless tests are updated intentionally.

## Suggested Execution Order for a Single Developer

1. Backend service contract and implementation.
2. Backend endpoint implementation.
3. Backend tests.
4. Frontend cart API and types.
5. Frontend cart state hook.
6. Cart panel UI and header integration.
7. Frontend tests.
8. Full validation.

## Risks to Watch

1. The current backend cart implementation is fully stubbed, so frontend work should not begin until the cart API contract is stable.
2. The current frontend count is local-only and increments optimistically; this must be replaced with server-backed state to avoid drift.
3. Validation messaging can become inconsistent if quantity-limit logic is duplicated in too many places.
4. The in-memory cart is shared at application scope in the current backend setup; that is acceptable for this demo, but the limitation should remain explicit.