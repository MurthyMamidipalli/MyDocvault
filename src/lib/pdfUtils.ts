/**
 * Utility functions for handling PDF base64 data URLs, blob conversions,
 * native browser previews, and downloads.
 */

/**
 * Convert a base64 data URL or raw URL to a Blob Object URL (`blob:http...`).
 */
export function dataUrlToBlobUrl(dataUrl: string): string {
  if (!dataUrl || !dataUrl.startsWith('data:')) {
    return dataUrl;
  }
  try {
    const parts = dataUrl.split(',');
    const mimeMatch = parts[0].match(/:(.*?);/);
    const mimeType = mimeMatch ? mimeMatch[1] : 'application/pdf';
    const base64Data = parts[1];

    const binaryStr = window.atob(base64Data);
    const len = binaryStr.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryStr.charCodeAt(i);
    }

    const blob = new Blob([bytes], { type: mimeType });
    return URL.createObjectURL(blob);
  } catch (err) {
    console.error("[pdfUtils] Failed to convert data URL to Blob URL:", err);
    return dataUrl;
  }
}

/**
 * Safely opens a PDF or document in a new browser tab.
 * Converts base64 Data URLs to Blob URLs so modern browsers (Chrome/Edge/Safari)
 * render the PDF natively in the top-level tab without blocking navigation.
 */
export function openPdfInNewTab(url: string, filename?: string): void {
  if (!url) return;

  let targetUrl = url;
  if (url.startsWith('data:')) {
    targetUrl = dataUrlToBlobUrl(url);
  }

  const win = window.open(targetUrl, '_blank', 'noopener,noreferrer');
  if (!win) {
    // Fallback if popup blocker prevented window.open
    const a = document.createElement('a');
    a.href = targetUrl;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    if (filename) a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }
}

/**
 * Downloads a file cleanly from a base64 Data URL or standard URL.
 */
export function downloadFileUrl(url: string, filename: string): void {
  if (!url) return;

  let targetUrl = url;
  let isBlobCreated = false;

  if (url.startsWith('data:')) {
    targetUrl = dataUrlToBlobUrl(url);
    isBlobCreated = targetUrl.startsWith('blob:');
  }

  const a = document.createElement('a');
  a.href = targetUrl;
  a.download = filename || 'document.pdf';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);

  if (isBlobCreated) {
    setTimeout(() => {
      try {
        URL.revokeObjectURL(targetUrl);
      } catch (_) {}
    }, 15000);
  }
}
