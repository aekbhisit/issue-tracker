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
    
    // Check if user is already authenticated
    // Only redirect if token exists and is valid (client-side validation)
    // This prevents redirect loops - we let the API validate the token
    // If token is invalid, API will return 401 and we'll stay on login page
    if (isAuthenticated()) {
      // User has token - redirect to dashboard
      // If token is invalid, dashboard will get 401 and redirect back here
      // Without basePath, we need to explicitly include /admin prefix
      // Routes are at /admin/* from app/admin/ folder structure
      router.push('/admin/dashboard');
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

