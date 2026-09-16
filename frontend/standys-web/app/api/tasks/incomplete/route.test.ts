import { beforeEach, describe, expect, it, vi } from "vitest";

const { getMock } = vi.hoisted(() => ({ getMock: vi.fn() }));
vi.mock("@/lib/api/server-client", () => ({ default: { get: getMock } }));
import { GET } from "./route";

describe("GET /api/tasks/incomplete", () => {
  beforeEach(() => vi.clearAllMocks());
  it("forwards taskDate and preserves status", async () => {
    getMock.mockResolvedValue({ ok: true, status: 200, data: [], meta: null, error: null });
    const response = await GET(new Request("http://localhost/api/tasks/incomplete?taskDate=2026-09-16"));
    expect(getMock).toHaveBeenCalledWith("/daily-tasks/incomplete", { params: { taskDate: "2026-09-16" } });
    expect(response.status).toBe(200);
  });
});
