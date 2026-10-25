import type { ApiError as ApiErrorBody } from '@app/core';

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
  ) {
    super(message);
  }
}

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  // Chemin relatif : fonctionne sous n'importe quel sous-chemin (BASE_PATH).
  const res = await fetch(`api/${path}`, {
    method,
    credentials: 'same-origin',
    headers: body === undefined ? {} : { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const data = (await res.json().catch(() => ({}))) as Partial<ApiErrorBody>;
  if (!res.ok) {
    throw new ApiError(
      res.status,
      data.error ?? 'network',
      data.message ?? 'Le serveur ne répond pas.',
    );
  }
  return data as T;
}

export const api = {
  get: <T>(path: string) => request<T>('GET', path),
  post: <T>(path: string, body: unknown = {}) => request<T>('POST', path, body),
  patch: <T>(path: string, body: unknown) => request<T>('PATCH', path, body),
  del: <T>(path: string) => request<T>('DELETE', path),
};

export function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Une erreur est survenue.';
}
