import { beforeEach, describe, expect, it, vi } from "vitest";

const { postMock } = vi.hoisted(() => ({ postMock: vi.fn() }));

vi.mock("@/lib/api/server-client", () => ({ default: { post: postMock } }));

import { POST } from "./route";

describe("POST /api/tasks/update", () => {
  beforeEach(() => vi.clearAllMocks());

  it("forwards a completion payload and preserves success status", async () => {
    postMock.mockResolvedValue({ ok: true, status: 200, data: { id: 3 }, meta: null, error: null });
    const response = await POST(new Request("http://localhost/api/tasks/update", {
      method: "POST",
      body: JSON.stringify({ dailyTaskId: 3, status: "COMPLETED", completedAt: "2026-09-15T09:30:00.000Z" }),
    }));

    expect(postMock).toHaveBeenCalledWith("/daily-tasks/update", {
      dailyTaskId: 3,
      status: "COMPLETED",
      completedAt: "2026-09-15T09:30:00.000Z",
    });
    expect(response.status).toBe(200);
  });

  it("preserves unauthorized and validation-error statuses", async () => {
    postMock.mockResolvedValue({ ok: false, status: 401, data: null, meta: null, error: "Unauthorized" });
    const response = await POST(new Request("http://localhost/api/tasks/update", {
      method: "POST",
      body: JSON.stringify({ dailyTaskId: 3, status: "PENDING", completedAt: null }),
    }));

    expect(response.status).toBe(401);
    expect(postMock).toHaveBeenCalledWith("/daily-tasks/update", {
      dailyTaskId: 3,
      status: "PENDING",
      completedAt: null,
    });
    expect(await response.json()).toMatchObject({ ok: false, error: "Unauthorized" });

    postMock.mockResolvedValue({ ok: false, status: 400, data: null, meta: null, error: "Invalid transition" });
    const validationResponse = await POST(new Request("http://localhost/api/tasks/update", {
      method: "POST",
      body: JSON.stringify({ dailyTaskId: 3, status: "COMPLETED", completedAt: null }),
    }));
    expect(validationResponse.status).toBe(400);
    expect(await validationResponse.json()).toMatchObject({ ok: false, error: "Invalid transition" });
  });
});
