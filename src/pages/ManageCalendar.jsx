import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from '@tanstack/react-form';
import { Calendar as CalendarIcon, Plus, Loader2, Trash2, Pencil, Info } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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

export default function ManageCalendar() {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [deleteId, setDeleteId] = useState(null);

  // Clear form when dialog closes
  useEffect(() => {
    if (!isDialogOpen) {
      setEditingEvent(null);
      form.reset();
    }
  }, [isDialogOpen]);

  const { data: events, isLoading } = useQuery({
    queryKey: ['calendar-events'],
    queryFn: () => fetchClient('/calendar'),
  });

  const createMutation = useMutation({
    mutationFn: (newEvent) => fetchClient('/calendar', {
      method: 'POST',
      body: JSON.stringify(newEvent),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries(['calendar-events']);
      setIsDialogOpen(false);
      toast.success('Event created successfully');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to create event');
    }
  });

  const updateMutation = useMutation({
    mutationFn: (event) => fetchClient(`/calendar/${event.id}`, {
      method: 'PUT',
      body: JSON.stringify(event),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries(['calendar-events']);
      setIsDialogOpen(false);
      setEditingEvent(null);
      toast.success('Event updated successfully');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to update event');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => fetchClient(`/calendar/${id}`, {
      method: 'DELETE',
    }),
    onSuccess: () => {
      queryClient.invalidateQueries(['calendar-events']);
      setDeleteId(null);
      toast.success('Event deleted successfully');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to delete event');
      setDeleteId(null);
    }
  });

  const form = useForm({
    defaultValues: {
      title: '',
      description: '',
      date: '',
    },
    onSubmit: async ({ value }) => {
      if (editingEvent) {
        updateMutation.mutate({ ...value, id: editingEvent.id });
      } else {
        createMutation.mutate(value);
      }
    },
  });

  const handleEdit = (event) => {
    setEditingEvent(event);
    // Format date to YYYY-MM-DD for input type="date"
    const dateStr = new Date(event.date).toISOString().split('T')[0];
    
    // Explicitly set values to ensure form state updates
    form.setFieldValue('title', event.title);
    form.setFieldValue('description', event.description || '');
    form.setFieldValue('date', dateStr);
    
    setIsDialogOpen(true);
  };

  const handleAdd = () => {
    setEditingEvent(null);
    form.reset(); // Reset to default empty values
    form.setFieldValue('date', new Date().toISOString().split('T')[0]);
    setIsDialogOpen(true);
  };

  const handleDeleteClick = (id) => {
    setDeleteId(id);
  };

  if (isLoading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const isMutating = createMutation.isLoading || updateMutation.isLoading;

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Calendar (Takwim)</h1>
          <p className="text-muted-foreground mt-1">Manage organizational events and important dates for members.</p>
        </div>
        <Button onClick={handleAdd} className="w-full md:w-auto">
          <Plus className="mr-2 h-4 w-4" /> Add Event
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-blue-500" /> All Events
          </CardTitle>
          <CardDescription>
            {events?.length || 0} events scheduled in the system.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Event Title</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {events?.map((event) => (
                <TableRow key={event.id}>
                  <TableCell className="font-mono font-bold">
                    {new Date(event.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </TableCell>
                  <TableCell className="font-medium">{event.title}</TableCell>
                  <TableCell className="max-w-xs truncate">{event.description || '-'}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(event)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDeleteClick(event.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {!events?.length && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-10 text-muted-foreground">
                    No calendar events found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{editingEvent ? 'Edit Event' : 'Add New Event'}</DialogTitle>
            <DialogDescription>
              {editingEvent ? 'Update the details of this scheduled event.' : 'Create a new event for the organizational calendar.'}
            </DialogDescription>
          </DialogHeader>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              e.stopPropagation();
              form.handleSubmit();
            }}
            className="space-y-4 pt-4"
          >
            <form.Field
              name="date"
              children={(field) => (
                <div className="space-y-2">
                  <Label htmlFor={field.name}>Event Date</Label>
                  <Input
                    id={field.name}
                    type="date"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    required
                  />
                </div>
              )}
            />

            <form.Field
              name="title"
              children={(field) => (
                <div className="space-y-2">
                  <Label htmlFor={field.name}>Event Title</Label>
                  <Input
                    id={field.name}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder="e.g. Majlis Tazkirah Bulanan"
                    required
                  />
                </div>
              )}
            />

            <form.Field
              name="description"
              children={(field) => (
                <div className="space-y-2">
                  <Label htmlFor={field.name}>Description (Optional)</Label>
                  <Input
                    id={field.name}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder="Short description or details..."
                  />
                </div>
              )}
            />

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isMutating}>
                {isMutating ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing...</>
                ) : (
                  editingEvent ? 'Update Event' : 'Create Event'
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={() => deleteMutation.mutate(deleteId)}
        title="Delete Event"
        description="Are you sure you want to delete this event from the calendar? This action cannot be undone."
        isLoading={deleteMutation.isLoading}
      />
    </div>
  );
}
