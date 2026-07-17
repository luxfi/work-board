import { defineConfig, type Plugin, type IndexHtmlTransformContext } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { resolveBrand, brandTitle } from './src/brands';

// Dev proxy target. Defaults to the kubectl port-forward; override to read a
// remote node, e.g. `RPC_TARGET=https://api.pars.network npm run dev`.
const RPC_TARGET = process.env.RPC_TARGET || 'http://127.0.0.1:9631';

// Inject the <title> and a Content-Security-Policy meta tag, both driven by the
// build-time brand (VITE_BRAND, default zoo). The CSP is strict in production
// (no external hosts; only the brand's own RPC host for data) and relaxed in dev
// so Vite HMR works. The app ships zero external CDNs/fonts/scripts, so the
// strict policy is a tight fit. The connect-src host is derived from the RPC
// actually baked in (VITE_RPC_URL, else the brand default) so the CSP can never
// drift from the endpoint the board calls.
function brandHtml(): Plugin {
  const brand = resolveBrand(process.env.VITE_BRAND);
  const rpcOrigin = new URL(process.env.VITE_RPC_URL || brand.rpcUrl).origin;
  const prod =
    "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; " +
    `img-src 'self' data:; font-src 'self'; connect-src 'self' ${rpcOrigin}; ` +
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
        .replace(
          '</title>',
          `</title>\n    <meta http-equiv="Content-Security-Policy" content="${policy}" />`,
        );
    },
  };
}

export default defineConfig({
  plugins: [react(), tailwindcss(), brandHtml()],
  server: {
    proxy: {
      '/rpc': {
        target: RPC_TARGET,
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/rpc/, '/v1/bc/C/rpc'),
      },
    },
  },
});
