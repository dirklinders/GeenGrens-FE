'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { login, loginWithGoogle, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnUrl = searchParams.get('returnUrl') || '/game';

  // If already authenticated, redirect
  if (!isLoading && isAuthenticated) {
    router.push(returnUrl);
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const success = await login(email, password, rememberMe);
      if (success) {
        router.push(returnUrl);
      } else {
        setError('Ongeldige inloggegevens. Probeer het opnieuw.');
      }
    } catch {
      setError('Er is een fout opgetreden. Probeer het later opnieuw.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleLogin = () => {
    const fullReturnUrl = `${window.location.origin}${returnUrl}`;
    loginWithGoogle(fullReturnUrl);
  };

  return (
    <div className="min-h-screen bg-stone-950 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[url('/images/paper-texture.png')] opacity-5 pointer-events-none" />
      
      <Card className="w-full max-w-md bg-stone-900 border-stone-800 relative">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto mb-4">
            <svg
              viewBox="0 0 100 100"
              className="w-16 h-16 text-red-700"
              fill="currentColor"
            >
              <path d="M50 5 L60 40 L95 40 L67 60 L77 95 L50 75 L23 95 L33 60 L5 40 L40 40 Z" />
            </svg>
          </div>
          <CardTitle className="font-serif text-2xl text-stone-100">
            GeenGrens
          </CardTitle>
          <CardDescription className="text-stone-400">
            Log in om het mysterie te ontrafelen
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <Button
            type="button"
            variant="outline"
            className="w-full bg-stone-800 border-stone-700 text-stone-100 hover:bg-stone-700 hover:text-stone-50"
            onClick={handleGoogleLogin}
          >
            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Doorgaan met Google
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <Separator className="w-full bg-stone-700" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-stone-900 px-2 text-stone-500">
                Of met email
              </span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 bg-red-900/30 border border-red-800 rounded-md text-red-400 text-sm">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email" className="text-stone-300">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="naam@voorbeeld.nl"
                required
                className="bg-stone-800 border-stone-700 text-stone-100 placeholder:text-stone-500 focus:border-red-700 focus:ring-red-700"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-stone-300">
                Wachtwoord
              </Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Voer je wachtwoord in"
                required
                className="bg-stone-800 border-stone-700 text-stone-100 placeholder:text-stone-500 focus:border-red-700 focus:ring-red-700"
              />
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="rememberMe"
                checked={rememberMe}
                onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                className="border-stone-600 data-[state=checked]:bg-red-700 data-[state=checked]:border-red-700"
              />
              <Label
                htmlFor="rememberMe"
                className="text-sm text-stone-400 cursor-pointer"
              >
                Onthoud mij
              </Label>
            </div>

            <Button
              type="submit"
              className="w-full bg-red-800 hover:bg-red-700 text-stone-100"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Bezig met inloggen...' : 'Inloggen'}
            </Button>
          </form>

          <p className="text-center text-sm text-stone-500">
            De waarheid wacht. Ben jij klaar om hem te ontdekken?
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-stone-950 flex items-center justify-center">
        <div className="animate-pulse text-stone-400 font-serif text-lg">
          Laden...
        </div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
