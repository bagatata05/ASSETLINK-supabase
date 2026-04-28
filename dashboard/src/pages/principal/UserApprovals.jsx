import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/AuthContext';
import { 
    ShieldCheck, UserCheck, UserX, Search, Filter, 
    MoreVertical, Mail, Calendar, Hash, BadgeCheck, Clock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { sileo } from 'sileo';
import { 
    Table, TableBody, TableCell, TableHead, 
    TableHeader, TableRow 
} from "@/components/ui/table";

export default function UserApprovals() {
    const { currentUser } = useAuth();
    const [pendingUsers, setPendingUsers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        fetchPendingUsers();
    }, []);

    const fetchPendingUsers = async () => {
        setIsLoading(true);
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('status', 'pending')
                .neq('id', currentUser?.id)
                .not('role', 'in', '("admin","principal")')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setPendingUsers(data || []);
        } catch (error) {
            console.error('Fetch error:', error);
            sileo.error({ title: 'Error', description: 'Failed to load pending users.' });
        } finally {
            setIsLoading(false);
        }
    };

    const handleApproval = async (userId, approve = true) => {
        try {
            const { error } = await supabase
                .from('profiles')
                .update({ 
                    status: approve ? 'approved' : 'rejected',
                    updated_at: new Date().toISOString()
                })
                .eq('id', userId);

            if (error) throw error;

            sileo.success({ 
                title: approve ? 'User Approved' : 'User Rejected', 
                description: approve ? 'Access granted successfully.' : 'Application declined.' 
            });
            
            setPendingUsers(prev => prev.filter(u => u.id !== userId));
        } catch (error) {
            sileo.error({ title: 'Update Failed', description: error.message });
        }
    };

    const filteredUsers = pendingUsers.filter(user => 
        user.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.employee_id?.includes(searchQuery)
    );

    return (
        <div className="space-y-6 animate-fade-up">
            {/* Simple Header */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                <div>
                    <h1 className="text-xl font-semibold text-foreground tracking-tight">User Approvals</h1>
                    <p className="text-sm text-muted-foreground mt-0.5">
                        {pendingUsers.length > 0 
                            ? `Verify and authorize ${pendingUsers.length} pending account requests`
                            : 'No new registration requests requiring authorization'}
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <div className="relative group flex-1 sm:flex-none">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                        <Input 
                            placeholder="Search requests..." 
                            className="pl-9 h-8 w-full sm:w-[240px] bg-white border-border text-xs focus-visible:ring-primary/50"
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            {/* Content Area */}
            <div className="bg-card border border-border rounded-xl overflow-hidden min-h-[400px]">
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center h-[400px] gap-3">
                        <div className="w-6 h-6 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
                        <p className="label-mono text-muted-foreground">Scanning Records...</p>
                    </div>
                ) : filteredUsers.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-[400px] text-center p-8">
                        <BadgeCheck className="w-8 h-8 text-emerald-500/30 mb-3" />
                        <h3 className="text-sm font-semibold text-foreground">Queue is Clear</h3>
                        <p className="text-xs text-muted-foreground/60 mt-1 max-w-[240px]">
                            All registration requests have been processed successfully.
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader className="bg-muted/30">
                                <TableRow className="hover:bg-transparent border-border">
                                    <TableHead className="h-11 label-mono pl-6">User Information</TableHead>
                                    <TableHead className="h-11 label-mono">Role & Dept</TableHead>
                                    <TableHead className="h-11 label-mono">Employee ID</TableHead>
                                    <TableHead className="h-11 label-mono">Date</TableHead>
                                    <TableHead className="h-11 label-mono text-right pr-6">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredUsers.map((user) => (
                                    <TableRow key={user.id} className="data-row border-border group transition-colors">
                                        <TableCell className="py-3 pl-6">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold text-[10px] border border-primary/20 overflow-hidden">
                                                    {user.avatar_url ? (
                                                        <img 
                                                            src={user.avatar_url} 
                                                            alt={user.full_name} 
                                                            className="w-full h-full object-cover"
                                                            referrerPolicy="no-referrer"
                                                        />
                                                    ) : (
                                                        user.full_name?.[0]?.toUpperCase() || 'U'
                                                    )}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-sm font-medium text-foreground truncate">{user.full_name}</p>
                                                    <p className="text-[11px] text-muted-foreground truncate">{user.email}</p>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <span className={`inline-flex w-fit px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                                                    user.role === 'teacher' ? 'bg-blue-50 text-blue-600' : 'bg-amber-50 text-amber-600'
                                                }`}>
                                                    {user.role}
                                                </span>
                                                <p className="text-[10px] text-muted-foreground mt-0.5">{user.department || 'N/A'}</p>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <span className="label-mono text-muted-foreground/70">{user.employee_id || '---'}</span>
                                        </TableCell>
                                        <TableCell>
                                            <span className="label-mono text-muted-foreground/50">
                                                {new Date(user.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-right pr-6">
                                            <div className="flex items-center justify-end gap-2">
                                                <Button 
                                                    onClick={() => handleApproval(user.id, false)}
                                                    variant="ghost" 
                                                    size="sm"
                                                    className="w-8 h-8 p-0 rounded-lg hover:bg-rose-50 hover:text-rose-600 transition-colors"
                                                >
                                                    <UserX className="w-4 h-4" />
                                                </Button>
                                                <Button 
                                                    onClick={() => handleApproval(user.id, true)}
                                                    size="sm"
                                                    className="h-8 px-3 bg-primary hover:bg-primary/90 text-white rounded-lg text-xs font-medium gap-1.5 active:scale-[0.98] transition-all"
                                                >
                                                    <UserCheck className="w-3.5 h-3.5" />
                                                    Approve
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                )}
            </div>
        </div>
    );
}
