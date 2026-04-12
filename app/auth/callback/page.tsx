'use client';

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';

function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { checkAuth } = useAuth();
  const returnUrl = searchParams.get('returnUrl') || '/';

  useEffect(() => {
    const handleCallback = async () => {
      // Re-check authentication status after Google OAuth redirect
      await checkAuth();
      // Redirect to the return URL
      router.push(returnUrl);
    };

    handleCallback();
  }, [checkAuth, router, returnUrl]);

  return (
    <div className="min-h-screen bg-stone-950 flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-700 mx-auto" />
        <p className="text-stone-400 font-serif text-lg">
          Authenticatie wordt verwerkt...
        </p>
      </div>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-stone-950 flex items-center justify-center">
        <div className="animate-pulse text-stone-400 font-serif text-lg">
          Laden...
        </div>
      </div>
    }>
      <AuthCallbackContent />
    </Suspense>
  );
}