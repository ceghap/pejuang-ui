import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { fetchClient } from '@/api/fetchClient';

export function UserLookup({ label, value, onChange, initialData = null, placeholder = "Search by Name, IC or Phone..." }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(initialData);

  useEffect(() => {
    if (initialData && !selectedUser) {
      setSelectedUser(initialData);
    }
  }, [initialData]);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchTerm), 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const { data: results, isLoading } = useQuery({
    queryKey: ['user-lookup', debouncedSearch],
    queryFn: () => fetchClient(`/users/search?q=${encodeURIComponent(debouncedSearch)}`),
    enabled: debouncedSearch.length >= 3,
  });

  const { data: initialUser } = useQuery({
    queryKey: ['user-by-id', value],
    queryFn: () => fetchClient(`/users/${value}`),
    enabled: !!value && !selectedUser,
  });

  useEffect(() => {
    if (initialUser && !selectedUser) {
      setSelectedUser(initialUser);
    }
  }, [initialUser, selectedUser]);

  const handleSelect = (user) => {
    setSelectedUser(user);
    onChange(user.id);
    setIsOpen(false);
    setSearchTerm('');
  };

  const handleClear = () => {
    setSelectedUser(null);
    onChange(null);
  };

  return (
    <div className="space-y-2 relative">
      <Label>{label}</Label>

      {selectedUser ? (
        <div className="flex items-center justify-between p-2 border border-border bg-muted/30 rounded-md">
          <div className="text-sm">
            <p className="font-medium">{selectedUser.name}</p>
            <p className="text-xs text-muted-foreground">
              {[selectedUser.icNumber, selectedUser.phoneNumber].filter(Boolean).join(' | ')}
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={handleClear} className="h-8 w-8 p-0">
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground/60" />
          <Input
            placeholder={placeholder}
            className="pl-9 bg-background border-border"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setIsOpen(true);
            }}
            onFocus={() => setIsOpen(true)}
          />

          {isOpen && (debouncedSearch.length >= 3 || isLoading) && (
            <div className="absolute z-50 w-full mt-1 bg-card border border-border rounded-md shadow-lg max-h-60 overflow-auto">
              {isLoading ? (
                <div className="p-4 text-center text-sm text-muted-foreground">Searching...</div>
              ) : results?.length > 0 ? (
                results.map(u => (
                  <div
                    key={u.id}
                    className="p-3 hover:bg-muted cursor-pointer border-b border-border last:border-0"
                    onClick={() => handleSelect(u)}
                  >
                    <p className="text-sm font-medium">{u.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {[u.icNumber, u.phoneNumber].filter(Boolean).join(' | ')}
                    </p>
                  </div>
                ))
              ) : (
                <div className="p-4 text-center text-sm text-muted-foreground">No users found</div>
              )}
            </div>
          )}
        </div>
      )}
      {isOpen && !selectedUser && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setIsOpen(false)} 
        />
      )}
    </div>
  );
}
