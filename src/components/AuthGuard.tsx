
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

  const isPublicPath = PUBLIC_PATHS.includes(pathname);
  
  useEffect(() => {
    // Don't do anything while loading the session
    if (isLoading) {
      return;
    }

    const isLoginPage = pathname === '/' || pathname === '/login' || pathname === '/suporte-gre/login';

    // If not authenticated and on a private page, redirect to login
    if (!isAuthenticated && !isPublicPath) {
      router.replace('/');
    }

    // If authenticated and on a login page, redirect to the main app page
    if (isAuthenticated && isLoginPage) {
      router.replace(AUTHENTICATED_ROOT);
    }
  }, [isLoading, isAuthenticated, isPublicPath, pathname, router]);

  // While loading the session, show a skeleton.
  if (isLoading) {
    return <AuthLoadingSkeleton />;
  }

  const isLoginPage = pathname === '/' || pathname === '/login' || pathname === '/suporte-gre/login';
  
  // If a redirect is imminent, show the skeleton to prevent flashing the old page
  if ((!isAuthenticated && !isPublicPath) || (isAuthenticated && isLoginPage)) {
      return <AuthLoadingSkeleton />;
  }

  // If everything is fine, render the children
  return <>{children}</>;
}