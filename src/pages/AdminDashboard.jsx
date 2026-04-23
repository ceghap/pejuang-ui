import { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from '@tanstack/react-form';
import { UploadCloud, Users, Plus, Download, Search, ChevronLeft, Building2, ChevronRight, Loader2, AlertCircle, CheckCircle2, Pencil, Trash2, X, MoreHorizontal } from 'lucide-react';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { fetchClient, downloadFile } from '@/api/fetchClient';
import { cn } from '@/lib/utils';
import { UserLookup } from '@/components/ui/user-lookup';

import { toast } from 'sonner';

export default function AdminDashboard() {
  const queryClient = useQueryClient();
  const fileInputRef = useRef(null);

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [cawanganFilter, setCawanganFilter] = useState('all');
  const [mandiAdatFilter, setMandiAdatFilter] = useState('all');

  const [editingUser, setEditingUser] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isCreateUserModalOpen, setIsCreateUserModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [deletingUser, setDeletingUser] = useState(null);
  const [selectedImportFile, setSelectedImportFile] = useState(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1); // Reset page on search
    }, 500);
    return () => clearTimeout(timer);
  }, [search, cawanganFilter, mandiAdatFilter]);

  const { data: usersData, isLoading: isLoadingUsers } = useQuery({
    queryKey: ['users', page, debouncedSearch, cawanganFilter, mandiAdatFilter],
    queryFn: () => {
      let url = `/users?page=${page}&limit=10`;
      if (debouncedSearch) url += `&search=${encodeURIComponent(debouncedSearch)}`;
      if (cawanganFilter !== 'all') url += `&cawanganId=${cawanganFilter}`;
      if (mandiAdatFilter !== 'all') url += `&isMandiAdat=${mandiAdatFilter === 'yes'}`;
      return fetchClient(url);
    }
  });

  const { data: cawangans } = useQuery({
    queryKey: ['cawangans'],
    queryFn: () => fetchClient('/cawangan'),
  });

  const { data: programs } = useQuery({
    queryKey: ['programs'],
    queryFn: () => fetchClient('/memberships/programs'),
  });

  const createUserMutation = useMutation({
    mutationFn: (data) => fetchClient('/users', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
    onSuccess: (data) => {
      toast.success("User created successfully!", {
        description: `Temp Password: ${data.temporaryPassword}`,
        duration: 10000,
      });
      setIsCreateUserModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ['users'] });
      form.reset();
    },
    onError: (error) => {
      toast.error("Failed to create user", {
        description: error.message
      });
    }
  });

  const updateUserMutation = useMutation({
    mutationFn: (data) => fetchClient(`/users/${data.id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    }),
    onSuccess: () => {
      toast.success("User updated successfully!");
      setIsEditModalOpen(false);
      setEditingUser(null);
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['user-detail'] });
    },
    onError: (error) => {
      toast.error("Failed to update user", {
        description: error.message
      });
    }
  });

  const deleteUserMutation = useMutation({
    mutationFn: (id) => fetchClient(`/users/${id}`, {
      method: 'DELETE'
    }),
    onSuccess: () => {
      toast.success("User deleted successfully!");
      setDeletingUser(null);
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (error) => {
      toast.error("Failed to delete user", {
        description: error.message
      });
      setDeletingUser(null);
    }
  });

  const form = useForm({
    defaultValues: {
      name: '',
      phoneNumber: '',
      icNumber: '',
      email: '',
      role: 3,
      uplineId: null,
      cawanganId: null,
      isMandiAdat: false,
      programName: ''
    },
    onSubmit: async ({ value }) => {
      createUserMutation.mutate(value);
    },
  });

  const importMutation = useMutation({
    mutationFn: (base64) => fetchClient('/users/import', {
      method: 'POST',
      body: JSON.stringify({ fileBase64: base64 })
    }),
    onSuccess: (data) => {
      if (data.failed > 0) {
        toast.warning("Import partially successful", {
          description: `Imported: ${data.imported}. Failed: ${data.failed}. First error: ${data.errors[0]}`
        });
      } else {
        toast.success(`Successfully imported ${data.imported} users.`);
      }
      setIsImportModalOpen(false);
      setSelectedImportFile(null);
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (error) => {
      toast.error("Import failed", {
        description: error.message
      });
    }
  });

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      setSelectedImportFile({
        name: file.name,
        size: file.size,
        base64: event.target.result
      });
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleStartImport = () => {
    if (selectedImportFile?.base64) {
      importMutation.mutate(selectedImportFile.base64);
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      await downloadFile('/users/import/template', 'Pejuang_Users_Template.xlsx');
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="h-full text-foreground p-4 md:p-8 pt-6 overflow-y-auto">
      <div className="max-w-6xl mx-auto space-y-6 md:space-y-8 pb-10">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <h1 className="text-2xl md:text-3xl font-light tracking-tight">Admin <span className="font-semibold">Dashboard</span></h1>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Button
              onClick={() => setIsCreateUserModalOpen(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white flex-1 sm:flex-none"
            >
              <Plus className="w-4 h-4 mr-2" /> Add User
            </Button>
            <Button
              onClick={() => setIsImportModalOpen(true)}
              variant="outline"
              className="border-emerald-500/50 text-emerald-600 hover:bg-emerald-50 flex-1 sm:flex-none"
            >
              <UploadCloud className="w-4 h-4 mr-2" /> Bulk Import
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6">
        </div>
        {/* User Table Section */}
        <Card className="bg-card border-border">
          <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-xl">User Directory</CardTitle>
              <CardDescription className="text-muted-foreground">Manage all registered prospects and admins.</CardDescription>
            </div>
            <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
              <select
                className="bg-background border border-border rounded-md text-[10px] font-bold uppercase h-10 px-2 outline-none w-full sm:w-auto"
                value={cawanganFilter}
                onChange={(e) => setCawanganFilter(e.target.value)}
              >
                <option value="all">All Branches</option>
                <option value="unassigned">Unassigned</option>
                {cawangans?.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              <select
                className="bg-background border border-border rounded-md text-[10px] font-bold uppercase h-10 px-2 outline-none w-full sm:w-auto"
                value={mandiAdatFilter}
                onChange={(e) => setMandiAdatFilter(e.target.value)}
              >
                <option value="all">Mandi Adat: All</option>
                <option value="yes">Mandi Adat: Yes</option>
                <option value="no">Mandi Adat: No</option>
              </select>

              <div className="relative w-full sm:w-64">
                <Search className="absolute left-2.5 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search users..."
                  className="pl-9 bg-background border-border w-full h-10"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border border-border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Contact / ID</TableHead>
                    <TableHead>Cawangan</TableHead>
                    <TableHead>Mandi Adat</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoadingUsers ? (
                    <TableRow>
                      <TableCell colSpan={6} className="h-24 text-center">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                          <span className="text-muted-foreground">Loading users...</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : usersData?.data?.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                        No users found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    usersData?.data?.map(user => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">
                          <div className="flex flex-col">
                            <span>{user.name}</span>
                            <span className="text-[10px] text-muted-foreground font-mono">{user.icNumber}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="text-xs">{user.phoneNumber}</span>
                            <span className="text-[9px] text-muted-foreground truncate max-w-[120px]">{user.email || '-'}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5">
                            <Building2 className="w-3 h-3 text-muted-foreground/30" />
                            <span className={cn(
                              "text-xs",
                              user.cawanganName ? "font-bold text-foreground" : "italic text-muted-foreground font-medium"
                            )}>
                              {user.cawanganName || 'Unassigned'}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {user.isMandiAdat ? (
                            <span className="inline-flex items-center gap-1 text-blue-600 font-bold text-[10px] uppercase">
                              <CheckCircle2 className="w-3 h-3" /> Done
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold text-muted-foreground/40 uppercase">Pending</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter ${user.role === 'SuperAdmin' || user.role === 'Admin'
                            ? 'bg-blue-500/10 text-blue-500 border border-blue-500/20'
                            : 'bg-muted text-muted-foreground border border-border'
                            }`}>
                            {user.role}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">Open menu</span>
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuGroup>
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                <DropdownMenuItem
                                  onClick={() => {
                                    setEditingUser(user);
                                    setIsEditModalOpen(true);
                                  }}
                                >
                                  <Pencil className="mr-2 h-4 w-4" />
                                  Edit User
                                </DropdownMenuItem>
                              </DropdownMenuGroup>
                              <DropdownMenuSeparator />
                              <DropdownMenuGroup>
                                <DropdownMenuItem
                                  className="text-rose-600 focus:text-rose-600 focus:bg-rose-50"
                                  onClick={() => setDeletingUser(user)}
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Delete User
                                </DropdownMenuItem>
                              </DropdownMenuGroup>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            {usersData?.totalPages > 1 && (
              <div className="flex flex-col sm:flex-row items-center justify-between mt-4 gap-4 text-sm text-muted-foreground">
                <div className="text-center sm:text-left">
                  Showing page {page} of {usersData.totalPages} ({usersData.totalCount} total)
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-border hover:bg-accent text-foreground"
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    <ChevronLeft className="w-4 h-4 mr-1" /> Prev
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-border hover:bg-accent text-foreground"
                    onClick={() => setPage(p => Math.min(usersData.totalPages, p + 1))}
                    disabled={page === usersData.totalPages}
                  >
                    Next <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

      </div>

      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {editingUser && (
            <EditUserModal
              user={editingUser}
              onClose={() => {
                setIsEditModalOpen(false);
                setEditingUser(null);
              }}
              onSave={(data) => updateUserMutation.mutate({ ...data, id: editingUser.id })}
              isSaving={updateUserMutation.isPending}
            />
          )}
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        isOpen={!!deletingUser}
        onClose={() => setDeletingUser(null)}
        onConfirm={() => deleteUserMutation.mutate(deletingUser.id)}
        isLoading={deleteUserMutation.isPending}
        title="Delete User"
        description={`Are you sure you want to delete ${deletingUser?.name}? This action cannot be undone.`}
      />

      <Dialog open={isCreateUserModalOpen} onOpenChange={setIsCreateUserModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-500" /> Manual User Creation
            </DialogTitle>
            <DialogDescription>
              Add a single new prospect or administrator to the system.
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
                    <Label htmlFor={field.name}>Full Name *</Label>
                    <Input
                      id={field.name}
                      name={field.name}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      required
                      className="bg-background border-border"
                    />
                  </div>
                )}
              />
              <form.Field
                name="icNumber"
                children={(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>IC Number *</Label>
                    <Input
                      id={field.name}
                      name={field.name}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      required
                      className="bg-background border-border"
                    />
                  </div>
                )}
              />
              <form.Field
                name="phoneNumber"
                children={(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>Phone Number *</Label>
                    <Input
                      id={field.name}
                      name={field.name}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      required
                      className="bg-background border-border"
                    />
                  </div>
                )}
              />
              <form.Field
                name="email"
                children={(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>Email</Label>
                    <Input
                      id={field.name}
                      name={field.name}
                      type="email"
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      className="bg-background border-border"
                    />
                  </div>
                )}
              />
              <form.Field
                name="uplineId"
                children={(field) => (
                  <div className="col-span-2">
                    <UserLookup
                      label="Introducer (Upline)"
                      value={field.state.value}
                      onChange={(val) => field.handleChange(val)}
                    />
                  </div>
                )}
              />
              <form.Field
                name="cawanganId"
                children={(field) => (
                  <div className="space-y-2 col-span-2">
                    <Label htmlFor={field.name}>Cawangan (Branch)</Label>
                    <select
                      id={field.name}
                      name={field.name}
                      value={field.state.value || ''}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value || null)}
                      className="flex h-10 w-full rounded-md border border-border bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 text-foreground"
                    >
                      <option value="">Select Cawangan...</option>
                      {cawangans?.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                )}
              />
              <form.Field
                name="programName"
                children={(field) => (
                  <div className="space-y-2 col-span-2">
                    <Label htmlFor={field.name}>Membership Program</Label>
                    <select
                      id={field.name}
                      name={field.name}
                      value={field.state.value || ''}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value || null)}
                      className="flex h-10 w-full rounded-md border border-border bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 text-foreground"
                    >
                      <option value="">No Membership</option>
                      <option value="Normal">General Member (GM)</option>
                      {programs?.filter(p => p.name !== 'Normal').map(p => (
                        <option key={p.id} value={p.name}>{p.description} ({p.prefix})</option>
                      ))}
                    </select>
                  </div>
                )}
              />
              <form.Field
                name="isMandiAdat"
                children={(field) => (
                  <div className="flex items-center gap-3 col-span-2 p-3 bg-muted/30 rounded-lg border border-border">
                    <input
                      type="checkbox"
                      id={field.name}
                      checked={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.checked)}
                      className="h-4 w-4 rounded border-border text-blue-600 focus:ring-blue-500"
                    />
                    <div className="space-y-0.5">
                      <Label htmlFor={field.name} className="text-sm font-bold">Mandi Adat</Label>
                      <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest opacity-60">Joined mandi adat.</p>
                    </div>
                  </div>
                )}
              />
              <form.Field
                name="role"
                children={(field) => (
                  <div className="space-y-2 col-span-2">
                    <Label htmlFor={field.name}>Role</Label>
                    <select
                      id={field.name}
                      name={field.name}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(parseInt(e.target.value, 10))}
                      className="flex h-10 w-full rounded-md border border-border bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 text-foreground"
                    >
                      <option value={3}>User</option>
                      <option value={2}>Admin</option>
                      <option value={1}>SuperAdmin</option>
                    </select>
                  </div>
                )}
              />
            </div>

            <div className="flex justify-end gap-3 pt-6">
              <Button type="button" variant="outline" onClick={() => setIsCreateUserModalOpen(false)}>
                Cancel
              </Button>
              <form.Subscribe
                selector={(state) => [state.canSubmit, state.isSubmitting]}
                children={([canSubmit, isSubmitting]) => (
                  <Button
                    type="submit"
                    className="bg-blue-600 hover:bg-blue-700 text-white min-w-[120px]"
                    disabled={!canSubmit || isSubmitting || createUserMutation.isPending}
                  >
                    {(isSubmitting || createUserMutation.isPending) && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    Create User
                  </Button>
                )}
              />
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isImportModalOpen} onOpenChange={setIsImportModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-emerald-600">
              <UploadCloud className="w-5 h-5" /> Bulk User Provisioning
            </DialogTitle>
            <DialogDescription>
              Upload an Excel (.xlsx) file to create multiple users and hierarchies at once.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 pt-4">
            <div className="p-4 bg-muted/30 border border-border rounded-lg space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Step 1: Preparation</p>
                <Button onClick={handleDownloadTemplate} variant="link" className="h-auto p-0 text-xs text-emerald-600">
                  <Download className="w-3 h-3 mr-1" /> Download Template
                </Button>
              </div>
              <p className="text-[10px] text-muted-foreground leading-relaxed">
                Please use our official template to ensure data integrity. Ensure all required columns (Name, IC, Phone) are correctly filled.
              </p>
            </div>

            <div className="space-y-3">
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground px-1">Step 2: Upload File</p>
              <input
                type="file"
                accept=".xlsx"
                className="hidden"
                ref={fileInputRef}
                onChange={handleFileChange}
              />

              <div
                onClick={() => fileInputRef.current?.click()}
                className={cn(
                  "h-40 border-2 border-dashed rounded-xl flex flex-col items-center justify-center transition-all cursor-pointer",
                  selectedImportFile
                    ? "border-emerald-500 bg-emerald-50/30"
                    : "border-border bg-muted/10 hover:bg-muted/20 hover:border-muted-foreground/30"
                )}
              >
                {importMutation.isPending ? (
                  <Loader2 className="w-10 h-10 mb-2 text-emerald-500 animate-spin" />
                ) : selectedImportFile ? (
                  <CheckCircle2 className="w-10 h-10 mb-2 text-emerald-500" />
                ) : (
                  <UploadCloud className="w-10 h-10 mb-2 text-muted-foreground/30" />
                )}

                <div className="text-center px-6">
                  {selectedImportFile ? (
                    <>
                      <p className="text-sm font-bold text-emerald-700">{selectedImportFile.name}</p>
                      <p className="text-[10px] text-emerald-600/70 font-medium">Ready to process ({(selectedImportFile.size / 1024).toFixed(1)} KB)</p>
                    </>
                  ) : (
                    <>
                      <p className="text-sm font-medium text-foreground">Click to browse or drag file here</p>
                      <p className="text-[10px] text-muted-foreground mt-1">Microsoft Excel (.xlsx) only</p>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2 pt-2">
              <Button
                onClick={handleStartImport}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                disabled={!selectedImportFile?.base64 || importMutation.isPending}
              >
                {importMutation.isPending ? 'Processing Import...' : 'Start Bulk Import'}
              </Button>
              <Button
                variant="ghost"
                className="text-xs text-muted-foreground"
                onClick={() => setIsImportModalOpen(false)}
                disabled={importMutation.isPending}
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export function EditUserModal({ user: summaryUser, onClose, onSave, isSaving }) {
  const { data: user, isLoading } = useQuery({
    queryKey: ['user-detail', summaryUser.id],
    queryFn: () => fetchClient(`/users/${summaryUser.id}`),
    enabled: !!summaryUser?.id
  });

  if (isLoading) {
    return (
      <div className="p-12 flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        <p className="text-sm text-muted-foreground font-medium italic">Fetching latest user details...</p>
      </div>
    );
  }

  if (!user) return null;

  return (
    <EditUserForm
      user={user}
      onClose={onClose}
      onSave={onSave}
      isSaving={isSaving}
    />
  );
}

function EditUserForm({ user, onClose, onSave, isSaving }) {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('details');

  const form = useForm({
    defaultValues: {
      name: user.name,
      phoneNumber: user.phoneNumber,
      icNumber: user.icNumber,
      email: user.email || '',
      role: user.role === 'SuperAdmin' ? 1 : user.role === 'Admin' ? 2 : 3,
      uplineId: user.uplineId || null,
      cawanganId: user.cawanganId || null,
      isMandiAdat: user.isMandiAdat || false,
    },
    onSubmit: async ({ value }) => {
      onSave(value);
    },
  });

  const { data: cawangans } = useQuery({
    queryKey: ['cawangans'],
    queryFn: () => fetchClient('/cawangan'),
  });

  const { data: downlinesData, isLoading: isLoadingDownlines } = useQuery({
    queryKey: ['user-downlines', user.id],
    queryFn: () => fetchClient(`/users/${user.id}/downlines`),
    enabled: activeTab === 'downlines'
  });

  const { data: membershipsData, isLoading: isLoadingMemberships } = useQuery({
    queryKey: ['user-memberships', user.id],
    queryFn: () => fetchClient(`/users/${user.id}`), // The user detail endpoint already includes memberships
    enabled: activeTab === 'memberships'
  });

  const { data: programs } = useQuery({
    queryKey: ['membership-programs'],
    queryFn: () => fetchClient('/memberships/programs'),
    enabled: activeTab === 'memberships'
  });

  const assignMembershipMutation = useMutation({
    mutationFn: (data) => fetchClient(`/users/${user.id}/memberships`, {
      method: 'POST',
      body: JSON.stringify(data)
    }),
    onSuccess: () => {
      toast.success("Membership assigned successfully!");
      queryClient.invalidateQueries({ queryKey: ['user-memberships', user.id] });
      queryClient.invalidateQueries({ queryKey: ['user-detail', user.id] });
    },
    onError: (error) => {
      toast.error("Failed to assign membership", { description: error.message });
    }
  });

  const addDownlineMutation = useMutation({
    mutationFn: (downlineId) => fetchClient(`/users/${downlineId}/upline`, {
      method: 'PUT',
      body: JSON.stringify({ uplineId: user.id })
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-downlines', user.id] });
    }
  });

  const removeDownlineMutation = useMutation({
    mutationFn: (downlineId) => fetchClient(`/users/${downlineId}/upline`, {
      method: 'PUT',
      body: JSON.stringify({ uplineId: null })
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-downlines', user.id] });
    }
  });

  return (
    <>
      <DialogHeader>
        <DialogTitle>Edit User</DialogTitle>
        <DialogDescription>
          Managing {user.name}
        </DialogDescription>
      </DialogHeader>

      <div className="flex gap-4 border-b border-border mt-2">
        <button
          className={`pb-2 text-sm font-medium transition-colors border-b-2 ${activeTab === 'details' ? 'border-blue-500 text-blue-500' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
          onClick={() => setActiveTab('details')}
        >
          Details
        </button>
        <button
          className={`pb-2 text-sm font-medium transition-colors border-b-2 ${activeTab === 'downlines' ? 'border-blue-500 text-blue-500' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
          onClick={() => setActiveTab('downlines')}
        >
          Downlines
        </button>
        <button
          className={`pb-2 text-sm font-medium transition-colors border-b-2 ${activeTab === 'memberships' ? 'border-blue-500 text-blue-500' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
          onClick={() => setActiveTab('memberships')}
        >
          Memberships
        </button>
      </div>

      <div className="pt-4">
        {activeTab === 'details' ? (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              e.stopPropagation();
              form.handleSubmit();
            }}
            className="space-y-4"
          >
            <div className="grid grid-cols-2 gap-4">
              <form.Field
                name="name"
                children={(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={`edit-${field.name}`}>Full Name *</Label>
                    <Input
                      id={`edit-${field.name}`}
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      required
                      className="bg-background border-border"
                    />
                  </div>
                )}
              />
              <form.Field
                name="icNumber"
                children={(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={`edit-${field.name}`}>IC Number *</Label>
                    <Input
                      id={`edit-${field.name}`}
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      required
                      className="bg-background border-border"
                    />
                  </div>
                )}
              />
              <form.Field
                name="phoneNumber"
                children={(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={`edit-${field.name}`}>Phone Number *</Label>
                    <Input
                      id={`edit-${field.name}`}
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      required
                      className="bg-background border-border"
                    />
                  </div>
                )}
              />
              <form.Field
                name="email"
                children={(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={`edit-${field.name}`}>Email</Label>
                    <Input
                      id={`edit-${field.name}`}
                      type="email"
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      className="bg-background border-border"
                    />
                  </div>
                )}
              />
              <form.Field
                name="uplineId"
                children={(field) => (
                  <div className="col-span-2">
                    <UserLookup
                      label="Introducer (Upline)"
                      value={field.state.value}
                      initialData={user.upline}
                      onChange={(val) => field.handleChange(val)}
                    />
                  </div>
                )}
              />
              <form.Field
                name="cawanganId"
                children={(field) => (
                  <div className="space-y-2 col-span-2">
                    <Label htmlFor={`edit-${field.name}`}>Cawangan (Branch)</Label>
                    <select
                      id={`edit-${field.name}`}
                      value={field.state.value || ''}
                      onChange={(e) => field.handleChange(e.target.value || null)}
                      className="flex h-10 w-full rounded-md border border-border bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 text-foreground"
                    >
                      <option value="">Select Cawangan...</option>
                      {cawangans?.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                )}
              />
              <form.Field
                name="isMandiAdat"
                children={(field) => (
                  <div className="flex items-center gap-3 col-span-2 p-3 bg-muted/30 rounded-lg border border-border">
                    <input
                      type="checkbox"
                      id={`edit-${field.name}`}
                      checked={field.state.value}
                      onChange={(e) => field.handleChange(e.target.checked)}
                      className="h-4 w-4 rounded border-border text-blue-600 focus:ring-blue-500"
                    />
                    <div className="space-y-0.5">
                      <Label htmlFor={`edit-${field.name}`} className="text-sm font-bold">Mandi Adat</Label>
                      <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest opacity-60">Joined mandi adat</p>
                    </div>
                  </div>
                )}
              />
              <form.Field
                name="role"
                children={(field) => (
                  <div className="space-y-2 col-span-2">
                    <Label htmlFor={`edit-${field.name}`}>Role</Label>
                    <select
                      id={`edit-${field.name}`}
                      value={field.state.value}
                      onChange={(e) => field.handleChange(parseInt(e.target.value, 10))}
                      className="flex h-10 w-full rounded-md border border-border bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 text-foreground"
                    >
                      <option value={3}>User</option>
                      <option value={2}>Admin</option>
                      <option value={1}>SuperAdmin</option>
                    </select>
                  </div>
                )}
              />
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <form.Subscribe
                selector={(state) => [state.canSubmit, state.isSubmitting]}
                children={([canSubmit, isSubmitting]) => (
                  <Button
                    type="submit"
                    className="bg-blue-600 hover:bg-blue-700 text-white min-w-[100px]"
                    disabled={!canSubmit || isSubmitting || isSaving}
                  >
                    {(isSubmitting || isSaving) && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    Save Changes
                  </Button>
                )}
              />
            </div>
          </form>
        ) : activeTab === 'downlines' ? (
          <div className="space-y-4">
            <div className="pb-4 border-b border-border">
              <UserLookup
                label="Add New Downline"
                placeholder="Search user to add to team..."
                value={null}
                onChange={(val) => val && addDownlineMutation.mutate(val)}
              />
            </div>

            <div className="max-h-60 overflow-y-auto space-y-2 custom-scrollbar pr-1">
              <Label>Current Team ({downlinesData?.count || 0})</Label>
              {isLoadingDownlines ? (
                <div className="py-8 text-center text-sm text-muted-foreground">Loading team...</div>
              ) : downlinesData?.downlines?.length > 0 ? (
                downlinesData.downlines.map(dl => (
                  <div key={dl.id} className="flex items-center justify-between p-2 rounded-md border border-border bg-muted/20 group">
                    <div>
                      <p className="text-sm font-medium">{dl.name}</p>
                      <p className="text-[10px] text-muted-foreground">{dl.icNumber} | {dl.phoneNumber}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-muted-foreground hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => removeDownlineMutation.mutate(dl.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))
              ) : (
                <div className="py-8 text-center text-sm text-muted-foreground border border-dashed border-border rounded-md">
                  No downlines assigned to this user.
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="p-4 bg-muted/30 border border-border rounded-lg space-y-4">
              <p className="text-sm font-medium">Assign New Membership</p>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Program Type</Label>
                  <select
                    id="program-type-select"
                    className="flex h-10 w-full rounded-md border border-border bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 text-foreground"
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val) assignMembershipMutation.mutate({ programType: val });
                      e.target.value = "";
                    }}
                  >
                    <option value="">Select Program...</option>
                    {programs?.map(p => (
                      <option key={p.id} value={p.name}>{p.name} ({p.prefix})</option>
                    ))}
                  </select>
                </div>
              </div>
              <p className="text-[10px] text-muted-foreground italic">
                * Assigning a membership will automatically generate a unique sequential ID.
              </p>
            </div>

            <div className="space-y-3">
              <Label>Active Memberships ({membershipsData?.memberships?.length || 0})</Label>
              {isLoadingMemberships ? (
                <div className="py-8 text-center text-sm text-muted-foreground">Loading memberships...</div>
              ) : membershipsData?.memberships?.length > 0 ? (
                <div className="grid grid-cols-1 gap-2">
                  {membershipsData.memberships.map(m => (
                    <div key={m.id} className="flex items-center justify-between p-3 rounded-md border border-rose-500/20 bg-rose-500/5 group">
                      <div>
                        <p className="text-[10px] font-bold text-rose-500 uppercase tracking-widest">{m.programType}</p>
                        <p className="text-lg font-bold font-mono tracking-tight">{m.fullMemberId}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] text-muted-foreground">Assigned on</p>
                        <p className="text-xs font-medium">{new Date(m.assignedAt).toLocaleDateString('en-GB')}</p>

                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center text-sm text-muted-foreground border border-dashed border-border rounded-md italic">
                  No memberships assigned yet.
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
