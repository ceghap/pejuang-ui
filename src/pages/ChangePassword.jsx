import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Lock, AlertCircle, KeyRound } from 'lucide-react';
import { fetchClient } from '../api/fetchClient';
import { useAuthStore } from '../store/authStore';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

export default function ChangePassword() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // pendingUserId is set by our fetchClient interceptor
  const pendingUserId = useAuthStore((state) => state.pendingUserId);
  const loginAction = useAuthStore((state) => state.login);

  const changePwdMutation = useMutation({
    mutationFn: async (payload) => {
      // Endpoint requires: UserId, CurrentPassword, NewPassword
      return await fetchClient('/auth/change-password', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
    },
    onSuccess: (data) => {
      // The endpoint returns { message, token, user } upon successful password change
      if (data && data.token) {
        loginAction(data.token, data.user);
      }
    },
    onError: (error) => {
      setErrorMessage(error.message || 'Failed to update password.');
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (newPassword !== confirmPassword) {
      setErrorMessage("New passwords do not match.");
      return;
    }
    if (newPassword.length < 8) {
      setErrorMessage("New password must be at least 8 characters.");
      return;
    }

    changePwdMutation.mutate({
      userId: pendingUserId,
      currentPassword,
      newPassword
    });
  };

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center items-center p-4 selection:bg-primary/10">

      {/* Decorative gradient blob behind the card */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[40rem] h-[40rem] bg-primary/5 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10 animate-in fade-in zoom-in-95 duration-500 flex flex-col items-center">
        <h1 className="text-3xl font-light text-zinc-100 mb-8 text-center tracking-tight">
          Pejuang <span className="font-semibold text-white">GM</span>
        </h1>

        <Card className="bg-card border-border text-card-foreground shadow-2xl backdrop-blur-xl bg-opacity-80 w-full">
          <CardHeader className="space-y-1 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-500 to-orange-500" />
            <div className="flex items-center gap-2 text-amber-600">
              <AlertCircle className="w-5 h-5" />
              <span className="font-medium text-sm tracking-widest uppercase">Action Required</span>
            </div>
            <CardTitle className="text-2xl tracking-tight mt-2">Setup Password</CardTitle>
            <CardDescription className="text-muted-foreground">
              For security reasons, you must change your assigned password before continuing to your profile.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">

              <div className="space-y-2">
                <Label htmlFor="currentPassword" className="text-muted-foreground">Current Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground/60" />
                  <Input
                    id="currentPassword"
                    type="password"
                    placeholder="••••••••"
                    className="pl-9 bg-background border-border focus-visible:ring-primary/50"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="newPassword" className="text-muted-foreground">New Password</Label>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-3 h-4 w-4 text-muted-foreground/60" />
                  <Input
                    id="newPassword"
                    type="password"
                    placeholder="Minimal 8 characters"
                    className="pl-9 bg-background border-border focus-visible:ring-amber-500/50"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-muted-foreground">Confirm New Password</Label>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-3 h-4 w-4 text-muted-foreground/60" />
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="Retype password"
                    className="pl-9 bg-background border-border focus-visible:ring-amber-500/50"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
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
                className="w-full bg-amber-500 text-white hover:bg-amber-600 transition-all active:scale-[0.98]"
                disabled={changePwdMutation.isPending}
              >
                {changePwdMutation.isPending ? 'Updating...' : 'Secure Account ->'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
