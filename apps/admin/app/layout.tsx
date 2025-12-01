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
  // Use useEffect only for client-side updates to prevent hydration mismatch
  useEffect(() => {
    // Only update title if it's different (prevents unnecessary updates)
    if (document.title !== 'Issue Collector - Admin Dashboard') {
      document.title = 'Issue Collector - Admin Dashboard';
    }
    
    // Update or create meta description only on client side
    let metaDescription = document.querySelector('meta[name="description"]');
    if (!metaDescription) {
      metaDescription = document.createElement('meta');
      metaDescription.setAttribute('name', 'description');
      document.head.appendChild(metaDescription);
    }
    metaDescription.setAttribute('content', 'Issue Collector - Centralized issue reporting and management system');
    
    // Add favicon link if not present
    let faviconLink = document.querySelector('link[rel="icon"]') as HTMLLinkElement;
    if (!faviconLink) {
      faviconLink = document.createElement('link');
      faviconLink.rel = 'icon';
      faviconLink.type = 'image/x-icon';
      document.head.appendChild(faviconLink);
    }
    // Set favicon path - Use /admin/favicon.ico (served by Next.js from public folder)
    const faviconPath = '/admin/favicon.ico';
    if (faviconLink.href !== faviconPath) {
      faviconLink.href = faviconPath;
    }
  }, []);

  return (
    <html lang="th" suppressHydrationWarning>
      <head>
        <link rel="icon" type="image/x-icon" href="/admin/favicon.ico" />
      </head>
      <body className={`${outfit.className} dark:bg-gray-900`} suppressHydrationWarning>
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


