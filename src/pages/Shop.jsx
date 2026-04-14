import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from '@tanstack/react-form';
import { ShoppingBag, Loader2, Search, Filter, CheckCircle2, XCircle, UserPlus, Calendar } from 'lucide-react';
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
  const navigate = useNavigate();
  const { user: currentUser } = useAuthStore();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [cart, setCart] = useState([]);
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

  const totalPrice = cart.reduce((sum, item) => sum + item.price, 0);

  const toggleCartItem = (product) => {
    setCart(prev => {
      const exists = prev.find(p => p.id === product.id);
      if (exists) {
        return prev.filter(p => p.id !== product.id);
      } else {
        return [...prev, product];
      }
    });
  };

  const buyMutation = useMutation({
    mutationFn: (payload) => fetchClient('/finance/orders', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
    onSuccess: (data) => {
      queryClient.invalidateQueries(['orders']);
      setIsBuyDialogOpen(false);
      setCart([]);
      toast.success('Order placed successfully!');
      // Redirect to the order details page
      navigate(`/orders/${data.id}`);
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to place order');
    }
  });

  const calculateMonths = (start, end) => {
    if (!start || !end) return 0;
    const startDate = new Date(start);
    const endDate = new Date(end);
    const months = (endDate.getFullYear() - startDate.getFullYear()) * 12 + (endDate.getMonth() - startDate.getMonth()) + 1;
    return months > 0 ? months : 0;
  };

  const buyForm = useForm({
    defaultValues: {
      depositAmount: '',
      isCash: false,
      userId: null,
      isHistorical: false,
      createdAt: new Date().toISOString().split('T')[0],
      installmentStartDate: '',
      paidUpToDate: '',
    },
    onSubmit: async ({ value }) => {
      buyMutation.mutate({
        productIds: cart.map(p => p.id),
        depositAmount: parseFloat(value.depositAmount),
        isCash: value.isCash,
        userId: value.userId || undefined,
        createdAt: value.isHistorical ? value.createdAt : undefined,
        installmentStartDate: (value.isHistorical && value.installmentStartDate) ? `${value.installmentStartDate}-01` : undefined,
        paidUpToDate: (value.isHistorical && value.paidUpToDate) ? `${value.paidUpToDate}-01` : undefined
      });
    },
  });

  useEffect(() => {
    if (cart.length > 0 && isBuyDialogOpen) {
      const isCash = buyForm.getFieldValue('isCash');
      if (isCash) {
        buyForm.setFieldValue('depositAmount', totalPrice.toString());
      } else {
        const minDeposit = (totalPrice * 0.1).toFixed(2);
        buyForm.setFieldValue('depositAmount', minDeposit);
      }
    }
  }, [totalPrice, isBuyDialogOpen]);

  const handleIsCashChange = (val) => {
    buyForm.setFieldValue('isCash', val);
    if (val) {
      buyForm.setFieldValue('depositAmount', totalPrice.toString());
      buyForm.setFieldValue('isHistorical', false);
    } else {
      buyForm.setFieldValue('depositAmount', (totalPrice * 0.1).toFixed(2));
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
    <div className="p-6 space-y-6 max-w-7xl mx-auto pb-32">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Panji Alam Shop</h1>
          <p className="text-muted-foreground mt-1">Select multiple products to start your exclusive membership journey.</p>
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
        {filteredProducts?.map((product) => {
          const isInCart = cart.find(p => p.id === product.id);
          return (
            <Card key={product.id} className={`flex flex-col h-full hover:shadow-lg transition-all border-border/50 ${isInCart ? 'ring-2 ring-emerald-500 bg-emerald-500/5' : 'bg-card/50'}`}>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div className="text-xs font-semibold text-emerald-500 uppercase tracking-wider mb-1">
                    {product.category?.name}
                  </div>
                  {isInCart && <CheckCircle2 className="h-5 w-5 text-emerald-500" />}
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
                  variant={isInCart ? "outline" : "default"}
                  onClick={() => toggleCartItem(product)}
                >
                  {isInCart ? 'Remove from Cart' : 'Add to Cart'}
                </Button>
              </CardFooter>
            </Card>
          );
        })}
      </div>

      {filteredProducts?.length === 0 && (
        <div className="text-center py-20 bg-muted/20 rounded-xl border border-dashed border-border">
          <ShoppingBag className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
          <h3 className="text-lg font-medium">No products found</h3>
          <p className="text-muted-foreground">Try adjusting your search or category filters.</p>
        </div>
      )}

      {/* Floating Cart Bar */}
      {cart.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[calc(100%-3rem)] max-w-2xl z-40 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="bg-background/95 backdrop-blur-md border border-emerald-500/30 shadow-2xl rounded-2xl p-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-4 overflow-hidden">
              <div className="bg-emerald-500/20 p-2.5 rounded-xl">
                <ShoppingBag className="h-6 w-6 text-emerald-500" />
              </div>
              <div className="min-w-0">
                <p className="font-bold text-lg leading-none">RM {totalPrice.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground truncate">{cart.length} items in cart</p>
              </div>
              <div className="hidden md:flex gap-1.5 overflow-x-auto no-scrollbar max-w-[300px]">
                {cart.map(item => (
                  <div key={item.id} className="text-[10px] bg-muted px-2 py-0.5 rounded-full whitespace-nowrap border border-border/50">
                    {item.name}
                  </div>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" className="hidden sm:flex text-muted-foreground" onClick={() => setCart([])}>
                Clear
              </Button>
              <Button className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/20 shadow-lg px-8" onClick={() => setIsBuyDialogOpen(true)}>
                Checkout
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Buy Dialog */}
      <Dialog open={isBuyDialogOpen} onOpenChange={setIsBuyDialogOpen}>
        <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Checkout Confirmation</DialogTitle>
            <DialogDescription>
              Review your selected products and complete the order.
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
            <div className="space-y-3">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">Selected Products</Label>
              <div className="space-y-2 max-h-[160px] overflow-y-auto pr-2 custom-scrollbar">
                {cart.map(item => (
                  <div key={item.id} className="flex justify-between items-center p-2 rounded-md bg-muted/50 border border-border/50 text-sm">
                    <span className="font-medium truncate mr-4">{item.name}</span>
                    <span className="shrink-0 font-mono">RM {item.price.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-4 rounded-lg bg-emerald-500/5 border border-emerald-500/20 space-y-2 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground font-medium text-base">Order Total:</span>
                <span className="font-bold text-xl text-foreground">RM {totalPrice.toLocaleString()}</span>
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
                      {getCurrentTierInfo(totalPrice)}
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

            {isAdmin && (
              <buyForm.Subscribe
                selector={(state) => state.values.isCash}
                children={(isCash) => !isCash && (
                  <div className="space-y-4 pt-2 border-t border-border">
                    <buyForm.Field
                      name="isHistorical"
                      children={(field) => (
                        <div className="flex items-center justify-between">
                          <Label htmlFor="isHistorical" className="text-amber-600 dark:text-amber-400 font-medium">Historical Order (Backdate)</Label>
                          <input
                            id="isHistorical"
                            type="checkbox"
                            className="h-4 w-4 rounded border-gray-300 text-amber-600 focus:ring-amber-500"
                            checked={field.state.value}
                            onChange={(e) => field.handleChange(e.target.checked)}
                          />
                        </div>
                      )}
                    />

                    <buyForm.Subscribe
                      selector={(state) => state.values.isHistorical}
                      children={(isHistorical) => isHistorical && (
                        <div className="grid grid-cols-2 gap-4 animate-in slide-in-from-top-2 duration-200">
                          <buyForm.Field
                            name="createdAt"
                            children={(field) => (
                              <div className="space-y-2 col-span-2">
                                <Label htmlFor="createdAt">Order Date (Deposit Date)</Label>
                                <div className="relative">
                                  <Calendar className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
                                  <Input
                                    id="createdAt"
                                    type="date"
                                    className="pl-9"
                                    value={field.state.value}
                                    onChange={(e) => field.handleChange(e.target.value)}
                                  />
                                </div>
                              </div>
                            )}
                          />
                          <buyForm.Field
                            name="installmentStartDate"
                            children={(field) => (
                              <div className="space-y-2">
                                <Label htmlFor="installmentStartDate">First Installment</Label>
                                <div className="relative">
                                  <Calendar className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
                                  <Input
                                    id="installmentStartDate"
                                    type="month"
                                    className="pl-9"
                                    value={field.state.value}
                                    onChange={(e) => field.handleChange(e.target.value)}
                                  />
                                </div>
                              </div>
                            )}
                          />
                          <buyForm.Field
                            name="paidUpToDate"
                            children={(field) => (
                              <div className="space-y-2">
                                <Label htmlFor="paidUpToDate">Paid Up To</Label>
                                <div className="relative">
                                  <Calendar className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
                                  <Input
                                    id="paidUpToDate"
                                    type="month"
                                    className="pl-9"
                                    value={field.state.value}
                                    onChange={(e) => field.handleChange(e.target.value)}
                                  />
                                </div>
                              </div>
                            )}
                          />
                          
                          <buyForm.Subscribe
                            selector={(state) => [state.values.installmentStartDate, state.values.paidUpToDate]}
                            children={([start, end]) => {
                              const months = calculateMonths(start, end);
                              const rate = tierConfigs?.find(c => totalPrice >= c.minPrice && totalPrice <= c.maxPrice)?.installmentRate || 0;
                              const total = months * rate;
                              
                              return months > 0 ? (
                                <div className="col-span-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs space-y-1">
                                  <div className="flex justify-between font-medium text-amber-700 dark:text-amber-400">
                                    <span>Calculated History:</span>
                                    <span>{months} Months</span>
                                  </div>
                                  <div className="flex justify-between text-muted-foreground">
                                    <span>Rate: RM {rate}/mo x {months}</span>
                                    <span className="font-bold text-foreground">RM {total.toLocaleString()}</span>
                                  </div>
                                </div>
                              ) : null;
                            }}
                          />
                        </div>
                      )}
                    />
                  </div>
                )}
              />
            )}

            <buyForm.Subscribe
              selector={(state) => state.values.isCash}
              children={(isCash) => isCash ? (
                <div className="text-sm text-muted-foreground italic px-1 bg-muted/30 p-2 rounded-md border border-border/50">
                  Full payment of RM {totalPrice.toLocaleString()} will be required. Commission for all {cart.length} items will be credited to introducer immediately.
                </div>
              ) : (
                <buyForm.Field
                  name="depositAmount"
                  validators={{
                    onChange: ({ value }) => {
                      const min = totalPrice * 0.1;
                      if (parseFloat(value) < min) return `Minimum RM ${min.toLocaleString()} required`;
                      if (parseFloat(value) > totalPrice) return "Deposit cannot exceed price";
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
              <Button type="submit" disabled={buyMutation.isLoading || cart.length === 0}>
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
