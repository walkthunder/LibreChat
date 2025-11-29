/**
 * Browser Fingerprint Generator
 * Generates a unique fingerprint based on browser characteristics
 */

export interface BrowserFingerprint {
  userAgent: string;
  language: string;
  platform: string;
  screenResolution: string;
  timezone: string;
  canvas?: string;
  webgl?: string;
}

/**
 * Generate canvas fingerprint
 */
const getCanvasFingerprint = (): string => {
  try {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';

    canvas.width = 200;
    canvas.height = 50;

    ctx.textBaseline = 'top';
    ctx.font = '14px Arial';
    ctx.fillStyle = '#f60';
    ctx.fillRect(125, 1, 62, 20);
    ctx.fillStyle = '#069';
    ctx.fillText('LibreChat', 2, 15);
    ctx.fillStyle = 'rgba(102, 204, 0, 0.7)';
    ctx.fillText('LibreChat', 4, 17);

    return canvas.toDataURL();
  } catch (e) {
    return '';
  }
};

/**
 * Generate WebGL fingerprint
 */
const getWebGLFingerprint = (): string => {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (!gl) return '';

    const debugInfo = (gl as any).getExtension('WEBGL_debug_renderer_info');
    if (!debugInfo) return '';

    const vendor = (gl as any).getParameter(debugInfo.UNMASKED_VENDOR_WEBGL);
    const renderer = (gl as any).getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);

    return `${vendor}~${renderer}`;
  } catch (e) {
    return '';
  }
};

/**
 * Generate browser fingerprint
 */
export const generateBrowserFingerprint = async (): Promise<BrowserFingerprint> => {
  const fingerprint: BrowserFingerprint = {
    userAgent: navigator.userAgent,
    language: navigator.language,
    platform: navigator.platform,
    screenResolution: `${screen.width}x${screen.height}x${screen.colorDepth}`,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  };

  // Add canvas fingerprint (async to avoid blocking)
  try {
    fingerprint.canvas = getCanvasFingerprint();
  } catch (e) {
    console.warn('Canvas fingerprint failed:', e);
  }

  // Add WebGL fingerprint
  try {
    fingerprint.webgl = getWebGLFingerprint();
  } catch (e) {
    console.warn('WebGL fingerprint failed:', e);
  }

  return fingerprint;
};

/**
 * Check if fingerprint is stored in localStorage
 */
export const getStoredFingerprint = (): BrowserFingerprint | null => {
  try {
    const stored = localStorage.getItem('browser_fingerprint');
    return stored ? JSON.parse(stored) : null;
  } catch (e) {
    return null;
  }
};

/**
 * Store fingerprint in localStorage
 */
export const storeFingerprint = (fingerprint: BrowserFingerprint): void => {
  try {
    localStorage.setItem('browser_fingerprint', JSON.stringify(fingerprint));
  } catch (e) {
    console.warn('Failed to store fingerprint:', e);
  }
};

/**
 * Get or generate browser fingerprint
 */
export const getOrGenerateFingerprint = async (): Promise<BrowserFingerprint> => {
  const stored = getStoredFingerprint();
  if (stored) {
    return stored;
  }

  const fingerprint = await generateBrowserFingerprint();
  storeFingerprint(fingerprint);
  return fingerprint;
};
