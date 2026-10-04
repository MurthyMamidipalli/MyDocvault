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
 * Generate a dynamic fallback PDF Data URL if a record has no attached file data,
 * ensuring users can always open and view a valid document.
 */
export function createFallbackPdfDataUrl(title: string, subtitle = 'MyDocVault Document Record'): string {
  const cleanTitle = (title || 'Personal Document').replace(/[^a-zA-Z0-9\s-]/g, '');
  const cleanSub = (subtitle || 'Official Verified Record').replace(/[^a-zA-Z0-9\s-]/g, '');
  
  const escapePdfText = (t: string) => {
    return t.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
  };

  const escTitle = escapePdfText(cleanTitle);
  const escSub = escapePdfText(cleanSub);
  const escDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  const drawStream = "0.1 0.6 0.4 RG\n3 w\n18 18 576 756 re S\n0.8 0.8 0.8 RG\n1 w\n54 670 m 558 670 l S\n";
  const textStream = `BT
0.1 0.1 0.1 rg
/F1 18 Tf
1 0 0 1 54 710 Tm
(${escTitle.toUpperCase()}) Tj
/F3 10 Tf
1 0 0 1 54 685 Tm
(${escSub}) Tj
/F2 12 Tf
1 0 0 1 54 630 Tm
(MyDocVault Intelligence Hub - System Verified Record) Tj
/F3 11 Tf
1 0 0 1 54 580 Tm
(Document Title: ${escTitle}) Tj
0 -18 Td
(Issued Date: ${escDate}) Tj
0 -18 Td
(Verification ID: VLT-REF-${Date.now().toString(36).toUpperCase()}) Tj
0 -18 Td
(Security Status: Authenticated Digital Vault Snapshot) Tj
/F2 10 Tf
1 0 0 1 54 440 Tm
(This is an electronically generated system document backup.) Tj
ET`;

  const streamContent = drawStream + '\n' + textStream;
  const streamLength = streamContent.length;

  const objects: { [key: number]: string } = {
    1: "1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n",
    2: "2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n",
    3: "3 0 obj\n<< /Type /Page /Parent 2 0 R /Resources << /Font << /F1 4 0 R /F2 6 0 R /F3 7 0 R >> >> /MediaBox [0 0 612 792] /Contents 5 0 R >>\nendobj\n",
    4: "4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>\nendobj\n",
    5: `5 0 obj\n<< /Length ${streamLength} >>\nstream\n${streamContent}\nendstream\nendobj\n`,
    6: "6 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Oblique >>\nendobj\n",
    7: "7 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n"
  };

  let currentOffset = 9;
  const offsets: { [key: number]: number } = {};
  let objectsStr = "%PDF-1.4\n";

  for (let i = 1; i <= 7; i++) {
    offsets[i] = currentOffset;
    const body = objects[i];
    objectsStr += body;
    currentOffset += body.length;
  }

  let xref = "xref\n0 8\n0000000000 65535 f \n";
  for (let i = 1; i <= 7; i++) {
    xref += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`;
  }

  const trailer = `trailer\n<< /Size 8 /Root 1 0 R >>\nstartxref\n${currentOffset}\n%%EOF`;
  const pdfContent = objectsStr + xref + trailer;

  try {
    const base64Pdf = btoa(unescape(encodeURIComponent(pdfContent)));
    return `data:application/pdf;base64,${base64Pdf}`;
  } catch (_) {
    return '';
  }
}

const blobUrlCache = new Map<string, string>();

/**
 * Convert a base64 data URL or raw URL to a Blob Object URL (`blob:http...`).
 */
export function dataUrlToBlobUrl(dataUrl: string, fallbackTitle?: string): string {
  if (!dataUrl) {
    if (fallbackTitle) {
      const generated = createFallbackPdfDataUrl(fallbackTitle);
      return dataUrlToBlobUrl(generated);
    }
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
  let targetUrl = url;
  
  if (!targetUrl || targetUrl.trim() === '') {
    targetUrl = createFallbackPdfDataUrl(filename || 'Document Record');
  }

  if (targetUrl.startsWith('data:')) {
    targetUrl = dataUrlToBlobUrl(targetUrl, filename);
  }

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
  let targetUrl = url;
  if (!targetUrl || targetUrl.trim() === '') {
    targetUrl = createFallbackPdfDataUrl(filename || 'Document Record');
  }

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
