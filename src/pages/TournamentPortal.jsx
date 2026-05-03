import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Trophy, MapPin, Calendar, DollarSign, Loader2, User, Users, Info, ShieldCheck, ArrowLeft, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { fetchClient } from '@/api/fetchClient';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { UserLookup } from '@/components/ui/user-lookup';

const formatDate = (dateStr) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  }).format(date);
};

export default function TournamentPortal() {
  const queryClient = useQueryClient();
  const [selectedTournament, setSelectedTournament] = useState(null);
  const [regType, setRegType] = useState(null); // 'individual' or 'team'
  
  // Individual Reg State
  const [indName, setIndName] = useState('');
  const [indIc, setIndIc] = useState('');
  const [indPhone, setIndPhone] = useState('');
  const [indEmail, setIndEmail] = useState('');
  const [indWeightClass, setIndWeightClass] = useState('');
  const [indCategory, setIndCategory] = useState('');
  const [indOrg, setIndOrg] = useState('');

  // Team Reg State
  const [teamOrg, setTeamOrg] = useState('');
  const [teamFighters, setTeamFighters] = useState([]); // { name, weightClass, category }
  const [newFighterName, setNewFighterName] = useState('');

  const { data: tournaments, isLoading } = useQuery({
    queryKey: ['tournament-events-public'],
    queryFn: () => fetchClient('/tournament-events'),
  });

  const individualMutation = useMutation({
    mutationFn: (data) => fetchClient(`/tournament-events/${data.eventId}/register-external-individual`, {
      method: 'POST',
      body: JSON.stringify(data.registration),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries(['tournament-events-public']);
      setRegType(null);
      setSelectedTournament(null);
      toast.success('Registration submitted successfully');
    },
    onError: (error) => toast.error(error.message)
  });

  const teamMutation = useMutation({
    mutationFn: (data) => fetchClient(`/tournament-events/${data.eventId}/register-external-team`, {
      method: 'POST',
      body: JSON.stringify(data.registration),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries(['tournament-events-public']);
      setRegType(null);
      setSelectedTournament(null);
      setTeamFighters([]);
      toast.success('Team registration submitted successfully');
    },
    onError: (error) => toast.error(error.message)
  });

  if (isLoading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  const openTournaments = tournaments?.filter(t => t.status === 'RegistrationOpen' || t.status === 'Draft');

  return (
    <div className="p-4 md:p-8 pt-6 space-y-8 max-w-7xl mx-auto pb-20">
      <div className="space-y-2">
        <h1 className="text-3xl font-black tracking-tight text-slate-900 flex items-center gap-3">
          <Trophy className="w-10 h-10 text-emerald-500" /> MACAT <span className="font-light italic text-emerald-600">Portal</span>
        </h1>
        <p className="text-muted-foreground font-medium">Register for upcoming silat tournaments and championships.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {openTournaments?.map((t) => (
          <Card key={t.id} className="overflow-hidden border-border/50 hover:shadow-2xl transition-all duration-300 group flex flex-col">
            <div className="h-2 bg-emerald-500" />
            <CardHeader className="bg-slate-50/50">
              <div className="flex justify-between items-start mb-2">
                <Badge variant="outline" className="text-[10px] font-black uppercase tracking-widest bg-emerald-50 text-emerald-700 border-emerald-100">
                  {t.status === 'RegistrationOpen' ? 'Registration Open' : 'Upcoming'}
                </Badge>
                <p className="text-sm font-black text-emerald-600 font-mono">RM {t.registrationFee}</p>
              </div>
              <CardTitle className="text-xl font-black uppercase tracking-tight group-hover:text-emerald-600 transition-colors">
                {t.name}
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 space-y-4 pt-6">
              <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed">
                {t.description || 'No description provided.'}
              </p>
              <div className="space-y-2 pt-2">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
                  <Calendar className="w-4 h-4 text-emerald-500" />
                  {formatDate(t.startDate)} - {formatDate(t.endDate)}
                </div>
                <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
                  <MapPin className="w-4 h-4 text-rose-500" />
                  {t.location}
                </div>
              </div>
            </CardContent>
            <CardFooter className="bg-slate-50/30 p-4 pt-0">
              <Button 
                onClick={() => setSelectedTournament(t)}
                className="w-full bg-emerald-600 hover:bg-emerald-700 font-black uppercase tracking-widest text-[11px] h-11 shadow-lg shadow-emerald-500/10"
              >
                Register Now
              </Button>
            </CardFooter>
          </Card>
        ))}

        {!openTournaments?.length && (
          <div className="col-span-full py-24 text-center border-2 border-dashed rounded-3xl space-y-4 bg-slate-50/50">
            <Trophy className="w-12 h-12 text-slate-200 mx-auto" />
            <div className="space-y-1">
              <p className="text-sm font-black uppercase tracking-widest text-slate-400">No tournaments available</p>
              <p className="text-xs text-slate-400 italic">Check back soon for upcoming championships.</p>
            </div>
          </div>
        )}
      </div>

      {/* Main Registration Dialog */}
      <Dialog open={!!selectedTournament} onOpenChange={(open) => { if(!open) { setSelectedTournament(null); setRegType(null); } }}>
        <DialogContent className="sm:max-w-[500px] rounded-3xl border-slate-200 shadow-2xl">
          {!regType ? (
            <div className="space-y-6 py-6">
              <div className="text-center space-y-2">
                <h2 className="text-2xl font-black uppercase italic text-emerald-900 tracking-tight">Register for MACAT</h2>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{selectedTournament?.name}</p>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <Button 
                  variant="outline" 
                  onClick={() => setRegType('individual')}
                  className="h-24 flex flex-col gap-2 rounded-2xl border-2 border-slate-100 hover:border-emerald-500 hover:bg-emerald-50 transition-all group"
                >
                  <User className="w-6 h-6 text-emerald-500 group-hover:scale-110 transition-transform" />
                  <span className="font-black uppercase tracking-widest text-xs">Individual Registration</span>
                  <span className="text-[9px] font-medium text-slate-400">Register yourself (Open to all silat)</span>
                </Button>

                <Button 
                  variant="outline" 
                  onClick={() => setRegType('team')}
                  className="h-24 flex flex-col gap-2 rounded-2xl border-2 border-slate-100 hover:border-emerald-500 hover:bg-emerald-50 transition-all group"
                >
                  <Users className="w-6 h-6 text-blue-500 group-hover:scale-110 transition-transform" />
                  <span className="font-black uppercase tracking-widest text-xs">Team / Organization Registration</span>
                  <span className="text-[9px] font-medium text-slate-400">Register a batch of fighters for your team</span>
                </Button>
              </div>
            </div>
          ) : regType === 'individual' ? (
            <div className="space-y-6 pt-4">
              <div className="flex items-center gap-3 border-b pb-4">
                <Button variant="ghost" size="sm" onClick={() => setRegType(null)} className="h-8 w-8 p-0 rounded-full">
                  <ArrowLeft className="w-4 h-4" />
                </Button>
                <div>
                  <h3 className="text-lg font-black uppercase">Individual Registration</h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Provide your details for {selectedTournament?.name}</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-black uppercase text-slate-400">Full Name</Label>
                  <Input 
                    placeholder="Enter your full name" 
                    className="h-10 text-xs font-bold"
                    value={indName}
                    onChange={(e) => setIndName(e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-black uppercase text-slate-400">IC Number</Label>
                    <Input 
                      placeholder="990101015555" 
                      className="h-10 text-xs font-bold"
                      value={indIc}
                      onChange={(e) => setIndIc(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-black uppercase text-slate-400">Phone Number</Label>
                    <Input 
                      placeholder="0123456789" 
                      className="h-10 text-xs font-bold"
                      value={indPhone}
                      onChange={(e) => setIndPhone(e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-black uppercase text-slate-400">Email Address (Optional)</Label>
                  <Input 
                    type="email"
                    placeholder="you@example.com" 
                    className="h-10 text-xs font-bold"
                    value={indEmail}
                    onChange={(e) => setIndEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-black uppercase text-slate-400">Silat Organization Name</Label>
                  <Input 
                    placeholder="e.g. Silat Gayong Maarifat / Silat Lincah" 
                    className="h-10 text-xs font-bold"
                    value={indOrg}
                    onChange={(e) => setIndOrg(e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-black uppercase text-slate-400">Weight Class</Label>
                    <Input 
                      placeholder="e.g. Class A" 
                      className="h-10 text-xs font-bold"
                      value={indWeightClass}
                      onChange={(e) => setIndWeightClass(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-black uppercase text-slate-400">Category</Label>
                    <Input 
                      placeholder="e.g. Putera Remaja" 
                      className="h-10 text-xs font-bold"
                      value={indCategory}
                      onChange={(e) => setIndCategory(e.target.value)}
                    />
                  </div>
                </div>

                <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-xl flex gap-3">
                  <Info className="w-4 h-4 text-emerald-600 mt-0.5" />
                  <p className="text-[10px] text-emerald-800 leading-relaxed font-medium italic">
                    By registering, you confirm that you have valid medical clearance and are fit to compete in this championship.
                  </p>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button variant="ghost" onClick={() => setRegType(null)} className="uppercase text-[10px] font-black tracking-widest">Back</Button>
                <Button 
                  onClick={() => individualMutation.mutate({
                    eventId: selectedTournament.id,
                    registration: { 
                      name: indName,
                      icNumber: indIc,
                      phoneNumber: indPhone,
                      email: indEmail,
                      weightClass: indWeightClass, 
                      category: indCategory, 
                      organizationName: indOrg 
                    }
                  })}
                  disabled={!indName || !indIc || !indPhone || !indOrg || !indWeightClass || !indCategory || individualMutation.isPending}
                  className="bg-emerald-600 hover:bg-emerald-700 font-black uppercase tracking-widest text-[10px] h-11 px-8 shadow-lg shadow-emerald-500/10"
                >
                  {individualMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin mr-2" /> : <ShieldCheck className="w-3 h-3 mr-2" />}
                  Submit Registration
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-6 pt-4">
              <div className="flex items-center gap-3 border-b pb-4">
                <Button variant="ghost" size="sm" onClick={() => setRegType(null)} className="h-8 w-8 p-0 rounded-full">
                  <ArrowLeft className="w-4 h-4" />
                </Button>
                <div>
                  <h3 className="text-lg font-black uppercase">Team Registration</h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Register multiple fighters for your organization</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-black uppercase text-slate-400">Organization Name</Label>
                  <Input 
                    placeholder="e.g. Pertubuhan Seni Silat Sendeng" 
                    className="h-10 text-xs font-bold"
                    value={teamOrg}
                    onChange={(e) => setTeamOrg(e.target.value)}
                  />
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-[10px] font-black uppercase text-slate-400">Team Roster ({teamFighters.length})</Label>
                  </div>
                  
                  <div className="p-4 border-2 border-dashed rounded-xl bg-slate-50/50 space-y-4">
                    <p className="text-[9px] font-black uppercase text-slate-400 text-center tracking-widest mb-2">Add Fighter to Roster</p>
                    <div className="flex gap-2">
                      <Input 
                        placeholder="Enter Fighter Name..." 
                        className="h-10 text-xs font-bold bg-white"
                        value={newFighterName}
                        onChange={(e) => setNewFighterName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            if (newFighterName.trim()) {
                              setTeamFighters([...teamFighters, { name: newFighterName.trim(), icNumber: '', phoneNumber: '', weightClass: '', category: '' }]);
                              setNewFighterName('');
                            }
                          }
                        }}
                      />
                      <Button 
                        type="button"
                        onClick={() => {
                          if (newFighterName.trim()) {
                            setTeamFighters([...teamFighters, { name: newFighterName.trim(), icNumber: '', phoneNumber: '', weightClass: '', category: '' }]);
                            setNewFighterName('');
                          }
                        }}
                        className="bg-emerald-600 h-10 w-10 p-0"
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
                    {teamFighters.map((f, idx) => (
                      <Card key={idx} className="p-4 border-slate-100 bg-white relative group space-y-3">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-6 w-6 absolute top-2 right-2 text-slate-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => setTeamFighters(teamFighters.filter((_, itemIdx) => itemIdx !== idx))}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                        <p className="text-[11px] font-black uppercase pr-8 text-emerald-700">{f.name}</p>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <Label className="text-[8px] font-black uppercase text-slate-400">IC Number</Label>
                            <Input 
                              placeholder="IC Number" 
                              className="h-8 text-[9px] font-bold"
                              value={f.icNumber}
                              onChange={(e) => {
                                const newList = [...teamFighters];
                                newList[idx].icNumber = e.target.value;
                                setTeamFighters(newList);
                              }}
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-[8px] font-black uppercase text-slate-400">Phone Number</Label>
                            <Input 
                              placeholder="Phone" 
                              className="h-8 text-[9px] font-bold"
                              value={f.phoneNumber}
                              onChange={(e) => {
                                const newList = [...teamFighters];
                                newList[idx].phoneNumber = e.target.value;
                                setTeamFighters(newList);
                              }}
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <Label className="text-[8px] font-black uppercase text-slate-400">Weight Class</Label>
                            <Input 
                              placeholder="e.g. Class A" 
                              className="h-8 text-[9px] font-bold"
                              value={f.weightClass}
                              onChange={(e) => {
                                const newList = [...teamFighters];
                                newList[idx].weightClass = e.target.value;
                                setTeamFighters(newList);
                              }}
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-[8px] font-black uppercase text-slate-400">Category</Label>
                            <Input 
                              placeholder="e.g. Putera" 
                              className="h-8 text-[9px] font-bold"
                              value={f.category}
                              onChange={(e) => {
                                const newList = [...teamFighters];
                                newList[idx].category = e.target.value;
                                setTeamFighters(newList);
                              }}
                            />
                          </div>
                        </div>
                      </Card>
                    ))}
                    {teamFighters.length === 0 && (
                      <p className="text-[10px] text-slate-400 italic text-center py-6">No fighters added yet.</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button variant="ghost" onClick={() => setRegType(null)} className="uppercase text-[10px] font-black tracking-widest">Back</Button>
                <Button 
                  onClick={() => teamMutation.mutate({
                    eventId: selectedTournament.id,
                    registration: { 
                      organizationName: teamOrg, 
                      registrations: teamFighters.map(f => ({ 
                        name: f.name,
                        icNumber: f.icNumber,
                        phoneNumber: f.phoneNumber,
                        weightClass: f.weightClass, 
                        category: f.category 
                      }))
                    }
                  })}
                  disabled={!teamOrg || teamFighters.length === 0 || teamFighters.some(f => !f.icNumber || !f.phoneNumber || !f.weightClass || !f.category) || teamMutation.isPending}
                  className="bg-blue-600 hover:bg-blue-700 font-black uppercase tracking-widest text-[10px] h-11 px-8 shadow-lg shadow-blue-500/10"
                >
                  {teamMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin mr-2" /> : <ShieldCheck className="w-3 h-3 mr-2" />}
                  Register Team
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
