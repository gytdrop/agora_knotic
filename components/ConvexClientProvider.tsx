'use client';

import { ReactNode } from 'react';
import { ConvexReactClient, ConvexProvider } from 'convex/react';
import { ConvexProviderWithClerk } from 'convex/react-clerk';
import { useAuth } from '@clerk/nextjs';

const DEFAULT_CONVEX_URL = 'https://enchanted-pony-120.convex.cloud';
const convexUrl =
  process.env.NEXT_PUBLIC_CONVEX_URL || DEFAULT_CONVEX_URL;
let convex: ConvexReactClient | null = null;

if (convexUrl && convexUrl.startsWith('http')) {
  try {
    convex = new ConvexReactClient(convexUrl);
  } catch {
    convex = null;
  }
}

export function ConvexClientProvider({ children }: { children: ReactNode }) {
  if (!convex) {
    return <>{children}</>;
  }

  // If Clerk publishable key is not configured, use standard ConvexProvider
  const clerkKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  const isClerkConfigured = Boolean(clerkKey && clerkKey.startsWith('pk_'));

  if (isClerkConfigured) {
    return (
      <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
        {children}
      </ConvexProviderWithClerk>
    );
  }

  return <ConvexProvider client={convex}>{children}</ConvexProvider>;
}
