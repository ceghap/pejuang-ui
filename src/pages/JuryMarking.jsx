import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Loader2, Save, CheckCircle, XCircle, AlertCircle, ClipboardList, User } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { fetchClient } from '@/api/fetchClient';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export default function JuryMarking() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedReg, setSelectedReg] = useState(null);
  const [marks, setMarks] = useState({}); // { syllabusItemId: { mark: number, notes: string } }

  const { data: registrations, isLoading: loadingRegs } = useQuery({
    queryKey: ['event-registrations', eventId],
    queryFn: () => fetchClient(`/ujian-events/${eventId}/registrations`),
  });

  const { data: markingSheet, isLoading: loadingSheet } = useQuery({
    queryKey: ['marking-sheet', selectedReg?.id],
    queryFn: () => fetchClient(`/ujian/registrations/${selectedReg.id}`),
    enabled: !!selectedReg,
  });

  // Effect to initialize marks from markingSheet
  useState(() => {
    if (markingSheet?.syllabus) {
      const initialMarks = {};
      markingSheet.syllabus.forEach(item => {
        initialMarks[item.id] = { mark: item.mark || 0, notes: item.notes || '' };
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
        <Button variant="ghost" onClick={() => navigate('/ujian-events')} className="pl-0">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Events
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Registration List */}
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <ClipboardList className="w-5 h-5" /> Candidates
            </CardTitle>
            <CardDescription>Select a student to enter marks.</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
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
            </div>
          </CardContent>
        </Card>

        {/* Marking Sheet */}
        <div className="col-span-1 lg:col-span-2">
          {selectedReg ? (
            <Card className="border-t-4 border-t-red-700 h-full">
              <CardHeader className="pb-4">
                 <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-2xl font-black">{selectedReg.studentName}</CardTitle>
                      <CardDescription>Examination for <span className="font-bold text-red-700">{selectedReg.bengkungName}</span></CardDescription>
                    </div>
                    <div className="text-right">
                       <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Mark</p>
                       <p className="text-2xl font-mono font-black">{Object.values(marks).reduce((sum, m) => sum + (parseFloat(m.mark) || 0), 0).toFixed(1)}</p>
                    </div>
                 </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {loadingSheet ? (
                  <div className="flex py-20 justify-center"><Loader2 className="animate-spin" /></div>
                ) : (
                  <div className="space-y-4">
                     {markingSheet?.syllabus?.map((item) => (
                       <div key={item.id} className="p-4 rounded-xl border bg-slate-50/50 flex flex-col md:flex-row gap-4 items-start md:items-center">
                          <div className="flex-1">
                             <p className="text-sm font-black">{item.name}</p>
                             <p className="text-[10px] text-muted-foreground uppercase font-mono">Item #{item.orderNo}</p>
                          </div>
                          <div className="flex gap-4 w-full md:w-auto">
                             <div className="w-24">
                                <Label className="text-[10px] uppercase text-slate-500">Mark</Label>
                                <Input 
                                  type="number" 
                                  className="h-9 bg-white" 
                                  value={marks[item.id]?.mark ?? ''} 
                                  onChange={(e) => handleMarkChange(item.id, 'mark', e.target.value)}
                                />
                             </div>
                             <div className="flex-1 md:w-64">
                                <Label className="text-[10px] uppercase text-slate-500">Notes</Label>
                                <Input 
                                  className="h-9 bg-white" 
                                  value={marks[item.id]?.notes ?? ''} 
                                  placeholder="Observation..."
                                  onChange={(e) => handleMarkChange(item.id, 'notes', e.target.value)}
                                />
                             </div>
                          </div>
                       </div>
                     ))}
                  </div>
                )}
              </CardContent>
              <CardFooter className="flex flex-col sm:flex-row gap-4 pt-6 border-t bg-slate-50/50">
                 <Button className="w-full sm:w-auto" variant="secondary" onClick={handleSaveMarks} disabled={saveMarksMutation.isPending}>
                   <Save className="w-4 h-4 mr-2" /> Save Draft Marks
                 </Button>
                 <div className="flex-1" />
                 <div className="flex gap-2 w-full sm:w-auto">
                    <Button variant="outline" className="flex-1 sm:flex-none border-rose-200 text-rose-700 hover:bg-rose-50" onClick={() => finalizeMutation.mutate(false)}>
                       <XCircle className="w-4 h-4 mr-2" /> Fail
                    </Button>
                    <Button className="flex-1 sm:flex-none bg-emerald-600 hover:bg-emerald-700" onClick={() => finalizeMutation.mutate(true)}>
                       <CheckCircle className="w-4 h-4 mr-2" /> Pass Candidate
                    </Button>
                 </div>
              </CardFooter>
            </Card>
          ) : (
            <div className="h-full flex flex-col items-center justify-center border-2 border-dashed rounded-2xl bg-slate-50 text-slate-400 p-12 text-center">
              <User className="w-12 h-12 mb-4 opacity-20" />
              <p className="font-medium">No Candidate Selected</p>
              <p className="text-xs">Pick a student from the left panel to begin marking.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
