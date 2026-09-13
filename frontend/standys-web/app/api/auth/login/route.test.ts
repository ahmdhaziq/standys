import { beforeEach, describe, expect, it, vi } from "vitest";

const { postMock } = vi.hoisted(() => ({ postMock: vi.fn() }));

vi.mock("../../../../lib/api/server-client", () => ({
  default: { post: postMock },
}));

import { POST } from "./route";

describe("POST /api/auth/login", () => {
  beforeEach(() => vi.clearAllMocks());

  it("stores access and refresh tokens in HttpOnly cookies without returning them", async () => {
    postMock.mockResolvedValue({
      ok: true,
      status: 200,
      data: { access_token: "access-token", refresh_token: "refresh-token" },
    });

    const response = await POST(
      new Request("http://localhost/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email: "user@example.com", password: "password" }),
      }),
    );

    const responseBody = await response.json();
    expect(responseBody).toEqual({ message: "Login successful" });
    const setCookies = response.headers.getSetCookie();
    expect(setCookies).toHaveLength(2);
    expect(setCookies[0]).toContain("access_token=access-token");
    expect(setCookies[0]).toContain("Max-Age=900");
    expect(setCookies[0]).toContain("HttpOnly");
    expect(setCookies[1]).toContain("refresh_token=refresh-token");
    expect(setCookies[1]).toContain("Max-Age=604800");
    expect(JSON.stringify(responseBody)).not.toContain("access-token");
    expect(JSON.stringify(responseBody)).not.toContain("refresh-token");
  });
});
