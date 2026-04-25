import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from '@tanstack/react-form';
import { Briefcase, Plus, Loader2, Trash2, Pencil, Users, Hash, CheckCircle2, XCircle } from 'lucide-react';
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

export default function Positions() {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPosition, setEditingPosition] = useState(null);
  const [deleteId, setDeleteId] = useState(null);

  const { data: positions, isLoading } = useQuery({
    queryKey: ['positions'],
    queryFn: () => fetchClient('/positions'),
  });

  const createMutation = useMutation({
    mutationFn: (newPos) => fetchClient('/positions', {
      method: 'POST',
      body: JSON.stringify(newPos),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries(['positions']);
      setIsDialogOpen(false);
      toast.success('Position created successfully');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to create position');
    }
  });

  const updateMutation = useMutation({
    mutationFn: (pos) => fetchClient(`/positions/${pos.id}`, {
      method: 'PUT',
      body: JSON.stringify(pos),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries(['positions']);
      setIsDialogOpen(false);
      setEditingPosition(null);
      toast.success('Position updated successfully');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to update position');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => fetchClient(`/positions/${id}`, {
      method: 'DELETE',
    }),
    onSuccess: () => {
      queryClient.invalidateQueries(['positions']);
      setDeleteId(null);
      toast.success('Position deleted successfully');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to delete position');
      setDeleteId(null);
    }
  });

  const form = useForm({
    defaultValues: {
      name: '',
      description: '',
      sortOrder: 0,
      isActive: true,
      level: 3
    },
    onSubmit: async ({ value }) => {
      if (editingPosition) {
        updateMutation.mutate({ ...value, id: editingPosition.id });
      } else {
        createMutation.mutate(value);
      }
    },
  });

  const handleEdit = (pos) => {
    setEditingPosition(pos);
    form.setFieldValue('name', pos.name);
    form.setFieldValue('description', pos.description || '');
    form.setFieldValue('sortOrder', pos.sortOrder || 0);
    form.setFieldValue('isActive', pos.isActive ?? true);
    form.setFieldValue('level', pos.level || 3);
    setIsDialogOpen(true);
  };

  const handleAdd = () => {
    setEditingPosition(null);
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
          <h1 className="text-3xl font-bold tracking-tight">Position Management</h1>
          <p className="text-muted-foreground mt-1">Define organizational titles and positions (Jawatan).</p>
        </div>
        <Button onClick={handleAdd} className="w-full md:w-auto">
          <Plus className="mr-2 h-4 w-4" /> Add Position
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-blue-500" /> Active Positions
          </CardTitle>
          <CardDescription>
            {positions?.length || 0} positions defined in the organization.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">Order</TableHead>
                <TableHead>Scope</TableHead>
                <TableHead>Position Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Users</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {positions?.map((pos) => (
                <TableRow key={pos.id}>
                  <TableCell>
                    <span className="text-xs font-mono bg-muted px-1.5 py-0.5 rounded text-muted-foreground">
                        {pos.sortOrder}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={cn(
                        "text-[9px] uppercase font-black px-1.5 py-0",
                        pos.level === 1 ? "bg-purple-50 text-purple-700 border-purple-100" :
                        pos.level === 2 ? "bg-orange-50 text-orange-700 border-orange-100" :
                        "bg-slate-50 text-slate-700 border-slate-100"
                    )}>
                        {pos.levelName}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-bold">
                    {pos.name}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground max-w-[300px] truncate">
                    {pos.description || '-'}
                  </TableCell>
                  <TableCell>
                    {pos.isActive ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 uppercase">
                            <CheckCircle2 className="w-3 h-3" /> Active
                        </span>
                    ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-muted-foreground uppercase">
                            <XCircle className="w-3 h-3" /> Inactive
                        </span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5 font-medium">
                      <Users className="w-3 h-3 text-blue-500/50" />
                      <span className="text-xs">{pos.userCount}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(pos)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="text-destructive" onClick={() => setDeleteId(pos.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {!positions?.length && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                    No positions found.
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
            <DialogTitle>{editingPosition ? 'Edit Position' : 'Add New Position'}</DialogTitle>
            <DialogDescription>
              Define a title for organizational hierarchy.
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
            <div className="grid grid-cols-4 gap-4">
                <div className="col-span-3">
                    <form.Field
                        name="name"
                        children={(field) => (
                            <div className="space-y-2">
                            <Label htmlFor={field.name}>Position Name</Label>
                            <Input
                                id={field.name}
                                value={field.state.value}
                                onBlur={field.handleBlur}
                                onChange={(e) => field.handleChange(e.target.value)}
                                placeholder="e.g. Setiausaha Agung"
                                required
                            />
                            </div>
                        )}
                    />
                </div>
                <div className="col-span-1">
                    <form.Field
                        name="sortOrder"
                        children={(field) => (
                            <div className="space-y-2">
                            <Label htmlFor={field.name}>Order</Label>
                            <Input
                                id={field.name}
                                type="number"
                                value={field.state.value}
                                onBlur={field.handleBlur}
                                onChange={(e) => field.handleChange(parseInt(e.target.value))}
                                required
                            />
                            </div>
                        )}
                    />
                </div>
            </div>

            <form.Field
                name="level"
                children={(field) => (
                    <div className="space-y-2">
                        <Label htmlFor={field.name}>Organizational Scope</Label>
                        <select
                            id={field.name}
                            value={field.state.value}
                            onChange={(e) => field.handleChange(parseInt(e.target.value))}
                            className="flex h-10 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                        >
                            <option value={1}>Pusat (HQ)</option>
                            <option value={2}>Cawangan (Branch)</option>
                            <option value={3}>All Scopes</option>
                        </select>
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
                    placeholder="Responsibilities or details"
                    className="resize-none"
                    rows={3}
                  />
                </div>
              )}
            />

            {editingPosition && (
                <form.Field
                    name="isActive"
                    children={(field) => (
                        <div className="flex items-center gap-2 pt-2">
                            <input
                                id={field.name}
                                type="checkbox"
                                checked={field.state.value}
                                onChange={(e) => field.handleChange(e.target.checked)}
                                className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <Label htmlFor={field.name}>This position is active</Label>
                        </div>
                    )}
                />
            )}

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isMutating}>
                {isMutating ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing...</>
                ) : (
                  editingPosition ? 'Update Position' : 'Create Position'
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
        title="Delete Position"
        description="Are you sure you want to delete this position? This action will fail if users are still assigned to it."
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
