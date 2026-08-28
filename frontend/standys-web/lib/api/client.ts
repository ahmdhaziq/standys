import { cookies } from "next/headers";
import { ApiResponse, NestErrorBody, NestResponse } from "./types";

const BASE_URL = process.env.NEST_URL || "http://localhost:3000";

function normalizeHeaders(init?: HeadersInit): Record<string, string> {
  if (!init) return {};
  const out: Record<string, string> = {};
  new Headers(init).forEach((value, key) => {
    out[key] = value;
  });
  return out;
}

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
  options: RequestInit = {},
): Promise<ApiResponse<T>> {
  const { headers: extraHeaders, ...restOptions } = options;

  const isFormData =
    typeof FormData !== "undefined" && body instanceof FormData;

  const headers: Record<string, string> = {
    ...(isFormData ? {} : { "Content-Type": "application/json" }),
    ...normalizeHeaders(extraHeaders),
  };

  const cookie = await cookies();
  const token = cookie.get("access_token")?.value;

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  let response: Response;
  try {
    response = await fetch(`${BASE_URL}/${path}`, {
      method,
      headers,
      body:
        body === undefined
          ? undefined
          : isFormData
            ? (body as FormData)
            : JSON.stringify(body),
      ...restOptions,
    });
  } catch (error) {
    throw new Error(`API request failed: ${error}`);
  }

  if (response.status === 204) {
    return { data: null, meta: null, error: null, status: 204, ok: true };
  }

  let json: unknown;
  try {
    json = await response.json();
  } catch (error) {
    throw new Error(`Failed to parse JSON response: ${error}`);
  }

  if (!response.ok) {
    const error = json as NestErrorBody;

    const errorMessage = Array.isArray(error?.message)
      ? error.message.join(", ")
      : (error?.message ?? `Request failed with status ${response.status}`);

    return {
      data: null,
      meta: null,
      error: errorMessage,
      status: response.status,
      ok: false,
    };
  }

  const envelope = json as NestResponse<T>;

  return {
    data: envelope.data,
    meta: envelope.meta || null, // undefined if the endpoint didn't return meta
    error: null,
    status: response.status,
    ok: true,
  };
}
const api = {
  get<T>(path: string, options: RequestInit = {}) {
    return request<T>("GET", path, undefined, options);
  },

  post<T>(path: string, body: unknown, options: RequestInit = {}) {
    return request<T>("POST", path, body, options);
  },

  put<T>(path: string, body: unknown, options: RequestInit = {}) {
    return request<T>("PUT", path, body, options);
  },

  patch<T>(path: string, body: unknown, options: RequestInit = {}) {
    return request<T>("PATCH", path, body, options);
  },

  delete<T = null>(path: string, options: RequestInit = {}) {
    return request<T>("DELETE", path, undefined, options);
  },
};
export default api;
