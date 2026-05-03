import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import StatusBadge from '../../components/StatusBadge';
import { 
    Package, Wrench, Calendar, MapPin, Tag, AlertTriangle, 
    ArrowLeft, History, DollarSign, Hammer, ClipboardCheck, 
    User, HardHat, FileText, ChevronRight
} from 'lucide-react';
import { format } from 'date-fns';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export default function AssetHistory() {
    const { id: assetId } = useParams();
    const [asset, setAsset] = useState(null);
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);

    useEffect(() => {
        if (!assetId) { setNotFound(true); setLoading(false); return; }
        
        async function loadXRayData() {
            try {
                // 1. Fetch Asset Details
                const { data: assetData, error: assetError } = await supabase
                    .from('assets')
                    .select('*')
                    .eq('id', assetId)
                    .single();
                
                if (assetError || !assetData) { 
                    setNotFound(true); 
                    setLoading(false); 
                    return; 
                }
                setAsset(assetData);

                // 2. Fetch Repair Requests and JOIN with Maintenance Tasks
                // We fetch all requests for this asset
                const { data: repairsData, error: repairsError } = await supabase
                    .from('repair_requests')
                    .select(`
                        *,
                        maintenance_tasks (*)
                    `)
                    .eq('asset_id', assetId)
                    .order('created_at', { ascending: false });
                
                if (!repairsError && repairsData) {
                    setHistory(repairsData);
                }
            } catch (error) {
                console.error("X-Ray Error:", error);
                setNotFound(true);
            } finally {
                setLoading(false);
            }
        }
        
        loadXRayData();
    }, [assetId]);

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.05 }
        }
    };

    const itemVariants = {
        hidden: { x: -20, opacity: 0 },
        visible: {
            x: 0,
            opacity: 1,
            transition: { type: 'spring', stiffness: 300, damping: 24 }
        }
    };

    if (loading) return (
        <div className="flex items-center justify-center min-h-[60vh]">
            <div className="w-12 h-12 border-4 border-primary/10 border-t-primary rounded-full animate-spin" />
        </div>
    );

    if (notFound) return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-10">
            <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mb-6">
                <AlertTriangle className="w-10 h-10 text-muted-foreground/20" />
            </div>
            <h2 className="text-2xl font-bold">Asset Not Found</h2>
            <p className="text-muted-foreground mt-2">The requested asset history is unavailable.</p>
            <Link to="/assets" className="mt-6">
                <Button variant="outline">Back to Inventory</Button>
            </Link>
        </div>
    );

    const totalSpent = history.reduce((acc, req) => {
        const task = req.maintenance_tasks?.[0];
        return acc + (task?.cost || 0);
    }, 0);

    return (
        <div className="max-w-5xl mx-auto space-y-8 pb-20">
            {/* Header / Breadcrumb */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Link to="/assets">
                        <Button variant="ghost" size="icon" className="rounded-full hover:bg-muted">
                            <ArrowLeft className="w-5 h-5" />
                        </Button>
                    </Link>
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <History className="w-4 h-4 text-primary" />
                            <span className="text-[10px] font-bold uppercase tracking-widest text-primary">System X-Ray</span>
                        </div>
                        <h1 className="text-2xl font-bold tracking-tight text-foreground">Lifecycle History</h1>
                    </div>
                </div>
                
                <div className="flex items-center gap-3">
                    <div className="px-4 py-2 bg-card border border-border rounded-xl shadow-sm">
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-0.5">Total Maintenance Investment</p>
                        <p className="text-lg font-bold text-emerald-600 flex items-center gap-1.5">
                            <DollarSign className="w-4 h-4" />
                            {totalSpent.toLocaleString()}
                        </p>
                    </div>
                </div>
            </div>

            {/* Asset Summary Card */}
            <div className="bg-card border border-border rounded-3xl overflow-hidden shadow-sm">
                <div className="p-6 md:p-8 flex flex-col md:flex-row gap-8">
                    <div className="w-24 h-24 rounded-2xl bg-primary/5 flex items-center justify-center border border-primary/10 shrink-0">
                        <Package className="w-12 h-12 text-primary" />
                    </div>
                    <div className="flex-1 space-y-4">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div>
                                <h2 className="text-3xl font-bold text-foreground tracking-tight">{asset.name}</h2>
                                <p className="text-sm text-muted-foreground mt-1">
                                    Code: <span className="font-mono font-bold text-primary">{asset.asset_code}</span> · 
                                    Registered {format(new Date(asset.created_at), 'MMM yyyy')}
                                </p>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                <StatusBadge status={asset.condition} />
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-muted text-[11px] font-bold text-muted-foreground">
                                    <Tag className="w-3 h-3" /> {asset.category}
                                </span>
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-muted text-[11px] font-bold text-muted-foreground">
                                    <MapPin className="w-3 h-3" /> {asset.location || 'Generic'}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Timeline View */}
            <div className="space-y-6 relative">
                <div className="absolute left-[39px] top-8 bottom-0 w-px bg-gradient-to-b from-border via-border to-transparent hidden md:block" />
                
                <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-muted-foreground/60 mb-8 pl-10 md:pl-0 md:ml-[80px]">
                    Chronological Events
                </h3>

                <motion.div 
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    className="space-y-12"
                >
                    {history.length === 0 ? (
                        <div className="ml-[80px] p-12 text-center bg-muted/20 rounded-3xl border border-dashed border-border">
                            <ClipboardCheck className="w-12 h-12 text-muted-foreground/20 mx-auto mb-4" />
                            <p className="text-sm font-medium text-muted-foreground">No repair events recorded for this asset yet.</p>
                        </div>
                    ) : history.map((req, idx) => {
                        const task = req.maintenance_tasks?.[0];
                        return (
                            <motion.div key={req.id} variants={itemVariants} className="relative md:pl-[80px]">
                                {/* Timeline Dot */}
                                <div className="absolute left-[32px] top-0 w-4 h-4 rounded-full bg-background border-4 border-primary z-10 hidden md:block shadow-[0_0_0_4px_white] dark:shadow-none" />
                                
                                <div className="group bg-card border border-border rounded-[2rem] overflow-hidden shadow-sm hover:shadow-md hover:border-primary/20 transition-all duration-300">
                                    <div className="flex flex-col lg:flex-row">
                                        {/* Left Side: The Issue */}
                                        <div className="p-6 lg:p-8 flex-1 border-b lg:border-b-0 lg:border-r border-border">
                                            <div className="flex items-center justify-between mb-4">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[10px] font-black uppercase tracking-widest text-primary/60">Reported</span>
                                                    <StatusBadge status={req.status} size="sm" />
                                                </div>
                                                <span className="text-xs font-bold text-muted-foreground">
                                                    {format(new Date(req.created_at), 'MMMM d, yyyy')}
                                                </span>
                                            </div>
                                            
                                            <div className="space-y-3">
                                                <h4 className="text-lg font-bold text-foreground leading-tight">{req.description}</h4>
                                                <div className="flex items-center gap-4 text-[11px] text-muted-foreground font-medium">
                                                    <div className="flex items-center gap-1.5">
                                                        <User className="w-3.5 h-3.5" />
                                                        {req.reported_by_name}
                                                    </div>
                                                    <div className="flex items-center gap-1.5">
                                                        <AlertTriangle className={cn("w-3.5 h-3.5", req.priority === 'High' ? 'text-rose-500' : 'text-amber-500')} />
                                                        {req.priority} Priority
                                                    </div>
                                                </div>
                                                
                                                {req.issue_photo && (
                                                    <div className="mt-4 rounded-2xl overflow-hidden border border-border aspect-video bg-muted">
                                                        <img src={req.issue_photo} alt="Issue" className="w-full h-full object-cover" />
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Right Side: The Solution (X-Ray) */}
                                        <div className="p-6 lg:p-8 lg:w-[400px] bg-muted/30 flex flex-col justify-between">
                                            {task ? (
                                                <div className="space-y-6">
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                                                                <HardHat className="w-4 h-4 text-emerald-600" />
                                                            </div>
                                                            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600">Resolution</span>
                                                        </div>
                                                        {task.cost > 0 && (
                                                            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-md">
                                                                ₱{task.cost.toLocaleString()}
                                                            </span>
                                                        )}
                                                    </div>

                                                    <div className="space-y-4">
                                                        <div>
                                                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">Technical Notes</p>
                                                            <p className="text-[13px] text-foreground/80 font-medium leading-relaxed italic">
                                                                "{task.maintenance_notes || 'No specific maintenance notes recorded.'}"
                                                            </p>
                                                        </div>

                                                        {task.materials_used && (
                                                            <div>
                                                                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">Materials & Parts</p>
                                                                <div className="flex flex-wrap gap-1.5">
                                                                    {task.materials_used.split(',').map((m, i) => (
                                                                        <span key={i} className="text-[11px] font-medium bg-card border border-border px-2.5 py-1 rounded-lg">
                                                                            {m.trim()}
                                                                        </span>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        )}
                                                        
                                                        {task.completion_photo_url && (
                                                            <div className="rounded-xl overflow-hidden border border-border shadow-sm h-32">
                                                                <img src={task.completion_photo_url} alt="Fixed" className="w-full h-full object-cover" />
                                                            </div>
                                                        )}
                                                    </div>

                                                    <div className="pt-4 border-t border-border/50">
                                                        <div className="flex items-center justify-between text-[10px] font-bold text-muted-foreground/60 uppercase">
                                                            <span>Technician</span>
                                                            <span className="text-foreground">{task.assigned_to_name || 'Naphier'}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="h-full flex flex-col items-center justify-center text-center py-8 opacity-40">
                                                    <Hammer className="w-10 h-10 mb-3" />
                                                    <p className="text-xs font-bold uppercase tracking-widest">Awaiting Technician</p>
                                                    <p className="text-[10px] mt-1 font-medium">No technical protocol logged yet.</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}
                </motion.div>
            </div>
        </div>
    );
}
