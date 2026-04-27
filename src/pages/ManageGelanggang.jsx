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
      toast.success(`Gelanggang saved successfully`);
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
          <h1 className="text-2xl md:text-3xl font-light tracking-tight">Gelanggang <span className="font-semibold">Management</span></h1>
          <p className="text-muted-foreground text-sm mt-1">Urus gelangang</p>
        </div>
        <Button onClick={handleAdd} className="w-full md:w-auto shadow-lg shadow-primary/10">
          <Plus className="mr-2 h-4 w-4" /> Tambah Gelanggang
        </Button>
      </div>

      <Card className="overflow-hidden border-border/50">
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 space-y-0 bg-muted/20 pb-4 border-b">
          <div>
            <CardTitle className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
              <Layers className="w-3.5 h-3.5" /> Senarai Gelanggang
            </CardTitle>
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <Label htmlFor="branch-filter" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground whitespace-nowrap">Filter Cawangan:</Label>
            <select
              id="branch-filter"
              value={filterCawanganId}
              onChange={(e) => setFilterCawanganId(e.target.value)}
              className="flex h-8 w-full sm:w-[180px] rounded-md border border-border bg-white px-3 text-[11px] font-bold shadow-sm outline-none focus:ring-2 focus:ring-primary/10 transition-all"
            >
              <option value="">Semua Cawangan</option>
              {cawangans?.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow>
                <TableHead className="pl-6 font-black uppercase text-[10px] tracking-widest py-4">Center Name</TableHead>
                <TableHead className="font-black uppercase text-[10px] tracking-widest py-4 max-w-[200px]">Location</TableHead>
                <TableHead className="font-black uppercase text-[10px] tracking-widest py-4">Branch</TableHead>
                <TableHead className="font-black uppercase text-[10px] tracking-widest py-4 max-w-[150px]">Jurulatih</TableHead>
                <TableHead className="text-right pr-6 font-black uppercase text-[10px] tracking-widest py-4">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {gelanggangs?.map((g) => (
                <TableRow key={g.id} className="hover:bg-muted/5 border-border/30 transition-colors">
                  <TableCell className="font-bold py-4 pl-6 text-sm text-slate-900">{g.name}</TableCell>
                  <TableCell className="py-4">
                    <div className="flex items-center gap-1.5 text-slate-500 max-w-[200px]">
                      <MapPin className="w-3 h-3 shrink-0 opacity-50" />
                      <span className="text-[11px] font-medium truncate">{g.location || 'N/A'}</span>
                    </div>
                  </TableCell>
                  <TableCell className="py-4">
                    <Badge variant="outline" className="text-[9px] font-black uppercase bg-white border-slate-200">
                      {g.cawangan?.name}
                    </Badge>
                  </TableCell>
                  <TableCell className="py-4">
                    {g.jurulatih ? (
                      <div className="flex items-center gap-2 max-w-[150px]">
                        <UserRound className="w-3 h-3 text-blue-500 shrink-0" />
                        <span className="text-[11px] font-bold text-slate-700 truncate">{g.jurulatih.name}</span>
                      </div>
                    ) : (
                      <span className="text-[10px] italic text-slate-400">Unassigned</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right pr-6 py-4">
                    <div className="flex justify-end items-center gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:bg-slate-100 rounded-full" onClick={() => handleEdit(g)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-rose-500 hover:bg-rose-50 rounded-full" onClick={() => setDeleteId(g.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {!gelanggangs?.length && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-20 text-slate-400 italic text-xs uppercase tracking-widest opacity-50">
                    No centers found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) setEditingGelanggang(null); }}>
        <DialogContent className="sm:max-w-[500px] rounded-2xl border-slate-200 shadow-2xl">
          <DialogHeader className="pb-4 border-b">
            <DialogTitle className="text-xl font-black uppercase tracking-tight italic text-slate-900">{editingGelanggang ? 'Edit Center' : 'New Center'}</DialogTitle>
          </DialogHeader>

          <form onSubmit={(e) => { e.preventDefault(); form.handleSubmit(); }} className="space-y-5 pt-6">
            <form.Field name="name" children={(field) => (
              <div className="space-y-1">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Center Name</Label>
                <Input value={field.state.value} onChange={(e) => field.handleChange(e.target.value)} placeholder="e.g. Gelanggang Putra" className="h-10 font-bold" required />
              </div>
            )} />

            <form.Field name="cawanganId" children={(field) => (
              <div className="space-y-1">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Branch (Cawangan)</Label>
                <select
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-border bg-white px-3 py-2 text-sm font-bold outline-none focus:ring-2 focus:ring-primary/10 transition-all"
                  required
                >
                  <option value="" disabled>Select Cawangan...</option>
                  {cawangans?.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
            )} />

            <form.Field name="location" children={(field) => (
              <div className="space-y-1">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Location Details</Label>
                <Input value={field.state.value} onChange={(e) => field.handleChange(e.target.value)} placeholder="e.g. Kuala Lumpur" className="h-10" />
              </div>
            )} />

            <form.Field name="description" children={(field) => (
              <div className="space-y-1">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Description</Label>
                <Textarea value={field.state.value} onChange={(e) => field.handleChange(e.target.value)} rows={2} className="resize-none" />
              </div>
            )} />

            <form.Field name="jurulatihId" children={(field) => (
              <UserLookup
                label="Center Leader (Jurulatih)"
                placeholder="Assign a leader..."
                value={field.state.value}
                initialData={editingGelanggang?.jurulatih ?? null}
                onChange={(val) => field.handleChange(val)}
              />
            )} />

            <div className="flex justify-end gap-3 pt-6 border-t">
              <Button type="button" variant="ghost" onClick={() => setIsDialogOpen(false)} className="uppercase text-[10px] font-black tracking-widest">Cancel</Button>
              <Button type="submit" disabled={mutation.isPending} className="uppercase text-[10px] font-black tracking-widest px-8">
                {mutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : editingGelanggang ? 'Save Changes' : 'Create Center'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={() => deleteMutation.mutate(deleteId)}
        title="Delete Center"
        description="Are you sure? This training center will be permanently removed."
        isLoading={deleteMutation.isPending}
        confirmText="Delete Center"
        variant="destructive"
      />
    </div>
  );
}
