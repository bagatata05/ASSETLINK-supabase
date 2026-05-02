import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/AuthContext';
import StatusBadge from '../../components/StatusBadge';
import { AlertTriangle, Search, CheckCircle, ArrowUpCircle, Wrench, ChevronRight, School, UserCircle, Send, X, Check, Image as ImageIcon, Hash, Clock, ShieldCheck, Activity, Shield, Camera } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { sileo } from 'sileo';
import { format } from 'date-fns';
import { calculateDeadline } from '@/lib/slaUtils';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

const STATUSES = ['Pending', 'Approved', 'In Progress', 'Completed', 'Rejected'];

export default function PrincipalRepairRequests() {
    const { currentUser } = useAuth();
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [selected, setSelected] = useState(null);
    const [notes, setNotes] = useState('');
    const [escalationReason, setEscalationReason] = useState('');
    const [assignedTo, setAssignedTo] = useState('');
    const [maintenanceStaff, setMaintenanceStaff] = useState([]);
    const [scheduledStartDate, setScheduledStartDate] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [saving, setSaving] = useState(false);
    const [escalationAttempted, setEscalationAttempted] = useState(false);

    const fetchRequests = async () => {
        try {
            const { data, error } = await supabase
                .from('repair_requests')
                .select('*')
                .order('created_at', { ascending: false });
            if (error) throw error;
            setRequests(data || []);
        } catch (error) {
            console.error('RepairRequests fetch error:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchStaff = async () => {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('role', 'maintenance');
            if (error) throw error;
            setMaintenanceStaff(data || []);
        } catch (error) {
            console.error('Staff fetch error:', error);
        }
    };

    useEffect(() => {
        fetchRequests();
        fetchStaff();

        const channel = supabase.channel('principal-repair-requests')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'repair_requests' }, fetchRequests)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, fetchStaff)
            .subscribe();
        return () => { supabase.removeChannel(channel); };
    }, []);

    const filtered = requests.filter(r => {
        const matchSearch = !search || r.asset_name?.toLowerCase().includes(search.toLowerCase()) || r.description?.toLowerCase().includes(search.toLowerCase());
        const matchStatus = filterStatus === 'all' || r.status === filterStatus;
        return matchSearch && matchStatus;
    });

    async function updateRequest(id, status, extraData = {}) {
        setSaving(true);
        try {
            const { error } = await supabase
                .from('repair_requests')
                .update({ status, ...extraData, updated_at: new Date().toISOString() })
                .eq('id', id);
            if (error) throw error;
            sileo.success({ title: 'Status Updated', description: `Successfully updated request to: ${status}.` });
            setSelected(null);
        } catch (error) {
            console.error(error);
            sileo.error({ title: 'Update Failed', description: 'Could not update request status.' });
        } finally {
            setSaving(false);
        }
    }

    async function handleApprove() {
        if (!assignedTo) {
            sileo.error({ title: 'Staff Required', description: 'Please select a maintenance staff to handle the repair.' });
            return;
        }
        const slaDeadline = calculateDeadline(scheduledStartDate, selected.priority);
        setSaving(true);
        try {
            const now = new Date().toISOString();
            const staffMember = maintenanceStaff.find(s => s.full_name === assignedTo);
            const staffEmail = staffMember?.email || '';

            const { error: rrError } = await supabase
                .from('repair_requests')
                .update({
                    status: 'In Progress',
                    principal_notes: notes,
                    assigned_to_name: assignedTo,
                    assigned_to_email: staffEmail,
                    approved_by_name: currentUser?.full_name,
                    approved_at: now,
                    scheduled_start_date: scheduledStartDate,
                    sla_deadline: slaDeadline.toISOString(),
                    updated_at: now
                })
                .eq('id', selected.id);
            if (rrError) throw rrError;

            const { error: mtError } = await supabase
                .from('maintenance_tasks')
                .insert([{
                    repair_request_id: selected.id,
                    request_number: selected.request_number || `RR-${Date.now().toString().slice(-6)}`,
                    asset_name: selected.asset_name,
                    description: selected.description || '',
                    photo_url: selected.photo_url || '',
                    reported_by_name: selected.reported_by_name || '',
                    asset_code: selected.asset_code || '',
                    school_name: selected.school_name || currentUser?.school_name || '',
                    assigned_to_name: assignedTo,
                    assigned_to_email: staffEmail,
                    priority: selected.priority,
                    status: 'Assigned',
                    scheduled_start_date: scheduledStartDate,
                    sla_deadline: slaDeadline.toISOString(),
                    created_at: now,
                    updated_at: now
                }]);
            if (mtError) throw mtError;

            sileo.success({ title: 'Request Approved', description: `Assigned to ${assignedTo} and scheduled for ${scheduledStartDate}.` });
            setSelected(null);
        } catch (error) {
            console.error(error);
            sileo.error({ title: 'Approval Failed', description: 'Could not process the approval.' });
        } finally {
            setSaving(false);
        }
    }

    async function handleReject() {
        if (!notes.trim()) {
            sileo.error({ title: 'Reason Required', description: 'Please provide a reason for rejection in the notes field.' });
            return;
        }
        await updateRequest(selected.id, 'Rejected', {
            principal_notes: notes,
            rejected_by_name: currentUser?.full_name,
            rejected_at: new Date().toISOString()
        });
    }


    return (
        <div className="space-y-6 max-w-6xl mx-auto pb-12">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-semibold text-foreground tracking-tight">Repair Approvals</h1>
                    <p className="text-sm text-muted-foreground mt-1">Administrative oversight of institutional repairs.</p>
                </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input placeholder="Filter registry..." className="pl-9 h-9 bg-white border-border text-sm w-full focus-visible:ring-1 focus-visible:ring-primary/50" value={search} onChange={e => setSearch(e.target.value)} />
                </div>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="w-full sm:w-[180px] h-9 bg-white text-sm"><SelectValue placeholder="All Statuses" /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Statuses</SelectItem>
                        {STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                </Select>
            </div>

            <div className="bg-card border border-border rounded-xl overflow-hidden">
                {loading ? (
                    <div className="p-12 flex justify-center"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>
                ) : filtered.length === 0 ? (
                    <div className="p-12 text-center text-sm text-muted-foreground">No pending maneuvers detected.</div>
                ) : (
                    <div className="divide-y divide-border">
                        <div className="grid grid-cols-[1fr_auto_auto_auto] gap-4 px-5 py-3 bg-muted/30">
                            <span className="label-mono">Asset Request</span>
                            <span className="label-mono hidden sm:block">Priority</span>
                            <span className="label-mono">Status</span>
                            <span className="label-mono hidden sm:block">Date</span>
                        </div>
                        {filtered.map(req => (
                            <div key={req.id} onClick={() => { setSelected(req); setNotes(''); setEscalationReason(''); setEscalationAttempted(false); setAssignedTo(req.assigned_to_name || ''); }} className="data-row grid grid-cols-[1fr_auto_auto] sm:grid-cols-[1fr_auto_auto_auto] gap-4 items-center px-5 py-3 hover:bg-muted/30 transition-colors cursor-pointer">
                                <div className="min-w-0">
                                    <p className="text-sm font-medium text-foreground truncate">{req.asset_name}</p>
                                    <p className="text-xs text-muted-foreground truncate">{req.description}</p>
                                </div>
                                <div className="hidden sm:flex items-center"><StatusBadge status={req.priority || 'Medium'} size="sm" /></div>
                                <div className="flex items-center"><StatusBadge status={req.status} size="sm" /></div>
                                <div className="hidden sm:flex items-center">
                                    <span className="text-xs text-muted-foreground">{req.created_at ? format(new Date(req.created_at), 'MMM d, yyyy') : ''}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <Dialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
                <DialogContent className="sm:max-w-4xl p-0 bg-background shadow-2xl rounded-2xl max-h-[95vh] overflow-y-auto border-none">
                    {selected && (
                        <div className="flex flex-col md:flex-row h-full lg:max-h-[90vh]">
                            {/* Left Side: Damage Report & Information */}
                            <div className="w-full md:w-1/2 bg-muted/30 border-r border-border p-8 lg:overflow-y-auto">
                                <div className="space-y-6">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <StatusBadge status={selected.status} size="xs" />
                                            <StatusBadge status={selected.priority || 'Medium'} size="xs" />
                                        </div>
                                        <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">{selected.request_number || '#REQ-NEW'}</span>
                                    </div>

                                    <div>
                                        <h2 className="text-2xl font-bold text-foreground tracking-tight leading-tight">{selected.asset_name}</h2>
                                        <p className="text-sm text-muted-foreground mt-1 flex items-center gap-2">
                                            <span className="w-1 h-1 rounded-full bg-muted-foreground/40"></span>
                                            {selected.school_name || 'Central Campus'}
                                        </p>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="bg-background/60 p-3 rounded-xl border border-border/40">
                                            <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-tighter">Reported By</p>
                                            <p className="text-sm font-semibold mt-0.5 truncate">{selected.reported_by_name || 'Teacher'}</p>
                                        </div>
                                        <div className="bg-background/60 p-3 rounded-xl border border-border/40">
                                            <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-tighter">Report Date</p>
                                            <p className="text-sm font-semibold mt-0.5">{selected.created_at ? format(new Date(selected.created_at), 'MMM d, yyyy') : 'Recently'}</p>
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <Label className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Incident Description</Label>
                                        <div className="bg-background/80 border border-border p-4 rounded-xl shadow-sm">
                                            <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
                                                {selected.description || 'No description provided by the reporting staff.'}
                                            </p>
                                        </div>
                                    </div>

                                    {selected.photo_url && (
                                        <div className="space-y-3 pt-2">
                                            <Label className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Evidence Photo</Label>
                                            <div className="rounded-xl overflow-hidden border border-border bg-black/5 aspect-video relative group cursor-zoom-in">
                                                <img src={selected.photo_url} alt="Evidence" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                                                    <span className="text-xs text-white/90 font-medium flex items-center gap-2">
                                                        <Camera className="w-3.5 h-3.5" /> High-Resolution Inspection View
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Right Side: Approval & Assignment Form */}
                            <div className="w-full md:w-1/2 p-8 lg:overflow-y-auto bg-background flex flex-col justify-between">
                                <div className="space-y-8">
                                    <div className="flex items-center justify-between border-b border-border/60 pb-5">
                                        <div>
                                            <h3 className="text-lg font-semibold text-foreground">Administrative Action</h3>
                                            <p className="text-xs text-muted-foreground mt-0.5">Define resolution path and personnel assignment.</p>
                                        </div>
                                        <div className="w-10 h-10 rounded-full bg-primary/5 flex items-center justify-center">
                                            <Shield className="w-5 h-5 text-primary/70" />
                                        </div>
                                    </div>

                                    {['Pending', 'Approved'].includes(selected.status) ? (
                                        <div className="space-y-6">
                                            <div className="space-y-3">
                                                <Label className="text-xs font-bold text-foreground">Assign Maintenance Personnel</Label>
                                                <Select value={assignedTo} onValueChange={setAssignedTo}>
                                                    <SelectTrigger className="h-12 bg-muted/20 border-border/60 hover:border-primary/50 hover:bg-muted/30 transition-all rounded-xl ring-offset-background focus:ring-primary/20">
                                                        <SelectValue placeholder="Select specialized staff..." />
                                                    </SelectTrigger>
                                                    <SelectContent className="rounded-xl border-border/80 shadow-xl">
                                                        {maintenanceStaff.length === 0 ? (
                                                            <p className="p-3 text-xs text-muted-foreground italic">No specialized staff available</p>
                                                        ) : (
                                                            maintenanceStaff.map(staff => (
                                                                <SelectItem key={staff.email} value={staff.full_name} className="py-2.5 rounded-lg focus:bg-primary/5 cursor-pointer">
                                                                    <div className="flex items-center gap-2">
                                                                        <span className="text-sm font-bold text-foreground">{staff.full_name}</span>
                                                                        <span className="text-[10px] text-muted-foreground/60 font-medium px-2 py-0.5 bg-muted rounded-full border border-border/40">
                                                                            {staff.specialization || 'General Maintenance'}
                                                                        </span>
                                                                    </div>
                                                                </SelectItem>
                                                            ))
                                                        )}
                                                    </SelectContent>
                                                </Select>
                                            </div>

                                            <div className="space-y-3">
                                                <Label className="text-xs font-bold text-foreground">Administrative Directives</Label>
                                                <Textarea 
                                                    rows={5} 
                                                    value={notes} 
                                                    onChange={e => setNotes(e.target.value)} 
                                                    placeholder="Provide specific instructions or constraints for the maintenance personnel..." 
                                                    className="resize-none bg-muted/20 border-border/60 focus:bg-background focus:ring-primary/20 rounded-xl p-4 text-sm leading-relaxed transition-all"
                                                />
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="p-10 bg-primary/5 border border-primary/10 rounded-2xl flex flex-col items-center text-center space-y-4">
                                            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                                                <ShieldCheck className="w-8 h-8 text-primary" />
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-foreground capitalize">Case Status: {selected.status}</h4>
                                                <p className="text-sm text-muted-foreground mt-2 px-4 italic leading-relaxed">
                                                    "Maintenance protocol has been activated. No further administrative action is required at this stage."
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {['Pending', 'Approved'].includes(selected.status) && (
                                    <div className="space-y-4 pt-10">
                                        <div className="grid grid-cols-2 gap-3">
                                            <Button 
                                                variant="outline" 
                                                onClick={handleReject} 
                                                disabled={saving} 
                                                className="h-12 border-rose-200 text-rose-600 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-300 rounded-xl font-semibold transition-all active:scale-[0.98]"
                                            >
                                                Reject Request
                                            </Button>
                                            <Button 
                                                onClick={handleApprove} 
                                                disabled={saving} 
                                                className="h-12 bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-200 rounded-xl font-semibold transition-all active:scale-[0.98]"
                                            >
                                                {saving ? (
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                                        <span>Processing...</span>
                                                    </div>
                                                ) : (
                                                    "Approve & Assign"
                                                )}
                                            </Button>
                                        </div>

                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
