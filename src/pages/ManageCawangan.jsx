import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from '@tanstack/react-form';
import { Building2, Plus, Loader2, Trash2, MapPin, Users, Phone, UserRound, ArrowRight } from 'lucide-react';
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

export default function ManageCawangan() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  const { data: cawangans, isLoading } = useQuery({
    queryKey: ['cawangans'],
    queryFn: () => fetchClient('/cawangan'),
  });

  const createMutation = useMutation({
    mutationFn: (newCawangan) => fetchClient('/cawangan', {
      method: 'POST',
      body: JSON.stringify(newCawangan),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries(['cawangans']);
      setIsDialogOpen(false);
      toast.success('Branch created successfully');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to create branch');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => fetchClient(`/cawangan/${id}`, {
      method: 'DELETE',
    }),
    onSuccess: () => {
      queryClient.invalidateQueries(['cawangans']);
      setDeleteId(null);
      toast.success('Branch deleted successfully');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to delete branch');
      setDeleteId(null);
    }
  });

  const form = useForm({
    defaultValues: {
      name: '',
      code: '',
      location: '',
      address: '',
      contactNumber: '',
      picId: null
    },
    onSubmit: async ({ value }) => {
      createMutation.mutate(value);
    },
  });

  const handleAdd = () => {
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

  const isMutating = createMutation.isLoading;

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Cawangan Management</h1>
          <p className="text-muted-foreground mt-1">Manage organizational branches, offices, and assigned PICs.</p>
        </div>
        <Button onClick={handleAdd} className="w-full md:w-auto">
          <Plus className="mr-2 h-4 w-4" /> Add Cawangan
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-emerald-500" /> All Branches
          </CardTitle>
          <CardDescription>
            {cawangans?.length || 0} branches currently active in the system.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Branch / State</TableHead>
                <TableHead>Office Address</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Person In Charge</TableHead>
                <TableHead>Members</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cawangans?.map((cawangan) => (
                <TableRow key={cawangan.id}>
                  <TableCell className="font-bold">
                    <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          <span>{cawangan.name}</span>
                          {cawangan.code && (
                            <span className="px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-600 text-[9px] font-black uppercase tracking-tighter">
                              {cawangan.code}
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-muted-foreground uppercase tracking-widest">{cawangan.location}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-start gap-1.5 text-muted-foreground max-w-[200px]">
                      <MapPin className="w-3 h-3 mt-1 shrink-0" />
                      <span className="text-xs line-clamp-2">{cawangan.address || 'No address set'}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {cawangan.contactNumber ? (
                         <div className="flex items-center gap-1.5 font-medium text-xs">
                         <Phone className="w-3 h-3 text-emerald-500" />
                         <span>{cawangan.contactNumber}</span>
                       </div>
                    ) : '-'}
                  </TableCell>
                  <TableCell>
                      {cawangan.picName ? (
                        <div className="flex items-center gap-1.5">
                            <div className="w-6 h-6 rounded-full bg-blue-500/10 flex items-center justify-center">
                                <UserRound className="w-3 h-3 text-blue-500" />
                            </div>
                            <span className="text-xs font-bold">{cawangan.picName}</span>
                        </div>
                      ) : (
                        <span className="text-[10px] text-muted-foreground italic font-medium">Unassigned</span>
                      )}
                  </TableCell>
                  <TableCell>
                    <div 
                      className="flex items-center gap-1.5 font-medium cursor-pointer hover:text-blue-600 group"
                      onClick={() => navigate(`/admin/users?cawanganId=${cawangan.id}`)}
                    >
                      <Users className="w-3 h-3 text-blue-500/50 group-hover:text-blue-600" />
                      <span className="text-xs group-hover:underline underline-offset-4">{cawangan.userCount}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-blue-600 hover:bg-blue-50 font-bold text-[10px] uppercase tracking-widest px-3"
                        onClick={() => navigate(`/admin/cawangan/${cawangan.id}`)}
                      >
                        Manage <ArrowRight className="ml-1.5 w-3 h-3" />
                      </Button>
                      <Button variant="ghost" size="icon" className="text-destructive" onClick={() => setDeleteId(cawangan.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {!cawangans?.length && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                    No branches found.
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
            <DialogTitle>Add New Branch</DialogTitle>
            <DialogDescription>
              Create a new organizational branch.
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
            <div className="grid grid-cols-2 gap-4">
                <form.Field
                name="name"
                children={(field) => (
                    <div className="space-y-2">
                    <Label htmlFor={field.name}>Branch Name</Label>
                    <Input
                        id={field.name}
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                        placeholder="e.g. Cawangan Selangor"
                        required
                    />
                    </div>
                )}
                />

                <form.Field
                name="code"
                children={(field) => (
                    <div className="space-y-2">
                    <Label htmlFor={field.name}>State Code (3 Letters)</Label>
                    <Input
                        id={field.name}
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value.toUpperCase().slice(0, 4))}
                        placeholder="e.g. SEL, KDH"
                        className="font-mono uppercase"
                    />
                    </div>
                )}
                />
            </div>

            <div className="grid grid-cols-1 gap-4">
                <form.Field
                name="location"
                children={(field) => (
                    <div className="space-y-2">
                    <Label htmlFor={field.name}>State / Territory</Label>
                    <Input
                        id={field.name}
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                        placeholder="e.g. Selangor"
                    />
                    </div>
                )}
                />
            </div>

            <form.Field
              name="address"
              children={(field) => (
                <div className="space-y-2">
                  <Label htmlFor={field.name}>Office Address</Label>
                  <Textarea
                    id={field.name}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder="Full physical address"
                    className="resize-none"
                    rows={3}
                  />
                </div>
              )}
            />

            <form.Field
              name="contactNumber"
              children={(field) => (
                <div className="space-y-2">
                  <Label htmlFor={field.name}>Contact Number</Label>
                  <Input
                    id={field.name}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder="e.g. 03-XXXXXXXX"
                  />
                </div>
              )}
            />

            <form.Field
              name="picId"
              children={(field) => (
                <div className="col-span-2">
                  <UserLookup 
                    key="new-cawangan-pic"
                    label="Person In Charge (PIC)" 
                    placeholder="Search user to assign as PIC..."
                    value={field.state.value} 
                    onChange={(val) => field.handleChange(val)} 
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
                  'Create Branch'
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
        title="Delete Branch"
        description="Are you sure you want to delete this branch? This action cannot be undone and will fail if there are members assigned to it."
        isLoading={deleteMutation.isLoading}
      />
    </div>
  );
}
