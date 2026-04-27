import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Loader2, Save, CheckCircle, XCircle, AlertCircle, ClipboardList, User, UserPlus, Trash2, CheckCircle2 } from 'lucide-react';
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
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
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
  const [deleteRegId, setDeleteRegId] = useState(null);

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
      toast.success('Marks saved');
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

  const deleteRegMutation = useMutation({
    mutationFn: (id) => fetchClient(`/ujian/registrations/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries(['event-registrations', eventId]);
      setSelectedReg(null);
      setDeleteRegId(null);
      toast.success('Candidate registration removed');
    },
    onError: (err) => toast.error(err.message)
  });

  const finalizeMutation = useMutation({
    mutationFn: () => fetchClient(`/ujian/registrations/${selectedReg.id}/finalize`, {
      method: 'POST',
      // No body needed anymore, backend calculates based on marks
    }),
    onSuccess: (data) => {
      queryClient.invalidateQueries(['event-registrations', eventId]);
      setSelectedReg(null);
      if (data.passed) {
        toast.success(`Candidate Passed! Average: ${data.totalMark.toFixed(1)}%`);
      } else {
        toast.error(`Candidate Failed. Average: ${data.totalMark.toFixed(1)}%`);
      }
    },
    onError: (err) => toast.error(err.message)
  });

  const handleMarkChange = (id, field, value) => {
    let finalValue = value;
    if (field === 'mark') {
      const num = parseFloat(value);
      if (!isNaN(num)) {
        finalValue = Math.min(100, Math.max(0, num)).toString();
      }
    }
    setMarks(prev => ({
      ...prev,
      [id]: { ...prev[id], [field]: finalValue }
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

  const handleCompleteAndFinalize = async () => {
    const data = Object.entries(marks).map(([id, val]) => ({
      syllabusItemId: id,
      mark: parseFloat(val.mark) || 0,
      notes: val.notes
    }));
    
    // Save marks first, then finalize on success
    saveMarksMutation.mutate(data, {
      onSuccess: () => {
        finalizeMutation.mutate();
      }
    });
  };

  if (loadingRegs) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const selectedBengkungInfo = selectedReg ? bengkungs?.find(b => b.name === selectedReg.bengkungName) : null;

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto pb-24">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => navigate('/admin/ujian-events')} className="pl-0">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Events
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Candidate Sidebar */}
        <Card className="col-span-1 border-border/50">
          <CardHeader className="pb-4 bg-muted/20 border-b">
            <div className="flex items-center justify-between">
               <CardTitle className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                 <ClipboardList className="w-3.5 h-3.5" /> Candidates
               </CardTitle>
               <Button size="icon" variant="ghost" className="text-blue-600 h-8 w-8 hover:bg-blue-50" onClick={() => setIsAddUserOpen(true)}>
                  <UserPlus className="w-4 h-4" />
               </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-slate-50 max-h-[600px] overflow-y-auto pr-1 custom-scrollbar">
              {registrations?.map((reg) => (
                <div 
                  key={reg.id} 
                  className={cn(
                    "p-4 group cursor-pointer hover:bg-slate-50 transition-colors relative",
                    selectedReg?.id === reg.id ? "bg-red-50/50 border-r-4 border-r-red-600" : "border-r-4 border-r-transparent"
                  )}
                  onClick={() => setSelectedReg(reg)}
                >
                  <div className="flex justify-between items-start pr-8">
                    <div>
                      <p className={cn("font-bold text-sm", selectedReg?.id === reg.id ? "text-red-900" : "text-slate-900")}>{reg.studentName}</p>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{reg.bengkungName}</p>
                    </div>
                    {reg.status === 'Passed' && <Badge className="bg-emerald-50 text-emerald-700 border-emerald-100 text-[8px] font-black uppercase">PASSED</Badge>}
                    {reg.status === 'Failed' && <Badge className="bg-rose-50 text-rose-700 border-rose-100 text-[8px] font-black uppercase">FAILED</Badge>}
                    {reg.status === 'Registered' && <Badge variant="outline" className="text-[8px] font-black uppercase text-slate-400 border-slate-200">PENDING</Badge>}
                  </div>
                  <Button 
                    size="icon" 
                    variant="ghost" 
                    className="absolute right-2 top-4 h-7 w-7 text-slate-200 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity rounded-full"
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteRegId(reg.id);
                    }}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              ))}
              {!registrations?.length && (
                <div className="p-12 text-center text-[10px] font-black uppercase text-slate-300 tracking-widest italic opacity-50">No candidates</div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Marking Sheet */}
        <div className="col-span-1 lg:col-span-2">
          {selectedReg ? (
            <Card className="border-t-4 border-t-red-700 h-full flex flex-col border-border/50">
              <CardHeader className="pb-4 bg-muted/5 shrink-0 border-b">
                 <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-xl font-black uppercase italic text-slate-900 leading-tight">{selectedReg.studentName}</CardTitle>
                      <CardDescription className="text-[10px] font-bold uppercase tracking-widest mt-1">
                         Rank Target: <span className="text-red-600 font-black">{selectedReg.bengkungName}</span>
                         {selectedBengkungInfo && (
                            <span className="ml-2 text-slate-400"> (Min to pass: {selectedBengkungInfo.minMarkToPass}%)</span>
                         )}
                      </CardDescription>
                    </div>
                    <div className="text-right">
                       <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Average Score</p>
                       <p className="text-3xl font-mono font-black text-red-700">
                          {(() => {
                             const vals = Object.values(marks);
                             const sum = vals.reduce((s, m) => s + (parseFloat(m.mark) || 0), 0);
                             return vals.length > 0 ? (sum / vals.length).toFixed(1) : '0.0';
                          })()}%
                       </p>
                    </div>
                 </div>
              </CardHeader>
              <CardContent className="p-6 flex-1 overflow-y-auto min-h-0">
                {loadingSheet ? (
                  <div className="flex py-20 justify-center"><Loader2 className="animate-spin text-red-600" /></div>
                ) : (
                  <div className="space-y-3 pb-4">
                     <div className="bg-amber-50 border border-amber-100 p-3 rounded-xl mb-6 flex items-start gap-3">
                        <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                        <p className="text-[10px] text-amber-800 leading-relaxed font-medium">
                          Enter technical scores (0-100). Scores are saved automatically when you complete. 
                          The system will determine pass/fail based on the average.
                        </p>
                     </div>

                     {markingSheet?.syllabus?.map((item) => (
                       <div key={item.id} className="p-4 rounded-2xl border bg-white flex flex-col gap-4 hover:border-slate-300 transition-all shadow-sm">
                          <div className="flex justify-between items-start">
                             <div className="flex-1">
                                <p className="text-sm font-black text-slate-900 uppercase tracking-tight">{item.name}</p>
                                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest font-mono">Silibus Item #{item.orderNo}</p>
                             </div>
                             <div className="text-right">
                                <span className="text-2xl font-mono font-black text-slate-900">{marks[item.id]?.mark || 0}</span>
                                <span className="text-xs font-black text-slate-400 ml-0.5">%</span>
                             </div>
                          </div>

                          <div className="space-y-3">
                             <div className="flex items-center gap-4">
                                <input 
                                  type="range"
                                  min="0"
                                  max="100"
                                  step="1"
                                  className="flex-1 h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                                  value={marks[item.id]?.mark || 0}
                                  onChange={(e) => handleMarkChange(item.id, 'mark', e.target.value)}
                                />
                             </div>
                             
                             <div className="flex justify-between gap-1">
                                {[0, 20, 40, 60, 80, 100].map((v) => (
                                   <Button
                                      key={v}
                                      type="button"
                                      variant="ghost"
                                      className={cn(
                                         "flex-1 h-7 text-[10px] font-black rounded-md transition-all",
                                         marks[item.id]?.mark == v 
                                            ? "bg-emerald-600 text-white hover:bg-emerald-700 shadow-md" 
                                            : "bg-slate-50 text-slate-500 hover:bg-slate-100"
                                      )}
                                      onClick={() => handleMarkChange(item.id, 'mark', v.toString())}
                                   >
                                      {v === 100 ? 'MAX' : v}
                                   </Button>
                                ))}
                             </div>

                             <div className="flex gap-3 items-center pt-1">
                                <Label className="text-[9px] font-black uppercase text-slate-400 shrink-0">Notes</Label>
                                <Input 
                                  className="h-8 text-xs border-slate-100 focus:border-emerald-500 bg-slate-50/50 rounded-lg font-medium italic" 
                                  value={marks[item.id]?.notes ?? ''} 
                                  placeholder="Observations..."
                                  onChange={(e) => handleMarkChange(item.id, 'notes', e.target.value)}
                                />
                             </div>
                          </div>
                       </div>
                     ))}

                     {!markingSheet?.syllabus?.length && (
                       <div className="p-20 text-center border-2 border-dashed rounded-2xl text-slate-300 font-black uppercase text-[10px] tracking-widest italic opacity-40">
                         No silibus items defined
                       </div>
                     )}
                  </div>
                )}
              </CardContent>
              <CardFooter className="flex flex-col sm:flex-row gap-4 pt-6 border-t bg-muted/10 shrink-0 p-6">
                 <Button className="w-full sm:w-auto uppercase text-[10px] font-black tracking-widest h-10 px-6 rounded-xl" variant="ghost" onClick={handleSaveMarks} disabled={saveMarksMutation.isPending || !selectedReg}>
                   {saveMarksMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-2" /> : <Save className="w-3.5 h-3.5 mr-2 opacity-50" />}
                   Save Draft
                 </Button>
                 <div className="flex-1" />
                 <Button 
                    className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-500/20 uppercase text-[10px] font-black tracking-[0.2em] h-10 px-10 rounded-xl transition-all border-none" 
                    onClick={handleCompleteAndFinalize} 
                    disabled={finalizeMutation.isPending || saveMarksMutation.isPending || !selectedReg}
                 >
                    {finalizeMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-2" /> : <CheckCircle2 className="w-3.5 h-3.5 mr-2 text-white" />}
                    Complete & Finalize
                 </Button>
              </CardFooter>
            </Card>
          ) : (
            <div className="h-full flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-3xl bg-slate-50 text-slate-400 p-20 text-center min-h-[500px] shadow-inner">
              <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-6 shadow-sm border border-white">
                <User className="w-10 h-10 opacity-20 text-slate-900" />
              </div>
              <p className="font-black uppercase tracking-[0.2em] text-slate-600 text-sm italic">No Candidate Selected</p>
              <p className="text-[10px] max-w-[220px] mx-auto mt-2 font-medium leading-relaxed uppercase tracking-tight opacity-50">Select a candidate from the roster to begin technical silibus evaluation.</p>
            </div>
          )}
        </div>
      </div>

      {/* Manual Registration Dialog */}
      <Dialog open={isAddUserOpen} onOpenChange={setIsAddUserOpen}>
         <DialogContent className="rounded-3xl border-slate-200 shadow-2xl">
            <DialogHeader className="pb-4 border-b">
               <DialogTitle className="text-lg font-black uppercase italic">Manual Registration</DialogTitle>
               <DialogDescription className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Force register a student for this examination event.</DialogDescription>
            </DialogHeader>
            <div className="space-y-5 py-6">
               <div className="space-y-1">
                  <Label className="text-[10px] font-black uppercase text-slate-400 ml-1">Search Member</Label>
                  <UserLookup 
                    onChange={(uid) => {
                      if (uid && selectedBeltId) {
                        registerManualMutation.mutate({ userId: uid, targetBengkungId: selectedBeltId });
                      }
                    }}
                    placeholder="Search name, IC, phone..."
                  />
               </div>
               <div className="space-y-1">
                  <Label className="text-[10px] font-black uppercase text-slate-400 ml-1">Target Rank (Bengkung)</Label>
                  <select 
                    className="w-full bg-white border border-slate-200 rounded-xl h-10 px-3 text-xs font-black uppercase outline-none focus:ring-2 focus:ring-primary/10 transition-all appearance-none"
                    style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 24 24\' stroke=\'currentColor\'%3E%3Cpath stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'2\' d=\'M19 9l-7 7-7-7\' /%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.75rem center', backgroundSize: '1rem' }}
                    value={selectedBeltId}
                    onChange={(e) => setSelectedBeltId(e.target.value)}
                  >
                     <option value="">Select Target Rank...</option>
                     {bengkungs?.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
               </div>
            </div>
            <DialogFooter className="border-t pt-4">
               <Button variant="ghost" onClick={() => setIsAddUserOpen(false)} className="uppercase text-[10px] font-black tracking-widest">Cancel</Button>
            </DialogFooter>
         </DialogContent>
      </Dialog>

      <ConfirmDialog 
        isOpen={!!deleteRegId}
        onClose={() => setDeleteRegId(null)}
        onConfirm={() => deleteRegMutation.mutate(deleteRegId)}
        title="Cancel Registration"
        description="Are you sure? This will permanently remove the candidate and all their technical marks from this event."
        isLoading={deleteRegMutation.isPending}
        confirmText="Remove Registration"
        variant="destructive"
      />
    </div>
  );
}
