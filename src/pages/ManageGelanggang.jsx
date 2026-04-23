import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from '@tanstack/react-form';
import { Layers, Plus, Loader2, Trash2, Pencil, MapPin, Users, UserRound, Building2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
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

  const createMutation = useMutation({
    mutationFn: (data) => fetchClient('/gelanggang', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries(['gelanggangs']);
      setIsDialogOpen(false);
      toast.success('Gelanggang created successfully');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to create gelanggang');
    }
  });

  const updateMutation = useMutation({
    mutationFn: (data) => fetchClient(`/gelanggang/${data.id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries(['gelanggangs']);
      setIsDialogOpen(false);
      setEditingGelanggang(null);
      toast.success('Gelanggang updated successfully');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to update gelanggang');
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
      if (editingGelanggang) {
        updateMutation.mutate({ ...value, id: editingGelanggang.id });
      } else {
        createMutation.mutate(value);
      }
    },
  });

  const handleEdit = (gelanggang) => {
    setEditingGelanggang(gelanggang);
    form.setFieldValue('name', gelanggang.name);
    form.setFieldValue('description', gelanggang.description || '');
    form.setFieldValue('location', gelanggang.location || '');
    form.setFieldValue('cawanganId', gelanggang.cawangan.id);
    form.setFieldValue('jurulatihId', gelanggang.jurulatih?.id || null);
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

  const isMutating = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gelanggang Management</h1>
          <p className="text-muted-foreground mt-1">Manage gelanggang, assign them to branches, and set Jurulatih (Trainers).</p>
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
              {gelanggangs?.length || 0} gelanggang in the system.
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
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[180px]">Gelanggang Name</TableHead>
                <TableHead className="w-[200px]">Location</TableHead>
                <TableHead>Branch (Cawangan)</TableHead>
                <TableHead>Jurulatih</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {gelanggangs?.map((g) => (
                <TableRow key={g.id}>
                  <TableCell className="font-semibold py-3">
                    <div className="flex flex-col max-w-[180px]">
                      <span className="text-sm truncate">{g.name}</span>
                      <span className="text-[10px] text-muted-foreground truncate opacity-70">{g.description}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-start gap-1.5 text-muted-foreground max-w-[200px]">
                      <MapPin className="w-3 h-3 mt-1 shrink-0" />
                      <span className="text-xs line-clamp-2 leading-tight">{g.location || 'No location set'}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5 text-xs font-semibold uppercase">
                      <Building2 className="w-4 h-4 text-emerald-500" />
                      <span>{g.cawangan?.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {g.jurulatih ? (
                      <div className="flex items-center gap-1.5">
                        <div className="w-6 h-6 rounded-full bg-blue-500/10 flex items-center justify-center">
                          <UserRound className="w-3 h-3 text-blue-500" />
                        </div>
                        <span className="text-xs font-bold">{g.jurulatih.name}</span>
                      </div>
                    ) : (
                      <span className="text-[10px] text-muted-foreground italic font-medium">Unassigned</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
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
            <DialogDescription>
              {editingGelanggang ? 'Update the details of this gelanggang.' : 'Create a new gelanggang.'}
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
              name="name"
              children={(field) => (
                <div className="space-y-2">
                  <Label htmlFor={field.name}>Gelanggang Name</Label>
                  <Input
                    id={field.name}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder="e.g. Gelanggang Putra"
                    required
                  />
                </div>
              )}
            />

            <form.Field
              name="cawanganId"
              children={(field) => (
                <div className="space-y-2">
                  <Label htmlFor={field.name}>Branch (Cawangan)</Label>
                  <select
                    id={field.name}
                    name={field.name}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
                    required
                  >
                    <option value="" disabled>Select Cawangan...</option>
                    {cawangans?.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              )}
            />

            <form.Field
              name="location"
              children={(field) => (
                <div className="space-y-2">
                  <Label htmlFor={field.name}>Location Details</Label>
                  <Input
                    id={field.name}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder="e.g. Dataran Merdeka, Kuala Lumpur"
                  />
                </div>
              )}
            />

            <form.Field
              name="description"
              children={(field) => (
                <div className="space-y-2">
                  <Label htmlFor={field.name}>Description</Label>
                  <Textarea
                    id={field.name}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder="Optional description"
                    className="resize-none"
                    rows={2}
                  />
                </div>
              )}
            />

            <form.Field
              name="jurulatihId"
              children={(field) => (
                <div>
                  <UserLookup
                    label="Jurulatih (Trainer in Charge)"
                    placeholder="Search user to assign as Jurulatih..."
                    value={field.state.value}
                    initialData={editingGelanggang?.jurulatih ?? null}
                    onChange={(val) => field.handleChange(val)}
                  />
                </div>
              )}
            />

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <form.Subscribe
                selector={(state) => [state.canSubmit, state.isSubmitting]}
                children={([canSubmit, isSubmitting]) => (
                  <Button type="submit" disabled={!canSubmit || isMutating || isSubmitting}>
                    {(isMutating || isSubmitting) ? (
                      <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing...</>
                    ) : (
                      editingGelanggang ? 'Update Gelanggang' : 'Create Gelanggang'
                    )}
                  </Button>
                )}
              />
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={() => deleteMutation.mutate(deleteId)}
        title="Delete Gelanggang"
        description="Are you sure you want to delete this gelanggang? This action cannot be undone."
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
