"use client";

import SignInForm from "@/components/auth/SignInForm";
import { Suspense, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { isAuthenticated } from "@/lib/auth/token";

export default function AdminPage() {
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);

  // Ensure this only runs on client side to prevent hydration mismatch
  useEffect(() => {
    setIsClient(true);
    
    // Use requestIdleCallback for non-critical redirect check (better performance)
    // Falls back to setTimeout if requestIdleCallback is not available
    // This doesn't block initial render, improving perceived performance
    const checkAuth = () => {
      if (isAuthenticated()) {
        // User has token - redirect to dashboard
        // If token is invalid, dashboard will get 401 and redirect back here
        // NOTE: With basePath='/admin', Next.js router.push automatically prepends basePath
        // So use path without /admin prefix (e.g., "/dashboard" not "/admin/dashboard")
        router.push('/dashboard');
      }
    };
    
    if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
      requestIdleCallback(checkAuth, { timeout: 100 });
    } else {
      // Fallback for browsers without requestIdleCallback
      setTimeout(checkAuth, 0);
    }
  }, [router]);

  // CRITICAL: Always render SignInForm to prevent hydration mismatch
  // The form itself handles client-side only logic internally
  // This ensures server and client render the exact same HTML structure
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900" suppressHydrationWarning>
      <div className="w-full max-w-md" suppressHydrationWarning>
        <Suspense fallback={
          <div className="bg-white dark:bg-gray-800 shadow-xl rounded-lg p-8" suppressHydrationWarning>
            <div className="text-center text-gray-500" suppressHydrationWarning>Loading...</div>
          </div>
        }>
          <SignInForm />
        </Suspense>
      </div>
    </div>
  );
}

