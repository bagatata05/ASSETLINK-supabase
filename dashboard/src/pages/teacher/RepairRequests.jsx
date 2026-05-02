import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/AuthContext';
import StatusBadge from '../../components/StatusBadge';
import { AlertTriangle, Search, Wrench, CheckCircle, Clock, Shield, Star, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { sileo } from 'sileo';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { notifyTechnicianOfRework, notifyTechnicianOfVerification } from '@/lib/notifications';

const STATUSES = ['Pending', 'Approved', 'In Progress', 'Completed', 'Rejected', 'Pending Teacher Verification'];

export default function TeacherRepairRequests() {
    const { currentUser } = useAuth();
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [selected, setSelected] = useState(null);
    const [verificationFeedback, setVerificationFeedback] = useState('');
    const [saving, setSaving] = useState(false);

    const fetchRequests = async () => {
        if (!currentUser) return;

        try {
            const { data, error } = await supabase
                .from('repair_requests')
                .select('*')
                .eq('reported_by_email', currentUser.email)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setRequests(data || []);
        } catch (error) {
            console.error('Teacher RepairRequests error:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRequests();

        const channel = supabase
            .channel('teacher-repair-requests')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'repair_requests' }, fetchRequests)
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [currentUser]);

    const filtered = requests.filter(r => {
        const matchSearch = !search || r.asset_name?.toLowerCase().includes(search.toLowerCase()) || r.description?.toLowerCase().includes(search.toLowerCase());
        const matchStatus = filterStatus === 'all' || r.status === filterStatus;
        return matchSearch && matchStatus;
    });

    async function handleVerifyRepair() {
        setSaving(true);
        try {
            // 1. Update the Repair Request
            const { error: rrError } = await supabase
                .from('repair_requests')
                .update({ 
                    status: 'Completed',
                    teacher_confirmation: true, 
                    completed_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                })
                .eq('id', selected.id);

            if (rrError) throw rrError;

            // 2. Synchronize with Maintenance Tasks
            const { error: mtError } = await supabase
                .from('maintenance_tasks')
                .update({
                    status: 'Completed',
                    updated_at: new Date().toISOString()
                })
                .eq('repair_request_id', selected.id);

            if (mtError) throw mtError;

            // 📧 Notify Technician
            notifyTechnicianOfVerification(selected);

            sileo.success({
                title: 'Repair Verified',
                description: 'The restoration protocol has been successfully finalized.'
            });
            setSelected(null);
        } catch (error) {
            console.error(error);
            sileo.error({ title: 'Sync Failure', description: 'Could not verify the restoration cycle.' });
        } finally {
            setSaving(false);
        }
    }

    async function handleRejectRepair() {
        if (!verificationFeedback.trim()) {
            sileo.error({
                title: 'Intelligence Required',
                description: 'Please provide detailed feedback explaining the restoration failure.'
            });
            return;
        }
        setSaving(true);
        try {
            const { error: rrError } = await supabase
                .from('repair_requests')
                .update({
                    status: 'In Progress',
                    teacher_verification_notes: verificationFeedback,
                    updated_at: new Date().toISOString()
                })
                .eq('id', selected.id);

            if (rrError) throw rrError;

            const { error: mtError } = await supabase
                .from('maintenance_tasks')
                .update({
                    status: 'In Progress',
                    updated_at: new Date().toISOString()
                })
                .eq('repair_request_id', selected.id);

            if (mtError) throw mtError;

            // 📧 Notify Technician
            notifyTechnicianOfRework(selected, verificationFeedback);

            sileo.success({
                title: 'Tactical Rework Initiated',
                description: 'Feedback synchronized for immediate restoration adjustment.'
            });
            setVerificationFeedback('');
            setSelected(null);
        } catch (error) {
            console.error(error);
            sileo.error({ title: 'Sync Failure', description: 'Could not broadcast feedback.' });
        } finally {
            setSaving(false);
        }
    }

    return (
        <div className="space-y-6 max-w-6xl mx-auto pb-12">
            {/* Header Section */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-semibold text-foreground tracking-tight">Restoration Reports</h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        Tracking your submitted cases through the district restoration lifecycle.
                    </p>
                </div>
            </div>

            {/* Tactical Status Toggles */}
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input 
                        placeholder="Scan reports by asset designation..." 
                        className="pl-9 h-9 bg-card border-border text-sm w-full focus-visible:ring-1 focus-visible:ring-primary/50" 
                        value={search} 
                        onChange={e => setSearch(e.target.value)} 
                    />
                </div>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="w-full sm:w-[180px] h-9 bg-card text-sm">
                        <SelectValue placeholder="All Statuses" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Statuses</SelectItem>
                        {STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                </Select>
            </div>

            {/* Table layout */}
            <div className="bg-card border border-border rounded-xl overflow-hidden">
                {loading ? (
                    <div className="p-12 flex justify-center">
                        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="p-12 text-center text-sm text-muted-foreground">
                        No active reports encountered in your sector.
                    </div>
                ) : (
                    <div className="divide-y divide-border">
                        <div className="grid grid-cols-[1fr_auto_auto_auto] gap-4 px-5 py-3 bg-muted/30">
                            <span className="label-mono">Asset Request</span>
                            <span className="label-mono hidden sm:block">Priority</span>
                            <span className="label-mono">Status</span>
                            <span className="label-mono hidden sm:block">Date</span>
                        </div>
                        {filtered.map(req => (
                            <div key={req.id} onClick={() => setSelected(req)} className="data-row grid grid-cols-[1fr_auto_auto] sm:grid-cols-[1fr_auto_auto_auto] gap-4 items-center px-5 py-3 hover:bg-muted/30 transition-colors cursor-pointer">
                                <div className="min-w-0">
                                    <div className="flex items-center gap-2">
                                        <p className="text-sm font-medium text-foreground truncate">{req.asset_name}</p>
                                        {req.status === 'Pending Teacher Verification' && <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />}
                                    </div>
                                    <p className="text-xs text-muted-foreground truncate">{req.description}</p>
                                </div>
                                <div className="hidden sm:flex items-center">
                                    <StatusBadge status={req.priority || 'Medium'} size="sm" />
                                </div>
                                <div className="flex items-center">
                                    <StatusBadge status={req.status} size="sm" />
                                </div>
                                <div className="hidden sm:flex items-center">
                                    <span className="text-xs text-muted-foreground">
                                        {req.created_at ? format(new Date(req.created_at), 'MMM d, yyyy') : ''}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
                <DialogContent className="max-w-4xl p-0 bg-card border border-border shadow-2xl rounded-2xl max-h-[95vh] overflow-y-auto">
                    {selected && (
                        <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-border">
                            {/* LEFT SIDE: Incident Report */}
                            <div className="flex flex-col h-full lg:max-h-[85vh]">
                                <div className="p-6 border-b border-border bg-muted/20">
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex gap-2">
                                            <StatusBadge status={selected.status} size="xs" />
                                            <StatusBadge status={selected.priority} size="xs" />
                                        </div>
                                        <span className="text-[10px] font-mono text-muted-foreground opacity-60">#{selected.request_number || 'RR-PENDING'}</span>
                                    </div>
                                    <h2 className="text-2xl font-bold tracking-tight text-foreground">{selected.asset_name}</h2>
                                    <div className="flex items-center gap-2 mt-1 text-muted-foreground">
                                        <div className="w-1.5 h-1.5 rounded-full bg-primary/40" />
                                        <p className="text-xs font-medium">Asset Restoration Report</p>
                                    </div>
                                </div>

                                <div className="p-6 space-y-6 lg:overflow-y-auto custom-scrollbar">
                                    <div className="space-y-3">
                                        <Label className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">Incident Description</Label>
                                        <div className="bg-muted/30 p-4 rounded-xl border border-border/60 text-sm leading-relaxed text-foreground/80 italic">
                                            "{selected.description}"
                                        </div>
                                    </div>

                                    {selected.photo_url && (
                                        <div className="space-y-3">
                                            <div className="flex items-center justify-between">
                                                <Label className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">Evidence Photo (Before)</Label>
                                                <span className="text-[10px] text-primary/60 font-mono">Capture-01.jpg</span>
                                            </div>
                                            <div className="group relative rounded-xl overflow-hidden border border-border/60 bg-muted/20">
                                                <img 
                                                    src={selected.photo_url} 
                                                    alt="Damage evidence" 
                                                    className="w-full h-auto object-cover max-h-64 transition-transform duration-500 group-hover:scale-105" 
                                                />
                                                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
                                                    <p className="text-[10px] text-white font-medium">Click to expand</p>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {selected.completion_photo && (
                                        <div className="space-y-3 pt-2">
                                            <div className="flex items-center justify-between">
                                                <Label className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">Resolution Proof (After)</Label>
                                                <span className="text-[10px] text-primary/60 font-mono">Completion-01.jpg</span>
                                            </div>
                                            <div className="group relative rounded-xl overflow-hidden border border-primary/20 bg-muted/20 shadow-sm">
                                                <img 
                                                    src={selected.completion_photo} 
                                                    alt="Resolution proof" 
                                                    className="w-full h-auto object-cover max-h-64 transition-transform duration-500 group-hover:scale-105" 
                                                />
                                                <div className="absolute inset-0 bg-gradient-to-t from-primary/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
                                                    <p className="text-[10px] text-white font-medium">Verified Restoration</p>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* RIGHT SIDE: Restoration Status & Action */}
                            <div className="flex flex-col h-full bg-muted/5">
                                <div className="p-6 border-b border-border bg-muted/10">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20 shadow-sm">
                                            <Shield className="w-5 h-5 text-primary" />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-bold text-foreground leading-none">Restoration Status</h3>
                                            <p className="text-[10px] text-muted-foreground mt-1 uppercase tracking-tight">Personnel & Directives Registry</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-6 space-y-6 lg:overflow-y-auto custom-scrollbar">
                                    {/* Assignment Info */}
                                    <div className="space-y-4">
                                        <Label className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">Assigned Team</Label>
                                        {selected.assigned_to_name ? (
                                            <div className="space-y-3">
                                                <div className="flex items-center gap-3 p-4 bg-card border border-border/80 rounded-2xl shadow-sm">
                                                    <div className="w-10 h-10 rounded-full bg-primary/5 flex items-center justify-center border border-primary/10">
                                                        <Wrench className="w-5 h-5 text-primary" />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-bold text-foreground">{selected.assigned_to_name}</p>
                                                        <p className="text-[10px] text-muted-foreground font-medium">Assigned Personnel</p>
                                                    </div>
                                                </div>

                                                {selected.principal_notes && (
                                                    <div className="p-4 bg-muted/20 border border-border/60 rounded-2xl">
                                                        <div className="flex items-center gap-2 mb-2">
                                                            <Shield className="w-3.5 h-3.5 text-muted-foreground" />
                                                            <span className="text-[10px] font-bold text-muted-foreground uppercase">Principal Directives</span>
                                                        </div>
                                                        <p className="text-xs text-muted-foreground leading-relaxed italic">
                                                            "{selected.principal_notes}"
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        ) : (
                                            <div className="p-6 border-2 border-dashed border-border/60 rounded-2xl text-center">
                                                <Clock className="w-6 h-6 text-muted-foreground/30 mx-auto mb-2" />
                                                <p className="text-xs text-muted-foreground font-medium">Awaiting Principal Review</p>
                                            </div>
                                        )}
                                    </div>

                                    {/* Maintenance Progress Notes */}
                                    {(selected.maintenance_notes || selected.teacher_verification_notes) && (
                                        <div className="space-y-4 pt-2">
                                            {selected.teacher_verification_notes && (
                                                <div className="space-y-2">
                                                    <Label className="text-[10px] uppercase tracking-widest font-bold text-rose-600">Your Rework Feedback</Label>
                                                    <div className="p-4 bg-rose-500/5 border border-rose-500/20 rounded-2xl">
                                                        <p className="text-xs text-rose-700 leading-relaxed italic">
                                                            "{selected.teacher_verification_notes}"
                                                        </p>
                                                    </div>
                                                </div>
                                            )}

                                            {selected.maintenance_notes && (
                                                <div className="space-y-2">
                                                    <Label className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">Maintenance Progress</Label>
                                                    <div className="p-4 bg-primary/5 border border-primary/20 rounded-2xl">
                                                        <p className="text-xs text-primary leading-relaxed">
                                                            {selected.maintenance_notes}
                                                        </p>
                                                        
                                                        <div className="mt-4 pt-4 border-t border-primary/10 flex items-center justify-between text-[10px] font-bold text-primary/80">
                                                            <span className="flex items-center gap-1"><Wrench className="w-3 h-3" /> TECHNICIAN UPDATE</span>
                                                            <span>COST: ₱{selected.actual_cost?.toLocaleString() || '0'}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Verification Controls */}
                                    {selected.status === 'Pending Teacher Verification' && (
                                        <div className="space-y-4 pt-4 animate-in fade-in slide-in-from-bottom-2">
                                            <div className="p-4 bg-amber-500/5 border border-amber-500/20 rounded-2xl">
                                                <h4 className="text-xs font-bold text-amber-700 flex items-center gap-2">
                                                    <Star className="w-3.5 h-3.5" /> Verification Required
                                                </h4>
                                                <p className="text-[11px] text-amber-600/80 mt-1">Please confirm if the restoration meets your expectations.</p>
                                            </div>
                                            
                                            <div className="space-y-2">
                                                <Label className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">Feedback Registry</Label>
                                                <Textarea 
                                                    value={verificationFeedback} 
                                                    onChange={e => setVerificationFeedback(e.target.value)} 
                                                    placeholder="Enter any issues if rework is needed..." 
                                                    className="h-24 bg-card border-border/80 text-sm focus:ring-primary/20 rounded-xl"
                                                />
                                            </div>
                                            
                                            <div className="flex gap-3">
                                                <Button onClick={handleRejectRepair} variant="outline" className="flex-1 h-11 text-xs font-bold text-rose-500 hover:text-rose-600 hover:bg-rose-500/10 border-rose-200 rounded-xl">
                                                    Request Rework
                                                </Button>
                                                <Button onClick={handleVerifyRepair} disabled={saving} className="flex-1 h-11 text-xs font-bold bg-primary hover:bg-primary/90 text-white rounded-xl shadow-lg shadow-primary/20 transition-all active:scale-[0.98]">
                                                    {saving ? 'Processing...' : 'Finalize & Close'}
                                                </Button>
                                            </div>
                                        </div>
                                    )}

                                    {/* Final QR Code Report */}
                                    {selected.status === 'Completed' && (
                                        <div className="pt-4 animate-in zoom-in-95">
                                            <div className="p-6 bg-card border border-border/80 rounded-3xl shadow-sm flex flex-col items-center gap-4 group">
                                                <div className="p-2 border-2 border-primary/10 rounded-2xl group-hover:border-primary/30 transition-colors">
                                                    <img
                                                        src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(`${window.location.origin}/repair-report?id=${selected.id}`)}&margin=8`}
                                                        alt="Repair Report QR Code"
                                                        className="w-28 h-28"
                                                    />
                                                </div>
                                                <div className="text-center">
                                                    <p className="text-[10px] font-bold text-primary uppercase tracking-widest">Restoration Certified</p>
                                                    <p className="text-[9px] text-muted-foreground mt-1">Scan to view digital certificate</p>
                                                </div>
                                                <Button
                                                    variant="outline"
                                                    className="w-full h-10 text-xs font-bold border-primary/20 text-primary hover:bg-primary/5 rounded-xl"
                                                    onClick={() => window.open(`${window.location.origin}/repair-report?id=${selected.id}`, '_blank')}
                                                >
                                                    Download Document
                                                </Button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
