import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from '@tanstack/react-form';
import { Calendar as CalendarIcon, MapPin, Plus, Loader2, ClipboardCheck, Users, Search } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { fetchClient } from '@/api/fetchClient';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

const formatDate = (dateStr) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

export default function UjianEvents() {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const { data: events, isLoading } = useQuery({
    queryKey: ['ujian-events'],
    queryFn: () => fetchClient('/ujian-events'),
  });

  const createMutation = useMutation({
    mutationFn: (newEvent) => fetchClient('/ujian-events', {
      method: 'POST',
      body: JSON.stringify(newEvent),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries(['ujian-events']);
      setIsDialogOpen(false);
      toast.success('Ujian Event scheduled successfully');
    },
    onError: (error) => toast.error(error.message)
  });

  const form = useForm({
    defaultValues: {
      title: '',
      location: '',
      date: new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16)
    },
    onSubmit: async ({ value }) => {
      createMutation.mutate(value);
    },
  });

  if (isLoading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-red-900">Ujian Events</h1>
          <p className="text-muted-foreground mt-1">Schedule and manage belt examination sessions (Ujian Bengkung).</p>
        </div>
        <Button onClick={() => { form.reset(); setIsDialogOpen(true); }} className="bg-red-700 hover:bg-red-800">
          <Plus className="mr-2 h-4 w-4" /> Schedule New Ujian
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Upcoming & Past Sessions</CardTitle>
          <CardDescription>All scheduled examination sessions organized by HQ.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Event Details</TableHead>
                <TableHead>Date & Time</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Registrations</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {events?.map((event) => (
                <TableRow key={event.id}>
                  <TableCell className="font-bold">{event.title}</TableCell>
                  <TableCell className="text-sm">
                    <div className="flex items-center gap-2">
                      <CalendarIcon className="w-3.5 h-3.5 text-slate-400" />
                      {formatDate(event.date)}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      {event.location}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Users className="w-3.5 h-3.5 text-blue-500" />
                      <span className="font-medium">{event.registrationCount}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={event.status === 'Scheduled' ? 'secondary' : 'default'}
                      className={cn(
                        "text-[10px] uppercase",
                        event.status === 'Scheduled' && "bg-blue-50 text-blue-700 border-blue-100",
                        event.status === 'Completed' && "bg-emerald-50 text-emerald-700 border-emerald-100"
                      )}>
                      {event.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" size="sm" asChild>
                        <Link to={`/ujian-events/${event.id}/markings`}>
                          <ClipboardCheck className="w-3.5 h-3.5 mr-1" /> Markings
                        </Link>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {!events?.length && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-10 text-muted-foreground italic">
                    No examination events scheduled.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Schedule Ujian Event</DialogTitle>
            <DialogDescription>Create a new examination session for members.</DialogDescription>
          </DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); form.handleSubmit(); }} className="space-y-4 pt-4">
            <form.Field name="title" children={(field) => (
              <div className="space-y-2">
                <Label>Event Title</Label>
                <Input value={field.state.value} onChange={(e) => field.handleChange(e.target.value)} placeholder="e.g. Ujian Bengkung Wilayah Tengah" required />
              </div>
            )} />
            <form.Field name="location" children={(field) => (
              <div className="space-y-2">
                <Label>Location</Label>
                <Input value={field.state.value} onChange={(e) => field.handleChange(e.target.value)} placeholder="e.g. Gelanggang Pusat HQ" required />
              </div>
            )} />
            <form.Field name="date" children={(field) => (
              <div className="space-y-2">
                <Label>Date & Time</Label>
                <Input type="datetime-local" value={field.state.value} onChange={(e) => field.handleChange(e.target.value)} required />
              </div>
            )} />
            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={createMutation.isPending} className="bg-red-700">Schedule Ujian</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
