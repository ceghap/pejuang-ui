import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ChevronRight, ChevronDown, User, ShieldAlert, ShieldCheck, Mail, Phone, CreditCard } from 'lucide-react';
import { fetchClient } from '../../api/fetchClient';
import { Card, CardContent } from '@/components/ui/card';

export default function TreeNode({ user, level = 0 }) {
  const [expanded, setExpanded] = useState(false);

  const { data: downlinesData, isLoading, error } = useQuery({
    queryKey: ['downlines', user.id],
    queryFn: () => fetchClient(`/users/${user.id}/downlines`),
    enabled: expanded,
    staleTime: 60000,
  });

  const getRoleIcon = (role) => {
    switch (role) {
      case 'SuperAdmin': return <ShieldAlert className="w-4 h-4 text-rose-500" />;
      case 'Admin': return <ShieldCheck className="w-4 h-4 text-amber-500" />;
      default: return <User className="w-4 h-4 text-blue-400" />;
    }
  };

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'SuperAdmin': return 'bg-rose-500/10 text-rose-500 border-rose-500/20';
      case 'Admin': return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
      default: return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
    }
  };

  const handleToggle = () => {
    setExpanded(!expanded);
  };

  return (
    <div className="flex flex-col mt-2" style={{ marginLeft: `${level > 0 ? 1.5 : 0}rem` }}>
      <div className="flex flex-row items-start relative group">
        
        {/* Connection line for nested items */}
        {level > 0 && (
          <div className="absolute -left-6 top-6 w-5 border-t border-zinc-700" />
        )}
        {level > 0 && (
          <div className="absolute -left-6 top-0 bottom-0 border-l border-zinc-700 group-last-of-type:bottom-auto group-last-of-type:h-6" />
        )}

        <img src={`https://api.dicebear.com/7.x/initials/svg?seed=${user.name}`} alt={user.name} className="w-10 h-10 rounded-full bg-zinc-800 border border-zinc-700 ring-2 ring-zinc-950 z-10 mr-3 mt-1" />

        <Card className={`flex-1 transition-all duration-200 border-zinc-800 bg-zinc-900/50 hover:bg-zinc-800/80 cursor-pointer ${expanded ? 'ring-1 ring-zinc-700' : ''}`} onClick={handleToggle}>
          <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            
            <div className="flex items-start sm:items-center gap-3">
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <h3 className="font-medium text-zinc-100">{user.name}</h3>
                  <span className={`text-[10px] font-medium px-2 py-0.5 rounded border ${getRoleBadgeColor(user.role)} flex items-center gap-1`}>
                    {getRoleIcon(user.role)} {user.role}
                  </span>
                </div>
                
                <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-zinc-400">
                  <div className="flex items-center gap-1"><CreditCard className="w-3 h-3" /> {user.icNumber}</div>
                  <div className="flex items-center gap-1"><Phone className="w-3 h-3" /> {user.phoneNumber}</div>
                  {user.email && <div className="flex items-center gap-1"><Mail className="w-3 h-3" /> {user.email}</div>}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 text-zinc-500">
              <span className="text-xs bg-zinc-800 px-2 py-1 rounded-md border border-zinc-700">
                Id: {user.id.substring(0, 8)}...
              </span>
              <div className="w-6 h-6 flex items-center justify-center rounded-full bg-zinc-800 text-zinc-400 group-hover:text-zinc-200 group-hover:bg-zinc-700 transition-colors">
                {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              </div>
            </div>

          </CardContent>
        </Card>
      </div>

      {expanded && (
        <div className="flex flex-col animate-in slide-in-from-top-2 fade-in duration-200 w-full">
          {isLoading && (
            <div className="ml-10 mt-4 text-xs flex items-center gap-2 text-zinc-500">
              <div className="w-4 h-4 border-2 border-zinc-600 border-t-zinc-400 rounded-full animate-spin"/> Loading downlines...
            </div>
          )}
          
          {error && (
            <div className="ml-10 mt-4 text-xs text-red-400">
              Error fetching network.
            </div>
          )}
          
          {downlinesData?.downlines && downlinesData.downlines.length > 0 && (
            <div className="relative">
              {downlinesData.downlines.map(downline => (
                <TreeNode key={downline.id} user={downline} level={level + 1} />
              ))}
            </div>
          )}

          {downlinesData?.downlines && downlinesData.downlines.length === 0 && (
            <div className="ml-12 mt-3 text-xs text-zinc-600 flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-zinc-700" /> No downlines found.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
