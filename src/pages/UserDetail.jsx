import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchClient } from '@/api/fetchClient';
import { useForm } from '@tanstack/react-form';
import { 
  ArrowLeft, Save, User as UserIcon, Shield, Sword, 
  Users, CreditCard, AlertCircle, Loader2, CheckCircle2 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';
import { UserLookup } from '@/components/ui/user-lookup';
import { cn } from '@/lib/utils';

export default function UserDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeSection, setActiveSection] = useState('core');

  const { data: user, isLoading, error } = useQuery({
    queryKey: ['user', id],
    queryFn: () => fetchClient(`/users/${id}`),
  });

  const updateMutation = useMutation({
    mutationFn: (data) => fetchClient(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    }),
    onSuccess: () => {
      toast.success("User updated successfully");
      queryClient.invalidateQueries({ queryKey: ['user', id] });
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (err) => toast.error(err.message || "Failed to update user")
  });

  const form = useForm({
    defaultValues: {
      name: user?.name || '',
      phoneNumber: user?.phoneNumber || '',
      icNumber: user?.icNumber || '',
      email: user?.email || '',
      role: user?.role === 'SuperAdmin' ? 1 : user?.role === 'Admin' ? 2 : 3,
      uplineId: user?.uplineId || null,
      cawanganId: user?.cawanganId || null,
      profile: {
        title: user?.profile?.title || '',
        occupation: user?.profile?.occupation || '',
        address: user?.profile?.address || '',
        position: user?.profile?.position || '',
        beltRank: user?.profile?.beltRank || '',
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
      updateMutation.mutate(value);
    },
  });

  // Re-sync form when user data is loaded
  React.useEffect(() => {
    if (user) {
      form.reset({
        name: user.name,
        phoneNumber: user.phoneNumber,
        icNumber: user.icNumber,
        email: user.email || '',
        role: user.role === 'SuperAdmin' ? 1 : user.role === 'Admin' ? 2 : 3,
        uplineId: user.uplineId || null,
        cawanganId: user.cawanganId || null,
        profile: {
          title: user.profile?.title || '',
          occupation: user.profile?.occupation || '',
          address: user.profile?.address || '',
          position: user.profile?.position || '',
          beltRank: user.profile?.beltRank || '',
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

  if (isLoading) return <UserDetailSkeleton />;
  if (error) return <div className="p-8 text-center text-red-500">Error: {error.message}</div>;

  const sections = [
    { id: 'core', label: 'Core Identity', icon: UserIcon },
    { id: 'profile', label: 'Demographics', icon: Shield },
    { id: 'silat', label: 'Silat History', icon: Sword },
    { id: 'emergency', label: 'Emergency Contact', icon: AlertCircle },
    { id: 'memberships', label: 'Memberships', icon: CreditCard },
    { id: 'downlines', label: 'Organization (Downlines)', icon: Users },
  ];

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/admin/users')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-black tracking-tight text-foreground uppercase">{user.name}</h1>
            <p className="text-muted-foreground font-mono text-sm tracking-widest">{user.icNumber} • {user.role}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            onClick={() => form.handleSubmit()} 
            disabled={updateMutation.isPending}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-6"
          >
            {updateMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
            SAVE CHANGES
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Navigation Sidebar */}
        <div className="lg:col-span-1 space-y-1">
          {sections.map(section => (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all uppercase tracking-wider",
                activeSection === section.id 
                  ? "bg-blue-600/10 text-blue-600 border-l-4 border-blue-600 pl-3" 
                  : "text-muted-foreground hover:bg-muted"
              )}
            >
              <section.icon className="w-4 h-4" />
              {section.label}
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="lg:col-span-3 space-y-6">
          {activeSection === 'core' && (
              <Card className="border-border/40 shadow-xl shadow-blue-500/5">
                <CardHeader>
                  <CardTitle className="text-lg font-black uppercase tracking-widest text-blue-600">Core Identity</CardTitle>
                  <CardDescription>Basic authentication and contact details.</CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <form.Field name="name" children={(field) => (
                    <div className="space-y-2">
                      <Label className="text-[10px] uppercase font-black tracking-widest opacity-60">Full Name</Label>
                      <Input {...field.state} value={field.state.value} onChange={(e) => field.handleChange(e.target.value)} className="bg-muted/30 border-border font-bold" />
                    </div>
                  )} />
                  <form.Field name="phoneNumber" children={(field) => (
                    <div className="space-y-2">
                      <Label className="text-[10px] uppercase font-black tracking-widest opacity-60">Phone Number</Label>
                      <Input {...field.state} value={field.state.value} onChange={(e) => field.handleChange(e.target.value)} className="bg-muted/30 border-border font-mono" />
                    </div>
                  )} />
                  <form.Field name="icNumber" children={(field) => (
                    <div className="space-y-2">
                      <Label className="text-[10px] uppercase font-black tracking-widest opacity-60">IC Number</Label>
                      <Input {...field.state} value={field.state.value} onChange={(e) => field.handleChange(e.target.value)} className="bg-muted/30 border-border font-mono" />
                    </div>
                  )} />
                  <form.Field name="email" children={(field) => (
                    <div className="space-y-2">
                      <Label className="text-[10px] uppercase font-black tracking-widest opacity-60">Email Address</Label>
                      <Input {...field.state} value={field.state.value} onChange={(e) => field.handleChange(e.target.value)} className="bg-muted/30 border-border" />
                    </div>
                  )} />
                </CardContent>
              </Card>
            )}

            {activeSection === 'profile' && (
              <Card className="border-border/40 shadow-xl shadow-blue-500/5">
                <CardHeader>
                  <CardTitle className="text-lg font-black uppercase tracking-widest text-blue-600">Demographics</CardTitle>
                  <CardDescription>Personal background and address.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-2 gap-6">
                    <form.Field name="profile.title" children={(field) => (
                      <div className="space-y-2">
                        <Label className="text-[10px] uppercase font-black tracking-widest opacity-60">Title (Gelaran)</Label>
                        <Input {...field.state} value={field.state.value} onChange={(e) => field.handleChange(e.target.value)} className="bg-muted/30 border-border" />
                      </div>
                    )} />
                    <form.Field name="profile.occupation" children={(field) => (
                      <div className="space-y-2">
                        <Label className="text-[10px] uppercase font-black tracking-widest opacity-60">Occupation</Label>
                        <Input {...field.state} value={field.state.value} onChange={(e) => field.handleChange(e.target.value)} className="bg-muted/30 border-border" />
                      </div>
                    )} />
                  </div>
                  <form.Field name="profile.address" children={(field) => (
                    <div className="space-y-2">
                      <Label className="text-[10px] uppercase font-black tracking-widest opacity-60">Home Address</Label>
                      <Input {...field.state} value={field.state.value} onChange={(e) => field.handleChange(e.target.value)} className="bg-muted/30 border-border" />
                    </div>
                  )} />
                </CardContent>
              </Card>
            )}

            {activeSection === 'silat' && (
              <Card className="border-border/40 shadow-xl shadow-blue-500/5">
                <CardHeader>
                  <CardTitle className="text-lg font-black uppercase tracking-widest text-blue-600">Silat History</CardTitle>
                  <CardDescription>Ranks and ritual milestones.</CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <form.Field name="profile.position" children={(field) => (
                    <div className="space-y-2">
                      <Label className="text-[10px] uppercase font-black tracking-widest opacity-60">Organizational Position</Label>
                      <Input {...field.state} value={field.state.value} onChange={(e) => field.handleChange(e.target.value)} className="bg-muted/30 border-border" />
                    </div>
                  )} />
                  <form.Field name="profile.beltRank" children={(field) => (
                    <div className="space-y-2">
                      <Label className="text-[10px] uppercase font-black tracking-widest opacity-60">Belt / Rank</Label>
                      <Input {...field.state} value={field.state.value} onChange={(e) => field.handleChange(e.target.value)} className="bg-muted/30 border-border" />
                    </div>
                  )} />
                  <form.Field name="profile.baiahYear" children={(field) => (
                    <div className="space-y-2">
                      <Label className="text-[10px] uppercase font-black tracking-widest opacity-60">Bai'ah Year</Label>
                      <Input type="number" {...field.state} value={field.state.value || ''} onChange={(e) => field.handleChange(e.target.value ? parseInt(e.target.value) : null)} className="bg-muted/30 border-border" />
                    </div>
                  )} />
                  <form.Field name="profile.mandiAdatYear" children={(field) => (
                    <div className="space-y-2">
                      <Label className="text-[10px] uppercase font-black tracking-widest opacity-60">Mandi Adat Year</Label>
                      <Input type="number" {...field.state} value={field.state.value || ''} onChange={(e) => field.handleChange(e.target.value ? parseInt(e.target.value) : null)} className="bg-muted/30 border-border" />
                    </div>
                  )} />
                  <form.Field name="profile.mandiPelangirYear" children={(field) => (
                    <div className="space-y-2">
                      <Label className="text-[10px] uppercase font-black tracking-widest opacity-60">Mandi Pelangir Year</Label>
                      <Input type="number" {...field.state} value={field.state.value || ''} onChange={(e) => field.handleChange(e.target.value ? parseInt(e.target.value) : null)} className="bg-muted/30 border-border" />
                    </div>
                  )} />
                </CardContent>
              </Card>
            )}

            {activeSection === 'emergency' && (
              <Card className="border-border/40 shadow-xl shadow-blue-500/5">
                <CardHeader>
                  <CardTitle className="text-lg font-black uppercase tracking-widest text-blue-600">Emergency Contact</CardTitle>
                  <CardDescription>Next of kin information.</CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <form.Field name="profile.nextOfKinName" children={(field) => (
                    <div className="space-y-2">
                      <Label className="text-[10px] uppercase font-black tracking-widest opacity-60">Waris Name</Label>
                      <Input {...field.state} value={field.state.value} onChange={(e) => field.handleChange(e.target.value)} className="bg-muted/30 border-border" />
                    </div>
                  )} />
                  <form.Field name="profile.nextOfKinPhone" children={(field) => (
                    <div className="space-y-2">
                      <Label className="text-[10px] uppercase font-black tracking-widest opacity-60">Waris Phone</Label>
                      <Input {...field.state} value={field.state.value} onChange={(e) => field.handleChange(e.target.value)} className="bg-muted/30 border-border" />
                    </div>
                  )} />
                </CardContent>
              </Card>
            )}

            {activeSection === 'memberships' && <MembershipSection userId={id} />}
            {activeSection === 'downlines' && <DownlineSection userId={id} />}
        </div>
      </div>
    </div>
  );
}

function MembershipSection({ userId }) {
  const { data: user } = useQuery({
    queryKey: ['user', userId],
    queryFn: () => fetchClient(`/users/${userId}`),
  });

  return (
    <Card className="border-border/40 shadow-xl">
      <CardHeader>
        <CardTitle className="text-lg font-black uppercase tracking-widest text-blue-600">Active Memberships</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {user?.memberships?.length > 0 ? (
          user.memberships.map(m => (
            <div key={m.id} className="p-4 rounded-xl border border-border/60 bg-muted/20 flex justify-between items-center">
              <div>
                <p className="font-black uppercase text-sm">{m.programType}</p>
                <p className="text-xs font-mono text-muted-foreground">{m.fullMemberId}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] uppercase text-muted-foreground font-black tracking-tighter">Joined</p>
                <p className="text-xs font-bold">{new Date(m.assignedAt).toLocaleDateString()}</p>
              </div>
            </div>
          ))
        ) : (
          <p className="text-center py-8 text-muted-foreground text-sm">No memberships assigned.</p>
        )}
      </CardContent>
    </Card>
  );
}

function DownlineSection({ userId }) {
  const { data: downlines, isLoading } = useQuery({
    queryKey: ['user-downlines', userId],
    queryFn: () => fetchClient(`/users/${userId}/downlines`),
  });

  if (isLoading) return <Loader2 className="animate-spin mx-auto my-8" />;

  return (
    <Card className="border-border/40 shadow-xl">
      <CardHeader>
        <CardTitle className="text-lg font-black uppercase tracking-widest text-blue-600">Downlines</CardTitle>
        <CardDescription>Direct and indirect students in the hierarchy.</CardDescription>
      </CardHeader>
      <CardContent>
        {downlines?.length > 0 ? (
          <div className="space-y-2">
            {downlines.map(d => (
              <div key={d.id} className="p-3 rounded-lg hover:bg-muted/50 transition-colors border-l-2 border-blue-600 flex justify-between items-center">
                <span className="font-bold text-sm uppercase">{d.name}</span>
                <span className="text-xs font-mono opacity-60">{d.phoneNumber}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center py-8 text-muted-foreground text-sm">No downlines found.</p>
        )}
      </CardContent>
    </Card>
  );
}

function UserDetailSkeleton() {
  return (
    <div className="max-w-6xl mx-auto p-8 space-y-8 animate-pulse">
      <div className="flex justify-between items-center">
        <div className="flex gap-4">
          <Skeleton className="w-10 h-10 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="w-48 h-8" />
            <Skeleton className="w-32 h-4" />
          </div>
        </div>
        <Skeleton className="w-32 h-10" />
      </div>
      <div className="grid grid-cols-4 gap-8">
        <div className="space-y-2">
          {[1,2,3,4,5].map(i => <Skeleton key={i} className="w-full h-12" />)}
        </div>
        <div className="col-span-3">
          <Skeleton className="w-full h-96" />
        </div>
      </div>
    </div>
  );
}
