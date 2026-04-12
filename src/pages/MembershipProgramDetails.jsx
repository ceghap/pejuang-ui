import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Users, ChevronLeft, Loader2, Search, ChevronRight, X, Pencil, Trash2, MoreHorizontal } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { fetchClient } from '@/api/fetchClient';
import { EditUserModal } from './AdminDashboard';
import { toast } from 'sonner';

export default function MembershipProgramDetails() {
  const { prefix } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  
  const [editingUser, setEditingUser] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [removingUser, setRemovingUser] = useState(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['program-users', prefix, page, debouncedSearch],
    queryFn: () => fetchClient(`/memberships/programs/${prefix}/users?page=${page}&limit=10${debouncedSearch ? `&search=${encodeURIComponent(debouncedSearch)}` : ''}`),
    enabled: !!prefix
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
      queryClient.invalidateQueries({ queryKey: ['program-users'] });
    },
    onError: (error) => {
      toast.error("Failed to update user", { description: error.message });
    }
  });

  const removeMembershipMutation = useMutation({
    mutationFn: (userId) => fetchClient(`/users/${userId}/memberships/${prefix}`, {
      method: 'DELETE'
    }),
    onSuccess: () => {
      toast.success("User removed from membership program.");
      setRemovingUser(null);
      queryClient.invalidateQueries({ queryKey: ['program-users'] });
    },
    onError: (error) => {
      toast.error("Failed to remove membership", { description: error.message });
      setRemovingUser(null);
    }
  });

  if (isLoading && !debouncedSearch) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-rose-500" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="h-full flex flex-col items-center justify-center space-y-4">
        <p className="text-muted-foreground font-medium">Failed to load program details.</p>
        <Button variant="outline" onClick={() => navigate('/admin/memberships')}>
          <ChevronLeft className="w-4 h-4 mr-2" /> Back to Programs
        </Button>
      </div>
    );
  }

  const program = data?.program;
  const memberships = data?.data || [];
  const totalPages = data?.totalPages || 0;
  const totalCount = data?.totalCount || 0;

  return (
    <div className="h-full text-foreground p-8 pt-6 overflow-y-auto">
      <div className="max-w-6xl mx-auto space-y-8 pb-10">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate('/admin/memberships')} className="h-8 w-8 p-0">
            <ChevronLeft className="w-5 h-5" />
          </Button>
          {program && (
            <div>
              <h1 className="text-3xl font-light tracking-tight">
                Program: <span className="font-semibold">{program.name}</span>
              </h1>
              <p className="text-muted-foreground text-sm flex items-center gap-2">
                <code className="bg-muted px-1.5 py-0.5 rounded text-rose-600 font-bold">{program.prefix}</code>
                <span>•</span>
                <span>{program.description}</span>
              </p>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="bg-card border-border">
            <CardHeader className="pb-2">
              <CardDescription className="text-xs uppercase font-bold tracking-wider">
                {debouncedSearch ? "Matches Found" : "Total Members"}
              </CardDescription>
              <CardTitle className="text-4xl font-black text-rose-600 font-mono">{totalCount}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-1 w-full bg-rose-500/10 rounded-full overflow-hidden">
                <div className="h-full bg-rose-500 w-full opacity-50"></div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle className="text-xl flex items-center gap-2">
                <Users className="text-blue-500 w-5 h-5" /> Assigned Members
              </CardTitle>
              <CardDescription>Directory of all users currently holding this membership tier.</CardDescription>
            </div>
            <div className="relative w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by Name, IC, or Member ID..."
                className="pl-9 pr-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              {search && (
                <button 
                  onClick={() => setSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border border-border relative">
              {isLoading && (
                <div className="absolute inset-0 bg-background/50 flex items-center justify-center z-10">
                  <Loader2 className="w-6 h-6 animate-spin text-rose-500" />
                </div>
              )}
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Member ID</TableHead>
                    <TableHead>Full Name</TableHead>
                    <TableHead>IC Number</TableHead>
                    <TableHead>Phone Number</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {memberships.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                        {debouncedSearch ? "No matching members found." : "No members assigned to this program yet."}
                      </TableCell>
                    </TableRow>
                  ) : (
                    memberships.map((m) => (
                      <TableRow key={m.fullMemberId}>
                        <TableCell className="font-mono font-bold text-rose-600">{m.fullMemberId}</TableCell>
                        <TableCell className="font-medium">{m.user.name}</TableCell>
                        <TableCell>{m.user.icNumber}</TableCell>
                        <TableCell className="text-muted-foreground">{m.user.phoneNumber}</TableCell>
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
                                <DropdownMenuLabel>Member Actions</DropdownMenuLabel>
                                <DropdownMenuItem onClick={() => {
                                  setEditingUser(m.user);
                                  setIsEditModalOpen(true);
                                }}>
                                  <Pencil className="mr-2 h-4 w-4" />
                                  Edit User Details
                                </DropdownMenuItem>
                              </DropdownMenuGroup>
                              <DropdownMenuSeparator />
                              <DropdownMenuGroup>
                                <DropdownMenuItem 
                                  className="text-rose-600 focus:text-rose-600 focus:bg-rose-50"
                                  onClick={() => setRemovingUser(m.user)}
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Remove from Program
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

            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4 text-sm text-muted-foreground">
                <div>
                  Showing page {page} of {totalPages} ({totalCount} total)
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-border hover:bg-accent"
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    <ChevronLeft className="w-4 h-4 mr-1" /> Prev
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-border hover:bg-accent"
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
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
        isOpen={!!removingUser}
        onClose={() => setRemovingUser(null)}
        onConfirm={() => removeMembershipMutation.mutate(removingUser.id)}
        isLoading={removeMembershipMutation.isPending}
        title="Remove Membership"
        description={`Are you sure you want to remove ${removingUser?.name} from the ${program?.name} program? Their user account will remain, but this membership ID will be deleted.`}
      />
    </div>
  );
}
