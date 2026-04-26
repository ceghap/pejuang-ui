import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from '@tanstack/react-form';
import { Layers, Plus, Loader2, Trash2, Pencil, MapPin, Users, UserRound, Building2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
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
import { UserLookup } from '@/components/ui/user-lookup';

export default function ManageGelanggang() {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingGelanggang, setEditingGelanggang] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [filterCawanganId, setFilterCawanganId] = useState('');

  const { data: gelanggangs, isLoading } = useQuery({
    queryKey: ['gelanggangs', filterCawanganId],
    queryFn: () => {
      const url = filterCawanganId
        ? `/gelanggang?cawanganId=${filterCawanganId}`
        : '/gelanggang';
      return fetchClient(url);
    },
  });

  const { data: cawangans } = useQuery({
    queryKey: ['cawangans'],
    queryFn: () => fetchClient('/cawangan'),
  });

  const mutation = useMutation({
    mutationFn: (data) => {
      const method = editingGelanggang ? 'PUT' : 'POST';
      const url = editingGelanggang ? `/gelanggang/${editingGelanggang.id}` : '/gelanggang';
      return fetchClient(url, {
        method,
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['gelanggangs']);
      setIsDialogOpen(false);
      setEditingGelanggang(null);
      toast.success(`Gelanggang ${editingGelanggang ? 'updated' : 'created'} successfully`);
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to process gelanggang');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => fetchClient(`/gelanggang/${id}`, {
      method: 'DELETE',
    }),
    onSuccess: () => {
      queryClient.invalidateQueries(['gelanggangs']);
      setDeleteId(null);
      toast.success('Gelanggang deleted successfully');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to delete gelanggang');
      setDeleteId(null);
    }
  });

  const form = useForm({
    defaultValues: {
      name: '',
      description: '',
      location: '',
      cawanganId: '',
      jurulatihId: null
    },
    onSubmit: async ({ value }) => {
      mutation.mutate(value);
    },
  });

  const handleEdit = (g) => {
    setEditingGelanggang(g);
    form.setFieldValue('name', g.name);
    form.setFieldValue('description', g.description || '');
    form.setFieldValue('location', g.location || '');
    form.setFieldValue('cawanganId', g.cawangan?.id || '');
    form.setFieldValue('jurulatihId', g.jurulatih?.id || null);
    setIsDialogOpen(true);
  };

  const handleAdd = () => {
    setEditingGelanggang(null);
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
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Gelanggang Management</h1>
          <p className="text-muted-foreground mt-1">Manage gelanggang centers and assign leaders.</p>
        </div>
        <Button onClick={handleAdd} className="w-full md:w-auto">
          <Plus className="mr-2 h-4 w-4" /> Add Gelanggang
        </Button>
      </div>

      <Card>
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 space-y-0">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Layers className="w-5 h-5 text-emerald-500" /> All Gelanggang
            </CardTitle>
            <CardDescription>
              {gelanggangs?.length || 0} training centers in the system.
            </CardDescription>
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <Label htmlFor="branch-filter" className="text-xs font-bold uppercase tracking-wider text-muted-foreground whitespace-nowrap">Filter by Branch:</Label>
            <select
              id="branch-filter"
              value={filterCawanganId}
              onChange={(e) => setFilterCawanganId(e.target.value)}
              className="flex h-9 w-full sm:w-[200px] rounded-md border border-border bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <option value="">All Branches</option>
              {cawangans?.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
        </CardHeader>
        <CardContent className="p-0 border-t">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-6">Gelanggang Name</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Branch</TableHead>
                <TableHead>Jurulatih</TableHead>
                <TableHead className="text-right pr-6">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {gelanggangs?.map((g) => (
                <TableRow key={g.id}>
                  <TableCell className="font-bold py-4 pl-6">{g.name}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{g.location || '-'}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-[10px] uppercase font-bold bg-slate-50">{g.cawangan?.name}</Badge>
                  </TableCell>
                  <TableCell>
                    {g.jurulatih ? (
                      <div className="flex items-center gap-2 text-xs font-medium">
                        <UserRound className="w-3.5 h-3.5 text-blue-500" />
                        {g.jurulatih.name}
                      </div>
                    ) : (
                      <span className="text-xs italic text-slate-400">Unassigned</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right pr-6">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(g)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="text-destructive" onClick={() => setDeleteId(g.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {!gelanggangs?.length && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">
                    No gelanggang found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{editingGelanggang ? 'Edit Gelanggang' : 'Add New Gelanggang'}</DialogTitle>
          </DialogHeader>

          <form onSubmit={(e) => { e.preventDefault(); form.handleSubmit(); }} className="space-y-4 pt-4">
            <form.Field name="name" children={(field) => (
              <div className="space-y-2">
                <Label>Gelanggang Name</Label>
                <Input value={field.state.value} onChange={(e) => field.handleChange(e.target.value)} placeholder="e.g. Gelanggang Putra" required />
              </div>
            )} />

            <form.Field name="cawanganId" children={(field) => (
              <div className="space-y-2">
                <Label>Branch (Cawangan)</Label>
                <select
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                  required
                >
                  <option value="" disabled>Select Cawangan...</option>
                  {cawangans?.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
            )} />

            <form.Field name="location" children={(field) => (
              <div className="space-y-2">
                <Label>Location</Label>
                <Input value={field.state.value} onChange={(e) => field.handleChange(e.target.value)} placeholder="e.g. Kuala Lumpur" />
              </div>
            )} />

            <form.Field name="description" children={(field) => (
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea value={field.state.value} onChange={(e) => field.handleChange(e.target.value)} rows={2} />
              </div>
            )} />

            <form.Field name="jurulatihId" children={(field) => (
              <UserLookup 
                label="Jurulatih"
                placeholder="Assign a leader..."
                value={field.state.value}
                initialData={editingGelanggang?.jurulatih ?? null}
                onChange={(val) => field.handleChange(val)}
              />
            )} />

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="ghost" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : editingGelanggang ? 'Update' : 'Create'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={() => deleteMutation.mutate(deleteId)}
        title="Delete Gelanggang"
        description="Are you sure? This action cannot be undone."
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
