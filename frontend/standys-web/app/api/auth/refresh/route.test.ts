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

describe("POST /api/auth/refresh", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    cookiesMock.mockResolvedValue({
      get: vi.fn().mockReturnValue({ value: "refresh-token" }),
    });
  });

  it("renews the access cookie using the HttpOnly refresh cookie", async () => {
    postMock.mockResolvedValue({
      ok: true,
      status: 200,
      data: { access_token: "new-access-token" },
    });

    const response = await POST();

    expect(postMock).toHaveBeenCalledWith(
      "/auth/refresh",
      { refresh_token: "refresh-token" },
      { skipRefresh: true },
    );
    expect(response.status).toBe(200);
    expect(response.headers.get("set-cookie")).toContain(
      "access_token=new-access-token",
    );
  });

  it("clears both cookies when refresh fails", async () => {
    postMock.mockResolvedValue({ ok: false, status: 401, data: null });

    const response = await POST();

    expect(response.status).toBe(401);
    const setCookie = response.headers.get("set-cookie");
    expect(setCookie).toContain("access_token=");
    expect(setCookie).toContain("refresh_token=");
  });
});
