import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const isPublicRoute = createRouteMatcher(["/", "/sign-in(.*)", "/sign-up(.*)"]);

export default clerkMiddleware(async (auth, request: NextRequest) => {
  // Protect non-public routes with Clerk authentication
  if (!isPublicRoute(request)) {
    await auth.protect();
  }

  // Generate unique nonce for this request (128-bit entropy)
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");

  // Build Content Security Policy with nonce
  // Using CSP Level 2 (host-based allowlists) instead of strict-dynamic
  // because Clerk loads scripts from their CDN which we don't control
  const cspHeader = `
    default-src 'self';
    script-src 'self' 'nonce-${nonce}' https://*.clerk.com https://*.clerk.accounts.dev https://challenges.cloudflare.com;
    style-src 'self' 'unsafe-inline' https://*.clerk.com https://*.clerk.accounts.dev;
    img-src 'self' blob: data: https://*.clerk.com https://img.clerk.com https://*.clerk.accounts.dev;
    font-src 'self' data:;
    object-src 'none';
    base-uri 'self';
    form-action 'self';
    frame-ancestors 'none';
    frame-src 'self' https://*.clerk.com https://*.clerk.accounts.dev https://challenges.cloudflare.com https://vercel.live;
    connect-src 'self' https://*.clerk.com https://curious-salamander-943.convex.cloud wss://curious-salamander-943.convex.cloud;
    block-all-mixed-content;
    upgrade-insecure-requests;
  `.replace(/\s{2,}/g, " ").trim();

  // Create response with security headers
  const response = NextResponse.next();

  // Apply all security headers
  response.headers.set("Content-Security-Policy", cspHeader);
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set(
    "Strict-Transport-Security",
    "max-age=31536000; includeSubDomains; preload"
  );

  // Pass nonce to client via custom header for layout consumption
  response.headers.set("x-nonce", nonce);

  return response;
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
