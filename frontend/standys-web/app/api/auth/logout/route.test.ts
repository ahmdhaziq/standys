import { beforeEach, describe, expect, it, vi } from "vitest";

const { postMock, cookiesMock } = vi.hoisted(() => ({
  postMock: vi.fn(),
  cookiesMock: vi.fn(),
}));

vi.mock("next/headers", () => ({ cookies: cookiesMock }));
vi.mock("../../../../lib/api/server-client", () => ({
  default: { post: postMock },
}));

import { POST } from "./route";

describe("POST /api/auth/logout", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    cookiesMock.mockResolvedValue({
      get: vi.fn().mockReturnValue({ value: "refresh-token" }),
    });
  });

  it.each([
    ["active", { ok: true, status: 200 }],
    ["expired", { ok: false, status: 401 }],
    ["already revoked", { ok: false, status: 401 }],
  ])("clears both cookies for a %s backend session", async (_state, result) => {
    postMock.mockResolvedValue(result);

    const response = await POST();

    expect(response.status).toBe(200);
    const setCookie = response.headers.get("set-cookie");
    expect(setCookie).toContain("access_token=");
    expect(setCookie).toContain("refresh_token=");
  });
});
