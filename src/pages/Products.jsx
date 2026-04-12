import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from '@tanstack/react-form';
import { ShoppingBag, Plus, Loader2, Search, Info, Pencil, Trash2 } from 'lucide-react';
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
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { fetchClient } from '@/api/fetchClient';
import { toast } from 'sonner';

export default function Products() {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [search, setSearch] = useState('');

  const { data: products, isLoading: productsLoading } = useQuery({
    queryKey: ['products'],
    queryFn: () => fetchClient('/finance/products'),
  });

  const { data: categories, isLoading: categoriesLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: () => fetchClient('/finance/categories'),
  });

  const createMutation = useMutation({
    mutationFn: (newProduct) => fetchClient('/finance/products', {
      method: 'POST',
      body: JSON.stringify(newProduct),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries(['products']);
      setIsDialogOpen(false);
      toast.success('Product created successfully');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to create product');
    }
  });

  const updateMutation = useMutation({
    mutationFn: (product) => fetchClient(`/finance/products/${product.id}`, {
      method: 'PUT',
      body: JSON.stringify(product),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries(['products']);
      setIsDialogOpen(false);
      setEditingProduct(null);
      toast.success('Product updated successfully');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to update product');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => fetchClient(`/finance/products/${id}`, {
      method: 'DELETE',
    }),
    onSuccess: () => {
      queryClient.invalidateQueries(['products']);
      setDeleteId(null);
      toast.success('Product deleted successfully');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to delete product');
      setDeleteId(null);
    }
  });

  const form = useForm({
    defaultValues: {
      name: editingProduct?.name || '',
      description: editingProduct?.description || '',
      price: editingProduct?.price || '',
      totalCommission: editingProduct?.totalCommission || '',
      categoryId: editingProduct?.categoryId || '',
    },
    onSubmit: async ({ value }) => {
      const payload = {
        ...value,
        price: parseFloat(value.price),
        totalCommission: parseFloat(value.totalCommission),
      };

      if (editingProduct) {
        updateMutation.mutate({ ...payload, id: editingProduct.id });
      } else {
        createMutation.mutate(payload);
      }
    },
  });

  const handleEdit = (product) => {
    setEditingProduct(product);
    form.reset({
      name: product.name,
      description: product.description || '',
      price: product.price.toString(),
      totalCommission: product.totalCommission.toString(),
      categoryId: product.categoryId,
    });
    setIsDialogOpen(true);
  };

  const handleAdd = () => {
    setEditingProduct(null);
    form.reset({
      name: '',
      description: '',
      price: '',
      totalCommission: '',
      categoryId: '',
    });
    setIsDialogOpen(true);
  };

  const handleDeleteClick = (id) => {
    setDeleteId(id);
  };

  const filteredProducts = products?.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) || 
    p.category?.name.toLowerCase().includes(search.toLowerCase())
  );

  if (productsLoading || categoriesLoading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const isMutating = createMutation.isLoading || updateMutation.isLoading;

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Product Catalog</h1>
          <p className="text-muted-foreground mt-1">Manage items, pricing, and commission pools.</p>
        </div>
        <Button onClick={handleAdd} className="w-full md:w-auto">
          <Plus className="mr-2 h-4 w-4" /> Add Product
        </Button>
      </div>

      <div className="flex items-center space-x-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search products or categories..."
            className="pl-8"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product Name</TableHead>
                <TableHead>Product Category</TableHead>
                <TableHead className="text-right">Price (RM)</TableHead>
                <TableHead className="text-right">Commission (RM)</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProducts?.map((product) => (
                <TableRow key={product.id}>
                  <TableCell>
                    <div className="font-medium">{product.name}</div>
                    {product.description && (
                      <div className="text-xs text-muted-foreground truncate max-w-xs">{product.description}</div>
                    )}
                  </TableCell>
                  <TableCell>
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-secondary text-secondary-foreground">
                      {product.category?.name || 'Uncategorized'}
                    </span>
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {product.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </TableCell>
                  <TableCell className="text-right font-mono text-emerald-600 dark:text-emerald-400">
                    {product.totalCommission.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(product)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDeleteClick(product.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {!filteredProducts?.length && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">
                    No products found.
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
            <DialogTitle>{editingProduct ? 'Edit Product' : 'Add New Product'}</DialogTitle>
            <DialogDescription>
              {editingProduct 
                ? 'Update item details, price, or commission.' 
                : 'Create a new item in the catalog with price and commission.'}
            </DialogDescription>
          </DialogHeader>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              e.stopPropagation();
              form.handleSubmit();
            }}
            className="grid gap-4 py-4"
          >
            <form.Field
              name="name"
              children={(field) => (
                <div className="grid gap-2">
                  <Label htmlFor={field.name}>Product Name</Label>
                  <Input
                    id={field.name}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder="e.g. Naga Sakti"
                  />
                </div>
              )}
            />

            <form.Field
              name="categoryId"
              children={(field) => (
                <div className="space-y-2">
                  <Label htmlFor={field.name}>Product Category</Label>
                  <select
                    id={field.name}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                  >
                    <option value="">Select a product category</option>
                    {categories?.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <form.Field
                name="price"
                children={(field) => (
                  <div className="grid gap-2">
                    <Label htmlFor={field.name}>Price (RM)</Label>
                    <Input
                      id={field.name}
                      type="number"
                      step="0.01"
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      placeholder="0.00"
                    />
                  </div>
                )}
              />
              <form.Field
                name="totalCommission"
                children={(field) => (
                  <div className="grid gap-2">
                    <Label htmlFor={field.name}>Total Commission (RM)</Label>
                    <Input
                      id={field.name}
                      type="number"
                      step="0.01"
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      placeholder="0.00"
                    />
                  </div>
                )}
              />
            </div>

            <form.Field
              name="description"
              children={(field) => (
                <div className="grid gap-2">
                  <Label htmlFor={field.name}>Description (Optional)</Label>
                  <textarea
                    id={field.name}
                    className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder="Describe the product or its benefits..."
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
                  editingProduct ? 'Update Product' : 'Create Product'
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
        title="Delete Product"
        description="Are you sure you want to delete this product? This action cannot be undone and will fail if there are active orders associated with it."
        isLoading={deleteMutation.isLoading}
      />
    </div>
  );
}
