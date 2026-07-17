import { defineConfig, type Plugin, type IndexHtmlTransformContext } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// Dev proxy target. Defaults to the kubectl port-forward; override to read a
// remote node, e.g. `RPC_TARGET=https://api.zoo.network npm run dev`.
const RPC_TARGET = process.env.RPC_TARGET || 'http://127.0.0.1:9631';

// Inject a Content-Security-Policy meta tag. Strict in production (no external
// hosts; only the Zoo RPC for data); relaxed in dev so Vite HMR works. The app
// ships zero external CDNs/fonts/scripts, so the strict policy is a tight fit.
function csp(): Plugin {
  const prod =
    "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; " +
    "img-src 'self' data:; font-src 'self'; connect-src 'self' https://api.zoo.network; " +
    "base-uri 'self'; frame-ancestors 'none'; object-src 'none'";
  const dev =
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; " +
    "style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; " +
    "connect-src 'self' ws: http: https:; base-uri 'self'; object-src 'none'";
  return {
    name: 'csp-meta',
    transformIndexHtml(html: string, ctx: IndexHtmlTransformContext) {
      const policy = ctx.server ? dev : prod;
      return html.replace(
        '</title>',
        `</title>\n    <meta http-equiv="Content-Security-Policy" content="${policy}" />`,
      );
    },
  };
}

export default defineConfig({
  plugins: [react(), tailwindcss(), csp()],
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
