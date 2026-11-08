/**
 * Utility functions for handling PDF base64 data URLs, blob conversions,
 * native browser previews, filename sanitization, and downloads.
 */

/**
 * Clean and sanitize a filename for safe OS downloading (removes spaces before extension,
 * invalid characters, and guarantees clean .pdf extension).
 */
export function sanitizeFilename(filename: string, fallbackName = 'document.pdf'): string {
  if (!filename) return fallbackName;
  
  let clean = filename.trim();
  // Remove trailing spaces or dots before extension
  clean = clean.replace(/\s+\./g, '.');
  // Replace internal spaces and special characters with single underscores
  clean = clean.replace(/[\s\t\n\r]+/g, '_').replace(/[^a-zA-Z0-9._-]/g, '');
  
  if (!clean || clean === '.pdf') {
    return fallbackName;
  }
  
  if (!clean.toLowerCase().endsWith('.pdf') && !clean.includes('.')) {
    clean += '.pdf';
  }
  
  return clean;
}

/**
 * Fallback PDF generation disabled per user requirement:
 * Don't show and don't generate AI generated PDFs in website.
 */
export function createFallbackPdfDataUrl(_title: string, _subtitle = 'MyDocVault Document Record'): string {
  return '';
}

const blobUrlCache = new Map<string, string>();

/**
 * Convert a base64 data URL or raw URL to a Blob Object URL (`blob:http...`).
 */
export function dataUrlToBlobUrl(dataUrl: string, fallbackTitle?: string): string {
  if (!dataUrl || dataUrl.includes('example.com')) {
    return '';
  }

  if (!dataUrl.startsWith('data:')) {
    return dataUrl;
  }

  if (blobUrlCache.has(dataUrl)) {
    return blobUrlCache.get(dataUrl)!;
  }

  try {
    const parts = dataUrl.split(',');
    if (parts.length < 2) return dataUrl;
    
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
    const url = URL.createObjectURL(blob);
    blobUrlCache.set(dataUrl, url);
    return url;
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
  if (!url || url.includes('example.com')) return;
  let targetUrl = url;

  const lowerName = (filename || '').toLowerCase();
  const isOfficeOrBinary = lowerName.endsWith('.docx') || lowerName.endsWith('.doc') || 
                           lowerName.endsWith('.xlsx') || lowerName.endsWith('.xls') || 
                           lowerName.endsWith('.csv') || lowerName.endsWith('.pptx') || 
                           lowerName.endsWith('.ppt');

  if (isOfficeOrBinary) {
    downloadFileUrl(url, filename || 'document');
    return;
  }

  if (targetUrl.startsWith('data:')) {
    targetUrl = dataUrlToBlobUrl(targetUrl, filename);
  }
  if (!targetUrl) return;

  const cleanTitle = (filename || 'PDF Document').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  const win = window.open('', '_blank');
  if (win) {
    try {
      win.document.write(`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${cleanTitle}</title>
  <style>
    html, body {
      margin: 0;
      padding: 0;
      width: 100%;
      height: 100%;
      overflow: hidden;
      background-color: #323639;
    }
    iframe {
      width: 100%;
      height: 100%;
      border: none;
    }
  </style>
</head>
<body>
  <iframe src="${targetUrl}" type="application/pdf"></iframe>
</body>
</html>`);
      win.document.close();
      return;
    } catch (err) {
      console.warn("[pdfUtils] iframe wrapper failed, falling back to direct tab:", err);
    }
  }

  // Fallback to direct navigation without download attribute
  const a = document.createElement('a');
  a.href = targetUrl;
  a.target = '_blank';
  a.rel = 'noopener noreferrer';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

/**
 * Downloads a file cleanly from a base64 Data URL or standard URL with sanitized OS filename.
 */
export function downloadFileUrl(url: string, filename: string): void {
  if (!url || url.includes('example.com')) return;
  let targetUrl = url;

  const cleanName = sanitizeFilename(filename || 'document.pdf');
  let isBlobCreated = false;

  if (targetUrl.startsWith('data:')) {
    targetUrl = dataUrlToBlobUrl(targetUrl, filename);
    isBlobCreated = targetUrl.startsWith('blob:');
  }

  const a = document.createElement('a');
  a.href = targetUrl;
  a.download = cleanName;
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
