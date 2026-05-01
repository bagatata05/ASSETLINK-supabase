import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import StatusBadge from '../../components/StatusBadge';
import { Package, Wrench, Calendar, MapPin, Tag, AlertTriangle, ArrowRight, ShieldCheck } from 'lucide-react';
import { format } from 'date-fns';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';

export default function AssetPublic() {
    const urlParams = new URLSearchParams(window.location.search);
    const assetId = urlParams.get('id');
    const [asset, setAsset] = useState(null);
    const [repairs, setRepairs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);

    useEffect(() => {
        if (!assetId) { setNotFound(true); setLoading(false); return; }
        async function load() {
            try {
                const { data: assetData, error: assetError } = await supabase
                    .from('assets')
                    .select('*')
                    .eq('id', assetId)
                    .single();
                if (assetError || !assetData) { setNotFound(true); setLoading(false); return; }
                setAsset(assetData);

                const { data: repairsData, error: repairsError } = await supabase
                    .from('repair_requests')
                    .select('*')
                    .eq('asset_id', assetId)
                    .order('created_at', { ascending: false });
                
                if (!repairsError && repairsData) {
                    setRepairs(repairsData);
                }
                setLoading(false);
            } catch (error) {
                console.error("Error loading asset:", error);
                setNotFound(true);
                setLoading(false);
            }
        }
        load();
    }, [assetId]);

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1,
                delayChildren: 0.1
            }
        }
    };

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: {
            y: 0,
            opacity: 1,
            transition: { type: 'spring', stiffness: 300, damping: 24 }
        }
    };

    if (loading) return (
        <div className="flex items-center justify-center min-h-[60vh]">
            <div className="w-12 h-12 border-8 border-primary/10 border-t-primary rounded-full animate-spin" />
        </div>
    );

    if (notFound) return (
        <div className="flex items-center justify-center min-h-[60vh] text-center p-10 animate-in fade-in zoom-in duration-500">
            <div className="bg-white rounded-[3rem] p-16 shadow-2xl shadow-black/5 border border-border/40 max-w-md w-full">
                <div className="w-24 h-24 bg-slate-50 rounded-[2rem] flex items-center justify-center mx-auto mb-8 border border-border/50">
                    <Package className="w-12 h-12 text-muted-foreground/20" />
                </div>
                <h2 className="text-3xl font-serif font-black text-foreground tracking-tighter">Asset Not <span className="text-primary italic">Found</span></h2>
                <p className="text-muted-foreground mt-4 font-medium opacity-60">This unit does not exist in our active registry or has been decommissioned.</p>
                <Button variant="ghost" className="mt-8 font-black uppercase text-[10px] tracking-[0.2em] opacity-40 hover:opacity-100" onClick={() => window.history.back()}>Return to Headquarters</Button>
            </div>
        </div>
    );

    return (
        <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="max-w-2xl mx-auto space-y-6 pb-20 px-4 relative z-10"
        >
            {/* Simple Header */}
            <motion.div variants={itemVariants} className="flex items-center justify-between pt-6">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center shadow-lg shadow-primary/20">
                        <ShieldCheck className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h2 className="text-sm font-bold tracking-tight text-foreground">Asset<span className="text-primary">Link</span></h2>
                        <p className="text-[10px] font-medium text-muted-foreground leading-none">Official School Registry</p>
                    </div>
                </div>
                <div className="text-right">
                    <span className="text-[10px] font-bold text-muted-foreground/60 block uppercase tracking-wider">Status Check</span>
                    <span className="text-[11px] font-semibold text-foreground">{format(new Date(), 'MMM d, h:mm a')}</span>
                </div>
            </motion.div>

            {/* Main Asset Information */}
            <motion.div 
                variants={itemVariants}
                className="bg-card rounded-[2rem] border border-border shadow-xl shadow-black/[0.02] overflow-hidden"
            >
                <div className="p-8 md:p-10">
                    <div className="flex flex-col gap-6">
                        <div className="flex items-start justify-between gap-4">
                            <div className="space-y-1">
                                <div className="flex items-center gap-2 mb-1">
                                    <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-primary">Asset Information</span>
                                </div>
                                <h1 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight leading-tight">{asset.name}</h1>
                                <p className="text-sm font-medium text-muted-foreground">Asset ID: <span className="font-mono">{asset.asset_code}</span></p>
                            </div>
                            <div className="w-20 h-20 rounded-2xl bg-muted/50 flex items-center justify-center border border-border/50 shrink-0">
                                <Package className="w-10 h-10 text-primary/40" />
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-2">
                            <span className="text-[11px] font-semibold bg-muted border border-border px-4 py-2 rounded-xl text-foreground/70">{asset.category}</span>
                            <div className="scale-100 origin-left">
                                <StatusBadge status={asset.condition} />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-muted/30 border-t border-border grid grid-cols-2 divide-x divide-border">
                    {[
                        { icon: MapPin, label: 'Current Location', value: asset.location || 'Not Set' },
                        { icon: Tag, label: 'Host Institution', value: asset.school_name || 'Guiwan Elementary School' },
                    ].map(({ icon: Icon, label, value }) => (
                        <div key={label} className="p-6 space-y-1">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60 flex items-center gap-1.5">
                                <Icon className="w-3 h-3" /> {label}
                            </span>
                            <p className="text-sm font-semibold text-foreground truncate">{value}</p>
                        </div>
                    ))}
                </div>
            </motion.div>

            {/* Quick Stats */}
            <motion.div variants={itemVariants} className="bg-card rounded-[2rem] border border-border p-8 shadow-sm grid grid-cols-2 gap-8">
                <div className="space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60 flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5" /> Registry Date
                    </span>
                    <p className="text-sm font-semibold text-foreground">
                        {asset.created_at ? format(new Date(asset.created_at), 'MMMM d, yyyy') : 'No Date'}
                    </p>
                </div>
                <div className="space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60 flex items-center gap-1.5">
                        <Wrench className="w-3.5 h-3.5" /> Maintenance
                    </span>
                    <p className="text-sm font-semibold text-foreground">{repairs.length} Total Records</p>
                </div>
            </motion.div>

            {/* Maintenance Log */}
            <motion.div variants={itemVariants} className="bg-card rounded-[2.2rem] border border-border overflow-hidden shadow-sm">
                <div className="px-8 py-6 border-b border-border bg-muted/20 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-card border border-border flex items-center justify-center shadow-sm">
                            <Wrench className="w-4.5 h-4.5 text-primary" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-foreground tracking-tight">Repair History</h2>
                            <p className="text-[10px] font-medium text-muted-foreground">Past repairs and updates</p>
                        </div>
                    </div>
                </div>
                <div className="divide-y divide-border">
                    {repairs.length === 0 ? (
                        <div className="text-center py-20 px-8">
                            <div className="w-16 h-16 bg-muted/50 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-border/50">
                                <AlertTriangle className="w-8 h-8 text-muted-foreground/20" />
                            </div>
                            <h3 className="text-lg font-bold text-foreground mb-1">No Repairs Found</h3>
                            <p className="text-xs text-muted-foreground font-medium max-w-[220px] mx-auto">This asset is currently in good standing with no past issues reported.</p>
                        </div>
                    ) : repairs.map((r) => (
                        <div key={r.id} className="p-8 hover:bg-muted/10 transition-all flex gap-6">
                            <div className="flex flex-col gap-1 min-w-[70px] pt-1">
                                <span className="text-sm font-bold text-foreground">{r.created_at ? format(new Date(r.created_at), 'MMM d') : '-'}</span>
                                <span className="text-[10px] font-semibold text-muted-foreground/50 uppercase tracking-widest">{r.created_at ? format(new Date(r.created_at), 'yyyy') : '-'}</span>
                            </div>
                            <div className="flex-1 min-w-0 space-y-3">
                                <div className="flex flex-wrap gap-2 mb-1">
                                    <StatusBadge status={r.status} size="sm" />
                                    <StatusBadge status={r.priority} size="sm" />
                                </div>
                                <p className="text-sm font-bold text-foreground leading-snug tracking-tight">{r.description}</p>
                                <div className="flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-primary/30" />
                                    <span className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-tight">Reported by {r.reported_by_name || 'Staff'}</span>
                                </div>
                                {r.maintenance_notes && (
                                    <div className="p-5 bg-muted/50 rounded-2xl border border-border/50 text-[13px] text-muted-foreground leading-relaxed italic font-medium">
                                        "{r.maintenance_notes}"
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </motion.div>

            {/* Simple CTA Section */}
            <motion.div 
                variants={itemVariants}
                className="bg-primary rounded-[2.5rem] p-10 text-center text-white shadow-xl shadow-primary/20 relative overflow-hidden"
            >
                <div className="relative z-10 space-y-4">
                    <h3 className="text-2xl font-bold tracking-tight">Report a Problem</h3>
                    <p className="text-sm font-medium opacity-80 max-w-xs mx-auto leading-relaxed">
                        Need to report an issue with this asset? Click the button below to start a repair request.
                    </p>
                    <div className="pt-4">
                        <Button 
                            onClick={() => window.location.href = `/report-damage?id=${assetId}`}
                            className="h-14 px-10 bg-white text-primary hover:bg-white/90 rounded-2xl text-xs font-bold uppercase tracking-widest transition-all shadow-xl gap-2"
                        >
                            Report Issue <ArrowRight className="w-4 h-4" />
                        </Button>
                    </div>
                </div>
            </motion.div>

            {/* Simple Footer */}
            <motion.div variants={itemVariants} className="text-center pt-8 border-t border-border/40">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/40">AssetLink Inventory Control · 2024</p>
            </motion.div>
        </motion.div>
    );
}

