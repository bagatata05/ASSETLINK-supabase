import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import StatsCard from '../../components/StatsCard';
import StatusBadge from '../../components/StatusBadge';
import { CalendarDays, AlertTriangle, Clock, Wrench, CheckCircle, ArrowUpRight, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format, parseISO, isToday } from 'date-fns';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';

import { Users, Eye } from 'lucide-react';

export default function PrincipalDashboard() {
    const { currentUser } = useAuth();
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [staffCount, setStaffCount] = useState(0);
    const [liveUsers, setLiveUsers] = useState(1); // Default to current user

    const fetchAnalytics = async () => {
        if (!currentUser) return;
        try {
            // 📊 Fetch Repair Requests
            const { data: reqData, error: reqError } = await supabase
                .from('repair_requests')
                .select('*')
                .order('created_at', { ascending: false });
            if (reqError) throw reqError;
            setRequests(reqData || []);

            // 👥 Fetch Approved Staff Count Only
            const { count, error: countError } = await supabase
                .from('profiles')
                .select('*', { count: 'exact', head: true })
                .eq('status', 'approved');
            if (countError) throw countError;
            setStaffCount(count || 0);

        } catch (error) {
            console.error('PrincipalDashboard analytics error:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAnalytics();

        // 📡 Real-time Subscription for Requests
        const reqChannel = supabase.channel('principal-requests')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'repair_requests' }, fetchAnalytics)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, fetchAnalytics)
            .subscribe();

        // 📡 Presence Tracking for Live Users
        const presenceChannel = supabase.channel('site-presence', {
            config: { presence: { key: currentUser?.email } }
        });

        presenceChannel
            .on('presence', { event: 'sync' }, () => {
                const state = presenceChannel.presenceState();
                setLiveUsers(Object.keys(state).length);
            })
            .on('presence', { event: 'join' }, ({ newPresences }) => {
                console.log('User joined:', newPresences);
            })
            .on('presence', { event: 'leave' }, ({ leftPresences }) => {
                console.log('User left:', leftPresences);
            })
            .subscribe(async (status) => {
                if (status === 'SUBSCRIBED') {
                    await presenceChannel.track({
                        user_id: currentUser?.id,
                        email: currentUser?.email,
                        online_at: new Date().toISOString(),
                    });
                }
            });

        return () => {
            supabase.removeChannel(reqChannel);
            supabase.removeChannel(presenceChannel);
        };
    }, [currentUser]);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="w-6 h-6 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
            </div>
        );
    }

    const pendingApproval = requests.filter(r => r.status === 'Pending');
    const inProgress = requests.filter(r => r.status === 'In Progress');
    const completed = requests.filter(r => r.status === 'Completed');
    const scheduledToday = requests.filter(r =>
        r.scheduled_start_date && isToday(parseISO(r.scheduled_start_date)) && r.status === 'Approved'
    );
    const resolutionRate = requests.length > 0 ? Math.round((completed.length / requests.length) * 100) : 0;

    return (
        <div className="space-y-6 animate-fade-up">
            <div className="flex items-start justify-between">
                <div>
                    <h1 className="text-xl font-semibold text-foreground tracking-tight">Executive Overview</h1>
                    <p className="text-sm text-muted-foreground mt-0.5">
                        {pendingApproval.length > 0
                            ? `${pendingApproval.length} repair requests require authorization`
                            : 'All requests have been addressed'}
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/5 border border-primary/10 shadow-sm">
                        <div className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                            <Eye className="w-3 h-3" />
                            {liveUsers} Live Now
                        </span>
                    </div>
                    {scheduledToday.length > 0 && (
                        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-md bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200/60 dark:border-emerald-500/20">
                            <span className="label-mono text-emerald-700 dark:text-emerald-400">{scheduledToday.length} active today</span>
                        </div>
                    )}
                    <Link to="/repair-requests">
                        <Button size="sm" className="h-8 px-3 text-xs font-medium bg-primary hover:bg-primary/90 text-white rounded-lg gap-1.5">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            Review Requests
                        </Button>
                    </Link>
                </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <StatsCard title="Total Staff" value={staffCount} subtitle="Verified Staff" icon={Users} color="blue" />
                <StatsCard title="Pending" value={pendingApproval.length} subtitle="Decision required" icon={Clock} color="amber" />
                <StatsCard title="In Progress" value={inProgress.length} subtitle="Active work orders" icon={Wrench} color="blue" />
                <StatsCard title="Resolved" value={completed.length} subtitle="Completed repairs" icon={CheckCircle} color="teal" />
            </div>

            <div className="grid lg:grid-cols-3 gap-4">
                <div className="lg:col-span-2 bg-card border border-border rounded-xl overflow-hidden">
                    <div className="flex items-center justify-between px-5 py-4 border-b border-border">
                        <div>
                            <h2 className="text-sm font-semibold text-foreground">Approval Queue</h2>
                            <p className="label-mono text-muted-foreground mt-0.5">Requests requiring authorization</p>
                        </div>
                        <Link to="/repair-requests">
                            <Button variant="ghost" size="sm" className="h-7 px-2.5 text-xs gap-1 text-muted-foreground hover:text-foreground">
                                View all <ArrowUpRight className="w-3 h-3" />
                            </Button>
                        </Link>
                    </div>

                    {pendingApproval.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 text-center">
                            <CheckCircle className="w-8 h-8 text-emerald-500/30 mb-3" />
                            <p className="text-sm font-medium text-muted-foreground/60">Queue is clear</p>
                            <p className="text-xs text-muted-foreground/40 mt-1">All requests have been addressed.</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-border">
                            <div className="grid grid-cols-[1fr_auto_auto] gap-4 px-5 py-2.5 bg-muted/30">
                                <span className="label-mono">Asset / Reporter</span>
                                <span className="label-mono">Priority</span>
                                <span className="label-mono">Date</span>
                            </div>
                            {pendingApproval.slice(0, 6).map((req) => (
                                <Link key={req.id} to="/repair-requests">
                                    <div className="data-row grid grid-cols-[1fr_auto_auto] gap-4 items-center px-5 py-3.5 hover:bg-muted/30 transition-colors">
                                        <div className="min-w-0">
                                            <p className="text-sm font-medium text-foreground truncate">{req.asset_name}</p>
                                            <p className="text-xs text-muted-foreground mt-0.5 truncate">{req.reported_by_name} · {req.school_name}</p>
                                        </div>
                                        <StatusBadge status={req.priority} size="sm" />
                                        <span className="label-mono text-muted-foreground/50 text-right">
                                            {req.created_at ? format(new Date(req.created_at), 'MMM d') : ''}
                                        </span>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>

                <div className="space-y-4">
                    <div className="bg-card border border-border rounded-xl p-5">
                        <h2 className="text-sm font-semibold text-foreground mb-4">System Health</h2>
                        <div className="space-y-3">
                            {[
                                { label: 'Auth Required', count: pendingApproval.length, color: 'bg-amber-500' },
                                { label: 'Operational', count: inProgress.length, color: 'bg-sky-500' },
                                { label: 'Resolved', count: completed.length, color: 'bg-emerald-500' },
                            ].map(({ label, count, color }) => (
                                <div key={label}>
                                    <div className="flex justify-between mb-1.5">
                                        <span className="label-mono text-muted-foreground">{label}</span>
                                        <span className="label-mono text-foreground">{count} / {requests.length}</span>
                                    </div>
                                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                                        <div
                                            className={cn('h-full rounded-full transition-all duration-700', color)}
                                            style={{ width: requests.length > 0 ? `${(count / requests.length) * 100}%` : '0%' }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="bg-[hsl(222,47%,9%)] border border-[hsl(222,35%,16%)] rounded-xl p-5 text-white">
                        <div className="flex items-center gap-2 mb-3">
                            <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                            <span className="label-mono text-white/40">Resolution Rate</span>
                        </div>
                        <div className="text-5xl font-bold text-white tracking-tight leading-none">
                            {resolutionRate}<span className="text-2xl text-white/40">%</span>
                        </div>
                        <p className="text-xs text-white/40 mt-3">
                            {completed.length} of {requests.length} requests resolved
                        </p>
                        <div className="mt-3 h-1 bg-white/10 rounded-full overflow-hidden">
                            <div className="h-full bg-emerald-500 rounded-full transition-all duration-700" style={{ width: `${resolutionRate}%` }} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
