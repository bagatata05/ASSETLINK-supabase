import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import StatusBadge from '../../components/StatusBadge';
import { 
    Package, Wrench, Calendar, MapPin, Tag, AlertTriangle, 
    ArrowLeft, History, DollarSign, Hammer, ClipboardCheck, 
    User, HardHat, FileText, ChevronRight, Eye, ShieldCheck
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
                setLoading(true);
                setNotFound(false);

                // 1. Try to fetch as an official Asset
                const { data: assetData } = await supabase
                    .from('assets')
                    .select('*')
                    .eq('id', assetId)
                    .single();

                let currentAssetName = null;
                let fallbackAssetData = null;

                if (assetData) {
                    setAsset(assetData);
                    currentAssetName = assetData.name;
                } else {
                    // 1b. Fallback: check if the URL ID is a repair_request ID
                    const { data: repairRef } = await supabase
                        .from('repair_requests')
                        .select('asset_name, asset_id, asset_code, created_at')
                        .eq('id', assetId)
                        .single();

                    if (repairRef) {
                        currentAssetName = repairRef.asset_name;
                        fallbackAssetData = {
                            name: repairRef.asset_name || 'Unregistered System',
                            asset_code: repairRef.asset_code || 'N/A',
                            category: 'Repair Record',
                            location: 'On-site',
                            created_at: repairRef.created_at,
                            condition: 'Recovered'
                        };
                    }
                }

                // 2. Fetch repair_requests (NO JOIN — foreign key doesn't exist)
                const { data: byId } = await supabase
                    .from('repair_requests')
                    .select('*')
                    .eq('asset_id', assetId)
                    .order('created_at', { ascending: false });

                let byName = [];
                if (currentAssetName) {
                    const { data: nameData } = await supabase
                        .from('repair_requests')
                        .select('*')
                        .eq('asset_name', currentAssetName)
                        .order('created_at', { ascending: false });
                    byName = nameData || [];
                }

                // Merge and deduplicate
                const allRepairs = [...(byId || []), ...byName];
                const uniqueMap = new Map(allRepairs.map(item => [item.id, item]));
                let uniqueRepairs = Array.from(uniqueMap.values());
                uniqueRepairs.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

                // 3. Separately fetch maintenance_tasks for these repairs
                if (uniqueRepairs.length > 0) {
                    const repairIds = uniqueRepairs.map(r => r.id);
                    const { data: tasks } = await supabase
                        .from('maintenance_tasks')
                        .select('*')
                        .in('repair_request_id', repairIds);

                    // Attach tasks to their parent repair
                    const taskMap = {};
                    (tasks || []).forEach(t => {
                        if (!taskMap[t.repair_request_id]) taskMap[t.repair_request_id] = [];
                        taskMap[t.repair_request_id].push(t);
                    });
                    uniqueRepairs = uniqueRepairs.map(r => ({
                        ...r,
                        maintenance_tasks: taskMap[r.id] || []
                    }));

                    setHistory(uniqueRepairs);
                    if (!assetData && fallbackAssetData) {
                        setAsset(fallbackAssetData);
                    }
                } else if (!assetData) {
                    setNotFound(true);
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
        <div className="max-w-6xl mx-auto space-y-8 pb-24">
            {/* 🏛️ MINIMALIST HEADER */}
            <div className="space-y-1">
                <h1 className="text-2xl font-bold text-foreground tracking-tight">Asset Analysis</h1>
                <p className="text-sm text-muted-foreground">Lifecycle history and resolution logs for this system node.</p>
            </div>

            {/* 📊 DASHBOARD-STYLE STATS GRID */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Total Investment */}
                <div className="bg-card border border-border p-5 rounded-xl shadow-sm flex flex-col justify-between group hover:border-primary/20 transition-colors">
                    <div className="flex items-center justify-between mb-4">
                        <span className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest">Total Investment</span>
                        <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                            <DollarSign className="w-4 h-4 text-emerald-600" />
                        </div>
                    </div>
                    <div>
                        <p className="text-2xl font-bold text-foreground tabular-nums">₱{totalSpent.toLocaleString()}</p>
                        <p className="text-[10px] text-muted-foreground/50 mt-1 uppercase font-bold tracking-tight">Cumulative Cost</p>
                    </div>
                </div>

                {/* Total Incidents */}
                <div className="bg-card border border-border p-5 rounded-xl shadow-sm flex flex-col justify-between group hover:border-primary/20 transition-colors">
                    <div className="flex items-center justify-between mb-4">
                        <span className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest">Incident Count</span>
                        <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center border border-amber-500/20">
                            <AlertTriangle className="w-4 h-4 text-amber-600" />
                        </div>
                    </div>
                    <div>
                        <p className="text-2xl font-bold text-foreground tabular-nums">{history.length}</p>
                        <p className="text-[10px] text-muted-foreground/50 mt-1 uppercase font-bold tracking-tight">Lifetime Events</p>
                    </div>
                </div>

                {/* Status */}
                <div className="bg-card border border-border p-5 rounded-xl shadow-sm flex flex-col justify-between group hover:border-primary/20 transition-colors">
                    <div className="flex items-center justify-between mb-4">
                        <span className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest">System Integrity</span>
                        <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                            <ShieldCheck className="w-4 h-4 text-blue-600" />
                        </div>
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <div className={cn("w-2 h-2 rounded-full animate-pulse", asset.condition === 'Good' ? 'bg-emerald-500' : 'bg-amber-500')} />
                            <p className="text-2xl font-bold text-foreground">{asset.condition}</p>
                        </div>
                        <p className="text-[10px] text-muted-foreground/50 mt-1 uppercase font-bold tracking-tight">Current Condition</p>
                    </div>
                </div>

                {/* Registered */}
                <div className="bg-card border border-border p-5 rounded-xl shadow-sm flex flex-col justify-between group hover:border-primary/20 transition-colors">
                    <div className="flex items-center justify-between mb-4">
                        <span className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest">Deployment Date</span>
                        <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center border border-border">
                            <Calendar className="w-4 h-4 text-muted-foreground" />
                        </div>
                    </div>
                    <div>
                        <p className="text-lg font-bold text-foreground">{format(new Date(asset.created_at), 'MMM d, yyyy')}</p>
                        <p className="text-[10px] text-muted-foreground/50 mt-1 uppercase font-bold tracking-tight">Registration Point</p>
                    </div>
                </div>
            </div>

            {/* 🛸 ASSET PROFILE - MINIMAL CARD */}
            <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden p-6 md:p-8">
                <div className="flex flex-col md:flex-row gap-8 items-start md:items-center">
                    <div className="w-20 h-20 rounded-xl bg-muted/50 border border-border flex items-center justify-center shrink-0">
                        <Package className="w-10 h-10 text-muted-foreground/40" />
                    </div>
                    
                    <div className="flex-1 space-y-4">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="text-[10px] font-bold bg-muted px-2 py-0.5 rounded text-muted-foreground uppercase tracking-widest">#{asset.asset_code}</span>
                                    <span className="text-[10px] font-bold text-muted-foreground/40">•</span>
                                    <span className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest">{asset.category}</span>
                                </div>
                                <h2 className="text-2xl font-bold text-foreground tracking-tight">{asset.name}</h2>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="h-8 flex items-center gap-2 px-3 rounded-lg bg-muted/30 border border-border text-[11px] font-bold text-muted-foreground">
                                    <MapPin className="w-3.5 h-3.5" /> {asset.location || 'Central Room'}
                                </div>
                                <Link to="/assets">
                                    <Button variant="outline" size="sm" className="h-8 text-[11px] font-bold uppercase tracking-wider">
                                        Back to Inventory
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* 🗓️ CHRONOLOGICAL TIMELINE */}
            <div className="space-y-6">
                <div className="flex items-center gap-2 pl-1">
                    <History className="w-4 h-4 text-muted-foreground/30" />
                    <h3 className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground/60">
                        Operational Timeline
                    </h3>
                </div>

                <div className="space-y-4">
                    {history.length === 0 ? (
                        <div className="p-16 text-center bg-muted/5 rounded-xl border border-dashed border-border/60">
                            <ClipboardCheck className="w-10 h-10 text-muted-foreground/20 mx-auto mb-4" />
                            <h4 className="text-sm font-bold text-muted-foreground">No records found</h4>
                            <p className="text-xs text-muted-foreground/60 mt-1">This asset has no recorded repair events.</p>
                        </div>
                    ) : history.map((req, idx) => {
                        const task = req.maintenance_tasks?.[0];
                        return (
                            <div key={req.id} className="group bg-card border border-border rounded-xl overflow-hidden shadow-sm hover:border-primary/30 transition-all duration-300">
                                <div className="flex flex-col lg:flex-row">
                                    {/* Left Panel: The Diagnosis */}
                                    <div className="p-6 lg:p-8 flex-1 border-b lg:border-b-0 lg:border-r border-border">
                                        <div className="flex items-center justify-between mb-6">
                                            <div className="flex items-center gap-3">
                                                <div className="text-[10px] font-bold text-muted-foreground/40 uppercase tracking-widest">Entry #{history.length - idx}</div>
                                                <StatusBadge status={req.status} size="xs" />
                                            </div>
                                            <div className="text-[10px] font-bold text-muted-foreground/40 uppercase">
                                                {format(new Date(req.created_at), 'MMM d, yyyy')}
                                            </div>
                                        </div>
                                        
                                        <div className="space-y-4">
                                            <h4 className="text-lg font-bold text-foreground leading-tight group-hover:text-primary transition-colors">{req.description}</h4>
                                            <div className="flex items-center gap-4">
                                                <div className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground uppercase">
                                                    <User className="w-3.5 h-3.5" />
                                                    {req.reported_by_name}
                                                </div>
                                                <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase">
                                                    <AlertTriangle className={cn("w-3.5 h-3.5", req.priority === 'High' ? 'text-rose-500' : 'text-amber-500')} />
                                                    <span className={req.priority === 'High' ? 'text-rose-500' : 'text-amber-500'}>{req.priority} Priority</span>
                                                </div>
                                            </div>
                                            
                                            {req.issue_photo && (
                                                <div className="relative group/photo mt-4 rounded-xl overflow-hidden border border-border aspect-video bg-muted max-w-sm">
                                                    <img src={req.issue_photo} alt="Issue" className="w-full h-full object-cover" />
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Right Panel: The Resolution */}
                                    <div className="p-6 lg:p-8 lg:w-[380px] bg-muted/20">
                                        {task ? (
                                            <div className="space-y-6 h-full flex flex-col">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        <ShieldCheck className="w-4 h-4 text-emerald-600" />
                                                        <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-700">Resolution</span>
                                                    </div>
                                                    {task.cost > 0 && (
                                                        <p className="text-xs font-bold text-emerald-700">₱{task.cost.toLocaleString()}</p>
                                                    )}
                                                </div>

                                                <div className="flex-1 space-y-4">
                                                    <p className="text-xs text-foreground/80 leading-relaxed pl-3 border-l-2 border-emerald-500/30 italic">
                                                        "{task.maintenance_notes || 'Standard protocol resolution.'}"
                                                    </p>

                                                    {task.materials_used && (
                                                        <div className="flex flex-wrap gap-1.5">
                                                            {task.materials_used.split(',').map((m, i) => (
                                                                <span key={i} className="text-[9px] font-bold bg-card border border-border px-2 py-1 rounded text-muted-foreground/80 uppercase">
                                                                    {m.trim()}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="pt-4 border-t border-border/40">
                                                    <p className="text-[9px] font-bold text-muted-foreground/40 uppercase mb-1">Technician</p>
                                                    <p className="text-[11px] font-bold text-foreground">{task.assigned_to_name || 'System Operator'}</p>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="h-full flex flex-col items-center justify-center text-center">
                                                <Hammer className="w-8 h-8 text-muted-foreground/20 mb-3" />
                                                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/40">Awaiting Action</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>
        </div>
    );
}
