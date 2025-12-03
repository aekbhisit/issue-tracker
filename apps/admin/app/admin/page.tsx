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
      // Use relative path without /admin prefix since basePath is already /admin
      // router.push() automatically adds basePath, so '/dashboard' becomes '/admin/dashboard'
      router.push('/dashboard');
    }
  }, [router]);

  // CRITICAL: Render the same structure on server and client to prevent hydration mismatch
  // Return a consistent structure that matches what will be rendered after hydration
  // Use suppressHydrationWarning on the outer container to tell React this is intentional
  return (
    <div className="min-h-screen flex items-center justify-center" suppressHydrationWarning>
      {isClient ? (
        <Suspense fallback={<div className="text-gray-500" suppressHydrationWarning>Loading...</div>}>
          <SignInForm />
        </Suspense>
      ) : (
        <div className="text-gray-500" suppressHydrationWarning>Loading...</div>
      )}
    </div>
  );
}

