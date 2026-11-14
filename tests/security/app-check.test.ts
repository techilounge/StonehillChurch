import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/firebaseAdmin", () => ({ getFirebaseAdminApp: () => ({}) }));

const { checkAppCheckToken, resolveAppCheckMode } = await import("@/lib/appCheck");

const withToken = (token: string) => new Headers({ "X-Firebase-AppCheck": token });
const acceptValid = async (token: string) => {
  if (token !== "valid-token") throw new Error("invalid");
};

let warn: ReturnType<typeof vi.spyOn>;
beforeEach(() => {
  warn = vi.spyOn(console, "warn").mockImplementation(() => {});
});
afterEach(() => warn.mockRestore());

describe("resolveAppCheckMode", () => {
  it("defaults to monitor so a rollout can never block visitors by accident", () => {
    expect(resolveAppCheckMode(undefined)).toBe("monitor");
    expect(resolveAppCheckMode("")).toBe("monitor");
    expect(resolveAppCheckMode("bogus")).toBe("monitor");
  });

  it("accepts off and enforce case-insensitively", () => {
    expect(resolveAppCheckMode(" Enforce ")).toBe("enforce");
    expect(resolveAppCheckMode("OFF")).toBe("off");
  });
});

describe("checkAppCheckToken", () => {
  it("accepts a valid token in every active mode", async () => {
    for (const mode of ["monitor", "enforce"] as const) {
      expect(await checkAppCheckToken(withToken("valid-token"), { mode, verify: acceptValid })).toEqual({
        allowed: true,
        status: "valid",
      });
    }
  });

  it("enforce mode rejects missing and invalid tokens", async () => {
    expect(await checkAppCheckToken(new Headers(), { mode: "enforce", verify: acceptValid })).toEqual({
      allowed: false,
      status: "missing",
    });
    expect(await checkAppCheckToken(withToken("forged"), { mode: "enforce", verify: acceptValid })).toEqual({
      allowed: false,
      status: "invalid",
    });
  });

  it("monitor mode allows but logs missing and invalid tokens", async () => {
    expect(await checkAppCheckToken(new Headers(), { mode: "monitor", verify: acceptValid })).toEqual({
      allowed: true,
      status: "missing",
    });
    expect(await checkAppCheckToken(withToken("forged"), { mode: "monitor", verify: acceptValid })).toEqual({
      allowed: true,
      status: "invalid",
    });
    expect(warn).toHaveBeenCalledTimes(2);
  });

  it("off mode skips verification entirely", async () => {
    const verify = vi.fn(acceptValid);
    expect(await checkAppCheckToken(new Headers(), { mode: "off", verify })).toEqual({
      allowed: true,
      status: "skipped",
    });
    expect(verify).not.toHaveBeenCalled();
  });
});
