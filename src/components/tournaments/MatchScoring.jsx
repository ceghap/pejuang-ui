import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2, Plus, Minus, CheckCircle2, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { fetchClient } from '@/api/fetchClient';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export default function MatchScoring({ match, onScoringComplete }) {
  const queryClient = useQueryClient();
  const [currentRound, setCurrentRound] = useState(1);
  const [scores, setScores] = useState({
    fighterA: { points: 0, penalties: 0 },
    fighterB: { points: 0, penalties: 0 }
  });

  const submitScoreMutation = useMutation({
    mutationFn: (scoreData) => fetchClient(`/tournaments/matches/${match.id}/scores`, {
      method: 'POST',
      body: JSON.stringify(scoreData),
    }),
    onSuccess: () => {
      toast.success("Score recorded");
    },
    onError: (error) => toast.error(error.message)
  });

  const finalizeMatchMutation = useMutation({
    mutationFn: (winnerId) => fetchClient(`/tournaments/matches/${match.id}/result`, {
      method: 'POST',
      body: JSON.stringify({ winnerId }),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries(['tournament-brackets']);
      toast.success("Match finalized");
      if (onScoringComplete) onScoringComplete();
    },
    onError: (error) => toast.error(error.message)
  });

  const updateScore = (fighterKey, type, delta) => {
    setScores(prev => ({
      ...prev,
      [fighterKey]: {
        ...prev[fighterKey],
        [type]: Math.max(0, prev[fighterKey][type] + delta)
      }
    }));
  };

  const handleScoreSubmit = (fighterKey) => {
    const fighter = fighterKey === 'fighterA' ? match.fighterA : match.fighterB;
    const scoreData = {
      fighterRegistrationId: fighter.id,
      roundNumber: currentRound,
      points: scores[fighterKey].points,
      penalties: scores[fighterKey].penalties
    };
    submitScoreMutation.mutate(scoreData);
  };

  const FighterScoreCard = ({ fighter, fighterKey, color }) => (
    <Card className={cn("border-2", color)}>
      <CardHeader className="pb-2">
        <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Fighter</div>
        <CardTitle className="text-xl font-bold">{fighter?.name || "TBD"}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label className="text-xs font-bold uppercase">Points</Label>
          <div className="flex items-center justify-between bg-slate-50 p-4 rounded-xl border">
            <Button variant="outline" size="icon" onClick={() => updateScore(fighterKey, 'points', -1)}><Minus className="w-4 h-4" /></Button>
            <span className="text-4xl font-black">{scores[fighterKey].points}</span>
            <Button variant="outline" size="icon" onClick={() => updateScore(fighterKey, 'points', 1)}><Plus className="w-4 h-4" /></Button>
          </div>
        </div>
        <div className="space-y-2">
          <Label className="text-xs font-bold uppercase text-rose-600">Penalties</Label>
          <div className="flex items-center justify-between bg-rose-50/50 p-4 rounded-xl border border-rose-100">
            <Button variant="outline" size="icon" className="text-rose-600 border-rose-200" onClick={() => updateScore(fighterKey, 'penalties', -1)}><Minus className="w-4 h-4" /></Button>
            <span className="text-4xl font-black text-rose-700">{scores[fighterKey].penalties}</span>
            <Button variant="outline" size="icon" className="text-rose-600 border-rose-200" onClick={() => updateScore(fighterKey, 'penalties', 1)}><Plus className="w-4 h-4" /></Button>
          </div>
        </div>
        <Button 
          className="w-full mt-4" 
          onClick={() => handleScoreSubmit(fighterKey)}
          disabled={submitScoreMutation.isPending}
        >
          {submitScoreMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Record Round Score"}
        </Button>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-emerald-900">Match Scoring</h2>
          <p className="text-sm text-muted-foreground">Round {currentRound} - {match.matchNumber}</p>
        </div>
        <div className="flex gap-2">
          {[1, 2, 3].map(r => (
            <Button 
              key={r} 
              variant={currentRound === r ? "default" : "outline"} 
              size="sm"
              onClick={() => setCurrentRound(r)}
              className={currentRound === r ? "bg-emerald-700" : ""}
            >
              Round {r}
            </Button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FighterScoreCard fighter={match.fighterA} fighterKey="fighterA" color="border-blue-100 shadow-blue-100/20" />
        <FighterScoreCard fighter={match.fighterB} fighterKey="fighterB" color="border-rose-100 shadow-rose-100/20" />
      </div>

      <Card className="bg-slate-900 text-white border-none">
        <CardHeader>
          <CardTitle className="text-sm font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" /> Finalize Match
          </CardTitle>
          <CardDescription className="text-slate-500">Select the winner to advance them to the next bracket.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col md:flex-row gap-4">
          <Button 
            className="flex-1 bg-blue-600 hover:bg-blue-700 h-12 text-lg font-bold"
            disabled={finalizeMatchMutation.isPending}
            onClick={() => finalizeMatchMutation.mutate(match.fighterA.id)}
          >
            {match.fighterA?.name} Wins
          </Button>
          <Button 
            className="flex-1 bg-rose-600 hover:bg-rose-700 h-12 text-lg font-bold"
            disabled={finalizeMatchMutation.isPending}
            onClick={() => finalizeMatchMutation.mutate(match.fighterB.id)}
          >
            {match.fighterB?.name} Wins
          </Button>
        </CardContent>
      </Card>

      <div className="flex items-center gap-2 p-4 bg-amber-50 rounded-lg border border-amber-100 text-amber-800 text-xs">
        <AlertTriangle className="w-4 h-4 flex-shrink-0" />
        Finalizing a match is irreversible. Ensure all round scores are recorded before declaring a winner.
      </div>
    </div>
  );
}
