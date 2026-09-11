import { cookies } from "next/headers";
import { ApiResponse, NestErrorBody, NestResponse } from "./types";

const BASE_URL = process.env.NEST_URL || "http://localhost:3000";

type requestOptions = RequestInit & {
  params?: Record<string, string | number | boolean | undefined | null>;
};

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
  options: requestOptions = {},
): Promise<ApiResponse<T>> {
  const { headers: extraHeaders, params, ...restOptions } = options;

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

  const query = params
    ? new URLSearchParams(
        Object.entries(params)
          .filter(([, value]) => value !== undefined && value !== null)
          .map(([key, value]) => [key, String(value)]),
      ).toString()
    : "";

  const url =
    `${BASE_URL.replace(/\/$/, "")}/${path.replace(/^\//, "")}` +
    (query ? `?${query}` : "");

  console.log("API URL:", url);

  let response: Response;
  try {
    response = await fetch(url, {
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
  get<T>(path: string, options: requestOptions = {}) {
    return request<T>("GET", path, undefined, options);
  },

  post<T>(path: string, body: unknown, options: requestOptions = {}) {
    return request<T>("POST", path, body, options);
  },

  put<T>(path: string, body: unknown, options: requestOptions = {}) {
    return request<T>("PUT", path, body, options);
  },

  patch<T>(path: string, body: unknown, options: requestOptions = {}) {
    return request<T>("PATCH", path, body, options);
  },

  delete<T = null>(path: string, options: requestOptions = {}) {
    return request<T>("DELETE", path, undefined, options);
  },
};
export default api;
