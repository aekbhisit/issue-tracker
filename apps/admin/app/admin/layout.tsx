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
    // Remove any double /admin/admin prefix that might occur due to routing issues
    let cleanedPath = pathOnly.replace(/^\/admin\/admin(\/|$)/, '/admin$1');
    
    // With basePath='/admin', usePathname() should return paths WITHOUT the basePath prefix
    // But handle both cases for safety (with and without /admin prefix)
    // If path still starts with /admin/, remove it (shouldn't happen with basePath, but handle it)
    if (cleanedPath.startsWith('/admin/')) {
      cleanedPath = cleanedPath.substring('/admin'.length) || '/';
    } else if (cleanedPath === '/admin') {
      cleanedPath = '/';
    }
    
    const normalized = cleanedPath.replace(/\/+$/, '') || '/';
    
    // With basePath='/admin', usePathname() returns paths WITHOUT the basePath prefix:
    // - '/admin' → '/' (login page)
    // - '/admin/signup' → '/signup'
    // - '/admin/reset-password' → '/reset-password'
    // After cleaning, '/admin/admin' → '/admin' → '/' (login page)
    // So we check for root path '/' (login page)
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
      <div className="min-h-screen" suppressHydrationWarning>
        {children}
      </div>
    );
  }

  // Regular admin layout with sidebar and header
  return (
    <div className="min-h-screen xl:flex" suppressHydrationWarning>
      {/* Sidebar and Backdrop */}
      <AppSidebar />
      <Backdrop />
      {/* Main Content Area */}
      <div
        className={`flex-1 transition-all  duration-300 ease-in-out ${mainContentMargin}`}
        suppressHydrationWarning
      >
        {/* Header */}
        <AppHeader />
        {/* Page Content */}
        <div className="p-4 mx-auto max-w-(--breakpoint-2xl) md:p-6" suppressHydrationWarning>{children}</div>
      </div>
    </div>
  );
}

