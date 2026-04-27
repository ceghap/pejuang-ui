import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Lock, AlertCircle, KeyRound, ArrowLeft } from 'lucide-react';
import { fetchClient } from '../api/fetchClient';
import { useAuthStore } from '../store/authStore';
import { useNavigate } from 'react-router-dom';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export default function ChangePassword() {
  const navigate = useNavigate();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const { user: authUser, pendingUserId, login: loginAction } = useAuthStore();
  const userId = pendingUserId || authUser?.id;
  const isForced = !!pendingUserId;

  const changePwdMutation = useMutation({
    mutationFn: async (payload) => {
      return await fetchClient('/auth/change-password', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
    },
    onSuccess: (data) => {
      if (data && data.token) {
        loginAction(data.token, data.user);
        if (!isForced) {
           navigate('/profile');
        }
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
      userId: userId,
      currentPassword,
      newPassword
    });
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col justify-center items-center p-4 selection:bg-primary/10">

      {/* Decorative gradient blob */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[40rem] h-[40rem] bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10 animate-in fade-in zoom-in-95 duration-500 flex flex-col items-center">
        <h1 className="text-3xl font-light text-zinc-100 mb-8 text-center tracking-tight uppercase">
          Pejuang <span className="font-semibold text-white">GM</span>
        </h1>

        <Card className="bg-zinc-900 border-zinc-800 text-white shadow-2xl backdrop-blur-xl bg-opacity-80 w-full rounded-2xl overflow-hidden">
          <CardHeader className="space-y-1 relative overflow-hidden pb-6">
            <div className={cn(
              "absolute top-0 left-0 w-full h-1 bg-gradient-to-r",
              isForced ? "from-amber-500 to-orange-500" : "from-blue-500 to-indigo-500"
            )} />
            
            {isForced ? (
              <div className="flex items-center gap-2 text-amber-500 mb-2">
                <AlertCircle className="w-4 h-4" />
                <span className="font-black text-[10px] tracking-[0.2em] uppercase">Action Required</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-blue-400 mb-2">
                <Lock className="w-4 h-4" />
                <span className="font-black text-[10px] tracking-[0.2em] uppercase">Security</span>
              </div>
            )}
            
            <CardTitle className="text-2xl font-black uppercase italic tracking-tight">
              {isForced ? 'Setup Password' : 'Change Password'}
            </CardTitle>
            <CardDescription className="text-zinc-400 text-[11px] font-medium uppercase tracking-tight">
              {isForced 
                ? "You must update your credentials before continuing."
                : "Update your account security settings."}
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-2">
            <form onSubmit={handleSubmit} className="space-y-5">

              <div className="space-y-2">
                <Label htmlFor="currentPassword" className="text-zinc-500 text-[10px] font-black uppercase tracking-widest ml-1">Current Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-zinc-600" />
                  <Input
                    id="currentPassword"
                    type="password"
                    placeholder="••••••••"
                    className="pl-9 bg-zinc-950 border-zinc-800 focus-visible:ring-zinc-700 text-white"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="newPassword" className="text-zinc-500 text-[10px] font-black uppercase tracking-widest ml-1">New Password</Label>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-3 h-4 w-4 text-zinc-600" />
                  <Input
                    id="newPassword"
                    type="password"
                    placeholder="Min. 8 characters"
                    className="pl-9 bg-zinc-950 border-zinc-800 focus-visible:ring-zinc-700 text-white"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2 pb-2">
                <Label htmlFor="confirmPassword" className="text-zinc-500 text-[10px] font-black uppercase tracking-widest ml-1">Confirm New Password</Label>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-3 h-4 w-4 text-zinc-600" />
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="Retype new password"
                    className="pl-9 bg-zinc-950 border-zinc-800 focus-visible:ring-zinc-700 text-white"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                </div>
              </div>

              {errorMessage && (
                <div className="p-3 text-xs font-bold bg-rose-500/10 border border-rose-500/20 text-rose-500 rounded-xl animate-in slide-in-from-top-1">
                  {errorMessage}
                </div>
              )}

              <Button
                type="submit"
                className={cn(
                  "w-full text-white font-black uppercase text-[10px] tracking-[0.2em] h-12 rounded-xl transition-all active:scale-[0.98] shadow-lg",
                  isForced ? "bg-amber-600 hover:bg-amber-700 shadow-amber-900/20" : "bg-blue-600 hover:bg-blue-700 shadow-blue-900/20"
                )}
                disabled={changePwdMutation.isPending}
              >
                {changePwdMutation.isPending ? 'Updating...' : isForced ? 'Secure Account' : 'Update Password'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {!isForced && (
          <Button 
            variant="ghost" 
            onClick={() => navigate('/profile')}
            className="mt-8 text-zinc-500 hover:text-white uppercase text-[10px] font-black tracking-[0.2em] transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5 mr-2" /> Back to Profile
          </Button>
        )}
      </div>
    </div>
  );
}
