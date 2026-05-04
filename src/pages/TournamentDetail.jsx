import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Trophy, MapPin, Loader2, Users, Calendar as CalendarIcon, 
  ChevronLeft, GitBranch, Play, CheckCircle2, AlertCircle 
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Check, X, AlertTriangle, ShieldCheck } from 'lucide-react';
import MatchScoring from '@/components/tournaments/MatchScoring';
import { fetchClient } from '@/api/fetchClient';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const formatDate = (dateStr) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  }).format(date);
};

export default function TournamentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("overview");
  const [scoringMatch, setScoringMatch] = useState(null);

  const { data: registrations, isLoading: isLoadingRegs } = useQuery({
    queryKey: ['tournament-registrations', id],
    queryFn: () => fetchClient(`/tournament-events/${id}/registrations`),
  });

  const updateRegStatusMutation = useMutation({
    mutationFn: ({ regId, status }) => fetchClient(`/tournament-registrations/${regId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status })
    }),
    onSuccess: () => {
      queryClient.invalidateQueries(['tournament-registrations', id]);
      toast.success("Registration status updated");
    },
    onError: (error) => toast.error(error.message)
  });

  const { data: brackets, isLoading: isLoadingBrackets } = useQuery({
    queryKey: ['tournament-brackets', id],
    queryFn: () => fetchClient(`/tournaments/${id}/brackets`),
    enabled: tournament?.status === 'BracketsGenerated' || tournament?.status === 'Ongoing' || tournament?.status === 'Completed'
  });

  const generateBracketsMutation = useMutation({
    mutationFn: () => fetchClient(`/tournaments/${id}/generate-brackets`, { method: 'POST' }),
    onSuccess: () => {
      queryClient.invalidateQueries(['tournament', id]);
      queryClient.invalidateQueries(['tournament-brackets', id]);
      toast.success("Brackets generated successfully");
      setActiveTab("brackets");
    },
    onError: (error) => toast.error(error.message)
  });

  if (isLoading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!tournament) return <div>Tournament not found</div>;

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/manage-tournaments')}>
          <ChevronLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-emerald-900 flex items-center gap-2">
            {tournament.name}
          </h1>
          <div className="flex items-center gap-4 mt-1">
            <Badge variant="outline" className={cn(
              "text-[10px] uppercase",
              tournament.status === 'Draft' && "bg-slate-50 text-slate-500",
              tournament.status === 'RegistrationOpen' && "bg-blue-50 text-blue-700 border-blue-200",
              tournament.status === 'BracketsGenerated' && "bg-purple-50 text-purple-700 border-purple-200",
              tournament.status === 'Ongoing' && "bg-amber-50 text-amber-700 border-amber-200",
              tournament.status === 'Completed' && "bg-emerald-50 text-emerald-700 border-emerald-200"
            )}>
              {tournament.status}
            </Badge>
            <span className="text-sm text-muted-foreground flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5" /> {tournament.location}
            </span>
            <span className="text-sm text-muted-foreground flex items-center gap-1">
              <CalendarIcon className="w-3.5 h-3.5" /> {formatDate(tournament.startDate)} - {formatDate(tournament.endDate)}
            </span>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-slate-100/50 p-1">
          <TabsTrigger value="overview" className="data-[state=active]:bg-white data-[state=active]:text-emerald-900 data-[state=active]:shadow-sm">
            Overview
          </TabsTrigger>
          <TabsTrigger value="registrations" className="data-[state=active]:bg-white data-[state=active]:text-emerald-900 data-[state=active]:shadow-sm">
            Registrations
          </TabsTrigger>
          <TabsTrigger value="brackets" className="data-[state=active]:bg-white data-[state=active]:text-emerald-900 data-[state=active]:shadow-sm">
            Brackets & Matches
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid grid-cols-1 lg:grid-span-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-bold uppercase tracking-widest">About Tournament</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-slate-600 leading-relaxed">{tournament.description || "No description provided."}</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
                  <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
                    <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Status</div>
                    <div className="text-xl font-bold text-emerald-900 mt-1">{tournament.status}</div>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
                    <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Total Fighters</div>
                    <div className="text-xl font-bold text-emerald-900 mt-1">{tournament.registrationCount}</div>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
                    <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Reg. Fee</div>
                    <div className="text-xl font-bold text-emerald-900 mt-1">RM {tournament.registrationFee}</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-emerald-100 bg-emerald-50/20">
              <CardHeader>
                <CardTitle className="text-sm font-bold uppercase tracking-widest flex items-center gap-2">
                  <GitBranch className="w-4 h-4 text-emerald-600" /> Administrative Actions
                </CardTitle>
                <CardDescription>Control the tournament lifecycle and engine.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-3">
                  {(tournament.status === 'RegistrationOpen' || tournament.status === 'Draft') && (
                    <Button 
                      onClick={() => generateBracketsMutation.mutate()} 
                      disabled={generateBracketsMutation.isPending || tournament.registrationCount === 0}
                      className="bg-emerald-700 hover:bg-emerald-800"
                    >
                      {generateBracketsMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <GitBranch className="mr-2 h-4 w-4" />}
                      Generate Brackets
                    </Button>
                  )}
                  {tournament.status === 'BracketsGenerated' && (
                    <Button className="bg-amber-600 hover:bg-amber-700">
                      <Play className="mr-2 h-4 w-4" /> Start Tournament
                    </Button>
                  )}
                  {tournament.status === 'Ongoing' && (
                    <Button className="bg-emerald-600 hover:bg-emerald-700">
                      <CheckCircle2 className="mr-2 h-4 w-4" /> Finalize Tournament
                    </Button>
                  )}
                </div>
                {tournament.registrationCount === 0 && (
                   <p className="text-xs text-rose-600 flex items-center gap-1">
                     <AlertCircle className="w-3 h-3" /> Brackets cannot be generated without registrations.
                   </p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="registrations">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-sm font-bold uppercase tracking-widest">Fighter Registrations</CardTitle>
                <CardDescription>Verify weights and approve participants.</CardDescription>
              </div>
              <div className="flex items-center gap-2 bg-amber-50 border border-amber-100 px-3 py-1.5 rounded-lg">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                <span className="text-[10px] font-bold text-amber-800 uppercase tracking-tight">Check missing weights before generating</span>
              </div>
            </CardHeader>
            <CardContent>
              {isLoadingRegs ? (
                <div className="flex h-[200px] items-center justify-center">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fighter Name</TableHead>
                      <TableHead>IC Number</TableHead>
                      <TableHead>Gelanggang / Org</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Weight (kg)</TableHead>
                      <TableHead>Height (cm)</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {registrations?.map((reg) => (
                      <TableRow key={reg.id}>
                        <TableCell className="font-bold text-slate-900">{reg.name}</TableCell>
                        <TableCell className="font-mono text-[11px] text-slate-500">{reg.icNumber}</TableCell>
                        <TableCell className="text-xs">{reg.gelanggang}</TableCell>
                        <TableCell><Badge variant="outline" className="text-[9px] uppercase">{reg.category}</Badge></TableCell>
                        <TableCell>
                          {(reg.weight !== null && reg.weight !== undefined) ? (
                            <span className="font-bold text-emerald-700">{reg.weight} kg</span>
                          ) : (
                            <span className="flex items-center gap-1 text-rose-600 font-black uppercase text-[9px] animate-pulse">
                              <AlertTriangle className="w-3 h-3" /> Undefined
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-slate-500">{reg.height ? `${reg.height} cm` : '-'}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={cn(
                            "text-[9px] uppercase font-black",
                            reg.registrationStatus === 'Approved' ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                            reg.registrationStatus === 'Rejected' ? "bg-rose-50 text-rose-500 border-rose-200" :
                            "bg-slate-100 text-slate-500 border-slate-200"
                          )}>
                            {reg.registrationStatus}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 text-emerald-600 hover:bg-emerald-50"
                              onClick={() => updateRegStatusMutation.mutate({ regId: reg.id, status: 'Approved' })}
                              disabled={updateRegStatusMutation.isPending}
                            >
                              <Check className="w-4 h-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 text-rose-600 hover:bg-rose-50"
                              onClick={() => updateRegStatusMutation.mutate({ regId: reg.id, status: 'Rejected' })}
                              disabled={updateRegStatusMutation.isPending}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    {!registrations?.length && (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-12 text-muted-foreground italic">
                          No registrations found for this tournament.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="brackets">
          {isLoadingBrackets ? (
             <div className="flex h-[200px] items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
             </div>
          ) : !brackets || brackets.length === 0 ? (
             <Card>
                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                  <GitBranch className="w-12 h-12 text-slate-200 mb-4" />
                  <h3 className="font-bold text-slate-900">No Brackets Generated</h3>
                  <p className="text-sm text-muted-foreground max-w-xs mt-1">
                    Once registrations are approved, generate the brackets to see the match schedule.
                  </p>
                  <Button 
                    variant="outline" 
                    className="mt-6" 
                    onClick={() => setActiveTab("overview")}
                  >
                    Go to Overview
                  </Button>
                </CardContent>
             </Card>
          ) : (
            <div className="space-y-8">
              {brackets.map((bracket) => (
                <Card key={bracket.id}>
                  <CardHeader className="border-b bg-slate-50/50">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-lg text-emerald-900 font-bold">{bracket.category}</CardTitle>
                        <CardDescription className="font-medium text-emerald-600">{bracket.weightClass}</CardDescription>
                      </div>
                      <Badge variant="secondary" className="bg-white">{bracket.type}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6">
                     <div className="overflow-x-auto pb-4">
                        <div className="flex gap-8 min-w-max">
                           {/* Simplified Bracket Visualization */}
                           {Array.from({ length: Math.max(...bracket.matches.map(m => m.round)) }).map((_, idx) => {
                             const round = idx + 1;
                             const roundMatches = bracket.matches.filter(m => m.round === round);
                             return (
                               <div key={round} className="space-y-8 w-64">
                                 <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground text-center mb-4">
                                   Round {round}
                                 </div>
                                 <div className="flex flex-col justify-around h-full gap-4">
                                    {roundMatches.map(match => (
                                      <div key={match.id} className="relative group">
                                         <button 
                                           onClick={() => {
                                             if (match.fighterA && match.fighterB && match.status !== 'Completed' && match.status !== 'Bye') {
                                               setScoringMatch(match);
                                             }
                                           }}
                                           disabled={!match.fighterA || !match.fighterB || match.status === 'Completed' || match.status === 'Bye'}
                                           className={cn(
                                           "w-full text-left p-3 rounded-md border text-sm shadow-sm transition-all",
                                           match.status === 'Ongoing' ? "border-amber-200 bg-amber-50" : "border-slate-200 bg-white hover:border-slate-300",
                                           (match.status === 'Completed' || match.status === 'Bye') && "opacity-80 bg-slate-50",
                                           match.fighterA && match.fighterB && match.status !== 'Completed' && match.status !== 'Bye' && "cursor-pointer group-hover:shadow-md group-hover:-translate-y-0.5"
                                         )}>
                                            <div className="flex flex-col gap-2">
                                               <div className={cn(
                                                 "flex justify-between items-center px-2 py-1 rounded",
                                                 match.winner?.id === match.fighterA?.id && match.winner != null ? "bg-emerald-50 text-emerald-700 font-bold" : ""
                                               )}>
                                                 <span className="truncate">{match.fighterA?.name || "TBD"}</span>
                                               </div>
                                               <div className="h-px bg-slate-100 mx-2" />
                                               <div className={cn(
                                                 "flex justify-between items-center px-2 py-1 rounded",
                                                 match.winner?.id === match.fighterB?.id && match.winner != null ? "bg-emerald-50 text-emerald-700 font-bold" : ""
                                               )}>
                                                 <span className="truncate">{match.fighterB?.name || "TBD"}</span>
                                               </div>
                                            </div>
                                         </button>
                                         <div className="text-[9px] text-muted-foreground mt-1 text-center">Match #{match.matchNumber}</div>
                                      </div>
                                    ))}
                                 </div>
                               </div>
                             );
                           })}
                        </div>
                     </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={!!scoringMatch} onOpenChange={(open) => !open && setScoringMatch(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Tournament Judging</DialogTitle>
          </DialogHeader>
          {scoringMatch && (
            <MatchScoring 
              match={scoringMatch} 
              onScoringComplete={() => {
                setScoringMatch(null);
                queryClient.invalidateQueries(['tournament-brackets', id]);
              }} 
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
