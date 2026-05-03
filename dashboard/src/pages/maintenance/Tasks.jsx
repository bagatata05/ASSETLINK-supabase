import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/AuthContext';
import StatusBadge from '../../components/StatusBadge';
import { Wrench, CheckCircle, Clock, AlertCircle, Camera, Image as ImageIcon, UploadCloud, X, ArrowRight, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { sileo } from 'sileo';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Search } from 'lucide-react';
import { notifyTeacherOfCompletion } from '@/lib/notifications';

const TASK_STATUSES = ['Assigned', 'In Progress', 'On Hold', 'Completed', 'Pending Teacher Verification'];

export default function Tasks() {
    const { currentUser } = useAuth();
    const role = currentUser?.role || 'maintenance';
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selected, setSelected] = useState(null);
    const [form, setForm] = useState({ status: '', notes: '', materials_used: '', actual_cost: '', completion_photo: '' });
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [saving, setSaving] = useState(false);
    const [filterStatus, setFilterStatus] = useState('all');

    useEffect(() => {
        if (!currentUser) return;

        const fetchTasks = async () => {
            setLoading(true);
            
            try {
                const { data, error } = await supabase
                    .from('maintenance_tasks')
                    .select('*')
                    .order('created_at', { ascending: false });

                if (error) throw error;

                if (data) {
                    if (role === 'maintenance') {
                        const myEmail = currentUser.email?.toLowerCase() || '';
                        const myName = currentUser.full_name?.toLowerCase() || '';
                        const myFirstName = myName.split(' ')[0] || '';

                        const filtered = data.filter(t => {
                            const assignedName = t.assigned_to_name?.toLowerCase() || '';
                            const assignedEmail = t.assigned_to_email?.toLowerCase() || '';
                            
                            return (assignedEmail && assignedEmail === myEmail) ||
                                   assignedName.includes(myEmail) ||
                                   assignedName.includes(myFirstName) ||
                                   (myName.length > 0 && assignedName.includes(myName)) ||
                                   (assignedName.length > 0 && myName.includes(assignedName)) ||
                                   (assignedName.includes('naphier') && myName.includes('naphier')) ||
                                   (assignedName.includes('awalie') && myName.includes('awalie'));
                        });

                        setTasks(filtered);
                    } else {
                        setTasks(data);
                    }
                }
            } catch (err) {
                console.error('[AssetLink] Maintenance Tasks Fetch Error:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchTasks();

        const channel = supabase.channel('maintenance_tasks_tasks')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'maintenance_tasks' }, fetchTasks)
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, [currentUser, role]);

    function openTask(task) {
        setSelected(task);
        setForm({ 
            status: task.status, 
            notes: task.maintenance_notes || '', 
            materials_used: task.materials_used || '', 
            actual_cost: task.cost || '',
            completion_photo: task.completion_photo_url || ''
        });
    }

    async function compressImage(file) {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = (event) => {
                if (typeof event.target?.result !== 'string') return;
                const img = new Image();
                img.src = event.target.result;
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const MAX_WIDTH = 1200;
                    const MAX_HEIGHT = 1200;
                    let width = img.width;
                    let height = img.height;

                    if (width > height) {
                        if (width > MAX_WIDTH) { height *= MAX_WIDTH / width; width = MAX_WIDTH; }
                    } else {
                        if (height > MAX_HEIGHT) { width *= MAX_HEIGHT / height; height = MAX_HEIGHT; }
                    }
                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, width, height);
                    canvas.toBlob((blob) => {
                        resolve(new File([blob], file.name, { type: 'image/jpeg' }));
                    }, 'image/jpeg', 0.7); // 70% quality
                };
            };
        });
    }

    async function handleFileUpload(e) {
        const rawFile = e.target.files[0];
        if (!rawFile) return;

        setUploading(true);
        setUploadProgress(0);

        try {
            const file = await compressImage(rawFile);
            const fileExt = file.name.split('.').pop();
            const fileName = `${Math.random()}.${fileExt}`;
            const filePath = `completion/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('repair-evidence')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('repair-evidence')
                .getPublicUrl(filePath);

            setForm(prev => ({ ...prev, completion_photo: publicUrl }));
            sileo.success({ title: 'Upload Successful', description: 'Photo proof uploaded to Supabase.' });
        } catch (err) {
            console.error(err);
            sileo.error({ title: 'Upload Failed', description: err.message || 'Check storage permissions.' });
        } finally {
            setUploading(false);
        }
    }

    async function handleUpdate() {
        setSaving(true);
        try {
            const now = new Date().toISOString();
            const updateData = {
                status: form.status,
                maintenance_notes: form.notes,
                cost: form.actual_cost ? parseFloat(form.actual_cost) : 0,
                completion_photo_url: form.completion_photo,
                updated_at: now
            };

            // Business Logic: If marked as Completed, move to verification stage
            if (form.status === 'Completed') {
                updateData.status = 'Pending Teacher Verification';
                updateData.completed_at = now;
            }

            // 1. Update the Maintenance Task
            const { error: error1 } = await supabase.from('maintenance_tasks').update(updateData).eq('id', selected.id);
            if (error1) throw error1;

            // 2. Sync status to the original Repair Request
            if (selected.repair_request_id) {
                const { error: error2 } = await supabase.from('repair_requests').update({
                    status: updateData.status,
                    maintenance_notes: form.notes,
                    materials_used: form.materials_used,
                    actual_cost: updateData.cost,
                    completion_photo: form.completion_photo,
                    updated_at: now
                }).eq('id', selected.repair_request_id);
                if (error2) throw error2;

                // 🔔 Notify Teacher for verification
                if (form.status === 'Completed') {
                    notifyTeacherOfCompletion({
                        reported_by_email: selected.reported_by_email,
                        asset_name: selected.asset_name
                    });
                }
            }

            sileo.success({
                title: 'Task Synchronized',
                description: 'Status update successful! The teacher has been notified for verification.'
            });
            setSelected(null);
        } catch (error) {
            console.error(error);
            sileo.error({ title: 'Sync Error', description: 'Could not update task status.' });
        } finally {
            setSaving(false);
        }
    }

    const [search, setSearch] = useState('');

    const displayed = tasks.filter(t => {
        const matchSearch = t.asset_name?.toLowerCase().includes(search.toLowerCase()) || 
                            t.school_name?.toLowerCase().includes(search.toLowerCase()) ||
                            t.request_number?.toLowerCase().includes(search.toLowerCase());
        
        if (!matchSearch) return false;
        if (filterStatus === 'all') return true;
        if (filterStatus === 'Completed') {
            return t.status === 'Completed' || t.status === 'Pending Teacher Verification';
        }
        return t.status === filterStatus;
    });

    return (
        <div className="space-y-6 max-w-6xl mx-auto pb-12">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-semibold text-foreground tracking-tight">Service Record</h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        Manage and synchronize your assigned school restoration protocols.
                    </p>
                </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input 
                        placeholder="Filter by asset, school, or request number..." 
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
                        <SelectItem value="all">Universal Record</SelectItem>
                        {TASK_STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                </Select>
            </div>

            <div className="bg-card border border-border rounded-xl overflow-hidden">
                {loading ? (
                    <div className="p-12 flex justify-center">
                        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : displayed.length === 0 ? (
                    <div className="p-12 text-center text-sm text-muted-foreground">
                        No maintenance protocols encountered in your schedule.
                    </div>
                ) : (
                    <div className="divide-y divide-border">
                        <div className="grid grid-cols-[1fr_auto_auto_auto] gap-4 px-5 py-3 bg-muted/30">
                            <span className="label-mono">Asset & Request</span>
                            <span className="label-mono hidden sm:block">Priority</span>
                            <span className="label-mono">Status</span>
                            <span className="label-mono hidden sm:block">Date</span>
                        </div>
                        {displayed.map(task => (
                            <div key={task.id} onClick={() => openTask(task)} className="data-row grid grid-cols-[1fr_auto_auto] sm:grid-cols-[1fr_auto_auto_auto] gap-4 items-center px-5 py-3 hover:bg-muted/30 transition-colors cursor-pointer">
                                <div className="min-w-0">
                                    <div className="flex items-center gap-2">
                                        <p className="text-sm font-medium text-foreground truncate">{task.asset_name}</p>
                                    </div>
                                    <div className="flex items-center gap-2 mt-1">
                                        <p className="text-xs text-muted-foreground truncate">{task.school_name}</p>
                                        <span className="text-[10px] text-muted-foreground/60">•</span>
                                        <p className="text-xs text-muted-foreground font-mono">{task.request_number}</p>
                                    </div>
                                </div>
                                <div className="hidden sm:block">
                                    <StatusBadge status={task.priority || 'Medium'} size="xs" />
                                </div>
                                <div>
                                    <StatusBadge status={task.status} size="xs" />
                                </div>
                                <div className="hidden sm:block text-xs text-muted-foreground">
                                    {task.created_at ? format(new Date(task.created_at), 'MMM d, yyyy') : 'Recent'}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <Dialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
                <DialogContent className="sm:max-w-4xl p-0 overflow-hidden border-none bg-background">
                    {selected && (
                        <div className="flex flex-col md:flex-row h-full max-h-[90vh]">
                            {/* Left Side: Information & Evidence */}
                            <div className="w-full md:w-5/12 bg-muted/30 border-r border-border p-6 overflow-y-auto">
                                <div className="space-y-6">
                                    <div>
                                        <div className="flex items-center gap-2 mb-2">
                                            <StatusBadge status={selected.priority || 'Medium'} size="xs" />
                                            <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">{selected.request_number}</span>
                                        </div>
                                        <h2 className="text-xl font-bold text-foreground tracking-tight">{selected.asset_name}</h2>
                                        <p className="text-sm text-muted-foreground">{selected.school_name}</p>
                                    </div>

                                    <div className="space-y-3">
                                        <Label className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Reported Problem</Label>
                                        <div className="bg-background border border-border p-4 rounded-xl shadow-sm">
                                            <p className="text-sm text-foreground leading-relaxed italic">
                                                "{selected.description || 'No description provided'}"
                                            </p>
                                            <div className="flex items-center gap-2 mt-4 pt-3 border-t border-border/50">
                                                <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary">
                                                    {selected.reported_by_name?.charAt(0) || 'T'}
                                                </div>
                                                <span className="text-xs text-muted-foreground font-medium">Reported by {selected.reported_by_name || 'Staff'}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {selected.repair_requests?.teacher_verification_notes && (
                                        <div className="space-y-3 pb-2">
                                            <Label className="text-[10px] uppercase tracking-widest text-rose-600 font-bold flex items-center gap-2">
                                                <AlertCircle className="w-3 h-3" /> Teacher Rework Feedback
                                            </Label>
                                            <div className="bg-rose-500/5 border border-rose-500/20 p-4 rounded-xl shadow-sm">
                                                <p className="text-sm text-rose-700 leading-relaxed italic">
                                                    "{selected.repair_requests.teacher_verification_notes}"
                                                </p>
                                            </div>
                                        </div>
                                    )}

                                    {selected.photo_url && (
                                        <div className="space-y-3">
                                            <Label className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Damage Evidence (Before)</Label>
                                            <div className="rounded-xl overflow-hidden border border-border bg-black/5 aspect-video relative group">
                                                <img src={selected.photo_url} alt="Evidence" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                                                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
                                                    <span className="text-[10px] text-white font-medium flex items-center gap-1">
                                                        <ImageIcon className="w-3 h-3" /> Original Report Image
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Right Side: Update Form */}
                            <div className="w-full md:w-7/12 p-8 overflow-y-auto bg-background">
                                <div className="space-y-6">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-lg font-semibold text-foreground">Protocol Update</h3>
                                        <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-medium">
                                            <Clock className="w-3 h-3" />
                                            Assigned {selected.created_at ? format(new Date(selected.created_at), 'MMM d, h:mm a') : 'Recently'}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-3">
                                            <Label className="text-xs font-semibold">Service Status</Label>
                                            <Select value={form.status} onValueChange={v => setForm({ ...form, status: v })}>
                                                <SelectTrigger className="h-10 bg-muted/20 border-border/60 hover:border-primary/50 transition-colors">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {TASK_STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="space-y-3">
                                            <Label className="text-xs font-semibold">Resolution Proof (After)</Label>
                                            {form.completion_photo ? (
                                                <div className="relative group rounded-lg overflow-hidden border border-border aspect-[16/9]">
                                                    <img src={form.completion_photo} alt="Proof" className="w-full h-full object-cover" />
                                                    <button onClick={() => setForm({...form, completion_photo: ''})} className="absolute top-2 right-2 bg-destructive/90 backdrop-blur-sm text-destructive-foreground p-1.5 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-all hover:scale-110">
                                                        <X className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="relative border-2 border-dashed border-border/60 rounded-lg p-0 h-24 flex items-center justify-center hover:bg-muted/30 hover:border-primary/40 transition-all cursor-pointer group overflow-hidden">
                                                    <input type="file" accept="image/*" onChange={handleFileUpload} className="absolute inset-0 opacity-0 cursor-pointer z-10" disabled={uploading} />
                                                    <div className="flex flex-col items-center gap-1.5">
                                                        {uploading ? (
                                                            <div className="flex flex-col items-center">
                                                                <div className="w-4 h-4 border-2 border-primary/20 border-t-primary rounded-full animate-spin mb-1" />
                                                                <span className="text-[10px] font-bold text-primary">{Math.round(uploadProgress)}%</span>
                                                            </div>
                                                        ) : (
                                                            <>
                                                                <UploadCloud className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                                                                <span className="text-[10px] font-medium text-muted-foreground group-hover:text-foreground">Upload Solution Proof</span>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <Label className="text-xs font-semibold">Maintenance Log / Remarks</Label>
                                        <Textarea 
                                            rows={4} 
                                            value={form.notes} 
                                            onChange={e => setForm({ ...form, notes: e.target.value })} 
                                            placeholder="Detailed technical notes on what actions were taken to resolve the issue..." 
                                            className="resize-none bg-muted/20 border-border/60 focus:bg-background focus:ring-1 transition-all"
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-3">
                                            <Label className="text-xs font-semibold">Components Used</Label>
                                            <Input 
                                                value={form.materials_used} 
                                                onChange={e => setForm({ ...form, materials_used: e.target.value })} 
                                                placeholder="e.g. Nails, wood glue, wire" 
                                                className="h-10 bg-muted/20 border-border/60"
                                            />
                                        </div>
                                        <div className="space-y-3">
                                            <Label className="text-xs font-semibold">Resolution Cost (₱)</Label>
                                            <div className="relative">
                                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">₱</span>
                                                <Input 
                                                    type="number" 
                                                    value={form.actual_cost} 
                                                    onChange={e => setForm({ ...form, actual_cost: e.target.value })} 
                                                    placeholder="0.00" 
                                                    className="h-10 pl-7 bg-muted/20 border-border/60"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <Button 
                                        onClick={handleUpdate} 
                                        disabled={saving} 
                                        className="w-full h-11 bg-primary hover:bg-primary/90 text-white font-semibold rounded-xl shadow-lg shadow-primary/20 transition-all active:scale-[0.98]"
                                    >
                                        {saving ? (
                                            <div className="flex items-center gap-2">
                                                <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                                <span>Synchronizing Record...</span>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-2">
                                                <CheckCircle className="w-4 h-4" />
                                                <span>Submit Solution Protocol</span>
                                            </div>
                                        )}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
