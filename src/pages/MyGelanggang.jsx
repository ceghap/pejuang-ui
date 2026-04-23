import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Layers, MapPin, Building2, Users, Loader2, UserRound } from 'lucide-react';
import { fetchClient } from '@/api/fetchClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuthStore } from '@/store/authStore';

export default function MyGelanggang() {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const { data: gelanggangs, isLoading, error } = useQuery({
    queryKey: ['my-gelanggang'],
    queryFn: () => fetchClient('/gelanggang'),
  });

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full text-foreground p-4 md:p-8 pt-6">
        <div className="max-w-6xl mx-auto text-destructive text-center py-20 border border-dashed rounded-xl">
          Failed to load Gelanggang data.
        </div>
      </div>
    );
  }

  return (
    <div className="h-full text-foreground p-4 md:p-8 pt-6 overflow-y-auto">
      <div className="max-w-6xl mx-auto space-y-8 pb-20">
        
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-light tracking-tight">My <span className="font-semibold text-emerald-600">Gelanggang</span></h1>
            <p className="text-muted-foreground text-sm mt-1">
              Welcome back, {user?.name}. Here are your active training centers.
            </p>
          </div>
        </div>

        {!gelanggangs || gelanggangs.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center p-16 bg-card rounded-2xl border border-dashed border-border shadow-sm">
            <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mb-6">
              <Layers className="w-10 h-10 text-emerald-500/50" />
            </div>
            <h2 className="text-xl font-semibold mb-2">No Gelanggang Assigned</h2>
            <p className="text-muted-foreground max-w-md text-sm">
              You haven't been assigned to any Gelanggang yet. Please contact your administrator or Jurulatih to get started.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {gelanggangs.map((g) => {
              const isJurulatih = g.jurulatih?.id === user?.id;
              
              return (
                <Card key={g.id} className="relative overflow-hidden group border-border shadow-sm hover:shadow-md transition-shadow">
                  <div className="absolute top-0 w-full h-1.5 bg-emerald-500" />
                  <CardHeader className="pb-4">
                    <div className="flex justify-between items-start mb-3">
                      <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center border border-emerald-100">
                        <Layers className="w-6 h-6 text-emerald-600" />
                      </div>
                      {isJurulatih && (
                        <span className="bg-emerald-500/10 text-emerald-600 text-[10px] px-2.5 py-1 rounded-md font-bold uppercase tracking-wider ring-1 ring-inset ring-emerald-500/20">
                          Jurulatih
                        </span>
                      )}
                    </div>
                    <CardTitle className="text-xl font-semibold group-hover:text-emerald-600 transition-colors">{g.name}</CardTitle>
                    <CardDescription className="line-clamp-2 text-xs leading-relaxed">
                      {g.description || 'No description available for this training center.'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4 pb-8 text-sm">
                    <div className="space-y-3">
                      <div className="flex items-center text-muted-foreground">
                        <Building2 className="w-4 h-4 mr-3 text-emerald-500/60" />
                        <span className="font-medium text-foreground/80">{g.cawangan?.name}</span>
                      </div>
                      <div className="flex items-center text-muted-foreground">
                        <UserRound className="w-4 h-4 mr-3 text-emerald-500/60" />
                        <span className="font-medium text-foreground/80">{g.jurulatih?.name || 'Open Vacancy'}</span>
                      </div>
                      <div className="flex items-center text-muted-foreground">
                        <MapPin className="w-4 h-4 mr-3 text-emerald-500/60" />
                        <span className="truncate">{g.location || 'Location not specified'}</span>
                      </div>
                      <div className="flex items-center text-muted-foreground">
                        <Users className="w-4 h-4 mr-3 text-emerald-500/60" />
                        <span>{g.memberCount || 0} Members ({g.pembantuCount} Assistants)</span>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="pt-0 border-t bg-emerald-50/10 p-6">
                    <Button 
                      onClick={() => navigate(`/gelanggang/${g.id}`)} 
                      className={isJurulatih 
                        ? "w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold" 
                        : "w-full bg-blue-600 hover:bg-blue-700 text-white font-bold"
                      }
                    >
                      {isJurulatih ? 'Manage Gelanggang' : 'Enter Gelanggang'}
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
