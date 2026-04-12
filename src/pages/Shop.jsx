import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from '@tanstack/react-form';
import { ShoppingBag, Loader2, Search, Filter, CheckCircle2, XCircle, UserPlus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";
import { fetchClient } from '@/api/fetchClient';
import { useAuthStore } from '@/store/authStore';
import { toast } from 'sonner';

// Reusable User Lookup component logic (simplified for this page)
function UserLookup({ value, onChange }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchTerm), 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const { data: results, isLoading } = useQuery({
    queryKey: ['user-lookup', debouncedSearch],
    queryFn: () => fetchClient(`/users/search?q=${encodeURIComponent(debouncedSearch)}`),
    enabled: debouncedSearch.length >= 3,
  });

  const handleSelect = (user) => {
    setSelectedUser(user);
    onChange(user.id);
    setIsOpen(false);
    setSearchTerm('');
  };

  return (
    <div className="space-y-2 relative">
      <Label>Buy for Member (Admin Only)</Label>
      {selectedUser ? (
        <div className="flex items-center justify-between p-2 border border-border bg-muted/30 rounded-md">
          <div className="text-sm">
            <p className="font-medium">{selectedUser.name}</p>
            <p className="text-xs text-muted-foreground">{selectedUser.phoneNumber}</p>
          </div>
          <Button variant="ghost" size="sm" onClick={() => { setSelectedUser(null); onChange(null); }}>
            Change
          </Button>
        </div>
      ) : (
        <div className="relative">
          <Input
            placeholder="Search member name or phone..."
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setIsOpen(true); }}
            onFocus={() => setIsOpen(true)}
          />
          {isOpen && debouncedSearch.length >= 3 && (
            <div className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-md shadow-md max-h-60 overflow-auto">
              {isLoading ? (
                <div className="p-4 text-center text-sm text-muted-foreground">Searching...</div>
              ) : results?.length > 0 ? (
                results.map(u => (
                  <button
                    key={u.id}
                    className="w-full text-left px-4 py-2 text-sm hover:bg-muted transition-colors flex flex-col"
                    onClick={() => handleSelect(u)}
                  >
                    <span className="font-medium">{u.name}</span>
                    <span className="text-xs text-muted-foreground">{u.phoneNumber}</span>
                  </button>
                ))
              ) : (
                <div className="p-4 text-center text-sm text-muted-foreground">No members found.</div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function Shop() {
  const { user: currentUser } = useAuthStore();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isBuyDialogOpen, setIsBuyDialogOpen] = useState(false);

  const isAdmin = currentUser?.role === 'Admin' || currentUser?.role === 'SuperAdmin';

  const { data: products, isLoading: productsLoading } = useQuery({
    queryKey: ['products'],
    queryFn: () => fetchClient('/finance/products'),
  });

  const { data: categories, isLoading: categoriesLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: () => fetchClient('/finance/categories'),
  });

  const { data: tierConfigs } = useQuery({
    queryKey: ['tiers'],
    queryFn: () => fetchClient('/finance/tiers'),
  });

  const buyMutation = useMutation({
    mutationFn: (payload) => fetchClient('/finance/orders', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries(['orders']);
      setIsBuyDialogOpen(false);
      toast.success('Order placed successfully!');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to place order');
    }
  });

  const buyForm = useForm({
    defaultValues: {
      depositAmount: '',
      isCash: false,
      userId: null,
    },
    onSubmit: async ({ value }) => {
      buyMutation.mutate({
        productId: selectedProduct.id,
        depositAmount: parseFloat(value.depositAmount),
        isCash: value.isCash,
        userId: value.userId || undefined
      });
    },
  });

  useEffect(() => {
    if (selectedProduct && isBuyDialogOpen) {
      const isCash = buyForm.getFieldValue('isCash');
      if (isCash) {
        buyForm.setFieldValue('depositAmount', selectedProduct.price.toString());
      } else {
        const minDeposit = (selectedProduct.price * 0.1).toFixed(2);
        buyForm.setFieldValue('depositAmount', minDeposit);
      }
    }
  }, [selectedProduct, isBuyDialogOpen]);

  const handleIsCashChange = (val) => {
    buyForm.setFieldValue('isCash', val);
    if (val) {
      buyForm.setFieldValue('depositAmount', selectedProduct.price.toString());
    } else {
      buyForm.setFieldValue('depositAmount', (selectedProduct.price * 0.1).toFixed(2));
    }
  };

  const filteredProducts = products?.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || p.categoryId === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const getCurrentTierInfo = (price) => {
    if (!tierConfigs) return 'Calculating...';
    const config = tierConfigs.find(c => price >= c.minPrice && price <= c.maxPrice);
    return config ? `${config.tier} (RM${config.installmentRate}/mo)` : 'N/A';
  };

  if (productsLoading || categoriesLoading) {
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
          <h1 className="text-3xl font-bold tracking-tight">Panji Alam Shop</h1>
          <p className="text-muted-foreground mt-1">Select a product to start your exclusive membership journey.</p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search products..."
            className="pl-8"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 no-scrollbar">
          <Button
            variant={selectedCategory === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedCategory('all')}
          >
            All
          </Button>
          {categories?.map(c => (
            <Button
              key={c.id}
              variant={selectedCategory === c.id ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory(c.id)}
              className="whitespace-nowrap"
            >
              {c.name}
            </Button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredProducts?.map((product) => (
          <Card key={product.id} className="flex flex-col h-full hover:shadow-lg transition-shadow border-border/50 bg-card/50">
            <CardHeader className="pb-2">
              <div className="text-xs font-semibold text-emerald-500 uppercase tracking-wider mb-1">
                {product.category?.name}
              </div>
              <CardTitle className="text-xl line-clamp-1">{product.name}</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 pb-4">
              <p className="text-sm text-muted-foreground line-clamp-3 mb-4 min-h-[60px]">
                {product.description || "No description provided for this exclusive product."}
              </p>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Price</p>
                <p className="text-2xl font-bold text-foreground">
                  RM {product.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </p>
              </div>
            </CardContent>
            <CardFooter className="pt-0 border-t border-border/50 bg-muted/20">
              <Button
                className="w-full mt-4"
                onClick={() => {
                  setSelectedProduct(product);
                  setIsBuyDialogOpen(true);
                }}
              >
                Place Order
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      {filteredProducts?.length === 0 && (
        <div className="text-center py-20 bg-muted/20 rounded-xl border border-dashed border-border">
          <ShoppingBag className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
          <h3 className="text-lg font-medium">No products found</h3>
          <p className="text-muted-foreground">Try adjusting your search or category filters.</p>
        </div>
      )}

      {/* Buy Dialog */}
      <Dialog open={isBuyDialogOpen} onOpenChange={setIsBuyDialogOpen}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle>Order Confirmation</DialogTitle>
            <DialogDescription>
              Confirming order for <span className="font-semibold text-foreground">{selectedProduct?.name}</span>
            </DialogDescription>
          </DialogHeader>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              e.stopPropagation();
              buyForm.handleSubmit();
            }}
            className="space-y-6 py-4"
          >
            <div className="p-4 rounded-lg bg-emerald-500/5 border border-emerald-500/20 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Price:</span>
                <span className="font-bold text-foreground">RM {selectedProduct?.price.toLocaleString()}</span>
              </div>

              <buyForm.Field
                name="isCash"
                children={(field) => (
                  <div className="flex items-center justify-between pt-2">
                    <Label htmlFor="isCash" className="cursor-pointer">Full Cash Purchase</Label>
                    <input
                      id="isCash"
                      type="checkbox"
                      className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                      checked={field.state.value}
                      onChange={(e) => handleIsCashChange(e.target.checked)}
                    />
                  </div>
                )}
              />

              <buyForm.Subscribe
                selector={(state) => state.values.isCash}
                children={(isCash) => !isCash ? (
                  <div className="flex justify-between pt-2 border-t border-emerald-500/10">
                    <span className="text-muted-foreground">Installment Tier:</span>
                    <span className="font-medium text-emerald-600 dark:text-emerald-400">
                      {getCurrentTierInfo(selectedProduct?.price)}
                    </span>
                  </div>
                ) : null}
              />
            </div>

            {isAdmin && (
              <buyForm.Field
                name="userId"
                children={(field) => (
                  <UserLookup
                    value={field.state.value}
                    onChange={(val) => field.handleChange(val)}
                  />
                )}
              />
            )}

            <buyForm.Subscribe
              selector={(state) => state.values.isCash}
              children={(isCash) => isCash ? (
                <div className="text-sm text-muted-foreground italic px-1">
                  Full payment of RM {selectedProduct?.price.toLocaleString()} will be required. Commission will be credited to introducer immediately.
                </div>
              ) : (
                <buyForm.Field
                  name="depositAmount"
                  validators={{
                    onChange: ({ value }) => {
                      const min = selectedProduct?.price * 0.1;
                      if (parseFloat(value) < min) return `Minimum RM ${min.toLocaleString()} required`;
                      if (parseFloat(value) > selectedProduct?.price) return "Deposit cannot exceed price";
                      return undefined;
                    }
                  }}
                  children={(field) => (
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <Label htmlFor={field.name}>Initial Deposit (RM)</Label>
                        <span className="text-[10px] text-emerald-600 font-medium italic">Min. 10% required</span>
                      </div>
                      <Input
                        id={field.name}
                        type="number"
                        step="0.01"
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                        className={field.state.meta.errors.length ? "border-destructive" : ""}
                      />
                      {field.state.meta.errors.length > 0 ? (
                        <p className="text-[10px] text-destructive">{field.state.meta.errors[0]}</p>
                      ) : (
                        <p className="text-[10px] text-muted-foreground">Paying a higher deposit reduces your total remaining balance.</p>
                      )}
                    </div>
                  )}
                />
              )}
            />

            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => setIsBuyDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={buyMutation.isLoading}>
                {buyMutation.isLoading ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing...</>
                ) : (
                  'Confirm Order'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
