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
  const isAuthPage = useMemo(() => {
    // Get pathname from Next.js hook
    let currentPath = pathname;
    
    // Fallback: if pathname is not available, try to get it from window.location
    // This is a safety net for edge cases in production
    if (!currentPath && typeof window !== 'undefined') {
      currentPath = window.location.pathname;
    }
    
    // If still no pathname, default to false (show sidebar)
    if (!currentPath) return false;
    
    // Normalize pathname: remove trailing slashes, query strings, and hashes
    // Split by '?' and '#' to get just the path
    const pathOnly = currentPath.split('?')[0].split('#')[0];
    const normalized = pathOnly.replace(/\/+$/, '') || '/';
    
    // Check if it's the login page (exactly /admin)
    if (normalized === '/admin') return true;
    
    // Check if it's an auth-related page
    const authPaths = ['/admin/signup', '/admin/reset-password', '/admin/forgot-password'];
    return authPaths.some(authPath => normalized.startsWith(authPath));
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

