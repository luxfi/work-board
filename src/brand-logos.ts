import type { BrandKey } from './brands';

// Runtime-only brand logo assets. Kept SEPARATE from brands.ts on purpose:
// vite.config.ts imports brands.ts (for the build-time <title> + CSP RPC host),
// and the Vite config bundler can't process `.svg` imports — it parses the SVG
// `<svg>` markup as JSX and fails. So brands.ts stays pure config data (bundler-
// safe) and the .svg imports live here, imported only by the components that
// render a logo. Vite inlines these small SVGs as `data:` URIs (under the 4 KB
// limit), which the strict production CSP permits via `img-src 'self' data:`.
// Each mark is the brand's own canonical asset — never cross-brand.
import zooWordmark from './assets/brands/zoo/wordmark.svg';
import parsWordmark from './assets/brands/pars/wordmark.svg';
import parsMark from './assets/brands/pars/mark.svg';
import luxWordmark from './assets/brands/lux/wordmark.svg';
import luxMark from './assets/brands/lux/mark.svg';
import hanzoWordmark from './assets/brands/hanzo/wordmark.svg';
import hanzoMark from './assets/brands/hanzo/mark.svg';

export type BrandLogos = { logo: string; logoMark: string };

// logo = full wordmark; logoMark = square/icon mark. Zoo ships one trigram for both.
export const BRAND_LOGOS: Record<BrandKey, BrandLogos> = {
  zoo: { logo: zooWordmark, logoMark: zooWordmark },
  pars: { logo: parsWordmark, logoMark: parsMark },
  lux: { logo: luxWordmark, logoMark: luxMark },
  hanzo: { logo: hanzoWordmark, logoMark: hanzoMark },
};
