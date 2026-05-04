import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from '@tanstack/react-form';
import { Weight, Plus, Loader2, Pencil, Trash2, Shield, User, Users } from 'lucide-react';
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
import { cn } from '@/lib/utils';

export default function WeightClassManagement() {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingWc, setEditingWc] = useState(null);
  const [deleteId, setDeleteId] = useState(null);

  const { data: weightClasses, isLoading } = useQuery({
    queryKey: ['weight-classes'],
    queryFn: () => fetchClient('/weight-classes'),
  });

  const mutation = useMutation({
    mutationFn: (data) => {
      const method = editingWc ? 'PUT' : 'POST';
      const url = editingWc ? `/weight-classes/${editingWc.id}` : '/weight-classes';
      return fetchClient(url, {
        method,
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['weight-classes']);
      setIsDialogOpen(false);
      setEditingWc(null);
      toast.success(`Weight class ${editingWc ? 'updated' : 'created'} successfully`);
    },
    onError: (error) => toast.error(error.message)
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => fetchClient(`/weight-classes/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries(['weight-classes']);
      setDeleteId(null);
      toast.success('Weight class deleted');
    },
    onError: (error) => toast.error(error.message)
  });

  const form = useForm({
    defaultValues: {
      name: '',
      minWeight: 0,
      maxWeight: 0,
      gender: 'Male',
      category: 'Tanding',
      minAge: 0,
      maxAge: 100
    },
    onSubmit: async ({ value }) => {
      mutation.mutate(value);
    },
  });

  const handleEdit = (wc) => {
    setEditingWc(wc);
    form.setFieldValue('name', wc.name);
    form.setFieldValue('minWeight', wc.minWeight);
    form.setFieldValue('maxWeight', wc.maxWeight);
    form.setFieldValue('gender', wc.gender);
    form.setFieldValue('category', wc.category);
    form.setFieldValue('minAge', wc.minAge);
    form.setFieldValue('maxAge', wc.maxAge);
    setIsDialogOpen(true);
  };

  const handleAddNew = () => {
    setEditingWc(null);
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
            <Shield className="w-8 h-8 text-emerald-600" /> Weight Class Management
          </h1>
          <p className="text-muted-foreground mt-1">Define categories and weight ranges for automated tournament brackets.</p>
        </div>
        <Button onClick={handleAddNew} className="bg-emerald-700 hover:bg-emerald-800">
          <Plus className="mr-2 h-4 w-4" /> Add Weight Class
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Defined Classes</CardTitle>
          <CardDescription>Master list used for bracket generation.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Category</TableHead>
                <TableHead>Class Name</TableHead>
                <TableHead>Weight Range</TableHead>
                <TableHead>Gender</TableHead>
                <TableHead>Age Range</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {weightClasses?.map((wc) => (
                <TableRow key={wc.id}>
                  <TableCell>
                    <Badge variant="outline" className={cn(
                      "text-[10px] uppercase",
                      wc.category === 'Tanding' ? "bg-blue-50 text-blue-700 border-blue-100" : "bg-purple-50 text-purple-700 border-purple-100"
                    )}>
                      {wc.category}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-bold text-slate-900">{wc.name}</TableCell>
                  <TableCell className="text-sm font-medium">
                    {wc.minWeight}kg - {wc.maxWeight}kg
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5 text-sm">
                      {wc.gender === 'Male' ? <User className="w-3.5 h-3.5 text-blue-500" /> : <User className="w-3.5 h-3.5 text-rose-500" />}
                      {wc.gender}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {wc.minAge} - {wc.maxAge === 100 ? 'Adult' : wc.maxAge} years
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end items-center gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:text-blue-600" onClick={() => handleEdit(wc)}>
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-rose-600" onClick={() => setDeleteId(wc.id)}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {!weightClasses?.length && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-10 text-muted-foreground italic">
                    No weight classes defined.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) { setEditingWc(null); } }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingWc ? 'Edit Weight Class' : 'New Weight Class'}</DialogTitle>
            <DialogDescription>Define the constraints for this competition category.</DialogDescription>
          </DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); form.handleSubmit(); }} className="space-y-4 pt-4">
            <form.Field name="name" children={(field) => (
              <div className="space-y-2">
                <Label>Class Name</Label>
                <Input value={field.state.value} onChange={(e) => field.handleChange(e.target.value)} placeholder="e.g. Putera A" required />
              </div>
            )} />
            <div className="grid grid-cols-2 gap-4">
              <form.Field name="category" children={(field) => (
                <div className="space-y-2">
                  <Label>Category</Label>
                  <select
                    className="w-full bg-white border border-slate-200 rounded-md h-10 px-3 text-sm"
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                  >
                    <option value="Tanding">Tanding</option>
                    <option value="Seni">Seni</option>
                  </select>
                </div>
              )} />
              <form.Field name="gender" children={(field) => (
                <div className="space-y-2">
                  <Label>Gender</Label>
                  <select
                    className="w-full bg-white border border-slate-200 rounded-md h-10 px-3 text-sm"
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Both">Both</option>
                  </select>
                </div>
              )} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <form.Field name="minWeight" children={(field) => (
                <div className="space-y-2">
                  <Label>Min Weight (kg)</Label>
                  <Input type="number" step="0.1" value={field.state.value} onChange={(e) => field.handleChange(parseFloat(e.target.value))} required />
                </div>
              )} />
              <form.Field name="maxWeight" children={(field) => (
                <div className="space-y-2">
                  <Label>Max Weight (kg)</Label>
                  <Input type="number" step="0.1" value={field.state.value} onChange={(e) => field.handleChange(parseFloat(e.target.value))} required />
                </div>
              )} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <form.Field name="minAge" children={(field) => (
                <div className="space-y-2">
                  <Label>Min Age</Label>
                  <Input type="number" value={field.state.value} onChange={(e) => field.handleChange(parseInt(e.target.value))} required />
                </div>
              )} />
              <form.Field name="maxAge" children={(field) => (
                <div className="space-y-2">
                  <Label>Max Age</Label>
                  <Input type="number" value={field.state.value} onChange={(e) => field.handleChange(parseInt(e.target.value))} required />
                </div>
              )} />
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={mutation.isPending} className="bg-emerald-700">
                {mutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : editingWc ? 'Save Changes' : 'Create Class'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={() => deleteMutation.mutate(deleteId)}
        title="Delete Weight Class"
        description="Are you sure? This may affect future bracket generation for tournaments."
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
