import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Lock, User } from 'lucide-react';
import { fetchClient } from '../api/fetchClient';
import { useAuthStore } from '../store/authStore';

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

export default function Login() {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const loginAction = useAuthStore((state) => state.login);

  const loginMutation = useMutation({
    mutationFn: async (credentials) => {
      // fetchClient automatically handles the 403 redirect by firing forcePasswordChange()
      return await fetchClient('/auth/login', {
        method: 'POST',
        body: JSON.stringify(credentials)
      });
    },
    onSuccess: (data) => {
      // The API returns { token, user: { id, name, role } }
      if (data && data.token) {
        loginAction(data.token, data.user);
      }
    },
    onError: (error) => {
      // If error is PASSWORD_RESET_REQUIRED, Zustand and React Router have already jumped us 
      // away from this page, so we don't need to flash an error to the user.
      if (error.message !== 'PASSWORD_RESET_REQUIRED') {
        setErrorMessage(error.message || 'Verification failed. Please check your credentials.');
      }
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrorMessage('');
    loginMutation.mutate({ identifier, password });
  };

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center items-center p-4 selection:bg-primary/10">

      {/* Decorative gradient blob behind the card */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[40rem] h-[40rem] bg-primary/5 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10 animate-in fade-in zoom-in-95 duration-500">
        <h1 className="text-3xl font-light text-foreground mb-8 text-center tracking-tight">
          Pejuang <span className="font-semibold">GM</span>
        </h1>
        <Card className="bg-card border-border text-card-foreground shadow-2xl backdrop-blur-xl bg-opacity-80 w-full">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl tracking-tight">Sign In</CardTitle>
            <CardDescription className="text-muted-foreground">
              Enter your IC or Phone number to access your hierarchy.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">

              <div className="space-y-2">
                <Label htmlFor="identifier" className="text-muted-foreground">Identifier (IC/Phone)</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground/60" />
                  <Input
                    id="identifier"
                    type="text"
                    placeholder="e.g. 900101141234/+60123456789"
                    className="pl-9 bg-background border-border focus-visible:ring-primary/50"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-muted-foreground">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground/60" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    className="pl-9 bg-background border-border focus-visible:ring-primary/50"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
              </div>

              {errorMessage && (
                <div className="p-3 text-sm bg-destructive/10 border border-destructive/20 text-destructive rounded-md animate-in slide-in-from-top-1">
                  {errorMessage}
                </div>
              )}

              <Button
                type="submit"
                className="w-full bg-primary text-primary-foreground hover:opacity-90 transition-all active:scale-[0.98]"
                disabled={loginMutation.isPending}
              >
                {loginMutation.isPending ? 'Verifying...' : 'Continue ->'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
