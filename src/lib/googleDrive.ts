// Google Drive API helper utility

// Helper key for localStorage to persist the custom OAuth Client ID
const CLIENT_ID_KEY = 'nexus_google_drive_client_id';

// Save and retrieve custom Google Client ID from localStorage
export function getSavedGoogleClientId(): string {
  const raw = localStorage.getItem(CLIENT_ID_KEY) || '';
  return raw.trim().replace(/^https?:\/\//, '');
}

export function saveGoogleClientId(clientId: string) {
  if (clientId) {
    const cleaned = clientId.trim().replace(/^https?:\/\//, '');
    localStorage.setItem(CLIENT_ID_KEY, cleaned);
  } else {
    localStorage.removeItem(CLIENT_ID_KEY);
  }
}

// Memory-only location for caching Google Access Token (cleared on page reload)
let cachedAccessToken: string | null = null;
let tokenExpiresAt: number | null = null;

export function getCachedAccessToken(): string | null {
  if (cachedAccessToken && tokenExpiresAt && Date.now() < tokenExpiresAt) {
    return cachedAccessToken;
  }
  // Clear if expired
  cachedAccessToken = null;
  tokenExpiresAt = null;
  return null;
}

export function saveCachedAccessToken(token: string, expiresInSeconds: number) {
  cachedAccessToken = token;
  tokenExpiresAt = Date.now() + (expiresInSeconds * 1000);
}

export function clearCachedAccessToken() {
  cachedAccessToken = null;
  tokenExpiresAt = null;
}

// Redirect the user to Google's Identity Provider for authentication (OAuth Implicit Flow)
export function initiateGoogleDriveOAuth(clientId: string) {
  // Sanitize the value: trim and strip http:// or https://
  let sanitizedClientId = clientId.trim();
  sanitizedClientId = sanitizedClientId.replace(/^https?:\/\//, '');

  // Log final client_id before redirecting to Google
  console.log("Redirecting to Google OAuth with client_id:", sanitizedClientId);

  const redirectUri = window.location.origin + window.location.pathname;
  const scope = 'https://www.googleapis.com/auth/drive.file';
  const responseType = 'token';
  const state = 'google_drive_auth_flow';

  const oauthUrl = `https://accounts.google.com/o/oauth2/v2/auth` +
    `?client_id=${encodeURIComponent(sanitizedClientId)}` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
    `&response_type=${encodeURIComponent(responseType)}` +
    `&scope=${encodeURIComponent(scope)}` +
    `&state=${encodeURIComponent(state)}` +
    `&prompt=consent`;

  window.location.href = oauthUrl;
}

// Parse Google OAuth hash fragment to extract access token
export function handleOAuthCallback(): { token: string; expiresIn: number } | null {
  const hash = window.location.hash;
  if (!hash) return null;

  const params: Record<string, string> = {};
  const hashString = hash.startsWith('#') ? hash.substring(1) : hash;
  const parts = hashString.split('&');

  for (const part of parts) {
    const [key, value] = part.split('=');
    if (key && value) {
      params[decodeURIComponent(key)] = decodeURIComponent(value);
    }
  }

  if (params.access_token) {
    // Clean hash from URL so it doesn't pollute the browser address bar
    window.history.replaceState(
      null,
      document.title,
      window.location.pathname + window.location.search
    );

    const expiresIn = parseInt(params.expires_in || '3600', 10);
    saveCachedAccessToken(params.access_token, expiresIn);
    return { token: params.access_token, expiresIn };
  }

  return null;
}

// Upload file directly using Google Drive Multipart API
export function uploadFileToDrive(
  file: File,
  accessToken: string,
  onProgress: (percent: number) => void
): Promise<{
  id: string;
  name: string;
  mimeType: string;
  size: string;
  webViewLink: string;
  webContentLink: string;
  owners?: Array<{ emailAddress: string }>;
}> {
  return new Promise((resolve, reject) => {
    const boundary = '-------314159265358979323846';
    const metadata = JSON.stringify({
      name: file.name,
      mimeType: file.type || 'application/octet-stream'
    });

    const parts = [
      `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${metadata}\r\n`,
      `\r\n--${boundary}\r\nContent-Type: ${file.type || 'application/octet-stream'}\r\n\r\n`,
      file,
      `\r\n--${boundary}--`
    ];

    const body = new Blob(parts, { type: `multipart/related; boundary=${boundary}` });

    const xhr = new XMLHttpRequest();
    // Retrieve metadata properties: id, name, mimeType, size, webViewLink, webContentLink, owners
    xhr.open('POST', 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,mimeType,size,webViewLink,webContentLink,owners');
    xhr.setRequestHeader('Authorization', `Bearer ${accessToken}`);

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) {
        const percent = Math.round((e.loaded / e.total) * 100);
        onProgress(percent);
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const res = JSON.parse(xhr.responseText);
          resolve(res);
        } catch (err) {
          reject(new Error("Failed to parse JSON response from Google Drive API."));
        }
      } else {
        let errMsg = xhr.responseText;
        try {
          const parsed = JSON.parse(xhr.responseText);
          if (parsed?.error?.message) errMsg = parsed.error.message;
        } catch (_) {}
        reject(new Error(`Upload failed (${xhr.status}): ${errMsg}`));
      }
    };

    xhr.onerror = () => {
      reject(new Error("Network connection error during Google Drive upload."));
    };

    xhr.send(body);
  });
}

// Download file as blob directly from Google Drive API using its File ID
export async function downloadFileFromDrive(
  fileId: string,
  accessToken: string
): Promise<{ blob: Blob; objectUrl: string }> {
  const response = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    let errorDetail = '';
    try {
      const errJson = await response.json();
      if (errJson?.error?.message) errorDetail = ': ' + errJson.error.message;
    } catch (_) {}
    throw new Error(`Failed to download from Google Drive (${response.status})${errorDetail}`);
  }

  const blob = await response.blob();
  const objectUrl = URL.createObjectURL(blob);
  return { blob, objectUrl };
}
