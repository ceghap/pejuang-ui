import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from '@tanstack/react-form';
import { 
  Building2, ArrowLeft, Save, Loader2, MapPin, 
  Phone, UserRound, ShieldCheck, Users, Info,
  CheckCircle2, Pencil, Plus, Search, Trash2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { fetchClient } from '@/api/fetchClient';
import { toast } from 'sonner';
import { UserLookup } from '@/components/ui/user-lookup';
import { cn } from '@/lib/utils';

export default function CawanganDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('committee');
  const [memberSearch, setMemberSearch] = useState('');

  const { data: cawangan, isLoading, error } = useQuery({
    queryKey: ['cawangan-detail', id],
    queryFn: () => fetchClient(`/cawangan/${id}`),
    enabled: !!id
  });

  const { data: membersData, isLoading: isLoadingMembers } = useQuery({
    queryKey: ['cawangan-members', id, memberSearch],
    queryFn: () => fetchClient(`/users?cawanganId=${id}&limit=50&search=${memberSearch}`),
    enabled: activeTab === 'members'
  });

  const { data: positions } = useQuery({
    queryKey: ['positions'],
    queryFn: () => fetchClient('/positions'),
  });

  const updateMutation = useMutation({
    mutationFn: (data) => fetchClient(`/cawangan/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries(['cawangan-detail', id]);
      queryClient.invalidateQueries(['cawangans']);
      toast.success('Branch details updated successfully');
    },
    onError: (error) => toast.error(error.message)
  });

  const appointMutation = useMutation({
    mutationFn: ({ userId, positionId }) => fetchClient(`/cawangan/${id}/committee`, {
      method: 'POST',
      body: JSON.stringify({ userId, positionId })
    }),
    onSuccess: (res) => {
      toast.success(res.message);
      queryClient.invalidateQueries(['cawangan-detail', id]);
      queryClient.invalidateQueries(['cawangan-members', id]);
    },
    onError: (error) => toast.error(error.message)
  });

  const addMemberMutation = useMutation({
    mutationFn: (userId) => fetchClient(`/cawangan/${id}/members`, {
      method: 'POST',
      body: JSON.stringify({ userId })
    }),
    onSuccess: (res) => {
      toast.success(res.message);
      queryClient.invalidateQueries(['cawangan-members', id]);
      queryClient.invalidateQueries(['cawangan-detail', id]);
    },
    onError: (error) => toast.error(error.message)
  });

  const unassignCommitteeMutation = useMutation({
    mutationFn: (positionId) => fetchClient(`/cawangan/${id}/committee/${positionId}`, {
      method: 'DELETE'
    }),
    onSuccess: (res) => {
      toast.success(res.message);
      queryClient.invalidateQueries(['cawangan-detail', id]);
      queryClient.invalidateQueries(['cawangan-members', id]);
    },
    onError: (error) => toast.error(error.message)
  });

  const removeMemberMutation = useMutation({
    mutationFn: (userId) => fetchClient(`/cawangan/${id}/members/${userId}`, {
      method: 'DELETE'
    }),
    onSuccess: (res) => {
      toast.success(res.message);
      queryClient.invalidateQueries(['cawangan-members', id]);
      queryClient.invalidateQueries(['cawangan-detail', id]);
    },
    onError: (error) => toast.error(error.message)
  });

  const form = useForm({
    defaultValues: {
      name: cawangan?.name || '',
      code: cawangan?.code || '',
      location: cawangan?.location || '',
      address: cawangan?.address || '',
      contactNumber: cawangan?.contactNumber || '',
      picId: cawangan?.picId || null
    },
    onSubmit: async ({ value }) => {
      updateMutation.mutate(value);
    },
  });

  // Re-sync form when data loads
  useState(() => {
    if (cawangan) {
        form.reset({
            name: cawangan.name,
            code: cawangan.code || '',
            location: cawangan.location || '',
            address: cawangan.address || '',
            contactNumber: cawangan.contactNumber || '',
            picId: cawangan.picId || null
        });
    }
  }, [cawangan]);

  const branchPositions = useMemo(() => {
    console.log("Raw positions from API:", positions);
    return positions?.filter(p => {
        const lvl = p.level || p.Level;
        // ONLY show Level 2 (Cawangan) administrative roles here.
        // Level 3 (All/Technical) like Jurulatih should be managed at the Gelanggang level.
        return lvl === 2 || lvl === "Cawangan";
    }) || [];
  }, [positions]);

  if (isLoading) return <div className="p-12 flex justify-center"><Loader2 className="animate-spin text-blue-500" /></div>;
  if (error) return <div className="p-8 text-center text-rose-500 font-bold">Error: {error.message}</div>;

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8 space-y-8 bg-slate-50/50 min-h-screen pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => navigate('/admin/cawangan')} className="rounded-full h-10 w-10">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black tracking-tight text-slate-900 uppercase leading-none">{cawangan.name}</h1>
                {cawangan.code && (
                    <Badge className="bg-blue-600 font-mono">{cawangan.code}</Badge>
                )}
            </div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2 flex items-center gap-1">
                <MapPin className="w-3 h-3" /> {cawangan.location}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {form.state.isDirty && (
            <p className="text-[10px] font-bold text-orange-600 uppercase tracking-widest animate-pulse mr-2">Unsaved Changes</p>
          )}
          <Button
            onClick={() => form.handleSubmit()}
            disabled={updateMutation.isLoading}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-8 py-6 rounded-xl shadow-lg shadow-blue-500/20 transition-all hover:scale-[1.02]"
          >
            {updateMutation.isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
            SAVE BRANCH INFO
          </Button>
        </div>
      </div>

      <div className="flex gap-4 border-b border-slate-200 overflow-x-auto pb-1 no-scrollbar">
        {[
          { id: 'committee', label: 'Committee Management', icon: ShieldCheck },
          { id: 'members', label: 'Branch Members', icon: Users },
          { id: 'details', label: 'Branch Settings', icon: Info },
        ].map(tab => (
          <button
            key={tab.id}
            className={cn(
                "pb-3 px-2 text-[10px] font-black uppercase tracking-widest transition-all border-b-2 flex items-center gap-2",
                activeTab === tab.id 
                    ? 'border-blue-600 text-blue-600' 
                    : 'border-transparent text-slate-400 hover:text-slate-600'
            )}
            onClick={() => setActiveTab(tab.id)}
          >
            <tab.icon className="w-3.5 h-3.5" />
            {tab.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content Area */}
        <div className="lg:col-span-2 space-y-8">
            {activeTab === 'members' && (
                <div className="space-y-6">
                    <Card className="border-slate-200 shadow-sm overflow-hidden bg-white">
                        <CardHeader className="bg-slate-50/50 border-b border-slate-100 pb-4">
                            <CardTitle className="text-xs font-black uppercase tracking-[0.2em] text-blue-600 flex items-center gap-2">
                                <Plus className="w-3 h-3" /> Add Member to Branch
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6">
                            <div className="flex flex-col sm:flex-row items-end gap-4">
                                <div className="flex-1 w-full">
                                    <UserLookup 
                                        label="Search System User"
                                        placeholder="Find user to move into this branch..."
                                        onChange={(userId) => {
                                            if (userId) addMemberMutation.mutate(userId);
                                        }}
                                    />
                                </div>
                                <p className="text-[9px] text-slate-400 italic mb-2">Note: This will transfer the user from their current branch to {cawangan.name}.</p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-slate-200 shadow-sm overflow-hidden">
                        <CardHeader className="bg-white border-b border-slate-100 pb-4 flex flex-row items-center justify-between">
                            <div>
                                <CardTitle className="text-sm font-black uppercase tracking-tight text-slate-900">Current Members</CardTitle>
                                <CardDescription className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mt-1">
                                    Showing up to 50 members in this branch
                                </CardDescription>
                            </div>
                            <div className="relative w-full sm:w-64">
                                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                                <Input
                                    type="text"
                                    placeholder="Filter by name, phone..."
                                    className="pl-8 bg-slate-50 border-slate-200 h-9 text-xs"
                                    value={memberSearch}
                                    onChange={(e) => setMemberSearch(e.target.value)}
                                />
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            {isLoadingMembers ? (
                                <div className="py-12 flex justify-center"><Loader2 className="animate-spin text-muted-foreground" /></div>
                            ) : membersData?.data?.length > 0 ? (
                                <Table>
                                    <TableHeader className="bg-slate-50/50">
                                        <TableRow className="hover:bg-transparent">
                                            <TableHead className="h-9 text-[9px] font-black uppercase tracking-widest px-6">Member Name</TableHead>
                                            <TableHead className="h-9 text-[9px] font-black uppercase tracking-widest px-4">Contact / IC</TableHead>
                                            <TableHead className="h-9 text-[9px] font-black uppercase tracking-widest text-right px-6">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {membersData.data.map(m => (
                                            <TableRow key={m.id} className="group hover:bg-slate-50/50">
                                                <TableCell className="px-6 py-4">
                                                    <p className="text-sm font-bold text-slate-900">{m.name}</p>
                                                    <p className="text-[9px] font-bold text-blue-600 uppercase tracking-tighter">{m.positionName || 'Regular Member'}</p>
                                                </TableCell>
                                                <TableCell className="px-4 py-4">
                                                    <p className="text-xs font-mono text-slate-600">{m.phoneNumber}</p>
                                                    <p className="text-[10px] font-mono text-slate-400">{m.icNumber}</p>
                                                </TableCell>
                                                <TableCell className="px-6 py-4 text-right">
                                                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-all">
                                                        <Button 
                                                            variant="ghost" 
                                                            size="sm" 
                                                            className="h-8 w-8 p-0 text-slate-300 hover:text-blue-600 hover:bg-blue-50"
                                                            onClick={() => navigate(`/admin/users/${m.id}`)}
                                                            title="Edit User"
                                                        >
                                                            <Pencil className="h-3.5 w-3.5" />
                                                        </Button>
                                                        <Button 
                                                            variant="ghost" 
                                                            size="sm" 
                                                            className="h-8 w-8 p-0 text-slate-300 hover:text-rose-600 hover:bg-rose-50"
                                                            onClick={() => {
                                                                if(confirm(`Remove ${m.name} from this branch? They will be moved to HQ.`)) {
                                                                    removeMemberMutation.mutate(m.id);
                                                                }
                                                            }}
                                                            title="Remove from Branch"
                                                        >
                                                            <Trash2 className="h-3.5 w-3.5" />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            ) : (
                                <div className="p-20 text-center text-slate-300">
                                    <Users className="w-12 h-12 mx-auto mb-4 opacity-10" />
                                    <p className="text-xs font-bold uppercase tracking-widest">No members found</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            )}

            {activeTab === 'committee' && (
                <div className="grid gap-4">
                    {branchPositions.length > 0 ? (
                        branchPositions.sort((a, b) => (a.sortOrder || a.SortOrder) - (b.sortOrder || b.SortOrder)).map(pos => {
                            const currentPosId = pos.id || pos.Id;
                            const incumbent = cawangan.committee?.find(c => (c.positionId || c.PositionId) === currentPosId);
                            
                            return (
                                <Card key={currentPosId} className="border-slate-200 shadow-sm overflow-hidden">
                                    <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                        <div className="flex items-center gap-4">
                                            <div className={cn(
                                                "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm",
                                                incumbent ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-400"
                                            )}>
                                                {incumbent ? <ShieldCheck className="w-5 h-5" /> : <UserRound className="w-5 h-5" />}
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <p className="text-sm font-black text-slate-900 uppercase tracking-tight">{pos.name || pos.Name}</p>
                                                    {(pos.isBranchAdmin || pos.IsBranchAdmin) && (
                                                        <Badge variant="outline" className="text-[8px] uppercase font-black bg-blue-50 text-blue-700 border-blue-100 px-1.5 py-0">
                                                            Admin
                                                        </Badge>
                                                    )}
                                                </div>
                                                {incumbent ? (
                                                    <div className="flex items-center gap-2 mt-0.5">
                                                        <p className="text-xs font-bold text-blue-600">{incumbent.name}</p>
                                                        <button 
                                                            onClick={() => unassignCommitteeMutation.mutate(currentPosId)}
                                                            className="text-[8px] font-black text-rose-500 hover:text-rose-700 uppercase tracking-tighter"
                                                        >
                                                            [REMOVE]
                                                        </button>
                                                    </div>
                                                ) : (                                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5 italic">Vacant</p>
                                                )}
                                            </div>
                                        </div>

                                        <div className="w-full sm:w-64">
                                            <UserLookup 
                                                placeholder={`Appoint ${pos.name || pos.Name}...`}
                                                onChange={(userId) => {
                                                    if (userId) appointMutation.mutate({ userId, positionId: currentPosId });
                                                }}
                                                className="bg-white border-slate-200 h-9 text-xs"
                                            />
                                        </div>                                    </CardContent>
                                </Card>
                            )
                        })
                    ) : (
                        <Card className="border-dashed border-slate-200 bg-slate-50/50">
                            <CardContent className="p-12 text-center space-y-3">
                                <ShieldCheck className="w-12 h-12 mx-auto text-slate-200" />
                                <div className="space-y-1">
                                    <p className="text-sm font-bold text-slate-900 uppercase tracking-tight">No Branch Roles Defined</p>
                                    <p className="text-[10px] font-medium text-slate-500 max-w-[200px] mx-auto uppercase leading-relaxed">
                                        Please go to <span className="text-blue-600 cursor-pointer hover:underline" onClick={() => navigate('/admin/positions')}>Position Management</span> to set positions to Level 2 (Branch).
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>
            )}

            {activeTab === 'details' && (
                <Card className="border-slate-200 shadow-sm">
                    <CardHeader className="bg-slate-50/50 border-b border-slate-100 pb-4">
                        <CardTitle className="text-xs font-black uppercase tracking-[0.2em] text-blue-600 flex items-center gap-2">
                            <Building2 className="w-3 h-3" /> Branch Configuration
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                        <form className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <form.Field name="name" children={(field) => (
                                    <div className="space-y-2">
                                        <Label className="text-[10px] uppercase font-bold tracking-widest text-slate-400">Branch Name</Label>
                                        <Input value={field.state.value} onChange={(e) => field.handleChange(e.target.value)} className="bg-slate-50 font-bold" />
                                    </div>
                                )} />
                                <form.Field name="code" children={(field) => (
                                    <div className="space-y-2">
                                        <Label className="text-[10px] uppercase font-bold tracking-widest text-slate-400">State Code</Label>
                                        <Input value={field.state.value} onChange={(e) => field.handleChange(e.target.value.toUpperCase().slice(0,4))} className="bg-slate-50 font-mono" />
                                    </div>
                                )} />
                                <form.Field name="location" children={(field) => (
                                    <div className="space-y-2">
                                        <Label className="text-[10px] uppercase font-bold tracking-widest text-slate-400">Region / Territory</Label>
                                        <Input value={field.state.value} onChange={(e) => field.handleChange(e.target.value)} className="bg-slate-50" />
                                    </div>
                                )} />
                                <form.Field name="contactNumber" children={(field) => (
                                    <div className="space-y-2">
                                        <Label className="text-[10px] uppercase font-bold tracking-widest text-slate-400">Main Contact</Label>
                                        <Input value={field.state.value} onChange={(e) => field.handleChange(e.target.value)} className="bg-slate-50 font-mono" />
                                    </div>
                                )} />
                            </div>
                            <form.Field name="address" children={(field) => (
                                <div className="space-y-2">
                                    <Label className="text-[10px] uppercase font-bold tracking-widest text-slate-400">Office Address</Label>
                                    <Textarea value={field.state.value} onChange={(e) => field.handleChange(e.target.value)} className="bg-slate-50" rows={3} />
                                </div>
                            )} />
                            <form.Field name="picId" children={(field) => (
                                <div className="space-y-2">
                                    <UserLookup 
                                        label="Person In Charge (PIC)"
                                        value={field.state.value}
                                        initialData={cawangan.picName ? { name: cawangan.picName } : null}
                                        onChange={(val) => field.handleChange(val)}
                                    />
                                </div>
                            )} />
                        </form>
                    </CardContent>
                </Card>
            )}
        </div>

        {/* Sidebar Info */}
        <div className="space-y-6">
            <Card className="border-slate-200 shadow-sm bg-slate-900 text-white overflow-hidden">
                <CardHeader className="pb-2">
                    <CardTitle className="text-[10px] font-black uppercase tracking-widest text-slate-400">Branch Insights</CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                                <Users className="w-5 h-5 text-blue-400" />
                            </div>
                            <div>
                                <p className="text-2xl font-black">{cawangan.userCount || 0}</p>
                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Total Members</p>
                            </div>
                        </div>
                    </div>

                    <div className="pt-4 border-t border-white/10 space-y-3">
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold text-slate-500 uppercase">Commitee Filled</span>
                            <span className="text-xs font-mono font-bold text-emerald-400">
                                {cawangan.committee?.length || 0} / {branchPositions.length}
                            </span>
                        </div>
                        <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
                            <div 
                                className="bg-emerald-500 h-full transition-all duration-1000" 
                                style={{ width: `${(cawangan.committee?.length / branchPositions.length) * 100 || 0}%` }}
                            />
                        </div>
                    </div>
                    
                    <Button 
                        variant="secondary" 
                        className="w-full bg-white/5 border-white/10 hover:bg-white/10 text-white font-bold text-[10px] uppercase tracking-widest h-10 mt-4"
                        onClick={() => navigate(`/admin/users?cawanganId=${id}`)}
                    >
                        View Members List
                    </Button>
                </CardContent>
            </Card>

            <Card className="border-slate-200 shadow-sm overflow-hidden">
                <CardHeader className="bg-slate-50/50 border-b border-slate-100">
                    <CardTitle className="text-[10px] font-black uppercase tracking-widest text-slate-500">Active Committee</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    {cawangan.committee?.length > 0 ? (
                        <div className="divide-y divide-slate-100">
                            {cawangan.committee.map(c => (
                                <div key={c.id} className="p-4 flex items-center gap-3">
                                    <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 font-black text-[10px]">
                                        {c.name.substring(0,2).toUpperCase()}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs font-bold text-slate-900 truncate">{c.name}</p>
                                        <p className="text-[9px] font-bold text-blue-600 uppercase tracking-tighter">{c.positionName}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="p-12 text-center text-slate-300">
                             <ShieldCheck className="w-8 h-8 mx-auto mb-2 opacity-20" />
                             <p className="text-[10px] font-bold uppercase tracking-widest">No committee active</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
}
