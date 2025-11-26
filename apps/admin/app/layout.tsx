'use client'
import { Outfit } from 'next/font/google';
import '@/../public/styles/globals.css';
import { useEffect, Suspense } from 'react';

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
  useEffect(() => {
    document.title = 'Issue Collector - Admin Dashboard';
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', 'Issue Collector - Centralized issue reporting and management system');
    } else {
      const meta = document.createElement('meta');
      meta.name = 'description';
      meta.content = 'Issue Collector - Centralized issue reporting and management system';
      document.head.appendChild(meta);
    }
  }, []);

  return (
    <html lang="en">
      <body className={`${outfit.className} dark:bg-gray-900`}>
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


