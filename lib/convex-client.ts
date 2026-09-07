import { ConvexHttpClient } from 'convex/browser';

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL || 'https://enchanted-pony-120.convex.cloud';

export const convexClient = new ConvexHttpClient(convexUrl);
