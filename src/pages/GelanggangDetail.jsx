import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Layers, MapPin, Building2, Users, ArrowLeft, Plus, Trash2,
  Calendar, UserRound, GraduationCap, ClipboardCheck, History,
  XCircle, Loader2, Info, ChevronRight
} from 'lucide-react';
import { toast } from 'sonner';

import { fetchClient } from '@/api/fetchClient';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { UserLookup } from '@/components/ui/user-lookup';
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
  const [selectedNewUser, setSelectedNewUser] = useState(null);
  const [userToRemove, setUserToRemove] = useState(null);

  const [activeTab, setActiveTab] = useState('members');
  const [selectedEventForReg, setSelectedEventForReg] = useState(null);
  const [selectedStudentsForReg, setSelectedStudentsForReg] = useState([]);
  const [regToRemove, setRegToRemove] = useState(null);

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
      toast.success('Students registered successfully');
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
      toast.success('User added successfully');
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
      toast.success('User removed');
    },
    onError: (err) => {
      toast.error(err.message);
      setUserToRemove(null);
    }
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
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <h2 className="text-xl font-bold text-destructive text-center">Failed to load Gelanggang</h2>
        <Button variant="outline" onClick={() => navigate(-1)} className="font-bold">
          <ArrowLeft className="w-4 h-4 mr-2" /> Return Home
        </Button>
      </div>
    );
  }

  const isJurulatih = gelanggang.jurulatih?.id === currentUser?.id;
  const isAdmin = currentUser?.role === 'SuperAdmin' || currentUser?.role === 'Admin';
  const canManage = isJurulatih || isAdmin;

  return (
    <div className="p-4 md:p-8 pt-6 space-y-8 max-w-7xl mx-auto pb-20">
      {/* Mixed Weight Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="pl-0 text-muted-foreground hover:text-foreground mb-2">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back
          </Button>
          <h1 className="text-2xl md:text-3xl font-light tracking-tight text-slate-900 italic">
            <span className="font-semibold uppercase not-italic">{gelanggang.name}</span>
          </h1>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-1 text-sm font-medium text-slate-500 mt-1">
            <div className="flex items-center gap-1.5">
              <Building2 className="w-4 h-4 text-blue-500" />
              {gelanggang.cawangan?.name}
            </div>
            <div className="flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-rose-500" />
              {gelanggang.location || 'No Location Set'}
            </div>
          </div>
        </div>

        {canManage && (
          <Button onClick={() => setIsAddUserOpen(true)} className="shadow-lg shadow-primary/20 font-bold">
            <Plus className="mr-2 h-4 w-4" /> Add Student
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar Cards */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="border-border/50">
            <CardHeader className="pb-3 border-b bg-muted/20">
              <CardTitle className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                <Info className="w-3.5 h-3.5" /> Center Overview
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-5">
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
                  <p className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Students</p>
                  <p className="text-2xl font-black text-slate-900">{gelanggang.users?.length || 0}</p>
                </div>
                <div className="space-y-0.5">
                  <p className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Assistants</p>
                  <p className="text-2xl font-black text-slate-900">{gelanggang.pembantuCount || 0}</p>
                </div>
              </div>

              {gelanggang.description && (
                <div className="pt-4 border-t border-slate-100">
                  <p className="text-[9px] font-black uppercase text-slate-400 tracking-wider mb-2">Description</p>
                  <p className="text-xs text-slate-600 leading-relaxed italic">
                    "{gelanggang.description}"
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Main Content Area */}
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
          </div>

          {activeTab === 'members' ? (
            <Card className="overflow-hidden border-border/50 border-t-4 border-t-blue-600 shadow-sm">
              <CardHeader className="pb-3 border-b bg-muted/20">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                    <Users className="w-3.5 h-3.5" /> Student Roster
                  </CardTitle>
                  <Badge variant="outline" className="text-[10px] bg-white font-black uppercase tracking-tighter">Active Center</Badge>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader className="bg-muted/30">
                    <TableRow>
                      <TableHead className="font-black uppercase text-[10px] tracking-widest py-4 pl-6 text-slate-400">Student Name</TableHead>
                      <TableHead className="font-black uppercase text-[10px] tracking-widest py-4 text-slate-400">Current Rank</TableHead>
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
                    {(!gelanggang.users || gelanggang.users.length === 0) && (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center py-20 text-slate-400 italic text-xs uppercase tracking-widest opacity-50 font-bold">
                          No registered students
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {/* Upcoming Exams styled like Shop Cards */}
              <Card className="overflow-hidden border-t-4 border-t-rose-600 border-border/50 shadow-sm">
                <CardHeader className="pb-3 border-b bg-rose-50/20">
                  <CardTitle className="text-[10px] font-black uppercase tracking-widest text-rose-900 flex items-center gap-2">
                    <ClipboardCheck className="w-4 h-4" /> Available Ujian Sessions
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {upcomingEvents?.filter(e => e.status === 'Scheduled' || e.status === 'Ongoing').map(event => (
                      <Card key={event.id} className="flex flex-col h-full hover:shadow-lg transition-all border-border/50 bg-card/50 group overflow-hidden">
                        <CardHeader className="pb-2">
                          <div className="flex justify-between items-start">
                            <div className="text-[9px] font-black text-rose-600 uppercase tracking-widest mb-1">
                              {event.status}
                            </div>
                            <Calendar className="w-3.5 h-3.5 text-slate-300" />
                          </div>
                          <CardTitle className="text-lg font-black uppercase text-slate-900 leading-tight">{event.title}</CardTitle>
                          <CardDescription className="text-[10px] font-bold text-slate-500 uppercase">
                            {formatDate(event.date, true)}
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="flex-1 pb-4">
                          <div className="flex items-center text-xs font-bold text-slate-600 gap-2 mt-2">
                            <MapPin className="w-3.5 h-3.5 text-rose-500" /> {event.location}
                          </div>
                        </CardContent>
                        <CardFooter className="pt-0 border-t border-border/50 bg-muted/20 p-4">
                          <Button
                            onClick={() => setSelectedEventForReg(event)}
                            variant="outline"
                            size="sm"
                            className="w-full text-[10px] font-black uppercase h-8 group-hover:bg-rose-600 group-hover:text-white group-hover:border-rose-600 transition-all rounded-lg"
                          >
                            Register Candidates
                          </Button>
                        </CardFooter>
                      </Card>
                    ))}
                    {!upcomingEvents?.filter(e => e.status === 'Scheduled' || e.status === 'Ongoing').length && (
                      <div className="col-span-full py-12 text-center text-slate-400 border-2 border-dashed rounded-2xl">
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40 italic">No technical examinations scheduled</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* History Table */}
              <Card className="overflow-hidden border-border/50 shadow-sm">
                <CardHeader className="pb-3 border-b bg-muted/20">
                  <CardTitle className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                    <History className="w-4 h-4" /> Examination Performance History
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
                          <TableCell className="py-4 pl-6 font-bold text-slate-900 text-xs uppercase tracking-tight">{res.studentName}</TableCell>
                          <TableCell className="py-4">
                            <div className="flex flex-col">
                              <span className="text-[11px] font-black text-slate-700">{res.eventTitle}</span>
                              <span className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter">{formatDate(res.eventDate)} — {res.bengkungName}</span>
                            </div>
                          </TableCell>
                          <TableCell className="py-4 text-center">
                            {res.status === 'Passed' ? (
                              <Badge className="bg-emerald-50 text-emerald-700 border-emerald-100 text-[8px] font-black uppercase px-2">Passed</Badge>
                            ) : res.status === 'Failed' ? (
                              <Badge className="bg-rose-50 text-rose-700 border-rose-100 text-[8px] font-black uppercase px-2">Failed</Badge>
                            ) : (
                              <div className="flex items-center justify-center gap-1">
                                <Badge variant="outline" className="text-[8px] font-black uppercase text-slate-400 px-2">Enrolled</Badge>
                                <Button variant="ghost" size="icon" className="h-6 w-6 text-slate-300 hover:text-rose-500 rounded-full" onClick={() => setRegToRemove(res)}>
                                  <XCircle className="w-3.5 h-3.5" />
                                </Button>
                              </div>
                            )}
                          </TableCell>
                          <TableCell className="text-right pr-6 font-mono font-black text-xs text-slate-900">{res.totalMark ?? '-'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>

      {/* Manual Dialogs */}
      <Dialog open={isAddUserOpen} onOpenChange={setIsAddUserOpen}>
        <DialogContent className="rounded-3xl border-slate-200 shadow-2xl">
          <DialogHeader className="pb-4 border-b">
            <DialogTitle className="text-lg font-black uppercase tracking-tight italic">Register New Student</DialogTitle>
            <DialogDescription className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Search for a martial artist to join this center.</DialogDescription>
          </DialogHeader>
          <div className="py-8">
            <UserLookup
              onChange={(uid) => setSelectedNewUser(uid)}
              placeholder="Enter name, IC, or phone..."
            />
          </div>
          <div className="flex justify-end gap-3 pt-6 border-t">
            <Button variant="ghost" onClick={() => setIsAddUserOpen(false)} className="uppercase text-[10px] font-black tracking-widest">Cancel</Button>
            <Button
              onClick={() => addUserMutation.mutate(selectedNewUser)}
              disabled={!selectedNewUser || addUserMutation.isPending}
              className="uppercase text-[10px] font-black tracking-widest px-8 shadow-lg shadow-primary/20"
            >
              {addUserMutation.isPending && <Loader2 className="animate-spin w-3 h-3 mr-2" />}
              Add to Roster
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        isOpen={!!userToRemove}
        onClose={() => setUserToRemove(null)}
        title="Remove Member?"
        description={`Are you sure you want to remove ${userToRemove?.name} from this center?`}
        onConfirm={() => removeUserMutation.mutate(userToRemove.id)}
        confirmText="Remove Student"
        variant="destructive"
        isLoading={removeUserMutation.isPending}
      />

      <ConfirmDialog
        isOpen={!!regToRemove}
        onClose={() => setRegToRemove(null)}
        title="Cancel Registration?"
        description={`Remove ${regToRemove?.studentName} from the ${regToRemove?.eventTitle}?`}
        onConfirm={() => deleteRegMutation.mutate(regToRemove.id)}
        confirmText="Cancel Ujian"
        variant="destructive"
        isLoading={deleteRegMutation.isPending}
      />

      {/* Registration Flow Dialog */}
      <Dialog open={!!selectedEventForReg} onOpenChange={(open) => !open && setSelectedEventForReg(null)}>
        <DialogContent className="sm:max-w-[500px] rounded-3xl border-slate-200 shadow-2xl">
          <DialogHeader className="pb-4 border-b border-rose-50">
            <DialogTitle className="text-xl font-black uppercase italic text-rose-900">Ujian Registration</DialogTitle>
            <DialogDescription className="text-[10px] font-bold text-rose-600/60 uppercase tracking-widest flex items-center gap-2 mt-1">
              <ClipboardCheck className="w-3 h-3 text-rose-600" />
              {selectedEventForReg?.title} — {formatDate(selectedEventForReg?.date || new Date())}
            </DialogDescription>
          </DialogHeader>
          <div className="py-6 space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
            <p className="text-[9px] font-black uppercase text-slate-400 tracking-[0.2em] mb-4 pl-1">Eligible Students in Center</p>
            {eligibleStudents?.map(student => (
              <div key={student.id} className="flex items-center justify-between p-3 border rounded-2xl bg-slate-50/50 hover:bg-white transition-all border-slate-100 hover:border-rose-200 hover:shadow-md">
                <div>
                  <p className={cn("text-xs font-black uppercase", student.isRegistered ? "text-slate-300" : "text-slate-900")}>{student.name}</p>
                  <p className="text-[9px] text-slate-400 font-bold uppercase tracking-tight mt-0.5">
                    Rank: {student.currentBengkung?.name || 'Cindai Kuning'}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  {student.isRegistered ? (
                    <Badge variant="outline" className="text-[8px] font-black uppercase text-slate-300 border-slate-100 px-2 py-0.5">Already Enrolled</Badge>
                  ) : student.eligibleBengkung ? (
                    <>
                      <Badge variant="outline" className="text-[9px] font-black bg-white border-rose-100 text-rose-600 uppercase shadow-sm">{student.eligibleBengkung.name}</Badge>
                      <input
                        type="checkbox"
                        className="w-5 h-5 rounded-lg border-slate-200 text-rose-600 focus:ring-rose-500 shadow-inner cursor-pointer"
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
                    <Badge variant="outline" className="text-[8px] font-bold uppercase text-slate-400 italic border-slate-100">{student.status}</Badge>
                  )}
                </div>
              </div>
            ))}
            {!eligibleStudents?.length && (
              <div className="py-12 text-center text-[10px] font-black uppercase text-slate-400 tracking-widest opacity-30 italic">No candidates found</div>
            )}
          </div>
          <div className="flex justify-end gap-3 pt-6 border-t border-slate-50">
            <Button variant="ghost" onClick={() => setSelectedEventForReg(null)} className="uppercase text-[10px] font-black tracking-widest rounded-xl px-6">Cancel</Button>
            <Button
              className="bg-rose-600 hover:bg-rose-700 uppercase text-[10px] font-black tracking-widest px-8 rounded-xl shadow-lg shadow-rose-500/20"
              disabled={selectedStudentsForReg.length === 0 || registerMutation.isPending}
              onClick={() => registerMutation.mutate({ eventId: selectedEventForReg.id, registrations: selectedStudentsForReg })}
            >
              {registerMutation.isPending && <Loader2 className="animate-spin w-3 h-3 mr-2" />}
              Register {selectedStudentsForReg.length} Students
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
