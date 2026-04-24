import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from '@tanstack/react-form';
import { useNavigate } from 'react-router-dom';
import { IdCard, Plus, Loader2, Info, ExternalLink, Pencil, X as CloseIcon } from 'lucide-react';
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
import { fetchClient } from '@/api/fetchClient';
import { toast } from 'sonner';

export default function MembershipPrograms() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [isAdding, setIsAdding] = useState(false);
  const [editingProgram, setEditingProgram] = useState(null);

  const { data: programs, isLoading } = useQuery({
    queryKey: ['membership-programs'],
    queryFn: () => fetchClient('/memberships/programs')
  });

  const createProgramMutation = useMutation({
    mutationFn: (data) => fetchClient('/memberships/programs', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
    onSuccess: () => {
      toast.success("Membership program created successfully!");
      queryClient.invalidateQueries({ queryKey: ['membership-programs'] });
      setIsAdding(false);
      form.reset();
    },
    onError: (error) => {
      toast.error("Failed to create program", { description: error.message });
    }
  });

  const updateProgramMutation = useMutation({
    mutationFn: (data) => fetchClient(`/memberships/programs/${data.id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    }),
    onSuccess: () => {
      toast.success("Membership program updated successfully!");
      queryClient.invalidateQueries({ queryKey: ['membership-programs'] });
      setEditingProgram(null);
      form.reset();
    },
    onError: (error) => {
      toast.error("Failed to update program", { description: error.message });
    }
  });

  const form = useForm({
    defaultValues: {
      name: editingProgram?.name || '',
      prefix: editingProgram?.prefix || '',
      description: editingProgram?.description || '',
      idPattern: editingProgram?.idPattern || '{PREFIX}{SEQ:D3}',
      maxMembers: editingProgram?.maxMembers || null
    },
    onSubmit: async ({ value }) => {
      if (editingProgram) {
        updateProgramMutation.mutate({ ...value, id: editingProgram.id });
      } else {
        createProgramMutation.mutate(value);
      }
    },
  });

  const handleEdit = (program) => {
    setEditingProgram(program);
    setIsAdding(false);
    form.reset({
      name: program.name,
      prefix: program.prefix,
      description: program.description || '',
      idPattern: program.idPattern || '{PREFIX}{SEQ:D3}',
      maxMembers: program.maxMembers || null
    });
  };

  const handleCancel = () => {
    setIsAdding(false);
    setEditingProgram(null);
    form.reset();
  };

  return (
    <div className="h-full text-foreground p-4 md:p-8 pt-6 overflow-y-auto">
      <div className="max-w-5xl mx-auto space-y-6 md:space-y-8 pb-10">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <h1 className="text-2xl md:text-3xl font-light tracking-tight">Membership <span className="font-semibold">Programs</span></h1>
          {!editingProgram && (
            <Button 
              onClick={() => setIsAdding(!isAdding)} 
              variant={isAdding ? "outline" : "default"}
              className={!isAdding ? "bg-rose-600 hover:bg-rose-700 text-white w-full sm:w-auto" : "w-full sm:w-auto"}
            >
              {isAdding ? "Cancel" : <><Plus className="w-4 h-4 mr-2" /> New Program</>}
            </Button>
          )}
        </div>

        {(isAdding || editingProgram) && (
          <Card className="bg-card border-border animate-in fade-in slide-in-from-top-4 duration-300">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-xl flex items-center gap-2">
                  <IdCard className="text-rose-500 w-5 h-5" /> 
                  {editingProgram ? `Edit Program: ${editingProgram.prefix}` : "Create New Program"}
                </CardTitle>
                <CardDescription>
                  {editingProgram ? "Update program name and configuration." : "Define a new membership tier and its unique ID prefix."}
                </CardDescription>
              </div>
              <Button variant="ghost" size="icon" onClick={handleCancel}>
                <CloseIcon className="w-4 h-4" />
              </Button>
            </CardHeader>
            <CardContent>
              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  form.handleSubmit();
                }} 
                className="space-y-4"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <form.Field
                    name="name"
                    children={(field) => (
                      <div className="space-y-2">
                        <Label htmlFor={field.name}>Program Name *</Label>
                        <Input 
                          id={field.name}
                          placeholder="e.g. Elite, Platinum"
                          value={field.state.value}
                          onChange={(e) => field.handleChange(e.target.value)}
                          required 
                        />
                      </div>
                    )}
                  />
                  <form.Field
                    name="prefix"
                    children={(field) => (
                      <div className="space-y-2">
                        <Label htmlFor={field.name}>ID Prefix *</Label>
                        <Input 
                          id={field.name}
                          placeholder="e.g. EL, PT"
                          value={field.state.value}
                          onChange={(e) => field.handleChange(e.target.value.toUpperCase())}
                          required 
                          maxLength={5}
                          disabled={!!editingProgram}
                        />
                      </div>
                    )}
                  />
                  <form.Field
                    name="idPattern"
                    children={(field) => (
                      <div className="space-y-2">
                        <Label htmlFor={field.name}>ID Pattern</Label>
                        <Input 
                          id={field.name}
                          placeholder="{PREFIX}{SEQ:D3}"
                          value={field.state.value}
                          onChange={(e) => field.handleChange(e.target.value)}
                        />
                        <p className="text-[10px] text-muted-foreground">e.g. &#123;PREFIX&#125;-&#123;CC&#125;-A&#123;SEQ:D4&#125;</p>
                      </div>
                    )}
                  />
                  <form.Field
                    name="maxMembers"
                    children={(field) => (
                      <div className="space-y-2">
                        <Label htmlFor={field.name}>Max Members</Label>
                        <Input 
                          id={field.name}
                          type="number"
                          placeholder="Unlimited"
                          value={field.state.value || ''}
                          onChange={(e) => field.handleChange(e.target.value ? parseInt(e.target.value) : null)}
                        />
                      </div>
                    )}
                  />
                  <form.Field
                    name="description"
                    children={(field) => (
                      <div className="space-y-2 md:col-span-2">
                        <Label htmlFor={field.name}>Description</Label>
                        <Input 
                          id={field.name}
                          placeholder="Brief description of this program level..."
                          value={field.state.value}
                          onChange={(e) => field.handleChange(e.target.value)}
                        />
                      </div>
                    )}
                  />
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <Button type="button" variant="ghost" onClick={handleCancel}>
                    Cancel
                  </Button>
                  <form.Subscribe
                    selector={(state) => [state.canSubmit, state.isSubmitting]}
                    children={([canSubmit, isSubmitting]) => (
                      <Button 
                        type="submit" 
                        className="bg-rose-600 hover:bg-rose-700 text-white min-w-[120px]" 
                        disabled={!canSubmit || isSubmitting || createProgramMutation.isPending || updateProgramMutation.isPending}
                      >
                        {(isSubmitting || createProgramMutation.isPending || updateProgramMutation.isPending) && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                        {editingProgram ? "Update Program" : "Save Program"}
                      </Button>
                    )}
                  />
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle>Active Programs</CardTitle>
            <CardDescription>Managed membership tiers available for assignment.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border border-border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Program Name</TableHead>
                    <TableHead>Prefix</TableHead>
                    <TableHead>Pattern</TableHead>
                    <TableHead>Limit</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="h-24 text-center">
                        <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                      </TableCell>
                    </TableRow>
                  ) : programs?.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                        No programs defined yet.
                      </TableCell>
                    </TableRow>
                  ) : (
                    programs.map(p => (
                      <TableRow key={p.id}>
                        <TableCell className="font-semibold text-rose-600 uppercase tracking-wider">
                          {p.name}
                        </TableCell>
                        <TableCell>
                          <code className="bg-muted px-2 py-1 rounded text-sm font-bold">{p.prefix}</code>
                        </TableCell>
                        <TableCell className="font-mono text-xs text-muted-foreground">{p.idPattern}</TableCell>
                        <TableCell className="text-sm">
                          {p.maxMembers ? <span className="font-bold text-orange-600">{p.maxMembers}</span> : "∞"}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-8 px-2 text-muted-foreground hover:text-blue-600"
                              onClick={() => handleEdit(p)}
                            >
                              <Pencil className="w-4 h-4 mr-1" /> Edit
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-8 px-2 text-muted-foreground hover:text-rose-600"
                              onClick={() => navigate(`/admin/memberships/${p.prefix}`)}
                            >
                              <ExternalLink className="w-4 h-4 mr-1" /> View
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            <div className="mt-6 p-4 bg-blue-500/5 border border-blue-500/10 rounded-lg flex gap-3 items-start">
              <Info className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
              <div className="text-xs text-muted-foreground space-y-1">
                <p className="font-semibold text-blue-700">How Prefixes Work</p>
                <p>Each program uses a unique prefix (e.g., "GM") to generate sequential IDs (e.g., GM1001, GM1002). Changing a prefix for an existing program is not allowed to maintain data integrity.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
