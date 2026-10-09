# GreenKarachi Marketplace

GreenKarachi is a B2B wholesale marketplace that aggregates available stock from verified Karachi nurseries. Buyers see a platform-wide stock total and can place one bulk order; the API reserves stock and splits fulfillment across nurseries. Sellers manage their own inventory and deliveries, while admins approve sellers and manage the catalog.

## Stack

- `client/`: React 18, Vite, React Router, Tailwind CSS, TanStack Query
- `server/`: Node.js, Express, Mongoose, MongoDB, JWT access tokens and HTTP-only refresh cookies
- `GreenKarachi — MERN Stack PRD & App Flow.md`: product requirements and detailed application flows

## Run locally

Use Node.js 18+ and MongoDB. Install dependencies and configure the API environment:

```sh
npm run install:all
```

Set `MONGODB_URI`, `JWT_ACCESS_SECRET`, and `JWT_REFRESH_SECRET` in `server/.env`. `CLIENT_URL` defaults to `http://localhost:5173`; the API listens on port `5000` by default.

Start the API and web client in separate terminals:

```sh
npm run dev:server
npm run dev
```

The web app reads `VITE_API_URL` from `client/.env`; it defaults to `http://localhost:5000/api/v1`.

## Demo data

When connected to a disposable development database, run `npm run seed`. Demo users use the password `password123`:

- `admin@greenkarachi.pk` — platform administrator
- `seller1@gulshan.pk`, `seller2@defence.pk` — verified sellers
- `seller3@korangi.pk` — pending seller application
- `buyer1@company.pk` — buyer

The seed command currently resets collections in the configured database. Do not run it against data you need to keep.

## App flow

1. Buyers browse the public catalog and see aggregated stock from verified, listed nurseries.
2. A buyer chooses a product and quantity. Checkout reserves stock for ten minutes, previews the price and nursery split, and confirms a COD order.
3. Sellers accept, reject, dispatch, or deliver their assigned sub-orders. Rejected quantities are offered to other eligible nurseries.
4. Admins approve nursery applications, monitor orders, and manage product catalog entries.

## Useful commands

```sh
npm run build       # build the React client
npm test            # run the backend tests
npm run seed        # seed demo data in the configured MongoDB
```
