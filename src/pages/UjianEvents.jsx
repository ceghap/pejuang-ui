import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from '@tanstack/react-form';
import { Calendar as CalendarIcon, MapPin, Plus, Loader2, ClipboardCheck, Users, Search, Pencil, Trash2 } from 'lucide-react';
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
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
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
  const [editingEvent, setEditingEvent] = useState(null);
  const [isPickingDate, setIsPickingDate] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  const { data: events, isLoading } = useQuery({
    queryKey: ['ujian-events'],
    queryFn: () => fetchClient('/ujian-events'),
  });

  const mutation = useMutation({
    mutationFn: (eventData) => {
      const method = editingEvent ? 'PUT' : 'POST';
      const url = editingEvent ? `/ujian-events/${editingEvent.id}` : '/ujian-events';
      return fetchClient(url, {
        method,
        body: JSON.stringify(eventData),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['ujian-events']);
      setIsDialogOpen(false);
      setEditingEvent(null);
      setIsPickingDate(false);
      toast.success(`Ujian Event ${editingEvent ? 'updated' : 'scheduled'} successfully`);
    },
    onError: (error) => toast.error(error.message)
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => fetchClient(`/ujian-events/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries(['ujian-events']);
      setDeleteId(null);
      toast.success('Ujian Event deleted');
    },
    onError: (error) => toast.error(error.message)
  });

  const form = useForm({
    defaultValues: {
      title: '',
      location: '',
      date: new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16),
      status: 'Scheduled'
    },
    onSubmit: async ({ value }) => {
      mutation.mutate(value);
    },
  });

  const handleEdit = (event) => {
    setEditingEvent(event);
    form.setFieldValue('title', event.title);
    form.setFieldValue('location', event.location);
    const localDate = new Date(new Date(event.date).getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16);
    form.setFieldValue('date', localDate);
    form.setFieldValue('status', event.status);
    setIsPickingDate(false);
    setIsDialogOpen(true);
  };

  const handleAddNew = () => {
    setEditingEvent(null);
    form.reset();
    setIsPickingDate(false);
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
          <h1 className="text-3xl font-bold tracking-tight text-red-900">Sesi Ujian Bengkung</h1>
          <p className="text-muted-foreground mt-1">Urus sesi ujian bengkung. </p>
        </div>
        <Button onClick={handleAddNew} className="bg-red-700 hover:bg-red-800">
          <Plus className="mr-2 h-4 w-4" /> Jadualkan Ujian Baru
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Sesi Akan Datang & Sesi Lepas </CardTitle>
          <CardDescription>Semua sesi ujian yang dijadualkan dan dianjurkan oleh HQ.</CardDescription>
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
                        event.status === 'Ongoing' && "bg-amber-50 text-amber-700 border-amber-100",
                        event.status === 'Completed' && "bg-emerald-50 text-emerald-700 border-emerald-100",
                        event.status === 'Cancelled' && "bg-slate-50 text-slate-500 border-slate-100"
                      )}>
                      {event.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end items-center gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:text-blue-600" onClick={() => handleEdit(event)}>
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>

                      <Button variant="outline" size="sm" className="h-8 text-[10px] font-bold uppercase tracking-tight px-3" asChild>
                        <Link to={`/admin/ujian-events/${event.id}/markings`} className="flex items-center gap-1.5">
                          <ClipboardCheck className="w-3.5 h-3.5" />
                          <span>Markings</span>
                        </Link>
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
                  <TableCell colSpan={6} className="text-center py-10 text-muted-foreground italic">
                    No examination events scheduled.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) { setEditingEvent(null); setIsPickingDate(false); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingEvent ? 'Edit Ujian Event' : 'Schedule Ujian Event'}</DialogTitle>
            <DialogDescription>{editingEvent ? 'Modify the details of this examination session.' : 'Create a new examination session for members.'}</DialogDescription>
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
            <form.Field name="date" children={(field) => {
              // Split the ISO string into date and time parts
              const [datePart, timePart] = field.state.value.split('T');

              const handleDateChange = (val) => {
                field.handleChange(`${val}T${timePart || '09:00'}`);
                document.getElementById('time-picker')?.focus();
              };

              const handleTimeChange = (val) => {
                field.handleChange(`${datePart}T${val}`);
                setIsPickingDate(false);
              };

              return (
                <div className="space-y-2">
                  <Label>Date & Time</Label>
                  {!isPickingDate ? (
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full justify-start font-bold border-slate-200"
                      onClick={() => setIsPickingDate(true)}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4 text-red-600" />
                      {formatDate(field.state.value)}
                    </Button>
                  ) : (
                    <div className="p-3 border-2 border-red-100 rounded-lg bg-red-50/30 space-y-3 animate-in fade-in zoom-in duration-200">
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <Label className="text-[10px] uppercase font-bold text-slate-500">1. Pick Date</Label>
                          <Input
                            type="date"
                            autoFocus
                            className="bg-white"
                            value={datePart}
                            onChange={(e) => handleDateChange(e.target.value)}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[10px] uppercase font-bold text-slate-500">2. Set Time</Label>
                          <Input
                            id="time-picker"
                            type="time"
                            className="bg-white"
                            value={timePart}
                            onChange={(e) => handleTimeChange(e.target.value)}
                          />
                        </div>
                      </div>
                      <div className="flex justify-between items-center pt-1">
                        <p className="text-[10px] text-slate-400 italic">Selection will auto-confirm on time change</p>
                        <Button
                          type="button"
                          variant="ghost"
                          className="h-7 text-[10px] font-bold uppercase tracking-tight"
                          onClick={() => setIsPickingDate(false)}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              );
            }} />
            {editingEvent && (
              <form.Field name="status" children={(field) => (
                <div className="space-y-2">
                  <Label>Event Status</Label>
                  <select
                    className="w-full bg-white border border-slate-200 rounded-md h-10 px-3 text-sm focus:ring-2 focus:ring-red-500/20"
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                  >
                    <option value="Scheduled">Scheduled</option>
                    <option value="Ongoing">Ongoing</option>
                    <option value="Completed">Completed</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>
              )} />
            )}
            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={mutation.isPending} className="bg-red-700">
                {mutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : editingEvent ? 'Save Changes' : 'Schedule Event'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={() => deleteMutation.mutate(deleteId)}
        title="Delete Ujian Event"
        description="Are you sure? This will permanently delete the event and all associated candidate registrations/marks."
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
