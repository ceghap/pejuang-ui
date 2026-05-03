import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from '@tanstack/react-form';
import {
  Layers, MapPin, Building2, Users, ArrowLeft, Plus, Trash2,
  Calendar, UserRound, GraduationCap, ClipboardCheck, History,
  XCircle, Loader2, Info, UserPlus, ShieldAlert, Trophy, DollarSign
} from 'lucide-react';
import { toast } from 'sonner';

import { fetchClient } from '@/api/fetchClient';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { UserLookup } from '@/components/ui/user-lookup';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const formatDate = (dateStr, includeTime = false) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const options = {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  };
  if (includeTime) {
    options.hour = '2-digit';
    options.minute = '2-digit';
  }
  return new Intl.DateTimeFormat('en-GB', options).format(date);
};

export default function GelanggangDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user: currentUser } = useAuthStore();

  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [selectedNewUser, setSelectedNewUser] = useState(null);
  const [userToRemove, setUserToRemove] = useState(null);
  const [tempUser, setTempUser] = useState(null);

  const [activeTab, setActiveTab] = useState('members');
  const [selectedEventForReg, setSelectedEventForReg] = useState(null);
  const [selectedStudentsForReg, setSelectedStudentsForReg] = useState([]);
  const [regToRemove, setRegToRemove] = useState(null);

  // Tournament specific states
  const [selectedTournamentForReg, setSelectedTournamentForReg] = useState(null);
  const [selectedFightersForReg, setSelectedFightersForReg] = useState([]);

  const { data: gelanggang, isLoading, error } = useQuery({
    queryKey: ['gelanggang', id],
    queryFn: () => fetchClient(`/gelanggang/${id}`),
  });

  const { data: eligibleStudents } = useQuery({
    queryKey: ['eligible-students', id, selectedEventForReg?.id],
    queryFn: () => {
      let url = `/gelanggang/${id}/eligible-students`;
      if (selectedEventForReg?.id) url += `?eventId=${selectedEventForReg.id}`;
      return fetchClient(url);
    },
    enabled: activeTab === 'grading'
  });

  const { data: upcomingEvents } = useQuery({
    queryKey: ['ujian-events'],
    queryFn: () => fetchClient('/ujian-events'),
    enabled: activeTab === 'grading'
  });

  const { data: ujianResults } = useQuery({
    queryKey: ['ujian-results', id],
    queryFn: () => fetchClient(`/gelanggang/${id}/ujian-results`),
    enabled: activeTab === 'grading'
  });

  const { data: upcomingTournaments } = useQuery({
    queryKey: ['tournament-events'],
    queryFn: () => fetchClient('/tournament-events'),
    enabled: activeTab === 'tournaments'
  });

  const { data: eligibleFighters } = useQuery({
    queryKey: ['eligible-fighters', id, selectedTournamentForReg?.id],
    queryFn: () => {
      let url = `/gelanggang/${id}/eligible-fighters`;
      if (selectedTournamentForReg?.id) url += `?eventId=${selectedTournamentForReg.id}`;
      return fetchClient(url);
    },
    enabled: activeTab === 'tournaments'
  });

  const registerFighterMutation = useMutation({
    mutationFn: (data) => fetchClient(`/tournament-events/${data.eventId}/register-internal`, {
      method: 'POST',
      body: JSON.stringify({ registrations: data.registrations }),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries(['eligible-fighters', id]);
      setSelectedTournamentForReg(null);
      setSelectedFightersForReg([]);
      toast.success('Tournament registration successful');
    },
    onError: (err) => toast.error(err.message)
  });

  const registerMutation = useMutation({
    mutationFn: (data) => fetchClient(`/ujian-events/${data.eventId}/register-students`, {
      method: 'POST',
      body: JSON.stringify({ registrations: data.registrations }),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries(['ujian-results', id]);
      queryClient.invalidateQueries(['eligible-students', id]);
      setSelectedEventForReg(null);
      setSelectedStudentsForReg([]);
      toast.success('Registration successful');
    },
    onError: (err) => toast.error(err.message)
  });

  const addStudentMutation = useMutation({
    mutationFn: (data) => fetchClient(`/gelanggang/${id}/add-student`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    onSuccess: (data) => {
      queryClient.invalidateQueries(['gelanggang', id]);
      if (data.temporaryPassword) {
        setTempUser(data);
      } else {
        setIsRegisterOpen(false);
        toast.success(data.message || 'Student added');
      }
    },
    onError: (err) => toast.error(err.message)
  });

  const deleteRegMutation = useMutation({
    mutationFn: (id) => fetchClient(`/ujian/registrations/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries(['ujian-results', id]);
      queryClient.invalidateQueries(['eligible-students', id]);
      setRegToRemove(null);
      toast.success('Registration removed');
    },
    onError: (err) => toast.error(err.message)
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
      toast.success('Member linked successfully');
    },
    onError: (err) => toast.error(err.message)
  });

  const removeUserMutation = useMutation({
    mutationFn: (userId) => fetchClient(`/gelanggang/${id}/users/${userId}`, {
      method: 'DELETE',
    }),
    onSuccess: () => {
      queryClient.invalidateQueries(['gelanggang', id]);
      setUserToRemove(null);
      toast.success('Member removed');
    },
    onError: (err) => {
      toast.error(err.message);
      setUserToRemove(null);
    }
  });

  const registerForm = useForm({
    defaultValues: { name: '', icNumber: '', phoneNumber: '', email: '' },
    onSubmit: async ({ value }) => {
      addStudentMutation.mutate(value);
    },
  });

  if (isLoading) {
    return (
      <div className="flex h-[400px] items-center justify-center p-6 animate-pulse">
        <Loader2 className="h-8 w-8 animate-spin text-slate-300" />
      </div>
    );
  }

  if (error || !gelanggang) {
    return (
      <div className="text-center p-12">
        <h2 className="text-xl font-bold text-destructive">Error Loading Gelanggang</h2>
        <Button variant="ghost" onClick={() => navigate(-1)} className="mt-4">
          <ArrowLeft className="w-4 h-4 mr-2" /> Go Back
        </Button>
      </div>
    );
  }

  const isJurulatih = gelanggang?.jurulatih?.id === currentUser?.id;
  const isAdmin = currentUser?.role === 'SuperAdmin' || currentUser?.role === 'Admin';
  const canManage = isJurulatih || isAdmin;

  return (
    <div className="p-4 md:p-8 pt-6 space-y-8 max-w-7xl mx-auto pb-20">
      {/* Header Area */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="pl-0 text-muted-foreground hover:text-slate-900 mb-2">
            <ArrowLeft className="w-4 h-4 mr-2" /> Kembali ke My Gelanggang
          </Button>
          <h1 className="text-2xl md:text-3xl font-light tracking-tight italic">
            <span className="font-semibold uppercase not-italic">{gelanggang.name}</span>
          </h1>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-1 text-sm font-medium text-slate-500 mt-1">
            <div className="flex items-center gap-1.5">
              <Building2 className="w-4 h-4 text-blue-500" />
              {gelanggang.cawangan?.name}
            </div>
            <div className="flex items-center gap-1.5 text-rose-500">
              <MapPin className="w-4 h-4" />
              {gelanggang.location || 'No Location Set'}
            </div>
          </div>
        </div>

        {canManage && (
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setIsAddUserOpen(true)} className="font-bold border-slate-200">
              <Plus className="mr-2 h-4 w-4" /> Tambah Ahli
            </Button>
            <Button size="sm" onClick={() => { registerForm.reset(); setIsRegisterOpen(true); }} className="shadow-lg shadow-primary/20 font-bold">
              <UserPlus className="mr-2 h-4 w-4" /> Daftar Ahli Baharu
            </Button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Detail Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader className="pb-3 border-b bg-muted/20">
              <CardTitle className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                <Info className="w-3.5 h-3.5" /> Tentang Gelanggang
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-5">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 shadow-sm">
                    <UserRound className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Ketua Jurulatih</p>
                    <p className="font-bold text-sm text-slate-900">{gelanggang.jurulatih?.name || 'Unassigned'}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100">
                  <div className="space-y-0.5">
                    <p className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Ahli</p>
                    <p className="text-2xl font-black text-slate-900">{gelanggang.users?.length || 0}</p>
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Pembantu</p>
                    <p className="text-2xl font-black text-slate-900">{gelanggang.pembantuCount || 0}</p>
                  </div>
                </div>
              </div>

              {gelanggang.description && (
                <div className="pt-4 border-t border-slate-100">
                  <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider mb-2">Penerangan</p>
                  <p className="text-xs text-slate-600 leading-relaxed italic">
                    "{gelanggang.description}"
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Content Tabs */}
        <div className="lg:col-span-3 space-y-6">
          <div className="flex gap-2 p-1 bg-slate-100/80 rounded-xl w-fit border border-slate-200">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setActiveTab('members')}
              className={cn(
                "rounded-lg px-6 font-bold text-xs uppercase tracking-widest transition-all",
                activeTab === 'members' ? "bg-white text-blue-600 shadow-sm" : "text-slate-500"
              )}
            >
              <Users className="w-3.5 h-3.5 mr-2" /> Members
            </Button>

            {canManage && (
              <>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setActiveTab('grading')}
                  className={cn(
                    "rounded-lg px-6 font-bold text-xs uppercase tracking-widest transition-all",
                    activeTab === 'grading' ? "bg-white text-rose-600 shadow-sm" : "text-slate-500"
                  )}
                >
                  <GraduationCap className="w-3.5 h-3.5 mr-2" /> Ujian & Grading
                </Button>

                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setActiveTab('tournaments')}
                  className={cn(
                    "rounded-lg px-6 font-bold text-xs uppercase tracking-widest transition-all",
                    activeTab === 'tournaments' ? "bg-white text-emerald-600 shadow-sm" : "text-slate-500"
                  )}
                >
                  <Trophy className="w-3.5 h-3.5 mr-2" /> MACAT Tournaments
                </Button>
              </>
            )}
          </div>
          
          {/* ── Tab Content ─────────────────────────────────────────── */}
          <div className="mt-2">
              {activeTab === 'members' || !canManage ? (
                /* Members Tab */
                <Card className="overflow-hidden border-border/50 border-t-4 border-t-blue-600 shadow-sm">
                  <CardHeader className="pb-3 border-b bg-muted/20">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                        <Users className="w-3.5 h-3.5" /> Senarai Ahli
                      </CardTitle>
                      <Badge variant="outline" className="text-[10px] bg-white font-black uppercase tracking-tighter">Gelangang aktif</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader className="bg-muted/30">
                        <TableRow>
                          <TableHead className="font-black uppercase text-[10px] tracking-widest py-4 pl-6 text-slate-400">Nama Ahli</TableHead>
                          <TableHead className="font-black uppercase text-[10px] tracking-widest py-4 text-slate-400">Bengkung</TableHead>
                          {canManage && <TableHead className="text-right py-4 pr-6 font-black uppercase text-[10px] tracking-widest text-slate-400">Actions</TableHead>}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {gelanggang.users?.map((u) => (
                          <TableRow key={u.id} className="hover:bg-muted/10 border-border/30">
                            <TableCell className="py-4 pl-6">
                              <span className="font-bold text-slate-900 text-sm">{u.name}</span>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="text-[9px] font-black uppercase bg-slate-50 text-slate-600">
                                {u.currentBengkungName || 'Cindai Kuning'}
                              </Badge>
                            </TableCell>
                            {canManage && (
                              <TableCell className="text-right pr-6">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-rose-300 hover:text-rose-600 hover:bg-rose-50 rounded-full"
                                  onClick={() => setUserToRemove(u)}
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </Button>
                              </TableCell>
                            )}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              ) : activeTab === 'grading' ? (
                /* Grading Tab */
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl flex items-start gap-4 shadow-sm">
                    <ShieldAlert className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
                    <div className="space-y-1">
                      <p className="text-[10px] font-black uppercase tracking-[0.15em] text-amber-900">Perhatian: Pembatalan Pendaftaran</p>
                      <p className="text-xs text-amber-800 leading-relaxed font-medium">
                        Jika pelajar anda tidak dapat hadir ke ujian, sila batalkan pendaftaran<strong> sebelum hari kejadian</strong>. Kegagalan berbuat demikian akan menyebabkan pelajar tersebut <strong>gagal secara automatik</strong>.
                      </p>
                    </div>
                  </div>

                  <Card className="overflow-hidden border-t-4 border-t-rose-600 border-border/50 shadow-sm">
                    <CardHeader className="pb-3 border-b bg-rose-50/20">
                      <CardTitle className="text-[10px] font-black uppercase tracking-widest text-rose-900 flex items-center gap-2">
                        <ClipboardCheck className="w-4 h-4 text-rose-600" /> Upcoming Ujian Sessions
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {upcomingEvents?.filter(e => e.status === 'Scheduled' || e.status === 'Ongoing').map(event => (
                          <Card key={event.id} className="flex flex-col h-full hover:shadow-lg transition-all border-border/50 bg-card/50 group overflow-hidden" onClick={() => setSelectedEventForReg(event)}>
                            <CardHeader className="p-4 pb-2 bg-slate-50 group-hover:bg-rose-50/50 transition-colors">
                              <CardTitle className="text-sm font-bold uppercase">{event.title}</CardTitle>
                              <CardDescription className="text-[10px] font-bold text-slate-500">{formatDate(event.date, true)}</CardDescription>
                            </CardHeader>
                            <CardContent className="p-4 pt-3 flex flex-col gap-3 cursor-pointer">
                              <div className="flex items-center text-[11px] font-bold text-slate-600 gap-2">
                                <MapPin className="w-3.5 h-3.5 text-rose-500" /> {event.location}
                              </div>
                              <Button variant="outline" size="sm" className="w-full text-[10px] font-black uppercase h-8 group-hover:bg-rose-600 group-hover:text-white group-hover:border-rose-600 transition-all rounded-lg">
                                Register Students
                              </Button>
                            </CardContent>
                          </Card>
                        ))}
                        {!upcomingEvents?.filter(e => e.status === 'Scheduled' || e.status === 'Ongoing').length && (
                          <div className="col-span-full py-12 text-center text-slate-400 border-2 border-dashed rounded-2xl flex flex-col items-center gap-2">
                            <Calendar className="w-6 h-6 opacity-20" />
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40 italic">No exams scheduled</p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="overflow-hidden border-border/50 shadow-sm">
                    <CardHeader className="pb-3 border-b bg-muted/20">
                      <CardTitle className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                        <History className="w-4 h-4 text-blue-500" /> Center Results & Performance
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                      <Table>
                        <TableHeader className="bg-muted/30">
                          <TableRow>
                            <TableHead className="font-black uppercase text-[9px] tracking-widest py-4 pl-6 text-slate-400">Student</TableHead>
                            <TableHead className="font-black uppercase text-[9px] tracking-widest py-4 text-slate-400">Event Details</TableHead>
                            <TableHead className="font-black uppercase text-[9px] tracking-widest py-4 text-center text-slate-400">Status</TableHead>
                            <TableHead className="text-right py-4 pr-6 font-black uppercase text-[9px] tracking-widest text-slate-400">Mark</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {ujianResults?.map((res) => (
                            <TableRow key={res.id} className="border-border/30 hover:bg-muted/5 transition-colors">
                              <TableCell className="py-4 pl-6 font-bold text-slate-900 text-[11px] uppercase">{res.studentName}</TableCell>
                              <TableCell className="py-4">
                                <div className="flex flex-col">
                                  <span className="text-[11px] font-bold text-slate-600">{res.eventTitle}</span>
                                  <span className="text-[9px] text-slate-400 font-bold uppercase">{formatDate(res.eventDate)} — {res.bengkungName}</span>
                                </div>
                              </TableCell>
                              <TableCell className="py-4 text-center">
                                {res.status === 'Passed' ? (
                                  <Badge className="bg-emerald-50 text-emerald-700 border-emerald-100 text-[8px] font-black uppercase px-2">Passed</Badge>
                                ) : res.status === 'Failed' ? (
                                  <Badge className="bg-rose-50 text-rose-700 border-rose-100 text-[8px] font-black uppercase px-2">Failed</Badge>
                                ) : (
                                  <div className="flex items-center justify-center gap-2">
                                    <Badge variant="outline" className="text-[8px] font-black uppercase text-slate-400 px-2">Enrolled</Badge>
                                    {canManage && (
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-full transition-colors"
                                        onClick={() => setRegToRemove(res)}
                                      >
                                        <XCircle className="w-4 h-4" />
                                      </Button>
                                    )}
                                  </div>
                                )}
                              </TableCell>
                              <TableCell className="text-right pr-6 font-mono font-black text-[11px] text-slate-900">{res.totalMark ?? '-'}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                </div>
              ) : activeTab === 'tournaments' ? (
                /* Tournaments Tab */
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-2xl flex items-start gap-4 shadow-sm">
                    <Trophy className="w-5 h-5 text-emerald-600 mt-0.5 shrink-0" />
                    <div className="space-y-1">
                      <p className="text-[10px] font-black uppercase tracking-[0.15em] text-emerald-900">MACAT Tournament Portal</p>
                      <p className="text-xs text-emerald-800 leading-relaxed font-medium">
                        Register your fighters for upcoming MACAT championships. Ensure all students have a <strong>Cleared</strong> medical status before registering.
                      </p>
                    </div>
                  </div>

                  <Card className="overflow-hidden border-t-4 border-t-emerald-600 border-border/50 shadow-sm">
                    <CardHeader className="pb-3 border-b bg-emerald-50/20">
                      <CardTitle className="text-[10px] font-black uppercase tracking-widest text-emerald-900 flex items-center gap-2">
                        <Trophy className="w-4 h-4 text-emerald-600" /> Upcoming Championships
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {upcomingTournaments?.filter(e => e.status === 'RegistrationOpen' || e.status === 'Draft').map(event => (
                          <Card key={event.id} className="flex flex-col h-full hover:shadow-lg transition-all border-border/50 bg-card/50 group overflow-hidden" onClick={() => setSelectedTournamentForReg(event)}>
                            <CardHeader className="p-4 pb-2 bg-slate-50 group-hover:bg-emerald-50/50 transition-colors">
                              <div className="flex justify-between items-start mb-1">
                                <CardTitle className="text-sm font-bold uppercase">{event.name}</CardTitle>
                                <Badge className="text-[8px] bg-emerald-600">Open</Badge>
                              </div>
                              <CardDescription className="text-[10px] font-bold text-slate-500">
                                {formatDate(event.startDate)} - {formatDate(event.endDate)}
                              </CardDescription>
                            </CardHeader>
                            <CardContent className="p-4 pt-3 flex flex-col gap-3 cursor-pointer">
                              <div className="space-y-2">
                                <div className="flex items-center text-[11px] font-bold text-slate-600 gap-2">
                                  <MapPin className="w-3.5 h-3.5 text-emerald-500" /> {event.location}
                                </div>
                                <div className="flex items-center text-[11px] font-bold text-emerald-600 gap-2">
                                  <DollarSign className="w-3.5 h-3.5" /> RM {event.registrationFee} Registration Fee
                                </div>
                              </div>
                              <Button variant="outline" size="sm" className="w-full text-[10px] font-black uppercase h-9 mt-2 group-hover:bg-emerald-600 group-hover:text-white group-hover:border-emerald-600 transition-all rounded-lg">
                                Select Fighters
                              </Button>
                            </CardContent>
                          </Card>
                        ))}
                        {!upcomingTournaments?.filter(e => e.status === 'RegistrationOpen' || e.status === 'Draft').length && (
                          <div className="col-span-full py-12 text-center text-slate-400 border-2 border-dashed rounded-2xl flex flex-col items-center gap-2">
                            <Trophy className="w-6 h-6 opacity-20" />
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40 italic">No tournaments open for registration</p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ) : null}
            </div>
          </div>
        </div>

      {/* Manual Link Dialog */}
      <Dialog open={isAddUserOpen} onOpenChange={setIsAddUserOpen}>
        <DialogContent className="rounded-2xl border-slate-200">
          <DialogHeader>
            <DialogTitle className="text-lg font-black uppercase">Link Member</DialogTitle>
            <DialogDescription className="text-xs uppercase font-bold tracking-widest text-slate-400">Search for an existing user to assign to this center.</DialogDescription>
          </DialogHeader>
          <div className="py-6 border-y border-slate-50">
            <UserLookup
              onChange={(uid) => setSelectedNewUser(uid)}
              placeholder="Search by name, IC, or Phone..."
            />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="ghost" onClick={() => setIsAddUserOpen(false)} className="uppercase text-[10px] font-black tracking-widest">Cancel</Button>
            <Button
              onClick={() => addUserMutation.mutate(selectedNewUser)}
              disabled={!selectedNewUser || addUserMutation.isPending}
              className="uppercase text-[10px] font-black tracking-widest px-6"
            >
              Link Student
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Register New Student Dialog */}
      <Dialog open={isRegisterOpen} onOpenChange={(open) => { setIsRegisterOpen(open); if (!open) setTempUser(null); }}>
        <DialogContent className="sm:max-w-[500px] rounded-3xl border-slate-200 shadow-2xl">
          {tempUser ? (
            <div className="p-6 text-center space-y-6">
              <div className="w-16 h-16 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto shadow-inner">
                <UserPlus className="w-8 h-8" />
              </div>
              <div className="space-y-2">
                <h2 className="text-xl font-black uppercase italic text-slate-900">Registration Successful</h2>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-widest">{tempUser.user.name}</p>
              </div>
              <Card className="bg-slate-50 border-emerald-100">
                <CardContent className="pt-6 pb-6">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Temporary Password</p>
                  <p className="text-3xl font-mono font-black text-emerald-600 tracking-tighter">{tempUser.temporaryPassword}</p>
                  <p className="text-[9px] text-slate-400 mt-4 uppercase font-bold">Please ask the student to change this on first login.</p>
                </CardContent>
              </Card>
              <Button onClick={() => setIsRegisterOpen(false)} className="w-full uppercase font-black tracking-widest">Done</Button>
            </div>
          ) : (
            <>
              <DialogHeader className="pb-4 border-b">
                <DialogTitle className="text-xl font-black uppercase italic text-slate-900">Register New Student</DialogTitle>
                <DialogDescription className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Create a new record or transfer an existing student.</DialogDescription>
              </DialogHeader>
              <form onSubmit={(e) => { e.preventDefault(); registerForm.handleSubmit(); }} className="space-y-4 pt-4">
                <registerForm.Field name="name" children={(field) => (
                  <div className="space-y-1">
                    <Label className="text-[9px] font-black uppercase text-slate-500 ml-1">Full Name</Label>
                    <Input placeholder="Enter student name..." className="h-9 text-xs font-bold" value={field.state.value} onChange={(e) => field.handleChange(e.target.value)} required />
                  </div>
                )} />
                <div className="grid grid-cols-2 gap-4">
                  <registerForm.Field name="icNumber" children={(field) => (
                    <div className="space-y-1">
                      <Label className="text-[9px] font-black uppercase text-slate-500 ml-1">IC Number</Label>
                      <Input placeholder="990101015555" className="h-9 text-xs font-bold" value={field.state.value} onChange={(e) => field.handleChange(e.target.value)} required />
                    </div>
                  )} />
                  <registerForm.Field name="phoneNumber" children={(field) => (
                    <div className="space-y-1">
                      <Label className="text-[9px] font-black uppercase text-slate-500 ml-1">Phone Number</Label>
                      <Input placeholder="0123456789" className="h-9 text-xs font-bold" value={field.state.value} onChange={(e) => field.handleChange(e.target.value)} />
                    </div>
                  )} />
                </div>
                <registerForm.Field name="email" children={(field) => (
                  <div className="space-y-1">
                    <Label className="text-[9px] font-black uppercase text-slate-500 ml-1">Email (Optional)</Label>
                    <Input type="email" placeholder="student@example.com" className="h-9 text-xs font-bold" value={field.state.value} onChange={(e) => field.handleChange(e.target.value)} />
                  </div>
                )} />

                <div className="bg-amber-50 border border-amber-100 p-3 rounded-xl flex items-start gap-3 mt-2">
                  <ShieldAlert className="w-4 h-4 text-amber-600 mt-0.5" />
                  <p className="text-[10px] text-amber-800 leading-relaxed font-medium">
                    If the IC number exists in the system, the student will be automatically transferred to this center and branch.
                  </p>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t">
                  <Button type="button" variant="ghost" onClick={() => setIsRegisterOpen(false)} className="text-[10px] font-black uppercase tracking-widest">Cancel</Button>
                  <Button type="submit" disabled={addStudentMutation.isPending} className="uppercase text-[10px] font-black tracking-widest px-8">
                    {addStudentMutation.isPending ? <Loader2 className="animate-spin w-3 h-3 mr-2" /> : <UserPlus className="w-3 h-3 mr-2" />}
                    Process Registration
                  </Button>
                </div>
              </form>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Existing Confirmation Dialogs */}
      <ConfirmDialog
        isOpen={!!userToRemove}
        onClose={() => setUserToRemove(null)}
        title="Remove Member?"
        description={`Are you sure you want to remove ${userToRemove?.name}?`}
        onConfirm={() => removeUserMutation.mutate(userToRemove.id)}
        confirmText="Remove"
        variant="destructive"
        isLoading={removeUserMutation.isPending}
      />

      <ConfirmDialog
        isOpen={!!regToRemove}
        onClose={() => setRegToRemove(null)}
        title="Cancel Registration?"
        description={`Remove ${regToRemove?.studentName} from the exam?`}
        onConfirm={() => deleteRegMutation.mutate(regToRemove.id)}
        confirmText="Remove"
        variant="destructive"
        isLoading={deleteRegMutation.isPending}
      />

      {/* Ujian Event Selection Dialog */}
      <Dialog open={!!selectedEventForReg} onOpenChange={(open) => !open && setSelectedEventForReg(null)}>
        <DialogContent className="sm:max-w-[500px] rounded-2xl border-slate-200">
          <DialogHeader className="pb-4 border-b border-slate-50">
            <DialogTitle className="text-lg font-black uppercase text-rose-900 italic">Ujian Registration</DialogTitle>
            <DialogDescription className="text-[10px] font-bold text-rose-600/60 uppercase tracking-widest flex items-center gap-2 mt-1">
              <ClipboardCheck className="w-3 h-3 text-rose-600" />
              {selectedEventForReg?.title} — {formatDate(selectedEventForReg?.date || new Date())}
            </DialogDescription>
          </DialogHeader>
          <div className="py-6 space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
            {eligibleStudents?.map(student => (
              <div key={student.id} className="flex items-center justify-between p-3 border rounded-xl bg-slate-50/50 hover:bg-white transition-all border-slate-100">
                <div>
                  <p className={cn("text-xs font-black uppercase", student.isRegistered ? "text-slate-300" : "text-slate-900")}>{student.name}</p>
                  <p className="text-[9px] text-slate-400 uppercase font-black">
                    Rank: {student.currentBengkung?.name || 'Cindai Kuning'}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  {student.isRegistered ? (
                    <Badge variant="outline" className="text-[8px] font-black uppercase text-slate-300 border-slate-100 px-2 py-0.5">Enrolled</Badge>
                  ) : student.eligibleBengkung ? (
                    <>
                      <Badge variant="outline" className="text-[9px] font-black bg-white border-rose-100 text-rose-600 uppercase">{student.eligibleBengkung.name}</Badge>
                      <input
                        type="checkbox"
                        className="w-4 h-4 rounded-lg border-slate-300 text-rose-600 focus:ring-rose-500"
                        checked={selectedStudentsForReg.some(s => s.userId === student.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedStudentsForReg([...selectedStudentsForReg, { userId: student.id, targetBengkungId: student.eligibleBengkung.id }]);
                          } else {
                            setSelectedStudentsForReg(selectedStudentsForReg.filter(s => s.userId !== student.id));
                          }
                        }}
                      />
                    </>
                  ) : (
                    <span className="text-[8px] font-bold uppercase text-slate-400 italic">{student.status}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="ghost" onClick={() => setSelectedEventForReg(null)} className="uppercase text-[10px] font-black tracking-widest">Cancel</Button>
            <Button
              className="bg-rose-600 hover:bg-rose-700 uppercase text-[10px] font-black tracking-widest px-6"
              disabled={selectedStudentsForReg.length === 0 || registerMutation.isPending}
              onClick={() => registerMutation.mutate({ eventId: selectedEventForReg.id, registrations: selectedStudentsForReg })}
            >
              Register {selectedStudentsForReg.length} Students
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Tournament Registration Dialog */}
      <Dialog open={!!selectedTournamentForReg} onOpenChange={(open) => !open && setSelectedTournamentForReg(null)}>
        <DialogContent className="sm:max-w-[600px] rounded-2xl border-slate-200">
          <DialogHeader className="pb-4 border-b border-slate-50">
            <DialogTitle className="text-lg font-black uppercase text-emerald-900 italic">MACAT Registration</DialogTitle>
            <DialogDescription className="text-[10px] font-bold text-emerald-600/60 uppercase tracking-widest flex items-center gap-2 mt-1">
              <ShieldAlert className="w-3 h-3 text-emerald-600" />
              {selectedTournamentForReg?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="py-6 space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
            {eligibleFighters?.map(fighter => {
              const currentReg = selectedFightersForReg.find(f => f.userId === fighter.id);
              const isMedicalCleared = fighter.medicalStatus === 'Cleared';
              const canRegister = !fighter.isRegistered && isMedicalCleared;
              
              return (
                <div key={fighter.id} className={cn(
                  "p-4 border rounded-xl transition-all space-y-4",
                  fighter.isRegistered ? "bg-slate-50 border-slate-100 opacity-60" : 
                  isMedicalCleared ? "bg-white border-slate-200 hover:border-emerald-200" : 
                  "bg-rose-50/30 border-rose-100"
                )}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className={cn("text-xs font-black uppercase", fighter.isRegistered ? "text-slate-400" : "text-slate-900")}>{fighter.name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <p className="text-[9px] text-slate-400 uppercase font-black">
                          W: {fighter.weight ?? '?'}kg | H: {fighter.height ?? '?'}cm
                        </p>
                        <span className="text-[10px] text-slate-200">|</span>
                        <div className="flex items-center gap-1">
                          {isMedicalCleared ? (
                            <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-none text-[8px] font-black uppercase h-4 px-1.5">Medical: Cleared</Badge>
                          ) : (
                            <Badge className="bg-rose-100 text-rose-700 hover:bg-rose-100 border-none text-[8px] font-black uppercase h-4 px-1.5">Medical: {fighter.medicalStatus || 'Pending'}</Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <div>
                      {fighter.isRegistered ? (
                        <div className="flex flex-col items-end">
                          <Badge variant="outline" className="text-[8px] font-black uppercase text-emerald-600 border-emerald-100 bg-emerald-50 px-2 py-0.5">Enrolled</Badge>
                          <span className="text-[7px] font-bold text-slate-300 uppercase mt-1">Registered</span>
                        </div>
                      ) : canRegister ? (
                        <input
                          type="checkbox"
                          className="w-6 h-6 rounded-lg border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer transition-all"
                          checked={!!currentReg}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedFightersForReg([...selectedFightersForReg, { 
                                userId: fighter.id, 
                                weightClass: '', 
                                category: '' 
                              }]);
                            } else {
                              setSelectedFightersForReg(selectedFightersForReg.filter(f => f.userId !== fighter.id));
                            }
                          }}
                        />
                      ) : (
                        <div className="text-right">
                          <p className="text-[8px] font-black uppercase text-rose-500 italic">Ineligible</p>
                          <p className="text-[7px] font-bold text-rose-400 uppercase">{fighter.status}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {currentReg && (
                    <div className="grid grid-cols-2 gap-4 animate-in fade-in duration-200">
                      <div className="space-y-1">
                        <Label className="text-[9px] font-black uppercase text-slate-400">Weight Class</Label>
                        <Input 
                          placeholder="e.g. Class A (45-50kg)" 
                          className="h-8 text-[10px] font-bold"
                          value={currentReg.weightClass}
                          onChange={(e) => {
                            setSelectedFightersForReg(selectedFightersForReg.map(f => 
                              f.userId === fighter.id ? { ...f, weightClass: e.target.value } : f
                            ));
                          }}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[9px] font-black uppercase text-slate-400">Category</Label>
                        <Input 
                          placeholder="e.g. Putera Remaja" 
                          className="h-8 text-[10px] font-bold"
                          value={currentReg.category}
                          onChange={(e) => {
                            setSelectedFightersForReg(selectedFightersForReg.map(f => 
                              f.userId === fighter.id ? { ...f, category: e.target.value } : f
                            ));
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
            {!eligibleFighters?.length && (
              <div className="py-12 text-center text-slate-400">
                <p className="text-xs italic">No students in this gelanggang.</p>
              </div>
            )}
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="ghost" onClick={() => setSelectedTournamentForReg(null)} className="uppercase text-[10px] font-black tracking-widest">Cancel</Button>
            <Button
              className="bg-emerald-600 hover:bg-emerald-700 uppercase text-[10px] font-black tracking-widest px-6 shadow-lg shadow-emerald-500/20"
              disabled={selectedFightersForReg.length === 0 || selectedFightersForReg.some(f => !f.weightClass || !f.category) || registerFighterMutation.isPending}
              onClick={() => registerFighterMutation.mutate({ 
                eventId: selectedTournamentForReg.id, 
                registrations: selectedFightersForReg 
              })}
            >
              {registerFighterMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin mr-2" /> : null}
              Register {selectedFightersForReg.length} Fighters
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
