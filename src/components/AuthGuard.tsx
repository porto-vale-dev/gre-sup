
"use client";

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Skeleton } from '@/components/ui/skeleton';

// Define routes that do not require authentication
const PUBLIC_PATHS = ['/', '/login', '/suporte-gre', '/suporte-gre/login'];
const AUTHENTICATED_ROOT = '/hub';

const AuthLoadingSkeleton = () => (
    <div className="flex items-center justify-center min-h-[calc(100vh-10rem-theme(spacing.20))]">
        <div className="w-full max-w-md space-y-6">
            <div className="text-center space-y-2">
                <Skeleton className="h-9 w-64 mx-auto" />
                <Skeleton className="h-5 w-80 mx-auto" />
            </div>
            <div className="space-y-6 rounded-lg border bg-card p-6 shadow-sm">
                <div className="space-y-2"><Skeleton className="h-5 w-20" /><Skeleton className="h-10 w-full" /></div>
                <div className="space-y-2"><Skeleton className="h-5 w-20" /><Skeleton className="h-10 w-full" /></div>
                <Skeleton className="h-10 w-full" />
            </div>
        </div>
    </div>
);

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const isPublicPath = PUBLIC_PATHS.includes(pathname) || pathname.startsWith('/_next/');

  useEffect(() => {
    // Wait until auth state is confirmed
    if (isLoading) {
      return;
    }

    const isLoginPage = pathname === '/' || pathname === '/login' || pathname === '/suporte-gre/login';

    // If on a protected page and not logged in, redirect to main login
    if (!isAuthenticated && !isPublicPath) {
      router.push('/');
    }

    // If logged in and on a login page, redirect to the hub
    if (isAuthenticated && isLoginPage) {
      router.push(AUTHENTICATED_ROOT);
    }
  }, [isLoading, isAuthenticated, isPublicPath, pathname, router]);

  const isLoginPage = pathname === '/' || pathname === '/login' || pathname === '/suporte-gre/login';
  
  // While loading or preparing for a redirect, show a skeleton to prevent content flashing
  if (isLoading || (!isAuthenticated && !isPublicPath) || (isAuthenticated && isLoginPage)) {
    return <AuthLoadingSkeleton />;
  }

  // Otherwise, render the page
  return <>{children}</>;
}
