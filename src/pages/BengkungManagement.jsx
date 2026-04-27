import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from '@tanstack/react-form';
import { Award, Plus, Loader2, Trash2, Pencil, ListChecks, ChevronRight, Hash, GripVertical, ArrowLeft } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
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
import { useNavigate } from 'react-router-dom';

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
        "group flex items-center justify-between px-3 py-2 rounded-lg border bg-white hover:border-slate-300 transition-colors shadow-sm mb-2",
        isDragging && "border-blue-500 shadow-md z-50"
      )}
    >
      <div className="flex items-center gap-3">
        <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing text-slate-300 hover:text-slate-400 transition-colors p-1">
          <GripVertical className="w-4 h-4" />
        </div>
        <div className="flex flex-col">
           <span className="text-xs font-bold text-slate-700">{s.name}</span>
           <span className="text-[9px] text-slate-400 uppercase font-mono tracking-tight">Order #{s.orderNo}</span>
        </div>
      </div>
      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onEdit(s)}>
          <Pencil className="h-3.5 w-3.5" />
        </Button>
        <Button variant="ghost" size="icon" className="h-7 w-7 text-rose-400 hover:text-rose-600" onClick={() => onDelete(s.id)}>
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}

export default function BengkungManagement() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
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
    defaultValues: { name: '', levelOrder: 0, description: '', minMarkToPass: 50.0 },
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
    bengkungForm.setFieldValue('minMarkToPass', b.minMarkToPass || 50.0);
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
      <div className="flex h-[400px] items-center justify-center p-6 animate-pulse">
        <Loader2 className="h-8 w-8 animate-spin text-slate-300" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto pb-24">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-light tracking-tight italic">Bengkung <span className="font-semibold uppercase not-italic">& Silibus</span></h1>
          <p className="text-muted-foreground text-sm mt-1 uppercase tracking-widest font-medium opacity-70">Manage belt ranks and technical technical silibus.</p>
        </div>
        <Button onClick={() => { setEditingBengkung(null); bengkungForm.reset(); setIsBengkungDialogOpen(true); }} className="shadow-lg shadow-primary/10">
          <Plus className="mr-2 h-4 w-4" /> Add Bengkung
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {bengkungs?.map((b) => (
          <Card key={b.id} className="flex flex-col border-border/50 shadow-sm hover:shadow-md transition-all">
            <CardHeader className="pb-4 bg-muted/20 border-b">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex flex-col">
                    <CardTitle className="text-lg font-black uppercase text-slate-900 leading-tight italic">{b.name}</CardTitle>
                    <div className="flex items-center gap-2 mt-1">
                       <Badge variant="secondary" className="text-[9px] font-black uppercase tracking-tighter">Order {b.levelOrder}</Badge>
                       <Badge variant="outline" className="text-[9px] font-black uppercase tracking-tighter bg-white border-emerald-100 text-emerald-600">Pass: {b.minMarkToPass}%</Badge>
                    </div>
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:text-blue-600 rounded-full" onClick={() => handleEditBengkung(b)}>
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-300 hover:text-rose-500 rounded-full" onClick={() => setDeleteBengkungId(b.id)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
              {b.description && <p className="text-[11px] text-slate-500 mt-2 line-clamp-2 italic font-medium">"{b.description}"</p>}
            </CardHeader>
            <CardContent className="pt-4 flex-1">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                    <ListChecks className="w-3.5 h-3.5" /> Silibus Requirements
                  </h4>
                  <Button variant="ghost" size="sm" className="h-6 text-[9px] uppercase font-black text-blue-600 hover:bg-blue-50" onClick={() => handleAddSilibus(b)}>
                    <Plus className="w-3 h-3 mr-1" /> Add
                  </Button>
                </div>

                <div>
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
                    <div className="py-12 text-center text-[10px] font-black uppercase text-slate-300 tracking-[0.2em] italic bg-slate-50/50 border border-dashed rounded-xl">
                      No silibus defined
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
        <DialogContent className="rounded-2xl border-slate-200">
          <DialogHeader className="pb-4 border-b">
            <DialogTitle className="font-black uppercase tracking-tight italic text-slate-900">{editingBengkung ? 'Edit Bengkung' : 'New Bengkung'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); bengkungForm.handleSubmit(); }} className="space-y-4 pt-6">
            <bengkungForm.Field name="name" children={(field) => (
              <div className="space-y-1">
                <Label className="text-[10px] font-black uppercase text-slate-400 ml-1">Rank Name</Label>
                <Input value={field.state.value} onChange={(e) => field.handleChange(e.target.value)} placeholder="e.g. CKPB1" className="h-10 font-bold" required />
              </div>
            )} />
            
            <div className="grid grid-cols-2 gap-4">
               <bengkungForm.Field name="levelOrder" children={(field) => (
                 <div className="space-y-1">
                   <Label className="text-[10px] font-black uppercase text-slate-400 ml-1">Sequence Order</Label>
                   <Input type="number" value={field.state.value} onChange={(e) => field.handleChange(parseInt(e.target.value))} required className="h-10 font-bold" />
                 </div>
               )} />
               <bengkungForm.Field name="minMarkToPass" children={(field) => (
                 <div className="space-y-1">
                   <Label className="text-[10px] font-black uppercase text-slate-400 ml-1">Min. Pass Mark %</Label>
                   <Input type="number" step="0.1" value={field.state.value} onChange={(e) => field.handleChange(parseFloat(e.target.value))} required className="h-10 font-bold text-emerald-600" />
                 </div>
               )} />
            </div>

            <bengkungForm.Field name="description" children={(field) => (
              <div className="space-y-1">
                <Label className="text-[10px] font-black uppercase text-slate-400 ml-1">Description</Label>
                <Textarea value={field.state.value} onChange={(e) => field.handleChange(e.target.value)} rows={2} className="resize-none" />
              </div>
            )} />
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button type="button" variant="ghost" onClick={() => setIsBengkungDialogOpen(false)} className="uppercase text-[10px] font-black tracking-widest">Cancel</Button>
              <Button type="submit" disabled={bengkungMutation.isPending} className="uppercase text-[10px] font-black tracking-widest px-8">Save Rank</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Silibus Dialog */}
      <Dialog open={isSilibusDialogOpen} onOpenChange={setIsSilibusDialogOpen}>
        <DialogContent className="rounded-2xl border-slate-200">
          <DialogHeader className="pb-4 border-b">
            <DialogTitle className="font-black uppercase tracking-tight italic text-slate-900">{editingSilibus ? 'Edit Requirement' : 'Add Requirement'}</DialogTitle>
            <DialogDescription className="text-[10px] font-bold uppercase tracking-widest text-blue-600">{selectedBengkung?.name}</DialogDescription>
          </DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); silibusForm.handleSubmit(); }} className="space-y-5 pt-6">
            <silibusForm.Field name="name" children={(field) => (
              <div className="space-y-1">
                <Label className="text-[10px] font-black uppercase text-slate-400 ml-1">Requirement Name</Label>
                <Input value={field.state.value} onChange={(e) => field.handleChange(e.target.value)} placeholder="e.g. Senaman Tua" className="h-10 font-bold" required />
              </div>
            )} />
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button type="button" variant="ghost" onClick={() => setIsSilibusDialogOpen(false)} className="uppercase text-[10px] font-black tracking-widest">Cancel</Button>
              <Button type="submit" disabled={silibusMutation.isPending} className="uppercase text-[10px] font-black tracking-widest px-8">Save Item</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        isOpen={!!deleteBengkungId}
        onClose={() => setDeleteBengkungId(null)}
        onConfirm={() => deleteBengkungMutation.mutate(deleteBengkungId)}
        title="Delete Bengkung"
        description="Are you sure? This will delete the bengkung and all its technical silibus items."
        isLoading={deleteBengkungMutation.isPending}
      />

      <ConfirmDialog
        isOpen={!!deleteSilibusId}
        onClose={() => setDeleteSilibusId(null)}
        onConfirm={() => deleteSilibusMutation.mutate(deleteSilibusId)}
        title="Delete Silibus Item"
        description="Remove this technical requirement from the belt level?"
        isLoading={deleteSilibusMutation.isPending}
      />
    </div>
  );
}
