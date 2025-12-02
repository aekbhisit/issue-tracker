"use client";

import SignInForm from "@/components/auth/SignInForm";
import { Suspense, useEffect } from "react";
import { useRouter } from "next/navigation";
import { isAuthenticated } from "@/lib/auth/token";

export default function AdminPage() {
  const router = useRouter();

  useEffect(() => {
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

  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <SignInForm />
    </Suspense>
  );
}

