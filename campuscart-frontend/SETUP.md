# CampusCart Frontend — Setup

## What's in this batch
Three real screens, all connected to your working Django backend:
- **Login** — `/login`
- **Register** — `/register`
- **Home / Browse** — `/` — live product grid, search, and category filter

`/listing/:id` and `/sell` are wired up as routes but show a "coming soon"
placeholder for now — those are the next screens to build, once you're
ready (they'll use the same Product Listings API that already works).

## Design direction
Dark "Liquid Gravity" glassmorphism, styled around a **laminated campus
ID card** motif (rounded glass panels, a gold hairline "lamination edge,"
a holographic sheen on hover) — ties the visual language to the actual
point of the app: a trusted, verified-student marketplace. Fraunces
(serif) for headings, Manrope for body text, IBM Plex Mono for prices —
gives listings a "ledger" feel rather than looking like a generic store.

## 1. Install Node.js
If you don't already have it: download and install Node.js LTS from
https://nodejs.org (this also installs `npm`). Any recent LTS version
works fine.

## 2. Install dependencies
Open a terminal inside this `campuscart-frontend` folder and run:
```
npm install
```

## 3. Make sure your Django backend is running
This frontend expects the API at `http://localhost:8000` (see
`src/api/client.js` if you ever need to change that). Start your backend
the same way as always:
```
python manage.py runserver
```

## 4. Run the frontend
In a separate terminal, inside `campuscart-frontend`:
```
npm run dev
```
This opens the app at `http://localhost:5173`. Register a new account,
log in, and you should see your real listings show up on the home page
in the styled grid.

## Notes
- JWT tokens are stored in `localStorage` and attached automatically to
  every API request. If a request comes back 401 (expired token), the
  app automatically tries refreshing it once using the stored refresh
  token before giving up and sending you back to login.
- The search box and category chips on the Home page are already fully
  wired to the real `?search=` and `?category=` query params your
  Product Listings API already supports — so this batch quietly
  delivers basic search/filter too, not just visuals.
- If a listing has no photos yet (nothing uploaded via Cloudinary), the
  card shows a soft "CC" placeholder instead of a broken image.
