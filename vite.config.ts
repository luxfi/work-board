import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { defineConfig, type Plugin, type IndexHtmlTransformContext } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { resolveBrand, resolveBrandKey, brandTitle } from './src/brands';

// Dev proxy target. Defaults to the kubectl port-forward; override to read a
// remote node, e.g. `RPC_TARGET=https://api.pars.network npm run dev`.
const RPC_TARGET = process.env.RPC_TARGET || 'http://127.0.0.1:9631';

// Inject the <title> and a Content-Security-Policy meta tag, both driven by the
// build-time brand (VITE_BRAND, default zoo). The CSP is strict in production
// (no external hosts; only the brand's own RPC host for data) and relaxed in dev
// so Vite HMR works. The app ships zero external CDNs/fonts/scripts, so the
// strict policy is a tight fit. `style-src 'unsafe-inline'` is required for the
// @hanzo/gui (Tamagui) runtime style injection. The connect-src host is derived
// from the RPC actually baked in (VITE_RPC_URL, else the brand default) so the
// CSP can never drift from the endpoint the board calls.
function brandHtml(): Plugin {
  const brand = resolveBrand(process.env.VITE_BRAND);
  const brandKey = resolveBrandKey(process.env.VITE_BRAND);
  // Favicon = the brand's own square mark, inlined as a data: URI so it needs no
  // separate request and satisfies the strict CSP (img-src 'self' data:). Kept as
  // a purpose-built 16px-legible favicon.svg per brand (never the generic
  // placeholder, never cross-brand).
  const faviconSvg = readFileSync(
    fileURLToPath(new URL(`./src/assets/brands/${brandKey}/favicon.svg`, import.meta.url)),
    'utf8',
  );
  const faviconHref = `data:image/svg+xml,${encodeURIComponent(faviconSvg)}`;
  const rpcOrigin = new URL(process.env.VITE_RPC_URL || brand.rpcUrl).origin;
  // The board fetches the brand's Hanzo IAM tenant (OIDC token/userinfo + web3
  // SIWE) — its origin must be in connect-src alongside the RPC host. The
  // authorize redirect is a top-level navigation (not governed by connect-src).
  // img-src also allows https: so an OIDC avatar (GitHub/Discord `picture`) renders.
  const iamOrigin = brand.iam ? new URL(brand.iam.issuer).origin : '';
  const connectSrc = ["'self'", rpcOrigin, iamOrigin].filter(Boolean).join(' ');
  const prod =
    "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; " +
    `img-src 'self' data: https:; font-src 'self'; connect-src ${connectSrc}; ` +
    "base-uri 'self'; frame-ancestors 'none'; object-src 'none'";
  const dev =
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; " +
    "style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; " +
    "connect-src 'self' ws: http: https:; base-uri 'self'; object-src 'none'";
  return {
    name: 'brand-html',
    transformIndexHtml(html: string, ctx: IndexHtmlTransformContext) {
      const policy = ctx.server ? dev : prod;
      return html
        .replace(/<title>[^<]*<\/title>/, `<title>${brandTitle(brand)}</title>`)
        .replace(/<link rel="icon"[^>]*>/, `<link rel="icon" type="image/svg+xml" href="${faviconHref}" />`)
        .replace(
          '</title>',
          `</title>\n    <meta http-equiv="Content-Security-Policy" content="${policy}" />`,
        );
    },
  };
}

// @luxfi/ui is the Lux skin of @hanzo/gui (Tamagui). Welding its cross-platform
// primitives into this Vite web app follows the proven exchange recipe:
//   1. react-native → react-native-web (Tamagui authors against RN primitives).
//   2. dedupe react / react-dom / the gui engine to ONE physical copy each, so
//      createGui() and getGui() read the same module-level config registry
//      (else: "Can't find GUI configuration" on first themed render).
//   3. pre-bundle react-native-web + the CJS-only @react-native/normalize-color
//      and the gui engine via optimizeDeps.
//   4. define __DEV__ / EXPO_OS / IS_WEB — the RN/Tamagui runtime reads them.
//   5. keep the gui engine + RNW in React's chunk (commonjsOptions) so the CJS
//      interop wrapper never yields an undefined createContext.
// Atomic-CSS extraction (@hanzogui/vite-plugin, prod-only) is intentionally NOT
// wired here: its published peer pins vite@8.0.3 which conflicts with 8.1.x, and
// the app renders correctly on the runtime style-injection path without it. See
// LLM.md for how to re-enable extraction once the peer is loosened.
export default defineConfig(({ mode }) => ({
  define: {
    __DEV__: mode !== 'production',
    'process.env.NODE_ENV': JSON.stringify(mode === 'production' ? 'production' : 'development'),
    'process.env.EXPO_OS': JSON.stringify('web'),
    'process.env.IS_WEB': JSON.stringify('true'),
  },
  resolve: {
    alias: {
      'react-native': 'react-native-web',
    },
    dedupe: [
      'react',
      'react-dom',
      '@tanstack/react-query',
      '@hanzo/gui',
      '@hanzogui/core',
      '@hanzogui/web',
    ],
  },
  optimizeDeps: {
    include: [
      'react-native-web',
      '@react-native/normalize-color',
      '@hanzo/gui',
      '@hanzogui/core',
      '@luxfi/ui',
    ],
  },
  plugins: [react(), tailwindcss(), brandHtml()],
  build: {
    // Never split the gui engine / RNW out of React's chunk — they use CJS
    // require('react'); a separate chunk makes the interop createContext undefined.
    commonjsOptions: { include: [/node_modules/] },
  },
  server: {
    proxy: {
      '/rpc': {
        target: RPC_TARGET,
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/rpc/, '/v1/bc/C/rpc'),
      },
    },
  },
}));
