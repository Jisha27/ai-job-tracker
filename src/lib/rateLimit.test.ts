// @vitest-environment node
import { describe, expect, it } from "vitest";
import { createRateLimiter, getClientIp } from "./rateLimit";

const HOUR = 60 * 60 * 1000;

describe("createRateLimiter", () => {
  it("allows up to the limit, then blocks with a retry time", () => {
    const check = createRateLimiter({ limit: 3, windowMs: HOUR });
    const t0 = 1_000_000;

    expect(check("ip", t0).allowed).toBe(true);
    expect(check("ip", t0).allowed).toBe(true);
    expect(check("ip", t0).allowed).toBe(true);

    const blocked = check("ip", t0 + 1000);
    expect(blocked.allowed).toBe(false);
    expect(blocked.retryAfterSeconds).toBe(HOUR / 1000 - 1);
  });

  it("allows requests again once the window has passed", () => {
    const check = createRateLimiter({ limit: 1, windowMs: HOUR });
    expect(check("ip", 0).allowed).toBe(true);
    expect(check("ip", HOUR - 1).allowed).toBe(false);
    expect(check("ip", HOUR).allowed).toBe(true);
  });

  it("tracks each key separately", () => {
    const check = createRateLimiter({ limit: 1, windowMs: HOUR });
    expect(check("a", 0).allowed).toBe(true);
    expect(check("a", 0).allowed).toBe(false);
    expect(check("b", 0).allowed).toBe(true);
  });
});

describe("getClientIp", () => {
  const req = (headers: Record<string, string>) => new Request("http://test", { headers });

  it("uses the first x-forwarded-for entry", () => {
    expect(getClientIp(req({ "x-forwarded-for": "1.1.1.1, 10.0.0.1" }))).toBe("1.1.1.1");
  });

  it("falls back to x-real-ip, then 'unknown'", () => {
    expect(getClientIp(req({ "x-real-ip": "2.2.2.2" }))).toBe("2.2.2.2");
    expect(getClientIp(req({}))).toBe("unknown");
  });
});
