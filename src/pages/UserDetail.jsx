import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchClient } from '@/api/fetchClient';
import { useForm } from '@tanstack/react-form';
import {
  ArrowLeft, Save, User as UserIcon, Shield, Sword,
  Users, CreditCard, Heart, Loader2, Plus, Link as LinkIcon,
  Trash2, Edit3, UserCheck
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';
import { UserLookup } from '@/components/ui/user-lookup';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export default function UserDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Dialog States
  const [isAddMembershipOpen, setIsAddMembershipOpen] = useState(false);
  const [isLinkDownlineOpen, setIsLinkDownlineOpen] = useState(false);
  const [isChangeUplineOpen, setIsChangeUplineOpen] = useState(false);

  // Local Staging States (for saving all at once)
  const [stagedUpline, setStagedUpline] = useState(null);
  const [stagedDownlines, setStagedDownlines] = useState([]);
  const [removedDownlineIds, setRemovedDownlineIds] = useState(new Set());
  const [addedDownlines, setAddedDownlines] = useState([]);

  const { data: user, isLoading, error } = useQuery({
    queryKey: ['user', id],
    queryFn: () => fetchClient(`/users/${id}`),
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
              <form.Field name="profile.position" children={(field) => (
                <div className="space-y-1">
                  <Label className="text-[10px] uppercase font-bold tracking-widest text-slate-400">Position</Label>
                  <Input {...field.state} value={field.state.value} onChange={(e) => field.handleChange(e.target.value)} className="bg-slate-50 border-slate-200 font-bold" />
                </div>
              )} />
            </div>
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
            <form.Field name="profile.bengkung" children={(field) => (
              <div className="space-y-1">
                <Label className="text-[10px] uppercase font-bold tracking-widest text-slate-400">Peringkat Bengkung</Label>
                <Input {...field.state} value={field.state.value} onChange={(e) => field.handleChange(e.target.value)} className="bg-slate-50 border-slate-200 font-bold" />
              </div>
            )} />
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
                  <Input {...field.state} value={field.state.value} onChange={(e) => field.handleChange(e.target.value)} className="bg-slate-50 font-mono" />
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
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-xs uppercase truncate text-slate-800">{stagedUpline.name}</p>
                    <p className="text-[10px] font-mono text-slate-400 text-blue-600 font-bold">Introducer</p>
                  </div>
                  {stagedUpline.id !== user?.upline?.id && <Badge variant="outline" className="text-[8px] bg-white text-orange-600 border-orange-200">PENDING</Badge>}
                </div>
              ) : (
                <div className="p-3 border border-dashed border-slate-200 rounded-lg text-center">
                  <p className="text-[10px] text-slate-400 uppercase font-bold italic">No Introducer Assigned</p>
                </div>
              )}
            </div>

            {/* Downlines Section */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <Label className="text-[10px] uppercase font-black tracking-widest text-slate-400">Anak Murid (Direct Downlines)</Label>
                <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">{stagedDownlines.length}</span>
              </div>
              <div className="space-y-1 max-h-64 overflow-y-auto pr-1">
                {stagedDownlines.length > 0 ? (
                  stagedDownlines.map(d => (
                    <div key={d.id} className={cn(
                      "p-2.5 rounded-lg border flex justify-between items-center group transition-all",
                      addedDownlines.some(ad => ad.id === d.id) ? "border-emerald-100 bg-emerald-50/30" : "border-slate-100 bg-white"
                    )}>
                      <div className="min-w-0">
                        <p className="font-bold text-[10px] uppercase text-slate-700 truncate">{d.name}</p>
                        <p className="text-[9px] font-mono text-slate-400">{d.phoneNumber}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {addedDownlines.some(ad => ad.id === d.id) && <Badge className="text-[7px] bg-emerald-500 text-white border-none h-4 px-1">NEW</Badge>}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveDownline(d)}
                          className="h-6 w-6 text-slate-200 hover:text-red-500 hover:bg-red-50 rounded-full"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-[9px] text-center py-8 text-slate-300 uppercase font-black tracking-widest">No direct downlines.</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* DIALOG: LINK INTRODUCER (LOCAL STAGE) */}
      <Dialog open={isChangeUplineOpen} onOpenChange={setIsChangeUplineOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="uppercase font-black tracking-widest flex items-center gap-2">
              <LinkIcon className="w-5 h-5 text-blue-600" /> Link Introducer
            </DialogTitle>
            <DialogDescription>Search for an existing user to set as the introducer.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-6">

            label="Search User"            <UserLookup
              excludeId={id}
              onChange={(uid, userData) => {
                if (userData) {
                  setStagedUpline(userData);
                  setIsChangeUplineOpen(false);
                }
              }}
              placeholder="Search by Name, IC or Phone..."
              className="bg-slate-50"
            />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsChangeUplineOpen(false)}>CANCEL</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DIALOG: LINK ANAK MURID (LOCAL STAGE) */}
      <Dialog open={isLinkDownlineOpen} onOpenChange={setIsLinkDownlineOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="uppercase font-black tracking-widest flex items-center gap-2">
              <LinkIcon className="w-5 h-5 text-slate-600" /> Link Anak Murid (Downline)
            </DialogTitle>
            <DialogDescription>Search for an existing user to move into this hierarchy.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-6">
            <UserLookup
              label="Search User"
              excludeId={id}
              onChange={(uid, userData) => handleLinkDownline(userData)}
              placeholder="Search by Name, IC or Phone..."
              className="bg-slate-50"
            />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsLinkDownlineOpen(false)}>CANCEL</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* DIALOG: ASSIGN MEMBERSHIP (IMMEDIATE) */}
      <Dialog open={isAddMembershipOpen} onOpenChange={setIsAddMembershipOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="uppercase font-black tracking-widest flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-blue-600" /> Assign Membership
            </DialogTitle>
            <DialogDescription>Generate a new Membership ID for this user immediately.</DialogDescription>
          </DialogHeader>
          <form onSubmit={(e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            assignMembershipMutation.mutate({
              programType: formData.get('programType'),
              manualSequence: formData.get('manualSequence') ? parseInt(formData.get('manualSequence')) : null
            });
          }} className="space-y-4 py-4">
            <div className="space-y-1">
              <Label className="text-[10px] uppercase font-black tracking-widest">Select Program</Label>
              <Select name="programType" required>
                <SelectTrigger className="bg-slate-50">
                  <SelectValue placeholder="Select Program..." />
                </SelectTrigger>
                <SelectContent>
                  {programs?.map(p => <SelectItem key={p.name} value={p.name}>{p.name} ({p.prefix})</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] uppercase font-black tracking-widest">Manual Sequence (Optional)</Label>
              <Input name="manualSequence" type="number" placeholder="Automatic if empty" className="bg-slate-50" />
            </div>
            <DialogFooter className="pt-6">
              <Button type="button" variant="ghost" onClick={() => setIsAddMembershipOpen(false)}>CANCEL</Button>
              <Button type="submit" disabled={assignMembershipMutation.isPending} className="bg-blue-600 hover:bg-blue-700 font-bold px-8">
                {assignMembershipMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "CONFIRM"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

    </div>
  );
}

function UserDetailSkeleton() {
  return (
    <div className="max-w-6xl mx-auto p-8 space-y-8 animate-pulse bg-slate-50/50">
      <div className="h-24 bg-white rounded-2xl border border-slate-200" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {[1, 2, 3, 4, 5, 6].map(i => <div key={i} className="h-48 bg-white rounded-2xl border border-slate-200" />)}
      </div>
    </div>
  );
}
