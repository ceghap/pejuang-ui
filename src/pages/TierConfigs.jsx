import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from '@tanstack/react-form';
import { Layers, Loader2, Pencil, Save, X, Plus, Trash2 } from 'lucide-react';
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
import { fetchClient } from '@/api/fetchClient';
import { toast } from 'sonner';

export default function TierConfigs() {
  const queryClient = useQueryClient();
  const [editingTier, setEditingTier] = useState(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  const { data: tiers, isLoading } = useQuery({
    queryKey: ['tiers'],
    queryFn: () => fetchClient('/finance/tiers'),
  });

  const updateMutation = useMutation({
    mutationFn: (config) => fetchClient(`/finance/tiers/${config.tier}`, {
      method: 'PUT',
      body: JSON.stringify(config),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries(['tiers']);
      setEditingTier(null);
      setIsAddDialogOpen(false);
      toast.success('Tier configuration saved');
    },
    onError: (error) => {
      toast.error(error.message || 'Update failed');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (tier) => fetchClient(`/finance/tiers/${tier}`, {
      method: 'DELETE',
    }),
    onSuccess: () => {
      queryClient.invalidateQueries(['tiers']);
      toast.success('Tier deleted');
    },
    onError: (error) => {
      toast.error(error.message || 'Delete failed');
    }
  });

  const form = useForm({
    defaultValues: {
      tier: '',
      minPrice: '',
      maxPrice: '',
      installmentRate: '',
    },
    onSubmit: async ({ value }) => {
      updateMutation.mutate({
        tier: value.tier,
        minPrice: parseFloat(value.minPrice),
        maxPrice: parseFloat(value.maxPrice),
        installmentRate: parseFloat(value.installmentRate),
      });
    },
  });

  const startEdit = (tier) => {
    setEditingTier(tier);
    form.reset({
      tier: tier.tier,
      minPrice: tier.minPrice.toString(),
      maxPrice: tier.maxPrice.toString(),
      installmentRate: tier.installmentRate.toString(),
    });
  };

  const startAdd = () => {
    setEditingTier(null);
    form.reset({
      tier: '',
      minPrice: '',
      maxPrice: '',
      installmentRate: '',
    });
    setIsAddDialogOpen(true);
  };

  const handleDelete = (tier) => {
    if (window.confirm(`Are you sure you want to delete the ${tier} tier?`)) {
      deleteMutation.mutate(tier);
    }
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
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Order Tiers</h1>
          <p className="text-muted-foreground mt-1">Configure price thresholds and installment rates.</p>
        </div>
        <Button onClick={startAdd}>
          <Plus className="mr-2 h-4 w-4" /> Add New Tier
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Tier Configurations</CardTitle>
          <CardDescription>
            These values determine the monthly installment rate based on the product price.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tier Name</TableHead>
                <TableHead>Min Price (RM)</TableHead>
                <TableHead>Max Price (RM)</TableHead>
                <TableHead>Installment Rate (RM)</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tiers?.map((tier) => (
                <TableRow key={tier.tier}>
                  <TableCell className="font-bold">{tier.tier}</TableCell>
                  <TableCell>
                    {editingTier?.tier === tier.tier ? (
                      <form.Field
                        name="minPrice"
                        children={(field) => (
                          <Input 
                            type="number" 
                            value={field.state.value}
                            onBlur={field.handleBlur}
                            onChange={(e) => field.handleChange(e.target.value)}
                            className="w-32"
                          />
                        )}
                      />
                    ) : (
                      tier.minPrice.toLocaleString()
                    )}
                  </TableCell>
                  <TableCell>
                    {editingTier?.tier === tier.tier ? (
                      <form.Field
                        name="maxPrice"
                        children={(field) => (
                          <Input 
                            type="number" 
                            value={field.state.value}
                            onBlur={field.handleBlur}
                            onChange={(e) => field.handleChange(e.target.value)}
                            className="w-32"
                          />
                        )}
                      />
                    ) : (
                      tier.maxPrice.toLocaleString()
                    )}
                  </TableCell>
                  <TableCell>
                    {editingTier?.tier === tier.tier ? (
                      <form.Field
                        name="installmentRate"
                        children={(field) => (
                          <Input 
                            type="number" 
                            value={field.state.value}
                            onBlur={field.handleBlur}
                            onChange={(e) => field.handleChange(e.target.value)}
                            className="w-32"
                          />
                        )}
                      />
                    ) : (
                      tier.installmentRate.toLocaleString()
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      {editingTier?.tier === tier.tier ? (
                        <>
                          <Button size="sm" onClick={() => form.handleSubmit()}>
                            <Save className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => setEditingTier(null)}>
                            <X className="h-4 w-4" />
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button size="sm" variant="ghost" onClick={() => startEdit(tier)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="ghost" className="text-destructive" onClick={() => handleDelete(tier.tier)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Tier</DialogTitle>
            <DialogDescription>Create a new price tier with a custom installment rate.</DialogDescription>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              form.handleSubmit();
            }}
            className="space-y-4 pt-4"
          >
            <form.Field
              name="tier"
              children={(field) => (
                <div className="space-y-2">
                  <Label>Tier Name</Label>
                  <Input 
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder="e.g. Diamond"
                  />
                </div>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <form.Field
                name="minPrice"
                children={(field) => (
                  <div className="space-y-2">
                    <Label>Min Price</Label>
                    <Input 
                      type="number"
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      placeholder="0"
                    />
                  </div>
                )}
              />
              <form.Field
                name="maxPrice"
                children={(field) => (
                  <div className="space-y-2">
                    <Label>Max Price</Label>
                    <Input 
                      type="number"
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      placeholder="999999"
                    />
                  </div>
                )}
              />
            </div>
            <form.Field
              name="installmentRate"
              children={(field) => (
                <div className="space-y-2">
                  <Label>Installment Rate (RM/month)</Label>
                  <Input 
                    type="number"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder="0"
                  />
                </div>
              )}
            />
            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={updateMutation.isLoading}>
                {updateMutation.isLoading ? 'Adding...' : 'Add Tier'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
