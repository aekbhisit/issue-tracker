'use client'
import { Outfit } from 'next/font/google';
import '@/../public/styles/globals.css';
import { Suspense } from 'react';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SidebarProvider } from '@/context/SidebarContext';
import { ThemeProvider } from '@/context/ThemeContext';
import { LoadingProvider } from '@/context/LoadingContext';
import GlobalLoading from '@/components/ui/loading/GlobalLoading';
import RouterLoading from '@/components/ui/loading/RouterLoading';
import '@/lib/i18n';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      refetchOnWindowFocus: false,
    },
  },
});

const outfit = Outfit({
  subsets: ["latin"],
});

export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th" suppressHydrationWarning>
      <head>
        <title>Issue Collector - Admin Dashboard</title>
        <meta name="description" content="Issue Collector - Centralized issue reporting and management system" />
        <link rel="icon" type="image/x-icon" href="/admin/favicon.ico" />
        {/* CRITICAL: Blocking script to set theme BEFORE React hydration - prevents hydration mismatch */}
        {/* This script runs synchronously before React starts, ensuring HTML matches between server and client */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var theme = localStorage.getItem('theme');
                  var html = document.documentElement;
                  var body = document.body;
                  if (theme === 'dark') {
                    html.classList.add('dark');
                    if (body) body.classList.add('dark');
                  } else {
                    html.classList.remove('dark');
                    if (body) body.classList.remove('dark');
                  }
                } catch (e) {
                  // Ignore localStorage errors (SSR, private browsing, etc.)
                }
              })();
            `,
          }}
        />
      </head>
      <body className={`${outfit.className} bg-white dark:bg-gray-900`} suppressHydrationWarning>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider>
            <SidebarProvider>
              <LoadingProvider>
                {children}
                <GlobalLoading />
                <Suspense fallback={null}>
                  <RouterLoading />
                </Suspense>
              </LoadingProvider>
            </SidebarProvider>
          </ThemeProvider>
        </QueryClientProvider>
      </body>
    </html>
  );
}


