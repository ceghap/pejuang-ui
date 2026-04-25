import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from '@tanstack/react-form';
import { Award, Plus, Loader2, Trash2, Pencil, ListChecks, ChevronRight, Hash } from 'lucide-react';
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
import { cn } from '@/lib/utils';

export default function BengkungManagement() {
  const queryClient = useQueryClient();
  const [isBengkungDialogOpen, setIsBengkungDialogOpen] = useState(false);
  const [editingBengkung, setEditingBengkung] = useState(null);
  const [deleteBengkungId, setDeleteBengkungId] = useState(null);

  const [isSyllabusDialogOpen, setIsSyllabusDialogOpen] = useState(false);
  const [selectedBengkung, setSelectedBengkung] = useState(null);
  const [editingSyllabus, setEditingSyllabus] = useState(null);
  const [deleteSyllabusId, setDeleteSyllabusId] = useState(null);

  const { data: bengkungs, isLoading } = useQuery({
    queryKey: ['bengkungs'],
    queryFn: () => fetchClient('/bengkung'),
  });

  const bengkungMutation = useMutation({
    mutationFn: (data) => {
      const method = data.id ? 'PUT' : 'POST';
      const url = data.id ? `/bengkung/${data.id}` : '/bengkung';
      return fetchClient(url, {
        method,
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['bengkungs']);
      setIsBengkungDialogOpen(false);
      setEditingBengkung(null);
      toast.success('Bengkung saved successfully');
    },
    onError: (error) => toast.error(error.message)
  });

  const deleteBengkungMutation = useMutation({
    mutationFn: (id) => fetchClient(`/bengkung/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries(['bengkungs']);
      setDeleteBengkungId(null);
      toast.success('Bengkung deleted');
    },
    onError: (error) => toast.error(error.message)
  });

  const syllabusMutation = useMutation({
    mutationFn: (data) => {
      const method = data.id ? 'PUT' : 'POST';
      const url = data.id ? `/syllabus/${data.id}` : `/bengkung/${data.bengkungId}/syllabus`;
      return fetchClient(url, {
        method,
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['bengkungs']);
      setIsSyllabusDialogOpen(false);
      setEditingSyllabus(null);
      toast.success('Syllabus item saved');
    },
    onError: (error) => toast.error(error.message)
  });

  const deleteSyllabusMutation = useMutation({
    mutationFn: (id) => fetchClient(`/syllabus/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries(['bengkungs']);
      setDeleteSyllabusId(null);
      toast.success('Syllabus item deleted');
    },
    onError: (error) => toast.error(error.message)
  });

  const bengkungForm = useForm({
    defaultValues: { name: '', levelOrder: 0, description: '' },
    onSubmit: async ({ value }) => {
      bengkungMutation.mutate(editingBengkung ? { ...value, id: editingBengkung.id } : value);
    },
  });

  const syllabusForm = useForm({
    defaultValues: { name: '', orderNo: 1 },
    onSubmit: async ({ value }) => {
      syllabusMutation.mutate(editingSyllabus 
        ? { ...value, id: editingSyllabus.id } 
        : { ...value, bengkungId: selectedBengkung.id }
      );
    },
  });

  const handleEditBengkung = (b) => {
    setEditingBengkung(b);
    bengkungForm.setFieldValue('name', b.name);
    bengkungForm.setFieldValue('levelOrder', b.levelOrder);
    bengkungForm.setFieldValue('description', b.description || '');
    setIsBengkungDialogOpen(true);
  };

  const handleAddSyllabus = (b) => {
    setSelectedBengkung(b);
    setEditingSyllabus(null);
    syllabusForm.reset();
    setIsSyllabusDialogOpen(true);
  };

  const handleEditSyllabus = (b, s) => {
    setSelectedBengkung(b);
    setEditingSyllabus(s);
    syllabusForm.setFieldValue('name', s.name);
    syllabusForm.setFieldValue('orderNo', s.orderNo);
    setIsSyllabusDialogOpen(true);
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
          <h1 className="text-3xl font-bold tracking-tight text-red-900">Bengkung & Syllabus</h1>
          <p className="text-muted-foreground mt-1">Manage belt levels and their required technical syllabus.</p>
        </div>
        <Button onClick={() => { setEditingBengkung(null); bengkungForm.reset(); setIsBengkungDialogOpen(true); }} className="bg-red-700 hover:bg-red-800">
          <Plus className="mr-2 h-4 w-4" /> Add Bengkung
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {bengkungs?.map((b) => (
          <Card key={b.id} className="overflow-hidden border-l-4 border-l-red-600 shadow-sm">
            <CardHeader className="bg-slate-50/50 pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-red-700 font-bold">
                    {b.levelOrder}
                  </div>
                  <div>
                    <CardTitle className="text-xl">{b.name}</CardTitle>
                    <CardDescription>{b.description || 'No description'}</CardDescription>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => handleAddSyllabus(b)}>
                    <Plus className="w-3.5 h-3.5 mr-1" /> Add Syllabus
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleEditBengkung(b)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="text-destructive" onClick={() => setDeleteBengkungId(b.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="space-y-2">
                <h4 className="text-xs font-black uppercase tracking-widest text-slate-500 flex items-center gap-2 mb-3">
                  <ListChecks className="w-3.5 h-3.5" /> Syllabus Requirements
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {b.syllabus?.map((s) => (
                    <div key={s.id} className="group flex items-center justify-between p-2 rounded-lg border bg-white hover:border-red-200 transition-colors">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono text-slate-400">#{s.orderNo}</span>
                        <span className="text-sm font-medium">{s.name}</span>
                      </div>
                      <div className="flex opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleEditSyllabus(b, s)}>
                          <Pencil className="h-3 w-3" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => setDeleteSyllabusId(s.id)}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  {!b.syllabus?.length && (
                    <div className="col-span-full py-4 text-center text-xs text-muted-foreground italic bg-slate-50 rounded-lg border border-dashed">
                      No syllabus items defined for this level.
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Bengkung Dialog */}
      <Dialog open={isBengkungDialogOpen} onOpenChange={setIsBengkungDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingBengkung ? 'Edit Bengkung' : 'Add Bengkung'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); bengkungForm.handleSubmit(); }} className="space-y-4 pt-4">
            <bengkungForm.Field name="name" children={(field) => (
              <div className="space-y-2">
                <Label>Bengkung Name</Label>
                <Input value={field.state.value} onChange={(e) => field.handleChange(e.target.value)} placeholder="e.g. CKPB1" required />
              </div>
            )} />
            <bengkungForm.Field name="levelOrder" children={(field) => (
              <div className="space-y-2">
                <Label>Level Order (0, 1, 2...)</Label>
                <Input type="number" value={field.state.value} onChange={(e) => field.handleChange(parseInt(e.target.value))} required />
              </div>
            )} />
            <bengkungForm.Field name="description" children={(field) => (
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea value={field.state.value} onChange={(e) => field.handleChange(e.target.value)} rows={3} />
              </div>
            )} />
            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsBengkungDialogOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={bengkungMutation.isPending}>Save</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Syllabus Dialog */}
      <Dialog open={isSyllabusDialogOpen} onOpenChange={setIsSyllabusDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingSyllabus ? 'Edit Syllabus' : 'Add Syllabus'} - {selectedBengkung?.name}</DialogTitle>
          </DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); syllabusForm.handleSubmit(); }} className="space-y-4 pt-4">
            <syllabusForm.Field name="name" children={(field) => (
              <div className="space-y-2">
                <Label>Syllabus Name</Label>
                <Input value={field.state.value} onChange={(e) => field.handleChange(e.target.value)} placeholder="e.g. Senaman Tua" required />
              </div>
            )} />
            <syllabusForm.Field name="orderNo" children={(field) => (
              <div className="space-y-2">
                <Label>Order Number</Label>
                <Input type="number" value={field.state.value} onChange={(e) => field.handleChange(parseInt(e.target.value))} required />
              </div>
            )} />
            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsSyllabusDialogOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={syllabusMutation.isPending}>Save</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        isOpen={!!deleteBengkungId}
        onClose={() => setDeleteBengkungId(null)}
        onConfirm={() => deleteBengkungMutation.mutate(deleteBengkungId)}
        title="Delete Bengkung"
        description="Are you sure? This will delete the bengkung and all its syllabus items."
      />

      <ConfirmDialog
        isOpen={!!deleteSyllabusId}
        onClose={() => setDeleteSyllabusId(null)}
        onConfirm={() => deleteSyllabusMutation.mutate(deleteSyllabusId)}
        title="Delete Syllabus Item"
        description="Remove this requirement from the belt level?"
      />
    </div>
  );
}
