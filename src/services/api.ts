import { recordClientLog } from '@/utils/consoleCapture';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const method = options?.method ?? 'GET';
  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      ...options,
    });
  } catch (err) {
    // Network-level failure (offline, DNS, CORS) — leave a breadcrumb.
    recordClientLog('network', `${method} ${path} — error de red: ${err instanceof Error ? err.message : 'desconocido'}`);
    throw err;
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText }));
    const message = body.error || res.statusText;
    // Don't log the routine "not authenticated" probe used to detect sessions.
    if (!(res.status === 401 && path === '/auth/me')) {
      recordClientLog('network', `HTTP ${res.status} ${method} ${path} — ${message}`);
    }
    throw new ApiError(res.status, message);
  }

  if (res.status === 204) return undefined as T;
  return res.json();
}

// XHR-based multipart upload. Unlike fetch(), XHR exposes upload progress
// events, which is essential for anything larger than a few MB.
function xhrUpload<T>(
  path: string,
  formData: FormData,
  onProgress?: (percent: number) => void,
): Promise<T> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', `${API_BASE}${path}`);
    xhr.withCredentials = true;
    xhr.responseType = 'text';

    if (onProgress) {
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          onProgress(Math.round((event.loaded / event.total) * 100));
        }
      };
    }

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        if (xhr.status === 204 || !xhr.responseText) {
          resolve(undefined as T);
          return;
        }
        try {
          resolve(JSON.parse(xhr.responseText) as T);
        } catch {
          reject(new ApiError(xhr.status, 'Respuesta inválida del servidor'));
        }
        return;
      }

      let message = xhr.statusText || `HTTP ${xhr.status}`;
      try {
        const body = JSON.parse(xhr.responseText);
        if (body?.error) message = body.error;
      } catch {
        /* non-JSON error body, keep default message */
      }
      recordClientLog('network', `HTTP ${xhr.status} POST ${path} (upload) — ${message}`);
      reject(new ApiError(xhr.status, message));
    };

    xhr.onerror = () => {
      recordClientLog('network', `POST ${path} (upload) — error de red`);
      reject(new ApiError(0, 'Error de red durante la subida'));
    };
    xhr.ontimeout = () => {
      recordClientLog('network', `POST ${path} (upload) — tiempo de espera agotado`);
      reject(new ApiError(0, 'La subida excedió el tiempo de espera'));
    };
    xhr.onabort = () => reject(new ApiError(0, 'Subida cancelada'));

    xhr.send(formData);
  });
}

/**
 * PUT a blob directly to an absolute URL (e.g., a presigned R2 upload URL).
 * This is not for the app's own API — it targets a third-party host, so
 * withCredentials must stay false and no Authorization/cookies are sent.
 * The caller is responsible for passing the exact Content-Type that was
 * signed into the presigned URL; a mismatch triggers SignatureDoesNotMatch.
 */
function xhrPut(
  url: string,
  body: Blob,
  contentType: string,
  onProgress?: (percent: number) => void,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('PUT', url);
    xhr.setRequestHeader('Content-Type', contentType);
    xhr.responseType = 'text';

    if (onProgress) {
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          onProgress(Math.round((event.loaded / event.total) * 100));
        }
      };
    }

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve();
        return;
      }
      reject(
        new ApiError(
          xhr.status,
          `El almacenamiento rechazó la subida (HTTP ${xhr.status}). ` +
          (xhr.responseText?.slice(0, 200) || ''),
        ),
      );
    };

    xhr.onerror = () => reject(new ApiError(0, 'Error de red durante la subida al almacenamiento'));
    xhr.ontimeout = () => reject(new ApiError(0, 'La subida al almacenamiento excedió el tiempo de espera'));
    xhr.onabort = () => reject(new ApiError(0, 'Subida cancelada'));

    xhr.send(body);
  });
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'POST', body: body ? JSON.stringify(body) : undefined }),
  put: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'PUT', body: body ? JSON.stringify(body) : undefined }),
  patch: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'PATCH', body: body ? JSON.stringify(body) : undefined }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
  upload: <T>(
    path: string,
    formData: FormData,
    onProgress?: (percent: number) => void,
  ) => xhrUpload<T>(path, formData, onProgress),
  putBlob: (
    url: string,
    body: Blob,
    contentType: string,
    onProgress?: (percent: number) => void,
  ) => xhrPut(url, body, contentType, onProgress),
};
