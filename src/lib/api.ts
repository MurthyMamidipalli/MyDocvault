/**
 * Helper utility to construct API URLs and perform standard fetch operations.
 */

export const getApiUrl = (path: string): string => {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return cleanPath;
};

/**
 * Perform a clean, relative API fetch with resilient JSON response handling.
 * This completely avoids direct browser access to external cloud services or databases,
 * and safely guards against non-JSON server error pages (like 500 HTML from Vercel or proxies)
 * from crashing client callers with "Unexpected token 'A'... is not valid JSON".
 */
export async function apiFetch(path: string, options?: RequestInit): Promise<Response> {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  const response = await fetch(cleanPath, options);

  // Wrap response.json() so it safely falls back if the response is plain text or HTML
  const originalJson = response.json.bind(response);
  response.json = async () => {
    try {
      const cloned = response.clone();
      const text = await cloned.text();
      try {
        return JSON.parse(text);
      } catch {
        // Strip HTML if returned by Vercel / serverless runtime
        let cleaned = text.replace(/<[^>]*>?/gm, ' ').replace(/\s+/g, ' ').trim();
        if (!cleaned || cleaned.length > 250) {
          cleaned = `Server response status ${response.status}: ${response.statusText || 'Internal Server Error'}`;
        }
        return {
          success: false,
          error: cleaned,
          message: cleaned,
          status: response.status,
        };
      }
    } catch {
      return originalJson();
    }
  };

  return response;
}
