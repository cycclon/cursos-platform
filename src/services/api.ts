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
  const res = await fetch(`${API_BASE}${path}`, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText }));
    throw new ApiError(res.status, body.error || res.statusText);
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
      reject(new ApiError(xhr.status, message));
    };

    xhr.onerror = () => reject(new ApiError(0, 'Error de red durante la subida'));
    xhr.ontimeout = () => reject(new ApiError(0, 'La subida excedió el tiempo de espera'));
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
