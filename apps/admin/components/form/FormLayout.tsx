"use client";

import { ReactNode } from "react";
import { Breadcrumb, BreadcrumbItem } from "../common/Breadcrumb";

interface FormLayoutProps {
  title: ReactNode;
  description?: ReactNode;
  breadcrumbs?: BreadcrumbItem[];
  actions?: ReactNode;
  children: ReactNode;
  sidebar?: ReactNode;
  className?: string;
}

export function FormLayout({
  title,
  description,
  breadcrumbs,
  actions,
  children,
  sidebar,
  className = "",
}: FormLayoutProps) {
  return (
    <div className={`w-full ${className}`}>
      {/* Page Header - TailAdmin Style: Title left, Breadcrumb right */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        {/* Title and Description */}
        <div className="flex-1 min-w-0">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white/90 mb-1">
            {title}
          </h2>
          {description && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {description}
            </p>
          )}
        </div>
        
        {/* Breadcrumb Navigation - Right side */}
        {breadcrumbs && breadcrumbs.length > 0 && (
          <nav>
            <Breadcrumb items={breadcrumbs} />
          </nav>
        )}
      </div>
      
      {/* Actions Row */}
      {actions && (
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end mb-6">
          {actions}
        </div>
      )}

      {/* Content Grid */}
      <div className={`grid gap-6 w-full ${sidebar ? "lg:grid-cols-[minmax(0,1fr)_290px]" : ""}`}>
        <div className="space-y-6">{children}</div>
        {sidebar && <div className="space-y-6">{sidebar}</div>}
      </div>
    </div>
  );
}

