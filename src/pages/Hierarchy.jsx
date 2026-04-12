import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, Network, AlertCircle } from 'lucide-react';
import { fetchClient } from '../api/fetchClient';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import TreeNode from '../components/hierarchy/TreeNode';

export default function Hierarchy() {
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedRoot, setSelectedRoot] = useState(null);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const { data: searchResults, isLoading: isSearching, error: searchError } = useQuery({
    queryKey: ['users-search', debouncedSearch],
    queryFn: () => fetchClient(`/users/search?q=${encodeURIComponent(debouncedSearch)}`),
    enabled: debouncedSearch.length >= 3,
  });

  return (
    <div className="h-full text-foreground p-8 pt-6">
      <div className="max-w-5xl mx-auto space-y-6 flex flex-col h-[calc(100vh-4rem)]">
        
        {/* Header */}
        <div className="flex items-center gap-4 shrink-0">
          <div>
            <h1 className="text-3xl font-light tracking-tight">Network <span className="font-semibold">Hierarchy</span></h1>
            <p className="text-muted-foreground text-sm mt-1">Visualize and explore user upline/downline structures.</p>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex gap-6 flex-1 min-h-0">
          
          {/* Left Panel: Search */}
          <div className="w-1/3 flex flex-col gap-4 overflow-hidden shadow-xl border border-border bg-card/40 rounded-xl p-4 shrink-0">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search IC, Name or Phone..."
                className="pl-9 bg-background border-border"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {debouncedSearch.length > 0 && debouncedSearch.length < 3 && (
              <div className="text-xs text-muted-foreground text-center py-4">Enter at least 3 characters to search.</div>
            )}

            <div className="flex-1 overflow-y-auto pr-2 space-y-2 custom-scrollbar">
              {isSearching && (
                 <div className="flex items-center justify-center py-8 text-muted-foreground">
                    <div className="w-5 h-5 border-2 border-muted border-t-foreground rounded-full animate-spin mr-2"/>
                    <span className="text-sm">Searching...</span>
                 </div>
              )}
              
              {searchError && (
                <div className="flex items-center gap-2 text-rose-500 text-sm p-4 bg-rose-500/10 rounded-lg border border-rose-500/20">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>Failed to search users. Check permissions.</span>
                </div>
              )}

              {searchResults && searchResults.length === 0 && (
                <div className="text-center py-8 text-sm text-muted-foreground">
                  No users found matching "{debouncedSearch}"
                </div>
              )}

              {searchResults && searchResults.map(user => (
                <Card 
                  key={user.id} 
                  className={`cursor-pointer transition-all border-border/50 hover:bg-muted ${selectedRoot?.id === user.id ? 'bg-muted ring-1 ring-emerald-500/50' : 'bg-card/50'}`}
                  onClick={() => setSelectedRoot(selectedRoot?.id === user.id ? null : user)}
                >
                  <CardContent className="p-3">
                    <h4 className="font-medium text-sm truncate">{user.name}</h4>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] text-muted-foreground">{user.icNumber}</span>
                      <span className="w-1 h-1 bg-border rounded-full" />
                      <span className={`text-[10px] px-1.5 rounded ${user.role === 'User' ? 'text-blue-500 bg-blue-500/10' : 'text-amber-500 bg-amber-500/10'}`}>
                        {user.role}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Right Panel: Visualization */}
          <div className="flex-1 border border-border bg-card/30 rounded-xl overflow-auto custom-scrollbar relative p-6">
            {!selectedRoot ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground pointer-events-none">
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4 ring-1 ring-border">
                  <Network className="w-8 h-8 text-muted-foreground/60" />
                </div>
                <h3 className="text-lg font-medium mb-1">No Root Selected</h3>
                <p className="text-sm max-w-sm text-center">Search for a user on the left and select them to visualize their network tree.</p>
              </div>
            ) : (
              <div className="pb-12 animate-in fade-in zoom-in-95 duration-300">
                <div className="mb-6 pb-4 border-b border-border flex items-center gap-3">
                   <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500 ring-1 ring-emerald-500/20">
                     <Network className="w-5 h-5" />
                   </div>
                   <div>
                     <h2 className="text-lg font-medium">Viewing Network For</h2>
                     <p className="text-xs text-muted-foreground">Starting from {selectedRoot.name}</p>
                   </div>
                </div>
                <TreeNode user={selectedRoot} level={0} />
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
