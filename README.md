# PropertyOps Mobile

A GitHub Pages-ready mobile web app for ordering products from multiple 3PL suppliers.

## What works right now
- Sign-in flow stored in browser
- Supplier catalog with search and filters
- Add to cart with quantity controls
- Checkout flow split by supplier
- Order tracking with status progression
- Reorder from previous orders
- Issue / return reports with optional image upload
- Saved property locations
- CSV export for orders
- Mobile-friendly white and blue interface

## Important note
This version is a true working front end for GitHub Pages, but it uses **localStorage** in the browser.
That means it works without a backend, but data is saved per browser/device.

## To make it fully cloud-based later
Add a backend like:
- Supabase
- Firebase
- Airtable + API
- Your own Node / Flask backend

## GitHub upload steps
1. Create a new repo.
2. Upload `index.html`, `styles.css`, `app.js`, and this `README.md`.
3. In GitHub repo settings, enable **Pages** from the main branch.
4. Open the GitHub Pages link.

## Best next upgrade
Use Supabase for:
- real user accounts
- shared cloud orders
- supplier dashboards
- inventory syncing
- notifications
