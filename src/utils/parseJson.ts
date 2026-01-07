// src/utils/parseJson.ts
import http from 'k6/http';

/**
 * Safely parses JSON from a k6 Response.
 * If JSON parsing fails, throws an error that includes status, URL, and a body snippet.
 */
export function parseJson<T>(res: http.Response, groupName: string): T {
  try {
    const body = res.json();
    if (body === null || body === undefined) {
      throw new Error('Response JSON was null/undefined');
    }
    return body as T;
  } catch (err) {
    const url = res.url ?? 'unknown-url';
    const status = res.status ?? -1;
    const contentType = res.headers?.['Content-Type'] ?? 'unknown-content-type';
    const snippet = (res.body ?? '').toString().slice(0, 400);

    throw new Error(
      `[${groupName}] JSON parse failed. status=${status} content-type=${contentType} url=${url}\n` +
        `Body starts with:\n${snippet}`
    );
  }
}
