import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Award, CheckCircle, Loader2, MapPin } from 'lucide-react';
import { toast } from 'sonner';

import { fetchClient } from '@/api/fetchClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';

export default function PendingRewards() {
  const queryClient = useQueryClient();
  const [awardDialog, setAwardDialog] = useState({ open: false, rewardId: null });
  const [awardData, setAwardData] = useState({ location: '', awardedAt: new Date().toISOString().slice(0, 16) });

  const { data: rewards, isLoading } = useQuery({
    queryKey: ['pending-rewards'],
    queryFn: () => fetchClient('/rewards/pending')
  });

  const awardMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      return fetchClient(`/rewards/${id}/award`, {
        method: 'PUT',
        body: JSON.stringify(data)
      });
    },
    onSuccess: () => {
      toast.success('Reward successfully marked as awarded');
      queryClient.invalidateQueries({ queryKey: ['pending-rewards'] });
      setAwardDialog({ open: false, rewardId: null });
    },
    onError: (err) => {
      toast.error(err.message || 'Failed to award reward');
    }
  });

  const handleAwardSubmit = (e) => {
    e.preventDefault();
    if (!awardData.location) {
      toast.error('Location is required');
      return;
    }
    awardMutation.mutate({
      id: awardDialog.rewardId,
      data: {
        location: awardData.location,
        awardedAt: new Date(awardData.awardedAt).toISOString()
      }
    });
  };

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-light tracking-tight">Pending <span className="font-semibold">Rewards</span></h1>
          <p className="text-muted-foreground mt-1">Manage and award pending Ajian and other rewards.</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-bold uppercase tracking-widest flex items-center gap-2">
            <Award className="w-4 h-4 text-emerald-500" />
            Reward Queue
          </CardTitle>
          <CardDescription>
            Users who have passed the required level and are awaiting their formal reward handover.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center p-12">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          ) : rewards?.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground bg-slate-50/50 rounded-md border border-dashed">
              No pending rewards found.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-y">
                  <tr>
                    <th className="px-4 py-3 font-medium">User</th>
                    <th className="px-4 py-3 font-medium">Gelanggang</th>
                    <th className="px-4 py-3 font-medium">Reward</th>
                    <th className="px-4 py-3 font-medium">Source Event</th>
                    <th className="px-4 py-3 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {rewards.map((reward) => (
                    <tr key={reward.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 font-medium">{reward.userName}</td>
                      <td className="px-4 py-3 text-muted-foreground">{reward.gelanggangName}</td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-100 text-emerald-800">
                          {reward.rewardName}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        {reward.eventTitle ? (
                          <>
                            <div>{reward.eventTitle}</div>
                            <div>{reward.eventDate && new Date(reward.eventDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
                          </>
                        ) : (
                          '-'
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                          onClick={() => setAwardDialog({ open: true, rewardId: reward.id })}
                        >
                          <CheckCircle className="w-3.5 h-3.5 mr-1" />
                          Award
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={awardDialog.open} onOpenChange={(open) => setAwardDialog({ open, rewardId: null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Award Reward</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAwardSubmit} className="space-y-4 mt-2">
            <div className="space-y-2">
              <Label>Location / Place</Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input 
                  required 
                  className="pl-9"
                  placeholder="e.g., Gelanggang Pusat" 
                  value={awardData.location}
                  onChange={(e) => setAwardData({ ...awardData, location: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Date & Time</Label>
              <Input 
                type="datetime-local" 
                required 
                value={awardData.awardedAt}
                onChange={(e) => setAwardData({ ...awardData, awardedAt: e.target.value })}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setAwardDialog({ open: false, rewardId: null })}>Cancel</Button>
              <Button type="submit" disabled={awardMutation.isPending}>
                {awardMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Confirm Award
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
