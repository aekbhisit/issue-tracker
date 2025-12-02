"use client";

import { useSidebar } from "@/context/SidebarContext";
import AppHeader from "@/layout/AppHeader";
import AppSidebar from "@/layout/AppSidebar";
import Backdrop from "@/layout/Backdrop";
import React, { useMemo } from "react";
import { usePathname } from "next/navigation";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isExpanded, isHovered, isMobileOpen } = useSidebar();
  const pathname = usePathname();
  
  // Check if current page is a public/auth page (login, signup, reset-password)
  // Normalize pathname by removing trailing slashes for comparison
  // Use useMemo to prevent unnecessary recalculations
  // IMPORTANT: Only use pathname from usePathname() to avoid hydration mismatches
  // NOTE: With basePath='/admin', usePathname() returns paths WITHOUT the basePath prefix
  // So /admin becomes '/', /admin/signup becomes '/signup', etc.
  const isAuthPage = useMemo(() => {
    // If pathname is not available, default to false (show sidebar)
    // Don't use window.location here as it causes hydration mismatches
    if (!pathname) return false;
    
    // Normalize pathname: remove trailing slashes, query strings, and hashes
    // Split by '?' and '#' to get just the path
    const pathOnly = pathname.split('?')[0].split('#')[0];
    const normalized = pathOnly.replace(/\/+$/, '') || '/';
    
    // With basePath='/admin', usePathname() returns:
    // - '/admin' → '/'
    // - '/admin/signup' → '/signup'
    // - '/admin/reset-password' → '/reset-password'
    // So we check for root path '/' (login page) and auth paths without '/admin' prefix
    if (normalized === '/' || normalized === '') return true; // Login page
    
    // Check if it's an auth-related page (without /admin prefix due to basePath)
    const authPaths = ['/signup', '/reset-password', '/forgot-password'];
    return authPaths.some(authPath => normalized === authPath || normalized.startsWith(authPath + '/'));
  }, [pathname]);

  // Dynamic class for main content margin based on sidebar state
  const mainContentMargin = isMobileOpen
    ? "ml-0"
    : isExpanded || isHovered
    ? "lg:ml-[290px]"
    : "lg:ml-[90px]";

  // If it's an auth page, render without sidebar and header
  if (isAuthPage) {
    return (
      <div className="min-h-screen">
        {children}
      </div>
    );
  }

  // Regular admin layout with sidebar and header
  return (
    <div className="min-h-screen xl:flex">
      {/* Sidebar and Backdrop */}
      <AppSidebar />
      <Backdrop />
      {/* Main Content Area */}
      <div
        className={`flex-1 transition-all  duration-300 ease-in-out ${mainContentMargin}`}
      >
        {/* Header */}
        <AppHeader />
        {/* Page Content */}
        <div className="p-4 mx-auto max-w-(--breakpoint-2xl) md:p-6">{children}</div>
      </div>
    </div>
  );
}

