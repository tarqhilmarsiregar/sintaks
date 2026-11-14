'use client';

/**
 * Client-safe confetti helper.
 * Uses window.confetti (from CDN script) or dynamic import on client-side only.
 * Will never cause Webpack SSR vendor-chunk missing module errors.
 */
export function fireConfetti(options?: {
  particleCount?: number;
  spread?: number;
  origin?: { x?: number; y?: number };
}) {
  if (typeof window === 'undefined') return;

  const win = window as any;
  if (typeof win.confetti === 'function') {
    win.confetti(options || {
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 }
    });
    return;
  }

  // Fallback: load dynamically if script not loaded yet
  try {
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/canvas-confetti@1.9.3/dist/confetti.browser.min.js';
    script.async = true;
    script.onload = () => {
      if (typeof win.confetti === 'function') {
        win.confetti(options || {
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 }
        });
      }
    };
    document.head.appendChild(script);
  } catch {
    // Non-critical visual effect, fail silently
  }
}

