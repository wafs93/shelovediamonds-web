# shelovediamonds-web

## Sanity CMS Setup

### 1) Start the Sanity Studio

```bash
cd sanity-studio
npm install
cp .env.example .env
# set SANITY_STUDIO_PROJECT_ID in .env
npm run dev
```

### 2) Seed the 5 existing products

Create a Sanity token with write access, then run:

```bash
cd ..
SANITY_PROJECT_ID=your_project_id SANITY_DATASET=production SANITY_API_TOKEN=your_token node scripts/seed-sanity-products.mjs
```

### 3) Connect storefront pages

Set public Sanity config in [js/sanity-config.js](js/sanity-config.js):

- `projectId`
- `dataset`
- `apiVersion`
- `useCdn`

When configured, product pages will pull from Sanity first, with local fallback data from [js/products.js](js/products.js).