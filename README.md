# DCHOI DESIGNS — Artisan Woodcraft Studio & Commerce Platform

[![Next.js](https://img.shields.io/badge/Next.js-16.3.4-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.2.8-blue?style=for-the-badge&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Stripe](https://img.shields.io/badge/Stripe-API_v2025-635BFF?style=for-the-badge&logo=stripe)](https://stripe.com)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?style=for-the-badge&logo=supabase)](https://supabase.com)
[![License](https://img.shields.io/badge/License-Proprietary-red?style=for-the-badge)]()

> High-end e-commerce experience and complete studio operating system crafted for **DCHOI DESIGNS** — an artisanal woodworking studio based in Chicago, IL specializing in handcrafted Japanese knife *sayas* (Ho-wood / Magnolia & Aged Walnut), bespoke culinary cutlery sheaths, and heirloom end-grain cutting blocks.

---

## Table of Contents

- [Overview & Philosophy](#overview--philosophy)
- [Key Features](#key-features)
  - [Collector Storefront & Showcase](#collector-storefront--showcase)
  - [Commerce, Pricing & Logistics Engine](#commerce-pricing--logistics-engine)
  - [Artisan Studio Operating System (`/admin`)](#artisan-studio-operating-system-admin)
- [System Architecture](#system-architecture)
- [Security & Data Integrity](#security--data-integrity)
- [Project Directory Structure](#project-directory-structure)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Configuration & Environment Variables](#configuration--environment-variables)
- [Available Scripts](#available-scripts)
- [Production Deployment](#production-deployment)

---

## Overview & Philosophy

**DCHOI DESIGNS** blends traditional Japanese woodworking joinery (*kanna* hand-planing, friction-fit tolerances, camellia oil finishes) with modern web engineering. The application provides:

1. **A Museum-Grade Collector Experience**: Immersive stereoscope visuals, harmonic ambient 432Hz synthesizer, real-time Chicago & Tokyo studio clocks, and granular timber grain inspection.
2. **A Zero-Compromise Studio OS**: Built specifically for a solo craftsman or small artisan atelier to oversee timber supply chains, bespoke custom commissions, collector waitlists, official certificates of authenticity, and direct carrier logistics without third-party aggregator markups.

---

## Key Features

### Collector Storefront & Showcase

* **Stereoscope Dynamic Hero**: 60vh sticky parallax header framing curated studio specimens.
* **Curated Specimen Catalog (`/store`)**: Live stock counts, multi-angle imagery, dimensions, wood grain classification, and batch availability.
* **Specimen Detail & Inspection (`/products/[id]`)**: Deep technical breakdowns including harvest year, board feet, air/kiln moisture content, and finish compounds.
* **Bespoke Knife Saya Intake**: Dedicated inquiry workflow capturing spine thickness, blade width, machi-to-tip length, and custom kanji engraving requests.
* **Ambient Soundscape**: Built-in 432Hz harmonic sine-wave sound generator evoking the acoustic resonance of raw wood planing.
* **Studio Dual Clocks**: Synchronized real-time status tracking between Chicago (studio headquarters) and Tokyo (traditional craft origin).

### Commerce, Pricing & Logistics Engine

* **Server-Authoritative Stripe Checkout (`/api/checkout`)**: The server strictly calculates unit pricing, package weights, taxes, and shipping rates directly from verified catalog data, preventing client-side price tampering.
* **Destination Sales Tax Engine (`lib/taxService.ts`)**: Automatic Cook County, IL nexus tax calculations and destination-based rate lookups.
* **Weight-Scaled Shipping Calculator (`lib/shippingService.ts`)**: Live tier pricing for USPS Priority Mail, USPS Priority Mail Express, UPS Ground, and UPS 2nd Day Air, dynamically scaling based on parcel weight (e.g., 14 oz knife sheaths vs. 15 lb end-grain butcher blocks).
* **Automated Line-Item Webhook (`/api/webhooks/stripe`)**: Webhook handler verifying Stripe signatures, recording line items, updating stock, and generating inventory audit records.
* **Trade Access & Discount Codes**: Percentage and flat discount codes with maximum usage limits and real-time validation.

### Artisan Studio Operating System (`/admin`)

An end-to-end management dashboard protected by cryptographically signed HMAC-SHA256 sessions:

1. **Order Fulfillment Hub**: Search, filter, inspect, and fulfill orders with automatic tracking number generation and instant customer notifications.
2. **Timber Lot Registry**: Raw lumber inventory tracking (species, harvest origin, moisture percentage, supplier, and remaining board feet).
3. **Bespoke Commission Kanban**: Step-by-step custom order pipeline (`Inquiry` &rarr; `Measurements Verified` &rarr; `Scribing Spine` &rarr; `Kanna Hand-Planing` &rarr; `Friction-Fit Testing` &rarr; `Camellia Oil Finishing` &rarr; `Ready for Dispatch`).
4. **Collector Waitlist & Drop Alert Broadcaster**: Collects demand for sold-out items and broadcasts small-batch drop email notifications directly to interested buyers.
5. **Printable Collector Documents**:
   * **Print-Ready Packing Slips**: Formatted for standard receipt or letter printing with studio letterhead.
   * **Certificates of Authenticity**: Archival provenance document listing wood species, craftsman signature, SKU, and specimen number.
6. **Direct Carrier Shipping Labels**: Direct integration with USPS and UPS REST APIs for label creation and tracking without Shippo or intermediate fees.
7. **Accounting & Tax Ledger**: Exportable CSV report detailing Illinois vs. out-of-state sales tax, timber COGS estimation, and net contribution.
8. **Transactional Email Engine**: Multi-provider support (Simulated Studio Outbox, Resend API, and Twilio SendGrid) with live email preview and audit logging.

---

## Security & Data Integrity

| Feature | Implementation | Details |
| :--- | :--- | :--- |
| **Pricing Security** | Server-Authoritative Line Items | Client sends only `productId` and `quantity`. Prices are resolved on the server from authoritative product definitions. |
| **Admin Authentication** | HMAC-SHA256 Signed Cookie | Session cookies are generated with a cryptographic HMAC signature keyed with `AUTH_SECRET` and `ADMIN_PASSWORD`. |
| **API Route Guards** | `isAuthenticatedAdmin()` | Administrative routes (`/api/shipping/generate-label`, `/api/upload`, `GET /api/orders`) block unauthenticated requests with HTTP 401. |
| **Data Synchronization** | Hybrid Storage Architecture | Fallback-resilient architecture combining client-side `localStorage`, in-memory server cache, and Supabase PostgreSQL. |

---

## Project Directory Structure

```plaintext
dchoiweb-app/
├── public/                       # Static public assets (images, fonts, favicons)
├── src/
│   ├── app/                      # Next.js App Router
│   │   ├── admin/                # Artisan Studio OS Dashboard
│   │   │   ├── components/       # Studio views (Accounting, Commissions, Timber, etc.)
│   │   │   └── page.tsx          # Main Studio Dashboard view
│   │   ├── api/                  # Secure Backend Endpoints
│   │   │   ├── admin/            # Login, session verification, logout
│   │   │   ├── checkout/         # Server-authoritative Stripe Checkout session
│   │   │   ├── email/send/       # Transactional email dispatcher
│   │   │   ├── integrations/     # Carrier & Stripe live connection testers
│   │   │   ├── orders/           # Authenticated order creation & listing
│   │   │   ├── shipping/         # Carrier label generation API
│   │   │   ├── upload/           # Protected asset upload handler
│   │   │   └── webhooks/stripe/  # Stripe payment fulfillment webhook
│   │   ├── products/[id]/        # Specimen detail & inspection page
│   │   ├── store/                # Public collector catalog
│   │   ├── globals.css           # Vanilla CSS tokens, animations & styles
│   │   ├── layout.tsx            # Global metadata, typography & layout shell
│   │   ├── page.tsx              # Brand flagship landing page
│   │   ├── privacy/              # Privacy policy
│   │   ├── shipping-returns/     # Shipping rates & returns policy
│   │   ├── sitemap.ts            # Dynamic search engine sitemap
│   │   └── terms/                # Terms of service
│   ├── hooks/
│   │   └── useStudioClocks.ts    # Hydration-safe Chicago/Tokyo dual clock hook
│   ├── lib/                      # Core business logic & services
│   │   ├── adminAuth.ts          # HMAC-SHA256 authentication & cookie utilities
│   │   ├── emailService.ts       # Resend / SendGrid / Simulated delivery engine
│   │   ├── shippingService.ts    # USPS/UPS rates & weight-based calculation
│   │   ├── storeManager.ts       # Seed data, inventory state & storage bridges
│   │   └── taxService.ts         # Sales tax rules & destination calculation
│   └── types/
│       └── store.ts              # TypeScript interfaces (Product, Order, Lot, etc.)
├── .env.example                  # Environment variable reference
├── next.config.ts                # Next.js configuration & image remote patterns
├── package.json                  # Dependencies & scripts
└── tsconfig.json                 # TypeScript compiler configuration
```

---

## Tech Stack

* **Framework**: [Next.js 16](https://nextjs.org/) (App Router, Webpack/Turbopack)
* **Frontend**: [React 19](https://react.dev/) with React Compiler compliance
* **Language**: [TypeScript 5](https://www.typescriptlang.org/) (Strict typing, zero `: any` violations)
* **Styling**: Vanilla CSS design tokens & bespoke micro-interactions (no heavy CSS frameworks required)
* **Icons**: [Lucide React](https://lucide.dev/)
* **Payments**: [Stripe](https://stripe.com/) (`@stripe/stripe-js` & `stripe` Node SDK)
* **Database**: [Supabase](https://supabase.com/) (`@supabase/supabase-js`, `@supabase/ssr`)
* **Email**: [Resend](https://resend.com/) & [SendGrid](https://sendgrid.com/)

---

## Getting Started

### Prerequisites

* **Node.js**: `v18.17.0` or higher (Node 20+ recommended)
* **npm**: `v9.0.0` or higher

### 1. Clone & Install Dependencies

```bash
git clone https://github.com/your-username/dchoiweb-app.git
cd dchoiweb-app
npm install
```

### 2. Configure Environment Variables

Create a local environment file by copying the template:

```bash
cp .env.example .env.local
```

Open `.env.local` and define your local configuration keys (see [Configuration & Environment Variables](#configuration--environment-variables) below).

### 3. Start the Development Server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) in your browser.

* Storefront: [http://localhost:3000/store](http://localhost:3000/store)
* Studio Admin: [http://localhost:3000/admin](http://localhost:3000/admin) (Log in using your configured `ADMIN_PASSWORD`)

---

## Configuration & Environment Variables

| Variable | Description | Required | Example |
| :--- | :--- | :---: | :--- |
| `NEXT_PUBLIC_SITE_URL` | Canonical domain for metadata and checkout redirects | Yes | `https://dchoidesigns.com` |
| `ADMIN_PASSWORD` | Passcode for logging into `/admin` | Yes | `studio_craft_pass_2026` |
| `AUTH_SECRET` | Secret key used to sign HMAC-SHA256 session tokens | Yes | `random-32-character-string` |
| `INTERNAL_API_SECRET` | Secret for trusted internal webhook and dispatch calls | Yes | `random-32-character-string` |
| `STRIPE_SECRET_KEY` | Stripe API Secret Key | For Live Checkout | `sk_test_...` or `sk_live_...` |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe Publishable Key | For Live Checkout | `pk_test_...` or `pk_live_...` |
| `STRIPE_WEBHOOK_SECRET` | Stripe Webhook Signing Secret | For Webhooks | `whsec_...` |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project API URL | Optional | `https://xyz.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous public key | Optional | `eyJhbG...` |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase backend service role key | Optional | `eyJhbG...` |
| `RESEND_API_KEY` | Resend API key for live transactional email delivery | Optional | `re_123456...` |
| `USPS_CLIENT_ID` | USPS Developer Portal App Client ID | Optional | `...` |
| `USPS_CLIENT_SECRET` | USPS Developer Portal App Client Secret | Optional | `...` |
| `UPS_CLIENT_ID` | UPS Developer Portal Client ID | Optional | `...` |
| `UPS_CLIENT_SECRET` | UPS Developer Portal Client Secret | Optional | `...` |

> *Note: If Stripe or carrier keys are not provided, the application automatically runs in **Studio Simulation Mode**, enabling complete test checkouts, preview outbox emails, and mock tracking generation directly within the UI.*

---

## Available Scripts

| Command | Action |
| :--- | :--- |
| `npm run dev` | Starts local Next.js development server on port 3000 |
| `npm run build` | Compiles optimized production bundle and pre-renders static pages |
| `npm run start` | Runs the production Next.js server locally |
| `npm run lint` | Runs ESLint across all TypeScript and React files |
| `npx tsc --noEmit` | Validates TypeScript types across the entire codebase |

---

## Production Deployment

### Deploying to Vercel

1. Push your repository to GitHub, GitLab, or Bitbucket.
2. Import the project into the [Vercel Dashboard](https://vercel.com/new).
3. Under **Build & Development Settings**, keep the default settings:
   * **Framework Preset**: Next.js
   * **Build Command**: `next build --webpack`
4. In **Environment Variables**, paste the keys defined in your `.env.local` (ensure `AUTH_SECRET` and `ADMIN_PASSWORD` are set).
5. Deploy. Configure your custom domain (`dchoidesigns.com`) and add your production webhook URL to Stripe:
   ```
   https://dchoidesigns.com/api/webhooks/stripe
   ```
   Listen for the `checkout.session.completed` event.

---

## License & Provenance

© 2026 **DCHOI DESIGNS**. All rights reserved.  
Handcrafted in Chicago, Illinois. All woodworking designs, photography, and code are proprietary.
