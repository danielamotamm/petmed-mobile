import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Unit tests for the "missed doses" rule: pending doses past the grace window
 * must be marked as missed whenever a listing runs.
 */

const TWO_HOURS_MS = 2 * 60 * 60 * 1000;
const GRACE_MS = TWO_HOURS_MS;

type FakeDose = { id: number; status: "pending" | "administered" | "missed"; scheduledAt: Date };

function markOverdueDosesAsMissed(doses: FakeDose[], now: Date): FakeDose[] {
  const cutoff = new Date(now.getTime() - GRACE_MS);
  return doses.map((dose) =>
    dose.status === "pending" && dose.scheduledAt.getTime() <= cutoff.getTime()
      ? { ...dose, status: "missed" as const }
      : dose,
  );
}

describe("missed doses rule", () => {
  const now = new Date("2026-09-10T18:00:00Z");

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("marks pending doses older than the grace window as missed", () => {
    const doses: FakeDose[] = [
      { id: 1, status: "pending", scheduledAt: new Date(now.getTime() - 3 * 60 * 60 * 1000) }, // 3h ago
    ];
    const result = markOverdueDosesAsMissed(doses, now);
    expect(result[0]?.status).toBe("missed");
  });

  it("keeps pending doses inside the grace window untouched", () => {
    const doses: FakeDose[] = [
      { id: 1, status: "pending", scheduledAt: new Date(now.getTime() - 30 * 60 * 1000) }, // 30min ago
      { id: 2, status: "pending", scheduledAt: new Date(now.getTime() + 60 * 60 * 1000) }, // future
    ];
    const result = markOverdueDosesAsMissed(doses, now);
    expect(result.map((dose) => dose.status)).toEqual(["pending", "pending"]);
  });

  it("does not change administered or already missed doses", () => {
    const old = new Date(now.getTime() - 5 * 60 * 60 * 1000);
    const doses: FakeDose[] = [
      { id: 1, status: "administered", scheduledAt: old },
      { id: 2, status: "missed", scheduledAt: old },
    ];
    const result = markOverdueDosesAsMissed(doses, now);
    expect(result.map((dose) => dose.status)).toEqual(["administered", "missed"]);
  });
});
