"use client";

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Skeleton } from '@/components/ui/skeleton';

// Define routes that do not require authentication
const PUBLIC_PATHS = ['/', '/login', '/suporte-gre', '/suporte-gre/login'];
// Define admin-only routes (actual file paths, not rewrites)
const ADMIN_PATHS = ['/dashboard', '/dashboard/archived'];
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
  const { isAuthenticated, isLoading, cargo } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const isPublicPath = PUBLIC_PATHS.includes(pathname);
  const isAdminPath = ADMIN_PATHS.includes(pathname);
  
  // A profile is considered loading if the user is authenticated but we don't have a cargo yet.
  // We only need this extended loading check for admin paths to prevent content flashing.
  const isAwaitingProfileForAdminPath = isAuthenticated && isAdminPath && cargo === null;

  useEffect(() => {
    // If the session is loading, or if we're on an admin path and the profile is still loading, wait.
    if (isLoading || isAwaitingProfileForAdminPath) {
      return;
    }

    const isLoginPage = pathname === '/' || pathname === '/login' || pathname === '/suporte-gre/login';

    // Rule 1: If not authenticated and on a private page, redirect to login
    if (!isAuthenticated && !isPublicPath) {
      router.replace('/');
      return;
    }

    // Rule 2: If authenticated and on a login page, redirect to the main app page
    if (isAuthenticated && isLoginPage) {
      router.replace(AUTHENTICATED_ROOT);
      return;
    }

    // Rule 3: If authenticated, on an admin page, but not an admin, redirect to hub
    if (isAuthenticated && isAdminPath && cargo !== 'adm') {
      router.replace(AUTHENTICATED_ROOT);
      return;
    }
  }, [isLoading, isAuthenticated, cargo, isPublicPath, isAdminPath, pathname, router, isAwaitingProfileForAdminPath]);

  // While loading the session, or the profile for an admin path, show a skeleton.
  if (isLoading || isAwaitingProfileForAdminPath) {
    return <AuthLoadingSkeleton />;
  }

  const isLoginPage = pathname === '/' || pathname === '/login' || pathname === '/suporte-gre/login';
  
  // If a redirect is imminent, show the skeleton to prevent flashing the old page
  const shouldRedirect = 
    (!isAuthenticated && !isPublicPath) ||
    (isAuthenticated && isLoginPage) ||
    (isAuthenticated && isAdminPath && cargo !== 'adm');
  
  if (shouldRedirect) {
      return <AuthLoadingSkeleton />;
  }

  // If everything is fine, render the children
  return <>{children}</>;
}
