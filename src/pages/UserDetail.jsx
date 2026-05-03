import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchClient } from '@/api/fetchClient';
import { useForm } from '@tanstack/react-form';
import { useAuthStore } from '@/store/authStore';
import {
  ArrowLeft, Save, User as UserIcon, Shield, Sword,
  Users, CreditCard, Heart, Loader2, Plus, Link as LinkIcon,
  Trash2, Edit3, UserCheck, ShieldAlert, KeyRound, XCircle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';
import { UserLookup } from '@/components/ui/user-lookup';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

export default function UserDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user: authUser } = useAuthStore();

  const isGlobalAdmin = authUser?.role === 'Admin' || authUser?.role === 'SuperAdmin';
  const isBranchAdmin = authUser?.isBranchAdmin;

  // Dialog States
  const [isAddMembershipOpen, setIsAddMembershipOpen] = useState(false);
  const [isLinkDownlineOpen, setIsLinkDownlineOpen] = useState(false);
  const [isChangeUplineOpen, setIsChangeUplineOpen] = useState(false);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  const [resetData, setResetData] = useState(null); // For showing temp password

  // Selection Tracking for Network
  const [addedDownlines, setAddedDownlines] = useState([]);
  const [removedDownlineIds, setRemovedDownlineIds] = useState(new Set());
  const [stagedUpline, setStagedUpline] = useState(null);
  const [stagedDownlines, setStagedDownlines] = useState([]);

  const { data: user, isLoading, error } = useQuery({
    queryKey: ['user', id],
    queryFn: () => fetchClient(`/users/${id}`),
    enabled: !!id
  });

  const { data: initialDownlines } = useQuery({
    queryKey: ['user-downlines', id],
    queryFn: () => fetchClient(`/users/${id}/downlines`),
    enabled: !!id
  });

  const { data: cawangans } = useQuery({
    queryKey: ['cawangans'],
    queryFn: () => fetchClient('/cawangan')
  });

  const { data: programs } = useQuery({
    queryKey: ['membership-programs'],
    queryFn: () => fetchClient('/memberships/programs')
  });

  const { data: positions } = useQuery({
    queryKey: ['positions'],
    queryFn: () => fetchClient('/positions')
  });

  const { data: bengkungs } = useQuery({
    queryKey: ['bengkungs'],
    queryFn: () => fetchClient('/bengkung')
  });

  const { data: gelanggangs } = useQuery({
    queryKey: ['gelanggangs'],
    queryFn: () => fetchClient('/gelanggang')
  });

  // Initialize staging when data loads
  useEffect(() => {
    if (user) setStagedUpline(user.upline);
    if (initialDownlines?.downlines) setStagedDownlines(initialDownlines.downlines);
  }, [user, initialDownlines]);

  const saveAllMutation = useMutation({
    mutationFn: async (formData) => {
      // 1. Update Profile & Upline FIRST
      await fetchClient(`/users/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ ...formData, uplineId: stagedUpline?.id || null })
      });

      // 2. Process Added Downlines ONE BY ONE
      for (const d of addedDownlines) {
        await fetchClient(`/users/${d.id}/upline`, {
          method: 'PUT',
          body: JSON.stringify({ uplineId: id })
        });
      }

      // 3. Process Removed Downlines ONE BY ONE
      for (const rid of removedDownlineIds) {
        await fetchClient(`/users/${rid}/upline`, {
          method: 'PUT',
          body: JSON.stringify({ uplineId: null })
        });
      }
    },
    onSuccess: () => {
      toast.success("All changes saved successfully");
      setAddedDownlines([]);
      setRemovedDownlineIds(new Set());
      form.reset(); // Clear dirty state
      queryClient.invalidateQueries({ queryKey: ['user', id] });
      queryClient.invalidateQueries({ queryKey: ['user-downlines', id] });
    },
    onError: (err) => {
      console.error("Save Error:", err);
      toast.error(err.message || "Failed to save changes");
    }
  });

  const resetMutation = useMutation({
    mutationFn: () => fetchClient(`/users/${id}/reset-password`, { method: 'POST' }),
    onSuccess: (data) => {
       setIsResetConfirmOpen(false);
       setResetData(data);
       toast.success("Password reset successful");
    },
    onError: (err) => {
       setIsResetConfirmOpen(false);
       toast.error(err.message);
    }
  });

  const assignMembershipMutation = useMutation({
    mutationFn: (data) => fetchClient(`/users/${id}/memberships`, {
      method: 'POST',
      body: JSON.stringify(data)
    }),
    onSuccess: () => {
      toast.success("Membership assigned");
      setIsAddMembershipOpen(false);
      queryClient.invalidateQueries({ queryKey: ['user', id] });
    },
    onError: (err) => toast.error(err.message || "Failed to assign membership")
  });

  const form = useForm({
    defaultValues: {
      name: user?.name || '',
      phoneNumber: user?.phoneNumber || '',
      icNumber: user?.icNumber || '',
      email: user?.email || '',
      role: user?.role === 'SuperAdmin' ? 1 : user?.role === 'Admin' ? 2 : 3,
      cawanganId: user?.cawanganId || null,
      positionId: user?.positionId || null,
      gelanggangId: user?.gelanggangId || null,
      currentBengkungId: user?.currentBengkungId || null,
      profile: {
        title: user?.profile?.title || '',
        occupation: user?.profile?.occupation || '',
        address: user?.profile?.address || '',
        position: user?.profile?.position || '',
        bengkung: user?.profile?.bengkung || '',
        baiahYear: user?.profile?.baiahYear || null,
        mandiAdatYear: user?.profile?.mandiAdatYear || null,
        mandiPelangirYear: user?.profile?.mandiPelangirYear || null,
        membershipCardStatus: user?.profile?.membershipCardStatus || '',
        weight: user?.profile?.weight || null,
        height: user?.profile?.height || null,
        medicalStatus: user?.profile?.medicalStatus || 'Pending',
        medicalClearanceDate: user?.profile?.medicalClearanceDate ? user.profile.medicalClearanceDate.split('T')[0] : '',
        nextOfKinName: user?.profile?.nextOfKinName || '',
        nextOfKinIc: user?.profile?.nextOfKinIc || '',
        nextOfKinPhone: user?.profile?.nextOfKinPhone || '',
        nextOfKinRelation: user?.profile?.nextOfKinRelation || '',
      }
    },
    onSubmit: async ({ value }) => {
      saveAllMutation.mutate(value);
    },
  });

  // Re-sync form when user data changes
  useEffect(() => {
    if (user) {
      form.reset({
        name: user.name,
        phoneNumber: user.phoneNumber,
        icNumber: user.icNumber,
        email: user.email || '',
        role: user.role === 'SuperAdmin' ? 1 : user.role === 'Admin' ? 2 : 3,
        cawanganId: user.cawanganId || null,
        positionId: user.positionId || null,
        gelanggangId: user.gelanggangId || null,
        currentBengkungId: user.currentBengkungId || null,
        profile: {
          title: user.profile?.title || '',
          occupation: user.profile?.occupation || '',
          address: user.profile?.address || '',
          position: user.profile?.position || '',
          bengkung: user.profile?.bengkung || '',
          baiahYear: user.profile?.baiahYear || null,
          mandiAdatYear: user.profile?.mandiAdatYear || null,
          mandiPelangirYear: user.profile?.mandiPelangirYear || null,
          membershipCardStatus: user.profile?.membershipCardStatus || '',
          weight: user.profile?.weight || null,
          height: user.profile?.height || null,
          medicalStatus: user.profile?.medicalStatus || 'Pending',
          medicalClearanceDate: user.profile?.medicalClearanceDate ? user.profile.medicalClearanceDate.split('T')[0] : '',
          nextOfKinName: user.profile?.nextOfKinName || '',
          nextOfKinIc: user.profile?.nextOfKinIc || '',
          nextOfKinPhone: user.profile?.nextOfKinPhone || '',
          nextOfKinRelation: user.profile?.nextOfKinRelation || '',
        }
      });
    }
  }, [user]);

  const handleLinkDownline = (selectedUser) => {
    if (!selectedUser) return;
    if (selectedUser.id === id) {
      toast.error("Cannot link user to themselves");
      return;
    }

    setAddedDownlines(prev => [...prev, selectedUser]);
    setStagedDownlines(prev => [...prev, selectedUser]);
    setRemovedDownlineIds(prev => {
      const next = new Set(prev);
      next.delete(selectedUser.id);
      return next;
    });
    setIsLinkDownlineOpen(false);
  };

  const handleRemoveDownline = (downline) => {
    setRemovedDownlineIds(prev => new Set(prev).add(downline.id));
    setStagedDownlines(prev => prev.filter(d => d.id !== downline.id));
    setAddedDownlines(prev => prev.filter(d => d.id !== downline.id));
  };

  if (isLoading) return <UserDetailSkeleton />;
  if (error) return <div className="p-8 text-center text-red-500">Error: {error.message}</div>;

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8 space-y-8 bg-slate-50/50 min-h-screen pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => navigate('/admin/users')} className="rounded-full h-10 w-10">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-slate-900 uppercase leading-none">{user.name}</h1>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="secondary" className="font-mono text-[10px] tracking-wider uppercase bg-blue-50 text-blue-700 border-none px-2 py-0.5">
                {user.icNumber}
              </Badge>
              <Badge className="font-mono text-[10px] tracking-wider uppercase bg-slate-900 text-white border-none px-2 py-0.5">
                {user.role}
              </Badge>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {(saveAllMutation.isPending || addedDownlines.length > 0 || removedDownlineIds.size > 0 || form.state.isDirty || stagedUpline?.id !== user.upline?.id) && (
            <p className="text-[10px] font-bold text-orange-600 uppercase tracking-widest animate-pulse mr-2">Unsaved Changes</p>
          )}
          
          <Button
            variant="outline"
            onClick={() => setIsResetConfirmOpen(true)}
            disabled={resetMutation.isPending}
            className="h-12 px-4 rounded-xl border-slate-200 text-rose-600 bg-rose-50/30 hover:bg-rose-50 shadow-sm transition-all flex items-center gap-2"
          >
             {resetMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <KeyRound className="w-4 h-4" />}
             <span className="text-[10px] font-black uppercase tracking-widest">Reset Pass</span>
          </Button>

          <Button
            onClick={() => form.handleSubmit()}
            disabled={saveAllMutation.isPending}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-8 py-6 rounded-xl shadow-lg shadow-blue-500/20 transition-all hover:scale-[1.02]"
          >
            {saveAllMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
            SAVE ALL CHANGES
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

        {/* IDENTITY */}
        <Card className="border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <CardHeader className="bg-slate-50/50 border-b border-slate-100 pb-4">
            <CardTitle className="text-xs font-black uppercase tracking-[0.2em] text-blue-600 flex items-center gap-2">
              <UserIcon className="w-3 h-3" /> Identity
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4 flex-1">
            <form.Field name="name" children={(field) => (
              <div className="space-y-1">
                <Label className="text-[10px] uppercase font-bold tracking-widest text-slate-400">Full Name</Label>
                <Input {...field.state} value={field.state.value} onChange={(e) => field.handleChange(e.target.value)} className="bg-slate-50 border-slate-200 font-bold" />
              </div>
            )} />
            <div className="grid grid-cols-2 gap-4">
              <form.Field name="phoneNumber" children={(field) => (
                <div className="space-y-1">
                  <Label className="text-[10px] uppercase font-bold tracking-widest text-slate-400">Phone</Label>
                  <Input {...field.state} value={field.state.value} onChange={(e) => field.handleChange(e.target.value)} className="bg-slate-50 border-slate-200 font-mono text-sm" />
                </div>
              )} />
              <form.Field name="icNumber" children={(field) => (
                <div className="space-y-1">
                  <Label className="text-[10px] uppercase font-bold tracking-widest text-slate-400">IC Number</Label>
                  <Input {...field.state} value={field.state.value} onChange={(e) => field.handleChange(e.target.value)} className="bg-slate-50 border-slate-200 font-mono text-sm" />
                </div>
              )} />
            </div>
            <form.Field name="email" children={(field) => (
              <div className="space-y-1">
                <Label className="text-[10px] uppercase font-bold tracking-widest text-slate-400">Email Address</Label>
                <Input {...field.state} value={field.state.value} onChange={(e) => field.handleChange(e.target.value)} className="bg-slate-50 border-slate-200" />
              </div>
            )} />
            {isGlobalAdmin && (
              <form.Field name="role" children={(field) => (
                <div className="space-y-1">
                  <Label className="text-[10px] uppercase font-bold tracking-widest text-slate-400">System Role</Label>
                  <Select value={field.state.value.toString()} onValueChange={(val) => field.handleChange(parseInt(val))}>
                    <SelectTrigger className="bg-slate-50 border-slate-200 font-bold">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Super Admin</SelectItem>
                      <SelectItem value="2">Admin</SelectItem>
                      <SelectItem value="3">User</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )} />
            )}
          </CardContent>
        </Card>

        {/* DEMOGRAPHICS */}
        <Card className="border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <CardHeader className="bg-slate-50/50 border-b border-slate-100 pb-4">
            <CardTitle className="text-xs font-black uppercase tracking-[0.2em] text-blue-600 flex items-center gap-2">
              <Shield className="w-3 h-3" /> Demographics
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4 flex-1">
            <div className="grid grid-cols-2 gap-4">
              <form.Field name="profile.title" children={(field) => (
                <div className="space-y-1">
                  <Label className="text-[10px] uppercase font-bold tracking-widest text-slate-400">Title</Label>
                  <Input {...field.state} value={field.state.value} onChange={(e) => field.handleChange(e.target.value)} className="bg-slate-50 border-slate-200" />
                </div>
              )} />
              <form.Field name="positionId" children={(field) => (
                <div className="space-y-1">
                  <Label className="text-[10px] uppercase font-bold tracking-widest text-slate-400">Position (Jawatan)</Label>
                  <Select value={field.state.value || 'none'} onValueChange={(val) => field.handleChange(val === 'none' ? null : val)}>
                    <SelectTrigger className="bg-slate-50 border-slate-200 font-bold h-10">
                        <SelectValue placeholder="No Specific Position" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="none">No Specific Position</SelectItem>
                        {positions?.filter(p => {
                            if (!p.isActive) return false;
                            const userCawanganId = isGlobalAdmin ? form.getFieldValue('cawanganId') : authUser?.cawanganId;
                            if (!userCawanganId) {
                                // HQ user
                                return p.level === 1 || p.level === 3;
                            } else {
                                // Branch user
                                return p.level === 2 || p.level === 3;
                            }
                        }).map(p => (
                            <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              )} />
            </div>
            <form.Field name="profile.position" children={(field) => (
              <div className="space-y-1">
                <Label className="text-[10px] uppercase font-bold tracking-widest text-slate-400">Other / Custom Title</Label>
                <Input {...field.state} value={field.state.value} onChange={(e) => field.handleChange(e.target.value)} className="bg-slate-50 border-slate-200" placeholder="e.g. Guru Utama" />
              </div>
            )} />
            <form.Field name="profile.occupation" children={(field) => (
              <div className="space-y-1">
                <Label className="text-[10px] uppercase font-bold tracking-widest text-slate-400">Occupation</Label>
                <Input {...field.state} value={field.state.value} onChange={(e) => field.handleChange(e.target.value)} className="bg-slate-50 border-slate-200" />
              </div>
            )} />
            <form.Field name="profile.address" children={(field) => (
              <div className="space-y-1">
                <Label className="text-[10px] uppercase font-bold tracking-widest text-slate-400">Home Address</Label>
                <Input {...field.state} value={field.state.value} onChange={(e) => field.handleChange(e.target.value)} className="bg-slate-50 border-slate-200 text-sm" />
              </div>
            )} />
            {isGlobalAdmin && (
              <form.Field name="cawanganId" children={(field) => (
                <div className="space-y-1">
                  <Label className="text-[10px] uppercase font-bold tracking-widest text-slate-400">State / Branch</Label>
                  <Select value={field.state.value || 'none'} onValueChange={(val) => field.handleChange(val === 'none' ? null : val)}>
                    <SelectTrigger className="bg-slate-50 border-slate-200 font-bold">
                      <SelectValue placeholder="No Cawangan" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No Cawangan</SelectItem>
                      {cawangans?.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              )} />
            )}
          </CardContent>
        </Card>

        {/* SILAT */}
        <Card className="border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <CardHeader className="bg-slate-50/50 border-b border-slate-100 pb-4">
            <CardTitle className="text-xs font-black uppercase tracking-[0.2em] text-blue-600 flex items-center gap-2">
              <Sword className="w-3 h-3" /> Silat
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4 flex-1">
            <form.Field name="gelanggangId" children={(field) => (
              <div className="space-y-1">
                <Label className="text-[10px] uppercase font-bold tracking-widest text-slate-400">Pusat Latihan (Gelanggang)</Label>
                <Select 
                  value={field.state.value || 'none'} 
                  onValueChange={(val) => {
                    const gid = val === 'none' ? null : val;
                    field.handleChange(gid);
                    
                    // Auto-align Cawangan (Branch) when Gelanggang is changed
                    if (gid) {
                      const selectedG = gelanggangs?.find(g => g.id === gid);
                      if (selectedG?.cawangan?.id) {
                        form.setFieldValue('cawanganId', selectedG.cawangan.id);
                      }
                    }
                  }}
                >
                  <SelectTrigger className="bg-slate-50 border-slate-200 font-bold">
                    <SelectValue placeholder="Tiada (Unassigned)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Tiada (Unassigned)</SelectItem>
                    {gelanggangs?.map(g => (
                      <SelectItem key={g.id} value={g.id}>{g.name} ({g.cawangan?.name})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )} />

            <form.Field name="currentBengkungId" children={(field) => {
              const isSuperAdmin = authUser?.role === 'SuperAdmin';
              return (
                <div className="space-y-1">
                  <Label className="text-[10px] uppercase font-bold tracking-widest text-slate-400">Peringkat Bengkung (Belt Rank)</Label>
                  <Select 
                    disabled={!isSuperAdmin} 
                    value={field.state.value || 'none'} 
                    onValueChange={(val) => field.handleChange(val === 'none' ? null : val)}
                  >
                    <SelectTrigger className={cn(
                        "bg-slate-50 border-slate-200 font-bold",
                        !isSuperAdmin && "opacity-70 cursor-not-allowed border-transparent shadow-none"
                    )}>
                      <SelectValue placeholder="Tiada (Kosong)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Tiada (Kosong)</SelectItem>
                      {bengkungs?.map(b => (
                        <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {!isSuperAdmin && (
                    <p className="text-[9px] text-slate-400 italic">Determined by official Ujian results.</p>
                  )}
                </div>
              );
            }} />
            <form.Field name="profile.baiahYear" children={(field) => (
              <div className="space-y-1">
                <Label className="text-[10px] uppercase font-bold tracking-widest text-slate-400">Tahun Baiah</Label>
                <Input type="number" {...field.state} value={field.state.value || ''} onChange={(e) => field.handleChange(e.target.value ? parseInt(e.target.value) : null)} className="bg-slate-50" placeholder="YYYY" />
              </div>
            )} />
            <form.Field name="profile.mandiAdatYear" children={(field) => (
              <div className="space-y-1">
                <Label className="text-[10px] uppercase font-bold tracking-widest text-slate-400">Tahun Mandi Adat</Label>
                <Input type="number" {...field.state} value={field.state.value || ''} onChange={(e) => field.handleChange(e.target.value ? parseInt(e.target.value) : null)} className="bg-slate-50" placeholder="YYYY" />
              </div>
            )} />
            <form.Field name="profile.mandiPelangirYear" children={(field) => (
              <div className="space-y-1">
                <Label className="text-[10px] uppercase font-bold tracking-widest text-slate-400">Tahun Mandi Pelangir</Label>
                <Input type="number" {...field.state} value={field.state.value || ''} onChange={(e) => field.handleChange(e.target.value ? parseInt(e.target.value) : null)} className="bg-slate-50" placeholder="YYYY" />
              </div>
            )} />
            <form.Field name="profile.membershipCardStatus" children={(field) => (
              <div className="space-y-1 pt-2">
                <Label className="text-[10px] uppercase font-bold tracking-widest text-slate-400">Status Kad Ahli</Label>
                <Select value={field.state.value || 'none'} onValueChange={(val) => field.handleChange(val)}>
                  <SelectTrigger className="bg-slate-50 border-slate-200">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Tiada (None)</SelectItem>
                    <SelectItem value="pending">Dalam Proses (Pending)</SelectItem>
                    <SelectItem value="delivered">Telah Diterima (Delivered)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )} />
          </CardContent>
        </Card>

        {/* WARIS */}
        <Card className="border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <CardHeader className="bg-slate-50/50 border-b border-slate-100 pb-4">
            <CardTitle className="text-xs font-black uppercase tracking-[0.2em] text-rose-600 flex items-center gap-2">
              <Heart className="w-3 h-3" /> Waris (Emergency)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4 flex-1">
            <form.Field name="profile.nextOfKinName" children={(field) => (
              <div className="space-y-1">
                <Label className="text-[10px] uppercase font-bold tracking-widest text-slate-400">Name</Label>
                <Input {...field.state} value={field.state.value} onChange={(e) => field.handleChange(e.target.value)} className="bg-slate-50 font-bold" />
              </div>
            )} />
            <div className="grid grid-cols-2 gap-4">
              <form.Field name="profile.nextOfKinPhone" children={(field) => (
                <div className="space-y-1">
                  <Label className="text-[10px] uppercase font-bold tracking-widest text-slate-400">Phone</Label>
                  <Input {...field.state} value={field.state.value} onChange={(e) => field.handleChange(e.target.value)} className="bg-slate-50 border-slate-200 font-mono text-sm" />
                </div>
              )} />
              <form.Field name="profile.nextOfKinRelation" children={(field) => (
                <div className="space-y-1">
                  <Label className="text-[10px] uppercase font-bold tracking-widest text-slate-400">Relation</Label>
                  <Input {...field.state} value={field.state.value} onChange={(e) => field.handleChange(e.target.value)} className="bg-slate-50" />
                </div>
              )} />
            </div>
          </CardContent>
        </Card>

        {/* MACAT / TOURNAMENT */}
        <Card className="border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <CardHeader className="bg-slate-50/50 border-b border-slate-100 pb-4">
            <CardTitle className="text-xs font-black uppercase tracking-[0.2em] text-emerald-600 flex items-center gap-2">
              <ShieldAlert className="w-3 h-3" /> MACAT / Tournament
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4 flex-1">
            <div className="grid grid-cols-2 gap-4">
              <form.Field name="profile.weight" children={(field) => (
                <div className="space-y-1">
                  <Label className="text-[10px] uppercase font-bold tracking-widest text-slate-400">Weight (kg)</Label>
                  <Input type="number" step="0.1" {...field.state} value={field.state.value || ''} onChange={(e) => field.handleChange(e.target.value ? parseFloat(e.target.value) : null)} className="bg-slate-50 border-slate-200 font-bold" />
                </div>
              )} />
              <form.Field name="profile.height" children={(field) => (
                <div className="space-y-1">
                  <Label className="text-[10px] uppercase font-bold tracking-widest text-slate-400">Height (cm)</Label>
                  <Input type="number" step="0.1" {...field.state} value={field.state.value || ''} onChange={(e) => field.handleChange(e.target.value ? parseFloat(e.target.value) : null)} className="bg-slate-50 border-slate-200 font-bold" />
                </div>
              )} />
            </div>
            <form.Field name="profile.medicalStatus" children={(field) => (
              <div className="space-y-1">
                <Label className="text-[10px] uppercase font-bold tracking-widest text-slate-400">Medical Status</Label>
                <Select value={field.state.value} onValueChange={(val) => field.handleChange(val)}>
                  <SelectTrigger className="bg-slate-50 border-slate-200 font-bold">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Pending">Pending</SelectItem>
                    <SelectItem value="Cleared">Cleared</SelectItem>
                    <SelectItem value="Rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )} />
            <form.Field name="profile.medicalClearanceDate" children={(field) => (
              <div className="space-y-1">
                <Label className="text-[10px] uppercase font-bold tracking-widest text-slate-400">Medical Clearance Date</Label>
                <Input type="date" {...field.state} value={field.state.value} onChange={(e) => field.handleChange(e.target.value)} className="bg-slate-50 border-slate-200" />
              </div>
            )} />
          </CardContent>
        </Card>

        {/* MEMBERSHIPS (IMMEDIATE) */}
        <Card className="border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <CardHeader className="bg-slate-50/50 border-b border-slate-100 pb-4 flex flex-row items-center justify-between">
            <CardTitle className="text-xs font-black uppercase tracking-[0.2em] text-blue-600 flex items-center gap-2">
              <CreditCard className="w-3 h-3" /> Memberships
            </CardTitle>
            <Button onClick={() => setIsAddMembershipOpen(true)} variant="outline" size="sm" className="h-7 text-[10px] font-black tracking-widest bg-blue-50 border-blue-200 text-blue-600 hover:bg-blue-100 px-3">
              <Plus className="w-3 h-3 mr-1" /> ASSIGN
            </Button>
          </CardHeader>
          <CardContent className="p-0 flex-1 min-h-[160px]">
            {user?.memberships?.length > 0 ? (
              <div className="divide-y divide-slate-100">
                {user.memberships.map(m => (
                  <div key={m.id} className="p-4 flex justify-between items-center group hover:bg-slate-50 transition-colors">
                    <div>
                      <p className="font-black uppercase text-xs text-slate-800">{m.programType}</p>
                      <p className="text-[10px] font-mono text-slate-400 tracking-tighter">{m.fullMemberId}</p>
                    </div>
                    <Badge variant="outline" className="text-[8px] font-black uppercase text-slate-400 border-slate-200">
                      {new Date(m.assignedAt).getFullYear()}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-12 text-center">
                <p className="text-[10px] uppercase font-black text-slate-300 tracking-widest">No programs assigned</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* ORGANIZATION (STAGED) */}
        <Card className="border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <CardHeader className="bg-slate-50/50 border-b border-slate-100 pb-4 flex flex-row items-center justify-between">
            <CardTitle className="text-xs font-black uppercase tracking-[0.2em] text-blue-600 flex items-center gap-2">
              <Users className="w-3 h-3" /> Network
            </CardTitle>
            <Button onClick={() => setIsLinkDownlineOpen(true)} variant="outline" size="sm" className="h-7 text-[10px] font-black tracking-widest bg-slate-50 border-slate-200 text-slate-600 px-3">
              <LinkIcon className="w-3 h-3 mr-1" /> LINK DOWNLINE
            </Button>
          </CardHeader>
          <CardContent className="p-5 space-y-6 flex-1">
            {/* Upline Section */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-[10px] uppercase font-black tracking-widest text-slate-400">Introducer</Label>
                <Button onClick={() => setIsChangeUplineOpen(true)} variant="ghost" className="h-6 px-2 text-[10px] font-black text-blue-600 hover:bg-blue-50">
                  <LinkIcon className="w-3 h-3 mr-1" /> LINK INTRODUCER
                </Button>
              </div>

              {stagedUpline ? (
                <div className={cn(
                  "p-3 border rounded-lg flex items-center gap-3 transition-colors",
                  stagedUpline.id !== user?.upline?.id ? "border-orange-200 bg-orange-50/50" : "border-blue-100 bg-blue-50/30"
                )}>
                  <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-black text-[10px]">
                    {stagedUpline.name.substring(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-900 truncate">{stagedUpline.name}</p>
                    <p className="text-[10px] text-slate-400 font-mono">UPLINE</p>
                  </div>
                  <Button onClick={() => setStagedUpline(null)} variant="ghost" size="icon" className="h-8 w-8 text-slate-300 hover:text-rose-500">
                    <XCircle className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <div className="p-4 border border-dashed rounded-lg text-center bg-slate-50/30">
                  <p className="text-[10px] font-black uppercase text-slate-300 tracking-widest">No introducer linked</p>
                </div>
              )}
            </div>

            {/* Downlines Section */}
            <div className="space-y-2">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Directed Members (Downlines)</p>
              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
                {stagedDownlines.length > 0 ? (
                  stagedDownlines.map(d => (
                    <div key={d.id} className="p-3 border border-slate-100 rounded-lg flex items-center gap-3 bg-white shadow-sm group">
                      <div className="h-7 w-7 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-black text-[9px]">
                        {d.name.substring(0, 2).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-slate-700 truncate">{d.name}</p>
                      </div>
                      <Button onClick={() => handleRemoveDownline(d)} variant="ghost" size="icon" className="h-7 w-7 text-slate-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  ))
                ) : (
                  <div className="p-8 border border-dashed rounded-lg text-center">
                    <p className="text-[10px] font-black uppercase text-slate-300 tracking-widest">No directed members</p>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* --- Dialogs --- */}

      {/* Reset Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isResetConfirmOpen}
        onClose={() => setIsResetConfirmOpen(false)}
        onConfirm={() => resetMutation.mutate()}
        title="Reset Password?"
        description={`This will generate a new temporary password for ${user.name}. The user will be required to change it on their next login.`}
        isLoading={resetMutation.isPending}
        confirmText="Reset Now"
        variant="destructive"
      />
      
      {/* Password Reset Result Dialog */}
      <Dialog open={!!resetData} onOpenChange={(open) => !open && setResetData(null)}>
         <DialogContent className="sm:max-w-[400px] rounded-3xl border-slate-200 shadow-2xl">
            <div className="p-6 text-center space-y-6">
               <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto shadow-inner">
                  <KeyRound className="w-8 h-8" />
               </div>
               <div className="space-y-2">
                  <h2 className="text-xl font-black uppercase italic text-slate-900">Password Reset</h2>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Temporary credentials generated</p>
               </div>
               <Card className="bg-slate-50 border-rose-100">
                  <CardContent className="pt-6 pb-6">
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Temporary Password</p>
                     <p className="text-3xl font-mono font-black text-rose-600 tracking-tighter select-all">{resetData?.temporaryPassword}</p>
                     <p className="text-[9px] text-slate-400 mt-4 uppercase font-bold">Share this with the user immediately.</p>
                  </CardContent>
               </Card>
               <Button onClick={() => setResetData(null)} className="w-full uppercase font-black tracking-widest rounded-xl h-12 shadow-lg shadow-rose-500/10">Done</Button>
            </div>
         </DialogContent>
      </Dialog>

      {/* Add Membership Dialog */}
      <Dialog open={isAddMembershipOpen} onOpenChange={setIsAddMembershipOpen}>
        <DialogContent className="rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-black uppercase italic">Assign Membership</DialogTitle>
            <DialogDescription className="text-xs uppercase font-bold tracking-widest text-slate-400">Link this user to a formal membership program.</DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="space-y-1.5">
              <Label className="text-[10px] font-black uppercase text-slate-400">Select Program</Label>
              <Select onValueChange={(val) => assignMembershipMutation.mutate({ programId: val })}>
                <SelectTrigger className="font-bold h-11 bg-slate-50">
                  <SelectValue placeholder="Choose program..." />
                </SelectTrigger>
                <SelectContent>
                  {programs?.map(p => (
                    <SelectItem key={p.id} value={p.id}>{p.name} ({p.prefix})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Network Dialogs */}
      <Dialog open={isChangeUplineOpen} onOpenChange={setIsChangeUplineOpen}>
        <DialogContent className="rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-black uppercase italic">Change Introducer</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <UserLookup onChange={(u) => { setStagedUpline(u); setIsChangeUplineOpen(false); }} />
          </div>
        </DialogContent>

      </Dialog>

      <Dialog open={isLinkDownlineOpen} onOpenChange={setIsLinkDownlineOpen}>
        <DialogContent className="rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-black uppercase italic">Link Directed Member</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <UserLookup onChange={handleLinkDownline} />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function UserDetailSkeleton() {
  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8 space-y-8 animate-pulse">
      <div className="h-32 bg-white rounded-2xl border border-slate-200" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {[1, 2, 3, 4, 5, 6].map(i => <div key={i} className="h-48 bg-white rounded-2xl border border-slate-200" />)}
      </div>
    </div>
  );
}
