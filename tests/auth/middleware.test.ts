/**
 * middleware.ts: the edge fast-path. It only checks that the session cookie is
 * present (real verification happens in app/admin/layout.tsx), so the tests
 * pin down which paths are gated and how the redirect is built.
 */
import { describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { middleware } from "@/middleware";
import { ADMIN_SESSION_COOKIE_NAME } from "@/lib/adminRoutes";

function run(path: string, cookie?: string) {
  const headers = new Headers();
  if (cookie) headers.set("cookie", `${ADMIN_SESSION_COOKIE_NAME}=${cookie}`);
  return middleware(new NextRequest(`https://church.example${path}`, { headers }));
}

function redirectTarget(response: Response): URL | null {
  const location = response.headers.get("location");
  return location ? new URL(location) : null;
}

describe("admin gating", () => {
  for (const path of ["/admin", "/admin/dashboard", "/admin/users", "/admin/events/abc"]) {
    it(`redirects ${path} to login without a session cookie`, () => {
      const target = redirectTarget(run(path));
      expect(target?.pathname).toBe("/admin/login");
      expect(target?.searchParams.get("returnTo")).toBe(path);
    });
  }

  it("keeps the query string in returnTo and drops other params", () => {
    const target = redirectTarget(run("/admin/events?status=draft"));
    expect([...target!.searchParams.keys()]).toEqual(["returnTo"]);
    expect(target?.searchParams.get("returnTo")).toBe("/admin/events?status=draft");
  });

  it("an empty cookie value counts as no cookie", () => {
    expect(redirectTarget(run("/admin/dashboard", ""))?.pathname).toBe("/admin/login");
  });

  it("lets requests with a cookie through to server-side verification", () => {
    expect(redirectTarget(run("/admin/dashboard", "anything"))).toBeNull();
  });

  for (const path of ["/admin/login", "/admin/invite/abc123"]) {
    it(`does not gate the public admin path ${path}`, () => {
      expect(redirectTarget(run(path))).toBeNull();
    });
  }

  it("still gates look-alike paths", () => {
    expect(redirectTarget(run("/admin/loginx"))?.pathname).toBe("/admin/login");
    expect(redirectTarget(run("/admin/invites"))?.pathname).toBe("/admin/login");
  });

  it("does not gate public pages", () => {
    for (const path of ["/", "/events", "/administration", "/api/forms"]) {
      expect(redirectTarget(run(path))).toBeNull();
    }
  });
});

describe("content security policy", () => {
  it("admin responses use a per-request nonce and no unsafe-inline scripts", () => {
    const a = run("/admin/dashboard", "c").headers.get("content-security-policy")!;
    const b = run("/admin/dashboard", "c").headers.get("content-security-policy")!;
    const scriptSrc = (csp: string) => csp.split("; ").find((d) => d.startsWith("script-src"))!;
    expect(scriptSrc(a)).toMatch(/'nonce-[A-Za-z0-9+/=]+'/);
    expect(scriptSrc(a)).not.toContain("unsafe-inline");
    expect(scriptSrc(a)).not.toBe(scriptSrc(b));
    expect(a).toContain("frame-ancestors 'none'");
  });

  it("the login redirect also carries the admin CSP", () => {
    expect(run("/admin/users").headers.get("content-security-policy")).toContain("'nonce-");
  });

  it("public pages get the static public CSP", () => {
    const csp = run("/events").headers.get("content-security-policy")!;
    expect(csp).not.toContain("nonce-");
    expect(csp).toContain("frame-ancestors 'none'");
    expect(csp).toContain("object-src 'none'");
  });
});
