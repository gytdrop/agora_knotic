import { clerkMiddleware } from "@clerk/nextjs/server";
import { NextResponse, type NextRequest } from "next/server";

export default function middleware(request: NextRequest, event: any) {
  const hasClerkKey =
    Boolean(process.env.CLERK_SECRET_KEY) ||
    Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);

  if (hasClerkKey) {
    return clerkMiddleware()(request, event);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
