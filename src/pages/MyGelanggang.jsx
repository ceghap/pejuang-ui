import { useQuery } from '@tanstack/react-query';
import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layers, MapPin, Building2, Users, Loader2, UserRound, ChevronRight, Search, Filter, X } from 'lucide-react';
import { fetchClient } from '@/api/fetchClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuthStore } from '@/store/authStore';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export default function MyGelanggang() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCawanganId, setFilterCawanganId] = useState('all');

  const { data: gelanggangs, isLoading, error } = useQuery({
    queryKey: ['my-gelanggang'],
    queryFn: () => fetchClient('/gelanggang'),
  });

  const { data: cawangans } = useQuery({
    queryKey: ['cawangans'],
    queryFn: () => fetchClient('/cawangan'),
  });

  const filteredGelanggangs = useMemo(() => {
    if (!gelanggangs) return [];
    
    return gelanggangs.filter(g => {
      const matchesSearch = !searchTerm || g.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCawangan = filterCawanganId === 'all' || g.cawangan?.id === filterCawanganId;
      return matchesSearch && matchesCawangan;
    });
  }, [gelanggangs, searchTerm, filterCawanganId]);

  if (isLoading) {
    return (
      <div className="flex h-[400px] items-center justify-center p-6 animate-pulse">
        <Loader2 className="h-8 w-8 animate-spin text-slate-300" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-center text-destructive">
        <p className="font-bold font-black uppercase tracking-widest text-xs">Failed to load training centers.</p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 pt-6 space-y-8 max-w-7xl mx-auto pb-32">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-light tracking-tight italic">My <span className="font-semibold uppercase not-italic">Gelanggang</span></h1>
          <p className="text-muted-foreground text-sm mt-1 uppercase tracking-tighter font-medium italic opacity-70">
             Training centers associated with your membership profile.
          </p>
        </div>
        
        <div className="flex items-center gap-2">
           <Badge variant="outline" className="text-[10px] font-black uppercase tracking-widest border-slate-200 bg-slate-50 px-4 py-1.5 h-fit">
              {filteredGelanggangs.length} Centers Found
           </Badge>
        </div>
      </div>

      {/* Top Filter Bar */}
      <Card className="border-border/50 shadow-sm overflow-hidden bg-slate-50/30">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row items-end gap-4">
            <div className="flex-1 w-full space-y-1.5">
              <Label className="text-[10px] font-black uppercase text-slate-400 tracking-wider ml-1">Search Centers</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <Input 
                  placeholder="Type center name to filter..." 
                  className="pl-9 h-11 text-sm font-bold bg-white border-slate-200 focus:ring-2 focus:ring-blue-500/10 transition-all"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            <div className="w-full md:w-64 space-y-1.5">
              <Label className="text-[10px] font-black uppercase text-slate-400 tracking-wider ml-1">Filter by Branch</Label>
              <select 
                className="w-full bg-white border border-slate-200 rounded-md h-11 text-sm font-bold px-3 focus:ring-2 focus:ring-blue-500/10 outline-none transition-all appearance-none"
                style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 24 24\' stroke=\'currentColor\'%3E%3Cpath stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'2\' d=\'M19 9l-7 7-7-7\' /%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.75rem center', backgroundSize: '1rem' }}
                value={filterCawanganId}
                onChange={(e) => setFilterCawanganId(e.target.value)}
              >
                <option value="all">All Branches</option>
                {cawangans?.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>

            {(searchTerm || filterCawanganId !== 'all') && (
              <Button 
                variant="ghost" 
                size="icon"
                className="h-11 w-11 rounded-lg text-rose-500 hover:bg-rose-50 hover:text-rose-600 shrink-0"
                onClick={() => { setSearchTerm(''); setFilterCawanganId('all'); }}
                title="Clear Filters"
              >
                <X className="h-5 w-5" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Results Grid */}
      <div>
        {filteredGelanggangs.length === 0 ? (
          <div className="text-center py-24 bg-muted/10 rounded-3xl border-2 border-dashed border-border shadow-inner">
            <Layers className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
            <h3 className="text-lg font-black uppercase text-slate-400">No centers found</h3>
            <p className="text-xs text-muted-foreground mt-1">Try adjusting your search or filter settings.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredGelanggangs.map((g) => {
              const isJurulatih = g.jurulatih?.id === user?.id;

              return (
                <Card key={g.id} className="flex flex-col h-full hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-300 border-border/50 bg-card group rounded-2xl overflow-hidden">
                  <CardHeader className="pb-3 bg-slate-50/30 border-b border-slate-50">
                    <div className="flex justify-between items-start mb-2">
                      <div className="text-[9px] font-black text-blue-500 uppercase tracking-widest">
                        {g.cawangan?.name}
                      </div>
                      {isJurulatih && (
                        <Badge className="bg-emerald-50 text-emerald-700 border-emerald-100 text-[8px] font-black uppercase px-2 shadow-sm">
                          Jurulatih
                        </Badge>
                      )}
                    </div>
                    <CardTitle className="text-lg font-black uppercase italic text-slate-900 group-hover:text-blue-600 transition-colors leading-tight">{g.name}</CardTitle>
                  </CardHeader>
                  <CardContent className="flex-1 py-5 space-y-4">
                    <p className="text-xs text-slate-600 line-clamp-2 min-h-[32px] leading-relaxed font-medium italic px-1">
                      {g.description || "No technical description provided for this center."}
                    </p>
                    
                    <div className="space-y-2.5 bg-slate-50/50 p-3 rounded-xl border border-slate-50">
                      <div className="flex items-center gap-2.5 text-xs text-slate-700 font-bold">
                         <UserRound className="w-3.5 h-3.5 text-slate-400" />
                         <span className="truncate">{g.jurulatih?.name || 'Vacancy'}</span>
                      </div>
                      <div className="flex items-center gap-2.5 text-xs text-slate-500 font-medium">
                         <MapPin className="w-3.5 h-3.5 text-rose-400/70" />
                         <span className="truncate">{g.location || 'Location Not Set'}</span>
                      </div>
                    </div>

                    <div className="px-1 pt-1">
                      <p className="text-[9px] text-slate-400 uppercase font-black tracking-widest mb-0.5">Active Members</p>
                      <p className="text-2xl font-black text-slate-900 leading-none">
                        {g.memberCount || 0}
                      </p>
                    </div>
                  </CardContent>
                  <CardFooter className="pt-0 border-t border-border/30 bg-muted/20 p-4">
                    <Button
                      className="w-full h-10 font-black uppercase text-[10px] tracking-[0.1em] rounded-xl hover:shadow-lg transition-all"
                      variant={isJurulatih ? "default" : "outline"}
                      onClick={() => navigate(`/gelanggang/${g.id}`)}
                    >
                      {isJurulatih ? 'Manage Center' : 'View Details'}
                      <ChevronRight className="w-3.5 h-3.5 ml-2 opacity-50" />
                    </Button>
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
