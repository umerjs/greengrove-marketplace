# GreenGrove Marketplace

Build a B2B nursery marketplace MVP called GreenKarachi.

Stack: .react, Supabase, Tailwind, TypeScript.

3 roles: super_admin, nursery_seller, buyer.

Pages needed:

1. /login — email + password, redirect by role

2. /seller/dashboard — seller sees their inventory, can update quantity per product

3. /buyer/marketplace — shows aggregated total stock per product across ALL nurseries

4. /admin/nurseries — list of nurseries with approve/reject button

Supabase tables:

- users (id, email, role)

- nurseries (id, owner_user_id, name, verification_status)

- product_catalog (id, name, category)

- nursery_inventory (id, nursery_id, product_id, quantity_available, price_per_unit)

Key logic: buyer page calls a Supabase view that SUMs quantity_available grouped by product across all verified nurseries. Show this as a card: "Coconut Plants — 8,420 available across 14 nurseries."

Seed data: 2 nurseries, 1 product (Coconut Plant), different quantities per nursery.

Green color theme. Clean, professional B2B look.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/8a841cef-6f2b-412e-878c-6c5738a23811).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
