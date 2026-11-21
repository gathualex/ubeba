# Changelog

## Unreleased — 2026-11-21

### Added

- Added a light/dark theme toggle that follows the device setting until the visitor chooses a theme.
- Added Anime.js motion for storefront and administration page sections, cards, forms, tables, and modal dialogs, with reduced-motion support.
- Added product-card image loading placeholders and hover carousels that progress through the gallery and return to the first image when the pointer leaves.
- Added image transitions to the product detail gallery, plus floating previous/next controls and image thumbnails.
- Added image cropping for the product-card aspect ratio, primary-image selection during upload, and gallery image ordering and removal in the editor.
- Added view counts to product cards when a product has views, a compact WhatsApp inquiry action, and an out-of-stock tag with a softened image for sold products.
- Added low-priority preloading of alternate product-card images after the catalog becomes idle.
- Added category-page pagination and set both shop and category listings to a maximum of 20 products per page.
- Added a searchable category management table with a category details dialog and accessible edit/delete icon buttons.
- Added dedicated pages for adding one product and adding multiple products, with shared styling for light and dark themes.
- Added a changelog covering this release.

### Changed

- Moved the administration area to `/ubeba-admin`, updated internal navigation and documentation, and redirected old `/admin` URLs to the new route.
- Refreshed the product detail page and administration product editor.
- Updated product grids to keep cards compact when filters return only a few items, with five or more columns on wide screens, three on medium screens, and two on small screens.
- Generated product and category URL slugs automatically and hid the slug fields from administrator forms.
- Reworked product inquiry URLs to use the canonical public site origin.
- Updated administration category and product creation flows to use dedicated pages instead of dialogs.

### Fixed

- Improved dark-mode contrast for featured tags, product controls, category illustrations, and homepage artwork.
- Prevented normal storefront navigation from exposing the administration page.
- Improved image fitting in product cards and filled the product detail image frame.
