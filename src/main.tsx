import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import { App } from './App';
import { isAuthCallback, handleAuthCallback } from './auth';

const root = document.getElementById('root');
if (!root) throw new Error('#root not found');

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
      <App />
    </StrictMode>,
  );
}
