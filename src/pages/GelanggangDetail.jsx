import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Layers, MapPin, Building2, Users, ArrowLeft, Plus, Trash2, Calendar, UserRound, GraduationCap, ClipboardCheck, History, Award, CheckCircle2, XCircle } from 'lucide-react';
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

  const { data: gelanggang, isLoading, error } = useQuery({
    queryKey: ['gelanggang', id],
    queryFn: () => fetchClient(`/gelanggang/${id}`),
  });

  const { data: eligibleStudents } = useQuery({
    queryKey: ['eligible-students', id],
    queryFn: () => fetchClient(`/gelanggang/${id}/eligible-students`),
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
      setSelectedEventForReg(null);
      setSelectedStudentsForReg([]);
      toast.success('Students registered for Ujian successfully');
    },
    onError: (err) => toast.error(err.message)
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

        {/* Member Roster & Grading Tabs */}
        <div className="col-span-1 md:col-span-2 space-y-6">
          <div className="flex gap-2 p-1 bg-slate-100 rounded-lg w-fit">
            <Button 
              variant={activeTab === 'members' ? 'secondary' : 'ghost'} 
              size="sm" 
              onClick={() => setActiveTab('members')}
              className={cn(activeTab === 'members' && "bg-white shadow-sm")}
            >
              <Users className="w-4 h-4 mr-2" /> Members
            </Button>
            <Button 
              variant={activeTab === 'grading' ? 'secondary' : 'ghost'} 
              size="sm" 
              onClick={() => setActiveTab('grading')}
              className={cn(activeTab === 'grading' && "bg-white shadow-sm")}
            >
              <GraduationCap className="w-4 h-4 mr-2" /> Grading & Ujian
            </Button>
          </div>

          {activeTab === 'members' ? (
            <Card className="shadow-sm">
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
          ) : (
            <div className="space-y-6">
              {/* Upcoming Exams for Registration */}
              <Card className="border-t-4 border-t-red-600">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ClipboardCheck className="w-5 h-5 text-red-600" /> Upcoming Exams
                  </CardTitle>
                  <CardDescription>Register your students for upcoming bengkung examinations.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {upcomingEvents?.filter(e => e.status === 'Scheduled').map(event => (
                      <Card key={event.id} className="border-slate-200 hover:border-red-200 transition-colors cursor-pointer" onClick={() => setSelectedEventForReg(event)}>
                        <CardHeader className="p-4 pb-2">
                          <CardTitle className="text-sm">{event.title}</CardTitle>
                          <CardDescription className="text-[10px]">{formatDate(event.date, true)}</CardDescription>
                        </CardHeader>
                        <CardContent className="p-4 pt-0">
                           <div className="flex items-center text-xs text-muted-foreground">
                              <MapPin className="w-3 h-3 mr-1" /> {event.location}
                           </div>
                        </CardContent>
                        <CardFooter className="p-4 pt-0">
                           <Button variant="outline" size="sm" className="w-full text-xs h-8">Select for Registration</Button>
                        </CardFooter>
                      </Card>
                    ))}
                    {!upcomingEvents?.filter(e => e.status === 'Scheduled').length && (
                      <div className="col-span-full py-8 text-center text-muted-foreground bg-slate-50 border border-dashed rounded-lg">
                        No upcoming examination sessions scheduled.
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Ujian History / Results */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <History className="w-5 h-5 text-blue-500" /> Result History
                  </CardTitle>
                  <CardDescription>Performance records of students in this gelanggang.</CardDescription>
                </CardHeader>
                <CardContent>
                   <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Student</TableHead>
                          <TableHead>Target Bengkung</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Marks</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {ujianResults?.map((res) => (
                          <TableRow key={res.id}>
                            <TableCell className="font-medium text-xs">{res.studentName}</TableCell>
                            <TableCell className="text-xs">{res.bengkungName}</TableCell>
                            <TableCell className="text-[10px] text-muted-foreground">
                               {formatDate(res.eventDate)}
                            </TableCell>
                            <TableCell>
                              {res.status === 'Passed' ? (
                                <Badge className="bg-emerald-50 text-emerald-700 hover:bg-emerald-50 border-emerald-100 text-[9px] uppercase">Passed</Badge>
                              ) : res.status === 'Failed' ? (
                                <Badge className="bg-rose-50 text-rose-700 hover:bg-rose-50 border-rose-100 text-[9px] uppercase">Failed</Badge>
                              ) : (
                                <Badge variant="outline" className="text-[9px] uppercase">Registered</Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-right font-mono text-xs">{res.totalMark ?? '-'}</TableCell>
                          </TableRow>
                        ))}
                        {!ujianResults?.length && (
                          <TableRow>
                             <TableCell colSpan={5} className="text-center py-8 text-muted-foreground text-xs italic">
                               No results recorded yet.
                             </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                   </Table>
                </CardContent>
              </Card>
            </div>
          )}
        </div>

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

      {/* Ujian Registration Dialog */}
      <Dialog open={!!selectedEventForReg} onOpenChange={(open) => !open && setSelectedEventForReg(null)}>
         <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
            <DialogHeader>
               <DialogTitle>Register Students</DialogTitle>
               <DialogDescription>
                  Event: {selectedEventForReg?.title} ({formatDate(selectedEventForReg?.date || new Date())})
               </DialogDescription>
            </DialogHeader>
            <div className="py-4 space-y-4">
               <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Select Eligible Students</p>
               <div className="space-y-2 border rounded-lg divide-y bg-slate-50/50">
                  {eligibleStudents?.map(student => (
                    <div key={student.id} className="flex items-center justify-between p-3">
                       <div className="flex flex-col">
                          <span className="text-sm font-bold">{student.name}</span>
                          <span className="text-[10px] text-muted-foreground">Current: {student.currentBengkung?.name || 'Cindai Kuning (Kosong)'}</span>
                       </div>
                       <div className="flex items-center gap-3">
                          {student.eligibleBengkung ? (
                            <>
                              <Badge variant="outline" className="text-[9px] bg-white">{student.eligibleBengkung.name}</Badge>
                              <input 
                                type="checkbox"
                                className="w-4 h-4 rounded border-gray-300 text-red-600 focus:ring-red-500"
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
                            <span className="text-[10px] italic text-slate-400">Max Level Reached</span>
                          )}
                       </div>
                    </div>
                  ))}
                  {!eligibleStudents?.length && (
                    <div className="p-8 text-center text-xs text-muted-foreground italic">No students available in this gelanggang.</div>
                  )}
               </div>
            </div>
            <div className="flex justify-end gap-3 pt-2">
               <Button variant="outline" onClick={() => setSelectedEventForReg(null)}>Cancel</Button>
               <Button 
                  className="bg-red-700" 
                  disabled={selectedStudentsForReg.length === 0 || registerMutation.isPending}
                  onClick={() => registerMutation.mutate({ eventId: selectedEventForReg.id, registrations: selectedStudentsForReg })}
               >
                  {registerMutation.isPending ? 'Registering...' : `Register ${selectedStudentsForReg.length} Students`}
               </Button>
            </div>
         </DialogContent>
      </Dialog>
    </div>
  );
}
