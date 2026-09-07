import { SignIn } from "@clerk/nextjs";
import Link from "next/link";

export default function SignInPage() {
  const hasClerkKey = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);

  if (!hasClerkKey) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-slate-950 text-slate-100 p-4 font-sans">
        <div className="max-w-md w-full p-6 rounded-xl border border-slate-800 bg-slate-900 text-center">
          <h1 className="text-lg font-semibold mb-2">Authentication Not Configured</h1>
          <p className="text-xs text-slate-400 mb-4">
            Clerk publishable key is not set. You can proceed directly to the War Room.
          </p>
          <Link
            href="/"
            className="inline-block px-4 py-2 rounded-lg bg-slate-100 text-slate-950 text-xs font-semibold hover:bg-white"
          >
            Go to War Room
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <SignIn />
    </div>
  );
}
