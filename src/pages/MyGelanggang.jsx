import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Layers, MapPin, Building2, Users } from 'lucide-react';
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
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-32 w-full max-w-2xl" />
      </div>
    );
  }

  if (error) {
    return <div className="text-destructive">Failed to load Gelanggang data.</div>;
  }

  if (!gelanggangs || gelanggangs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center text-center p-12 bg-white rounded-xl border border-dashed border-zinc-200">
        <div className="w-16 h-16 bg-zinc-100 rounded-full flex items-center justify-center mb-4">
          <Layers className="w-8 h-8 text-zinc-400" />
        </div>
        <h2 className="text-xl font-bold mb-2">No Gelanggang Assigned</h2>
        <p className="text-muted-foreground max-w-md">
          You have not been assigned to any Gelanggang yet. Please contact your administrator or Jurulatih if this is a mistake.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">My Gelanggang</h1>
        <p className="text-muted-foreground mt-1">
          Welcome back, {user?.name}. Here is your active training center.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {gelanggangs.map((g) => {
           const isJurulatih = g.jurulatih?.id === user?.id;
           
           return (
            <Card key={g.id} className="relative overflow-hidden group">
              <div className="absolute top-0 w-full h-1 bg-emerald-500" />
              <CardHeader className="pb-4">
                <div className="flex justify-between items-start mb-2">
                  <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center">
                    <Layers className="w-5 h-5 text-emerald-600" />
                  </div>
                  {isJurulatih && (
                    <span className="bg-emerald-100 text-emerald-800 text-xs px-2.5 py-0.5 rounded-full font-medium">
                      Jurulatih
                    </span>
                  )}
                </div>
                <CardTitle className="text-xl">{g.name}</CardTitle>
                <CardDescription className="line-clamp-2">{g.description || 'No description available'}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 pb-6 text-sm">
                <div className="flex items-center text-muted-foreground">
                  <Building2 className="w-4 h-4 mr-2 text-zinc-400" />
                  <span>{g.cawangan?.name}</span>
                </div>
                <div className="flex items-center text-muted-foreground">
                  <MapPin className="w-4 h-4 mr-2 text-zinc-400" />
                  <span className="truncate">{g.location || 'Location not specified'}</span>
                </div>
                <div className="flex items-center text-muted-foreground">
                  <Users className="w-4 h-4 mr-2 text-zinc-400" />
                  <span>{g.pembantuCount} Assistants</span>
                </div>
              </CardContent>
              <CardFooter className="pt-0 border-t bg-zinc-50/50 flex">
                <Button 
                  onClick={() => navigate(`/gelanggang/${g.id}`)} 
                  className="w-full mt-4" 
                  variant={isJurulatih ? "default" : "secondary"}
                >
                  {isJurulatih ? 'Manage Gelanggang' : 'Enter Gelanggang'}
                </Button>
              </CardFooter>
            </Card>
           );
        })}
      </div>
    </div>
  );
}
