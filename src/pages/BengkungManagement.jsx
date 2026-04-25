import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from '@tanstack/react-form';
import { Award, Plus, Loader2, Trash2, Pencil, ListChecks, ChevronRight, Hash, GripVertical } from 'lucide-react';
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

// DnD Kit Imports
import {
  DndContext, 
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

function SortableSilibusItem({ s, onEdit, onDelete }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: s.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 0,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div 
      ref={setNodeRef} 
      style={style}
      className={cn(
        "group flex items-center justify-between px-3 py-1.5 rounded-md border bg-white hover:border-red-200 transition-colors shadow-sm mb-1",
        isDragging && "border-red-500 shadow-lg z-50"
      )}
    >
      <div className="flex items-center gap-3">
        <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing text-slate-300 hover:text-slate-500 transition-colors p-1">
          <GripVertical className="w-3.5 h-3.5" />
        </div>
        <span className="text-xs font-bold text-slate-700">{s.name}</span>
      </div>
      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => onEdit(s)}>
          <Pencil className="h-3 w-3" />
        </Button>
        <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => onDelete(s.id)}>
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}

export default function BengkungManagement() {
  const queryClient = useQueryClient();
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const [isBengkungDialogOpen, setIsBengkungDialogOpen] = useState(false);
  const [editingBengkung, setEditingBengkung] = useState(null);
  const [deleteBengkungId, setDeleteBengkungId] = useState(null);

  const [isSilibusDialogOpen, setIsSilibusDialogOpen] = useState(false);
  const [selectedBengkung, setSelectedBengkung] = useState(null);
  const [editingSilibus, setEditingSilibus] = useState(null);
  const [deleteSilibusId, setDeleteSilibusId] = useState(null);

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

  const silibusMutation = useMutation({
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
      setIsSilibusDialogOpen(false);
      setEditingSilibus(null);
    },
    onError: (error) => toast.error(error.message)
  });

  const deleteSilibusMutation = useMutation({
    mutationFn: (id) => fetchClient(`/syllabus/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries(['bengkungs']);
      setDeleteSilibusId(null);
      toast.success('Silibus item deleted');
    },
    onError: (error) => toast.error(error.message)
  });

  const bengkungForm = useForm({
    defaultValues: { name: '', levelOrder: 0, description: '' },
    onSubmit: async ({ value }) => {
      bengkungMutation.mutate(editingBengkung ? { ...value, id: editingBengkung.id } : value);
    },
  });

  const silibusForm = useForm({
    defaultValues: { name: '' },
    onSubmit: async ({ value }) => {
      let finalOrderNo = editingSilibus?.orderNo || 1;
      
      if (!editingSilibus) {
        const currentSilibus = selectedBengkung.syllabus || [];
        const maxOrder = currentSilibus.reduce((max, item) => Math.max(max, item.orderNo), 0);
        finalOrderNo = maxOrder + 1;
      }

      silibusMutation.mutate(editingSilibus 
        ? { ...value, id: editingSilibus.id, orderNo: finalOrderNo } 
        : { ...value, bengkungId: selectedBengkung.id, orderNo: finalOrderNo }
      );
      toast.success('Silibus saved');
    },
  });

  const handleEditBengkung = (b) => {
    setEditingBengkung(b);
    bengkungForm.setFieldValue('name', b.name);
    bengkungForm.setFieldValue('levelOrder', b.levelOrder);
    bengkungForm.setFieldValue('description', b.description || '');
    setIsBengkungDialogOpen(true);
  };

  const handleAddSilibus = (b) => {
    setSelectedBengkung(b);
    setEditingSilibus(null);
    silibusForm.reset();
    setIsSilibusDialogOpen(true);
  };

  const handleEditSilibus = (b, s) => {
    setSelectedBengkung(b);
    setEditingSilibus(s);
    silibusForm.setFieldValue('name', s.name);
    setIsSilibusDialogOpen(true);
  };

  const handleDragEnd = (event, bengkung) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = bengkung.syllabus.findIndex(item => item.id === active.id);
    const newIndex = bengkung.syllabus.findIndex(item => item.id === over.id);

    const reorderedSilibus = arrayMove(bengkung.syllabus, oldIndex, newIndex);
    
    // Optimistically update query client
    queryClient.setQueryData(['bengkungs'], (old) => 
      old.map(b => b.id === bengkung.id ? { ...b, syllabus: reorderedSilibus } : b)
    );

    // Persist to backend
    reorderedSilibus.forEach((item, index) => {
      const newOrder = index + 1;
      if (item.orderNo !== newOrder) {
        silibusMutation.mutate({ ...item, orderNo: newOrder });
      }
    });
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
          <h1 className="text-3xl font-bold tracking-tight text-red-900">Bengkung & Silibus</h1>
          <p className="text-muted-foreground mt-1">Manage belt levels and their required technical silibus.</p>
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
                  <Button variant="outline" size="sm" onClick={() => handleAddSilibus(b)}>
                    <Plus className="w-3.5 h-3.5 mr-1" /> Add Silibus
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
                  <ListChecks className="w-3.5 h-3.5" /> Silibus Requirements
                </h4>
                <div className="max-w-2xl">
                  <DndContext 
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={(e) => handleDragEnd(e, b)}
                  >
                    <SortableContext 
                      items={b.syllabus?.map(s => s.id) || []}
                      strategy={verticalListSortingStrategy}
                    >
                      {b.syllabus?.sort((a, b) => a.orderNo - b.orderNo).map((s) => (
                        <SortableSilibusItem 
                          key={s.id} 
                          s={s} 
                          onEdit={(item) => handleEditSilibus(b, item)}
                          onDelete={(id) => setDeleteSilibusId(id)}
                        />
                      ))}
                    </SortableContext>
                  </DndContext>
                  {!b.syllabus?.length && (
                    <div className="py-8 text-center text-xs text-muted-foreground italic bg-slate-50 rounded-lg border border-dashed">
                      No silibus items defined for this level.
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

      {/* Silibus Dialog */}
      <Dialog open={isSilibusDialogOpen} onOpenChange={setIsSilibusDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingSilibus ? 'Edit Silibus' : 'Add Silibus'} - {selectedBengkung?.name}</DialogTitle>
          </DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); silibusForm.handleSubmit(); }} className="space-y-4 pt-4">
            <silibusForm.Field name="name" children={(field) => (
              <div className="space-y-2">
                <Label>Silibus Name</Label>
                <Input value={field.state.value} onChange={(e) => field.handleChange(e.target.value)} placeholder="e.g. Senaman Tua" required />
              </div>
            )} />
            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsSilibusDialogOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={silibusMutation.isPending}>Save</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        isOpen={!!deleteBengkungId}
        onClose={() => setDeleteBengkungId(null)}
        onConfirm={() => deleteBengkungMutation.mutate(deleteBengkungId)}
        title="Delete Bengkung"
        description="Are you sure? This will delete the bengkung and all its silibus items."
      />

      <ConfirmDialog
        isOpen={!!deleteSilibusId}
        onClose={() => setDeleteSilibusId(null)}
        onConfirm={() => deleteSilibusMutation.mutate(deleteSilibusId)}
        title="Delete Silibus Item"
        description="Remove this requirement from the belt level?"
      />
    </div>
  );
}
