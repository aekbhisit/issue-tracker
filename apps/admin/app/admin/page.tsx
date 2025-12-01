import SignInForm from "@/components/auth/SignInForm";
import { Suspense } from "react";

export default function AdminPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <SignInForm />
    </Suspense>
  );
}

