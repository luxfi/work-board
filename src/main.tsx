import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { AppProvider } from '@luxfi/ui';
import './index.css';
import { App } from './App';
import { BRAND_KEY } from './config';
import { isAuthCallback, handleAuthCallback } from './auth';

const root = document.getElementById('root');
if (!root) throw new Error('#root not found');

// The board runs on the @luxfi/ui / @hanzo/gui (Tamagui) engine. AppProvider
// mounts GuiProvider (the Tamagui runtime every @luxfi/ui primitive needs) +
// TanStack Query, and selects the per-org brand child-theme row as a VALUE —
// `dark_${BRAND_KEY}` resolves to dark_lux | dark_zoo | dark_hanzo | dark_pars.
// Bespoke Dework markup still reads the `--brand` CSS var (set in App.tsx from
// the same @luxfi/ui LUX_BRAND source), so brand is one value in one place.
const brandTheme = `dark_${BRAND_KEY}`;

// The OAuth redirect (Discord / GitHub) lands on /auth/callback — the static
// server's SPA fallback serves index.html, so we finish the PKCE code exchange
// here and then navigate back to '/'. The board itself never mounts on this path.
if (isAuthCallback()) {
  createRoot(root).render(
    <div className="flex h-full flex-col items-center justify-center gap-3 text-neutral-500">
      <span className="h-6 w-6 animate-spin rounded-full border-2 border-neutral-700" style={{ borderTopColor: 'var(--brand)' }} />
      <span className="text-sm">Completing sign-in…</span>
    </div>,
  );
  void handleAuthCallback();
} else {
  createRoot(root).render(
    <StrictMode>
      <AppProvider defaultTheme={brandTheme}>
        <App />
      </AppProvider>
    </StrictMode>,
  );
}
