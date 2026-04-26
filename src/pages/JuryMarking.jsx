import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Loader2, Save, CheckCircle, XCircle, AlertCircle, ClipboardList, User, UserPlus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { UserLookup } from '@/components/ui/user-lookup';
import { fetchClient } from '@/api/fetchClient';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export default function JuryMarking() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedReg, setSelectedReg] = useState(null);
  const [marks, setMarks] = useState({}); // { silibusItemId: { mark: number, notes: string } }

  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [selectedBeltId, setSelectedBeltId] = useState('');

  const { data: bengkungs } = useQuery({
    queryKey: ['bengkungs'],
    queryFn: () => fetchClient('/bengkung'),
  });

  const { data: registrations, isLoading: loadingRegs } = useQuery({
    queryKey: ['event-registrations', eventId],
    queryFn: () => fetchClient(`/ujian-events/${eventId}/registrations`),
  });

  const { data: markingSheet, isLoading: loadingSheet } = useQuery({
    queryKey: ['marking-sheet', selectedReg?.id],
    queryFn: () => fetchClient(`/ujian/registrations/${selectedReg.id}`),
    enabled: !!selectedReg,
  });

  // Correctly initialize marks when markingSheet data arrives
  useEffect(() => {
    if (markingSheet?.syllabus) {
      const initialMarks = {};
      markingSheet.syllabus.forEach(item => {
        initialMarks[item.id] = { mark: item.mark ?? 0, notes: item.notes || '' };
      });
      setMarks(initialMarks);
    }
  }, [markingSheet]);

  const saveMarksMutation = useMutation({
    mutationFn: (data) => fetchClient(`/ujian/registrations/${selectedReg.id}/marks`, {
      method: 'POST',
      body: JSON.stringify({ marks: data }),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries(['marking-sheet', selectedReg.id]);
      toast.success('Marks saved successfully');
    },
    onError: (err) => toast.error(err.message)
  });

  const registerManualMutation = useMutation({
    mutationFn: (data) => fetchClient(`/ujian-events/${eventId}/register-students`, {
      method: 'POST',
      body: JSON.stringify({ registrations: [data] }),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries(['event-registrations', eventId]);
      setIsAddUserOpen(false);
      setSelectedBeltId('');
      toast.success('Candidate added successfully');
    },
    onError: (err) => toast.error(err.message)
  });

  const finalizeMutation = useMutation({
    mutationFn: (passed) => fetchClient(`/ujian/registrations/${selectedReg.id}/finalize`, {
      method: 'POST',
      body: JSON.stringify({ passed }),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries(['event-registrations', eventId]);
      setSelectedReg(null);
      toast.success('Registration finalized');
    },
    onError: (err) => toast.error(err.message)
  });

  const handleMarkChange = (id, field, value) => {
    setMarks(prev => ({
      ...prev,
      [id]: { ...prev[id], [field]: value }
    }));
  };

  const handleSaveMarks = () => {
    const data = Object.entries(marks).map(([id, val]) => ({
      syllabusItemId: id,
      mark: parseFloat(val.mark) || 0,
      notes: val.notes
    }));
    saveMarksMutation.mutate(data);
  };

  if (loadingRegs) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => navigate('/admin/ujian-events')} className="pl-0">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Events
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Registration List */}
        <Card className="col-span-1">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <ClipboardList className="w-5 h-5" /> Candidates
              </CardTitle>
              <Button size="icon" variant="ghost" className="text-blue-600 h-8 w-8" onClick={() => setIsAddUserOpen(true)}>
                <UserPlus className="w-4 h-4" />
              </Button>
            </div>
            <CardDescription>Select a student to enter marks.</CardDescription>
          </CardHeader>
          <CardContent className="p-0 border-t">
            <div className="divide-y max-h-[600px] overflow-y-auto">
              {registrations?.map((reg) => (
                <div
                  key={reg.id}
                  className={cn(
                    "p-4 cursor-pointer hover:bg-slate-50 transition-colors",
                    selectedReg?.id === reg.id && "bg-red-50 border-r-4 border-r-red-600"
                  )}
                  onClick={() => setSelectedReg(reg)}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-bold text-sm">{reg.studentName}</p>
                      <p className="text-[10px] text-muted-foreground uppercase">{reg.bengkungName}</p>
                    </div>
                    {reg.status === 'Passed' && <Badge className="bg-emerald-50 text-emerald-700 text-[8px]">PASSED</Badge>}
                    {reg.status === 'Failed' && <Badge className="bg-rose-50 text-rose-700 text-[8px]">FAILED</Badge>}
                    {reg.status === 'Registered' && <Badge variant="outline" className="text-[8px]">PENDING</Badge>}
                  </div>
                </div>
              ))}
              {!registrations?.length && (
                <div className="p-12 text-center text-xs text-muted-foreground italic">No candidates registered for this event.</div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Marking Sheet */}
        <div className="col-span-1 lg:col-span-2">
          {selectedReg ? (
            <Card className="border-t-4 border-t-red-700 h-full flex flex-col">
              <CardHeader className="pb-4 shrink-0">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-2xl font-black uppercase">{selectedReg.studentName}</CardTitle>
                    <CardDescription>Examination for <span className="font-bold text-red-700">{selectedReg.bengkungName}</span></CardDescription>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Mark</p>
                    <p className="text-2xl font-mono font-black text-red-700">{Object.values(marks).reduce((sum, m) => sum + (parseFloat(m.mark) || 0), 0).toFixed(1)}</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6 flex-1 overflow-y-auto min-h-0">
                {loadingSheet ? (
                  <div className="flex py-20 justify-center"><Loader2 className="animate-spin text-red-600" /></div>
                ) : (
                  <div className="space-y-3 pb-4">
                    <div className="bg-amber-50 border border-amber-100 p-3 rounded-lg mb-4 flex items-start gap-3">
                      <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                      <p className="text-[11px] text-amber-800 leading-relaxed">
                        Enter marks for each technical requirement below. Click <strong>Save Draft Marks</strong> to store your progress. You must click <strong>Pass</strong> or <strong>Fail</strong> to finalize the result and update the student's rank.
                      </p>
                    </div>

                    {markingSheet?.syllabus?.map((item) => (
                      <div key={item.id} className="p-3 rounded-lg border bg-white flex flex-col md:flex-row gap-4 items-start md:items-center hover:border-red-200 transition-colors shadow-sm">
                        <div className="flex-1">
                          <p className="text-xs font-black text-slate-900">{item.name}</p>
                          <p className="text-[9px] text-muted-foreground uppercase font-mono">Requirement #{item.orderNo}</p>
                        </div>
                        <div className="flex gap-3 w-full md:w-auto">
                          <div className="w-20">
                            <Label className="text-[9px] uppercase font-bold text-slate-500 mb-1 block">Score</Label>
                            <Input
                              type="number"
                              className="h-8 text-xs font-bold border-slate-200 focus:border-red-500 bg-slate-50/30"
                              value={marks[item.id]?.mark ?? ''}
                              onChange={(e) => handleMarkChange(item.id, 'mark', e.target.value)}
                            />
                          </div>
                          <div className="flex-1 md:w-64">
                            <Label className="text-[9px] uppercase font-bold text-slate-500 mb-1 block">Notes / Observation</Label>
                            <Input
                              className="h-8 text-xs border-slate-200 focus:border-red-500 bg-slate-50/30"
                              value={marks[item.id]?.notes ?? ''}
                              placeholder="Enter observations..."
                              onChange={(e) => handleMarkChange(item.id, 'notes', e.target.value)}
                            />
                          </div>
                        </div>
                      </div>
                    ))}

                    {!markingSheet?.syllabus?.length && (
                      <div className="p-12 text-center border border-dashed rounded-xl text-muted-foreground text-xs italic">
                        No silibus items defined for this bengkung level.
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
              <CardFooter className="flex flex-col sm:flex-row gap-4 pt-6 border-t bg-slate-50/50 shrink-0">
                <Button className="w-full sm:w-auto" variant="outline" onClick={handleSaveMarks} disabled={saveMarksMutation.isPending || !selectedReg}>
                  {saveMarksMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                  Save Draft Marks
                </Button>
                <div className="flex-1" />
                <div className="flex gap-2 w-full sm:w-auto">
                  <Button variant="outline" className="flex-1 sm:flex-none border-rose-200 text-rose-700 hover:bg-rose-50 font-bold" onClick={() => finalizeMutation.mutate(false)} disabled={finalizeMutation.isPending}>
                    <XCircle className="w-4 h-4 mr-2" /> Fail
                  </Button>
                  <Button className="flex-1 sm:flex-none bg-emerald-600 hover:bg-emerald-700 font-bold" onClick={() => finalizeMutation.mutate(true)} disabled={finalizeMutation.isPending}>
                    <CheckCircle className="w-4 h-4 mr-2" /> Pass Candidate
                  </Button>
                </div>
              </CardFooter>
            </Card>
          ) : (
            <div className="h-full flex flex-col items-center justify-center border-2 border-dashed rounded-2xl bg-slate-50 text-slate-400 p-12 text-center min-h-[500px]">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                <User className="w-8 h-8 opacity-20" />
              </div>
              <p className="font-bold text-slate-600">No Candidate Selected</p>
              <p className="text-[11px] max-w-[200px] mx-auto mt-1">Pick a student from the left panel to load their technical silibus and begin marking.</p>
            </div>
          )}
        </div>
      </div>

      {/* Manual Registration Dialog */}
      <Dialog open={isAddUserOpen} onOpenChange={setIsAddUserOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Candidate Manually</DialogTitle>
            <DialogDescription>Search for a student to register for this exam event.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-1">
              <Label className="text-xs font-bold">Search Student</Label>
              <UserLookup
                onChange={(uid) => {
                  if (uid && selectedBeltId) {
                    registerManualMutation.mutate({ userId: uid, targetBengkungId: selectedBeltId });
                  } else if (uid) {
                    // User selected but belt not yet
                    const tempUser = { id: uid };
                    setStagedUser(tempUser);
                  }
                }}
                placeholder="Search by name, IC or phone..."
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-bold">Target Bengkung</Label>
              <select
                className="w-full bg-white border border-slate-200 rounded-md h-10 px-3 text-sm"
                value={selectedBeltId}
                onChange={(e) => setSelectedBeltId(e.target.value)}
              >
                <option value="">Select Target Belt...</option>
                {bengkungs?.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsAddUserOpen(false)}>Cancel</Button>
            <Button
              className="bg-blue-600"
              disabled={!selectedBeltId || registerManualMutation.isPending}
              onClick={() => {
                // Since UserLookup might be used without auto-submitting
                toast.info("Please select a student from the lookup above");
              }}
            >
              Add to Event
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
