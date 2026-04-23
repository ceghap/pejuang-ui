import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Layers, MapPin, Building2, Users, ArrowLeft, Plus, Trash2, Calendar, UserRound } from 'lucide-react';
import { toast } from 'sonner';

import { fetchClient } from '@/api/fetchClient';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { UserLookup } from '@/components/ui/user-lookup';

export default function GelanggangDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user: currentUser } = useAuthStore();

  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [selectedNewUser, setSelectedNewUser] = useState(null);
  const [userToRemove, setUserToRemove] = useState(null);

  const { data: gelanggang, isLoading, error } = useQuery({
    queryKey: ['gelanggang', id],
    queryFn: () => fetchClient(`/gelanggang/${id}`),
  });

  const addUserMutation = useMutation({
    mutationFn: (userId) => fetchClient(`/gelanggang/${id}/users`, {
      method: 'POST',
      body: JSON.stringify({ userId }),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries(['gelanggang', id]);
      setIsAddUserOpen(false);
      setSelectedNewUser(null);
      toast.success('User added successfully');
    },
    onError: (err) => {
      toast.error(err.message || 'Failed to add user');
    }
  });

  const removeUserMutation = useMutation({
    mutationFn: (userId) => fetchClient(`/gelanggang/${id}/users/${userId}`, {
      method: 'DELETE',
    }),
    onSuccess: () => {
      queryClient.invalidateQueries(['gelanggang', id]);
      setUserToRemove(null);
      toast.success('User removed from gelanggang');
    },
    onError: (err) => {
      toast.error(err.message || 'Failed to remove user');
      setUserToRemove(null);
    }
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64 mb-6" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Skeleton className="h-48 col-span-1" />
          <Skeleton className="h-48 col-span-2" />
        </div>
      </div>
    );
  }

  if (error || !gelanggang) {
    return (
      <div className="text-center p-12">
        <h2 className="text-xl font-bold text-destructive">Error Loading Gelanggang</h2>
        <Button onClick={() => navigate('/gelanggang')} className="mt-4" variant="outline">
          Back to List
        </Button>
      </div>
    );
  }

  const isJurulatih = gelanggang.jurulatih?.id === currentUser?.id;
  const isAdmin = currentUser?.role === 'Admin' || currentUser?.role === 'SuperAdmin';
  const canManage = isJurulatih || isAdmin;

  const handleAddSubmit = (e) => {
    e.preventDefault();
    if (!selectedNewUser) return;
    addUserMutation.mutate(selectedNewUser);
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto p-4 md:p-8 pt-6">
      <Button variant="ghost" onClick={() => navigate('/gelanggang')} className="pl-0 text-muted-foreground hover:text-foreground">
        <ArrowLeft className="w-4 h-4 mr-2" /> Back to My Gelanggang
      </Button>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Info Card */}
        <Card className="col-span-1 border-t-4 border-t-emerald-500 shadow-sm">
          <CardHeader className="pb-4">
             <div className="w-12 h-12 rounded-lg bg-emerald-50 flex items-center justify-center border border-emerald-100 mb-2">
                <Layers className="w-6 h-6 text-emerald-600" />
             </div>
             <CardTitle className="text-2xl">{gelanggang.name}</CardTitle>
             <CardDescription>{gelanggang.description || 'No description provided.'}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
             <div className="flex items-start gap-3">
               <Building2 className="w-4 h-4 text-emerald-500 mt-1 shrink-0" />
               <div>
                  <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Cawangan</p>
                  <p className="text-sm font-medium">{gelanggang.cawangan?.name}</p>
               </div>
             </div>
             <div className="flex items-start gap-3">
               <UserRound className="w-4 h-4 text-emerald-500 mt-1 shrink-0" />
               <div>
                  <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Jurulatih</p>
                  <p className="text-sm font-medium">{gelanggang.jurulatih?.name || 'Open vacancy'}</p>
               </div>
             </div>
             <div className="flex items-start gap-3">
               <MapPin className="w-4 h-4 text-emerald-500 mt-1 shrink-0" />
               <div>
                  <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Location</p>
                  <p className="text-sm">{gelanggang.location || 'Not specified'}</p>
               </div>
             </div>
          </CardContent>
        </Card>

        {/* Member Roster */}
        <Card className="col-span-1 md:col-span-2 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-4">
             <div>
                <CardTitle className="flex items-center gap-2">
                   <Users className="w-5 h-5 text-blue-500" /> Member Roster
                </CardTitle>
                <CardDescription>{gelanggang.users?.length || 0} active members.</CardDescription>
             </div>
             {canManage && (
                <Button onClick={() => setIsAddUserOpen(true)} size="sm">
                   <Plus className="w-4 h-4 mr-1" /> Add Member
                </Button>
             )}
          </CardHeader>
          <CardContent>
             <Table>
                <TableHeader>
                   <TableRow>
                      <TableHead>Student Name</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Joined</TableHead>
                      {canManage && <TableHead className="text-right">Actions</TableHead>}
                   </TableRow>
                </TableHeader>
                <TableBody>
                   {gelanggang.users?.map((u) => (
                      <TableRow key={u.id}>
                         <TableCell className="font-medium">{u.name}</TableCell>
                         <TableCell className="text-muted-foreground text-xs">{u.phoneNumber || '-'}</TableCell>
                         <TableCell className="text-xs text-muted-foreground">
                            {new Date(u.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                         </TableCell>
                         {canManage && (
                            <TableCell className="text-right">
                               <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="text-rose-500 hover:text-rose-600 hover:bg-rose-50"
                                  onClick={() => setUserToRemove(u)}
                               >
                                  <Trash2 className="w-4 h-4" />
                               </Button>
                            </TableCell>
                         )}
                      </TableRow>
                   ))}
                   {(!gelanggang.users || gelanggang.users.length === 0) && (
                      <TableRow>
                         <TableCell colSpan={canManage ? 4 : 3} className="text-center text-muted-foreground py-8">
                            No students registered yet.
                         </TableCell>
                      </TableRow>
                   )}
                </TableBody>
             </Table>
          </CardContent>
        </Card>

      </div>

      {/* Add User Dialog */}
      <Dialog open={isAddUserOpen} onOpenChange={setIsAddUserOpen}>
         <DialogContent>
            <DialogHeader>
               <DialogTitle>Add Member to Gelanggang</DialogTitle>
               <DialogDescription>
                  Search for a registered user to add them to this gelanggang. They will automatically be transferred if they belong to another setup.
               </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAddSubmit} className="space-y-4 mt-4">
               <UserLookup 
                  label="Search User"
                  value={selectedNewUser}
                  onChange={(val) => setSelectedNewUser(val)}
               />
               <div className="flex justify-end gap-3 pt-4">
                  <Button type="button" variant="outline" onClick={() => setIsAddUserOpen(false)}>
                     Cancel
                  </Button>
                  <Button type="submit" disabled={!selectedNewUser || addUserMutation.isPending}>
                     {addUserMutation.isPending ? 'Adding...' : 'Add User'}
                  </Button>
               </div>
            </form>
         </DialogContent>
      </Dialog>

      {/* Remove User Confirmation */}
      <ConfirmDialog
         isOpen={!!userToRemove}
         onClose={() => setUserToRemove(null)}
         title="Remove Member?"
         description={`Are you sure you want to remove ${userToRemove?.name} from this gelanggang? They will remain in the system but will no longer be associated with this training center.`}
         onConfirm={() => removeUserMutation.mutate(userToRemove.id)}
         confirmText="Remove Member"
         variant="destructive"
         isLoading={removeUserMutation.isPending}
      />
    </div>
  );
}
