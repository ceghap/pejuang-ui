import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from '@tanstack/react-form';
import { LayoutDashboard, Plus, Loader2, AlertCircle, CheckCircle2, Trash2 } from 'lucide-react';
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

export default function Categories() {
  const queryClient = useQueryClient();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  const { data: categories, isLoading, isError } = useQuery({
    queryKey: ['categories'],
    queryFn: () => fetchClient('/finance/categories'),
  });

  const createMutation = useMutation({
    mutationFn: (newCategory) => fetchClient('/finance/categories', {
      method: 'POST',
      body: JSON.stringify(newCategory),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries(['categories']);
      setIsAddDialogOpen(false);
      toast.success('Category created successfully');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to create category');
    }
  });

  const form = useForm({
    defaultValues: {
      name: '',
      description: '',
    },
    onSubmit: async ({ value }) => {
      createMutation.mutate(value);
    },
  });

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
          <h1 className="text-3xl font-bold tracking-tight">Product Categories</h1>
          <p className="text-muted-foreground mt-1">Manage dynamic categories for the product catalog.</p>
        </div>
        <Button onClick={() => setIsAddDialogOpen(true)} className="w-full md:w-auto">
          <Plus className="mr-2 h-4 w-4" /> Add Category
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Product Categories</CardTitle>
          <CardDescription>
            {categories?.length || 0} product categories defined in the system.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Created At</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categories?.map((category) => (
                <TableRow key={category.id}>
                  <TableCell className="font-medium">{category.name}</TableCell>
                  <TableCell className="max-w-xs truncate">{category.description || '-'}</TableCell>
                  <TableCell>{new Date(category.createdAt).toLocaleDateString()}</TableCell>
                </TableRow>
              ))}
              {!categories?.length && (
                <TableRow>
                  <TableCell colSpan={3} className="text-center py-10 text-muted-foreground">
                    No product categories found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add New Product Category</DialogTitle>
            <DialogDescription>
              Create a new category for products.
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
                  <Label htmlFor={field.name}>Category Name</Label>
                  <Input
                    id={field.name}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder="e.g. Services, Merchandise"
                  />
                </div>
              )}
            />

            <form.Field
              name="description"
              children={(field) => (
                <div className="space-y-2">
                  <Label htmlFor={field.name}>Description (Optional)</Label>
                  <Input
                    id={field.name}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder="Short description..."
                  />
                </div>
              )}
            />

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createMutation.isLoading}>
                {createMutation.isLoading ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating...</>
                ) : (
                  'Create Product Category'
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
