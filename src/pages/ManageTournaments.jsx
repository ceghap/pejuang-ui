import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from '@tanstack/react-form';
import { Trophy, MapPin, Plus, Loader2, Users, Pencil, Trash2, Calendar as CalendarIcon, DollarSign, Eye } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
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
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
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

export default function ManageTournaments() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [deleteId, setDeleteId] = useState(null);

  const { data: events, isLoading } = useQuery({
    queryKey: ['tournament-events'],
    queryFn: () => fetchClient('/tournament-events'),
  });

  const mutation = useMutation({
    mutationFn: (eventData) => {
      const method = editingEvent ? 'PUT' : 'POST';
      const url = editingEvent ? `/tournament-events/${editingEvent.id}` : '/tournament-events';
      return fetchClient(url, {
        method,
        body: JSON.stringify(eventData),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['tournament-events']);
      setIsDialogOpen(false);
      setEditingEvent(null);
      toast.success(`Tournament ${editingEvent ? 'updated' : 'created'} successfully`);
    },
    onError: (error) => toast.error(error.message)
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => fetchClient(`/tournament-events/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries(['tournament-events']);
      setDeleteId(null);
      toast.success('Tournament deleted');
    },
    onError: (error) => toast.error(error.message)
  });

  const form = useForm({
    defaultValues: {
      name: '',
      description: '',
      startDate: new Date().toISOString().slice(0, 10),
      endDate: new Date().toISOString().slice(0, 10),
      location: '',
      registrationFee: 0,
      status: 'Draft'
    },
    onSubmit: async ({ value }) => {
      mutation.mutate(value);
    },
  });

  const handleEdit = (event) => {
    setEditingEvent(event);
    form.setFieldValue('name', event.name);
    form.setFieldValue('description', event.description);
    form.setFieldValue('startDate', event.startDate.slice(0, 10));
    form.setFieldValue('endDate', event.endDate.slice(0, 10));
    form.setFieldValue('location', event.location);
    form.setFieldValue('registrationFee', event.registrationFee);
    form.setFieldValue('status', event.status);
    setIsDialogOpen(true);
  };

  const handleAddNew = () => {
    setEditingEvent(null);
    form.reset();
    setIsDialogOpen(true);
  };

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
          <h1 className="text-3xl font-bold tracking-tight text-emerald-900 flex items-center gap-2">
            <Trophy className="w-8 h-8 text-emerald-600" /> MACAT Tournaments
          </h1>
          <p className="text-muted-foreground mt-1">Manage silat tournaments and championships.</p>
        </div>
        <Button onClick={handleAddNew} className="bg-emerald-700 hover:bg-emerald-800">
          <Plus className="mr-2 h-4 w-4" /> Create New Tournament
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Tournament List</CardTitle>
          <CardDescription>Scheduled and past MACAT events.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tournament Details</TableHead>
                <TableHead>Dates</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Fee</TableHead>
                <TableHead>Registrations</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {events?.map((event) => (
                <TableRow key={event.id}>
                  <TableCell>
                    <div className="font-bold text-emerald-900">{event.name}</div>
                    <div className="text-[10px] text-muted-foreground line-clamp-1">{event.description}</div>
                  </TableCell>
                  <TableCell className="text-sm">
                    <div className="flex items-center gap-2">
                      <CalendarIcon className="w-3.5 h-3.5 text-slate-400" />
                      {formatDate(event.startDate)} - {formatDate(event.endDate)}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      {event.location}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm font-mono font-bold text-emerald-600">
                    RM {event.registrationFee}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Users className="w-3.5 h-3.5 text-blue-500" />
                      <span className="font-medium">{event.registrationCount}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline"
                      className={cn(
                        "text-[10px] uppercase",
                        event.status === 'Draft' && "bg-slate-50 text-slate-500",
                        event.status === 'RegistrationOpen' && "bg-blue-50 text-blue-700 border-blue-200",
                        event.status === 'Ongoing' && "bg-amber-50 text-amber-700 border-amber-200",
                        event.status === 'Completed' && "bg-emerald-50 text-emerald-700 border-emerald-200"
                      )}>
                      {event.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end items-center gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:text-emerald-600" onClick={() => navigate(`/admin/tournaments/${event.id}`)}>
                        <Eye className="w-3.5 h-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:text-blue-600" onClick={() => handleEdit(event)}>
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-rose-600" onClick={() => setDeleteId(event.id)}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {!events?.length && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-10 text-muted-foreground italic">
                    No tournaments found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) { setEditingEvent(null); } }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingEvent ? 'Edit Tournament' : 'Create New Tournament'}</DialogTitle>
            <DialogDescription>Define the details and schedule for the MACAT event.</DialogDescription>
          </DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); form.handleSubmit(); }} className="space-y-4 pt-4">
            <form.Field name="name" children={(field) => (
              <div className="space-y-2">
                <Label>Tournament Name</Label>
                <Input value={field.state.value} onChange={(e) => field.handleChange(e.target.value)} placeholder="e.g. Kejuaraan MACAT Kebangsaan 2026" required />
              </div>
            )} />
            <form.Field name="description" children={(field) => (
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea value={field.state.value} onChange={(e) => field.handleChange(e.target.value)} placeholder="Details about the tournament rules, categories, etc." />
              </div>
            )} />
            <div className="grid grid-cols-2 gap-4">
              <form.Field name="startDate" children={(field) => (
                <div className="space-y-2">
                  <Label>Start Date</Label>
                  <Input type="date" value={field.state.value} onChange={(e) => field.handleChange(e.target.value)} required />
                </div>
              )} />
              <form.Field name="endDate" children={(field) => (
                <div className="space-y-2">
                  <Label>End Date</Label>
                  <Input type="date" value={field.state.value} onChange={(e) => field.handleChange(e.target.value)} required />
                </div>
              )} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <form.Field name="location" children={(field) => (
                <div className="space-y-2">
                  <Label>Location</Label>
                  <Input value={field.state.value} onChange={(e) => field.handleChange(e.target.value)} placeholder="e.g. Stadium Titiwangsa" required />
                </div>
              )} />
              <form.Field name="registrationFee" children={(field) => (
                <div className="space-y-2">
                  <Label>Registration Fee (RM)</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input type="number" className="pl-9" value={field.state.value} onChange={(e) => field.handleChange(parseFloat(e.target.value))} required />
                  </div>
                </div>
              )} />
            </div>
            {editingEvent && (
              <form.Field name="status" children={(field) => (
                <div className="space-y-2">
                  <Label>Tournament Status</Label>
                  <select
                    className="w-full bg-white border border-slate-200 rounded-md h-10 px-3 text-sm focus:ring-2 focus:ring-emerald-500/20"
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                  >
                    <option value="Draft">Draft</option>
                    <option value="RegistrationOpen">Registration Open</option>
                    <option value="BracketsGenerated">Brackets Generated</option>
                    <option value="Ongoing">Ongoing</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>
              )} />
            )}
            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={mutation.isPending} className="bg-emerald-700">
                {mutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : editingEvent ? 'Save Changes' : 'Create Tournament'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={() => deleteMutation.mutate(deleteId)}
        title="Delete Tournament"
        description="Are you sure? This will permanently delete the tournament and all candidate registrations. This action cannot be undone."
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
