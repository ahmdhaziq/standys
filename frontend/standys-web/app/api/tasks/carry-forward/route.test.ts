import { beforeEach, describe, expect, it, vi } from "vitest";

const { postMock } = vi.hoisted(() => ({ postMock: vi.fn() }));
vi.mock("@/lib/api/server-client", () => ({ default: { post: postMock } }));
import { POST } from "./route";

describe("POST /api/tasks/carry-forward", () => {
  beforeEach(() => vi.clearAllMocks());
  it("forwards the carry-forward payload", async () => {
    postMock.mockResolvedValue({ ok: true, status: 200, data: { id: 3 }, meta: null, error: null });
    const response = await POST(new Request("http://localhost/api/tasks/carry-forward", { method: "POST", body: JSON.stringify({ dailyTaskId: 3, taskDate: "2026-09-16" }) }));
    expect(postMock).toHaveBeenCalledWith("/daily-tasks/carry-forward", { dailyTaskId: 3, taskDate: "2026-09-16" });
    expect(response.status).toBe(200);
  });
});
