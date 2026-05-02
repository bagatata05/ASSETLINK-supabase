import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { CheckCircle, Wrench, DollarSign, Package, Image } from 'lucide-react';
import { format } from 'date-fns';

export default function RepairReportPublic() {
    const urlParams = new URLSearchParams(window.location.search);
    const requestId = urlParams.get('id');
    const [report, setReport] = useState(null);
    const [loading, setLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);

    useEffect(() => {
        if (!requestId) { setNotFound(true); setLoading(false); return; }
        async function load() {
            try {
                const { data, error } = await supabase
                    .from('repair_requests')
                    .select('*')
                    .eq('id', requestId)
                    .single();
                if (error || !data) { setNotFound(true); setLoading(false); return; }
                setReport(data);
            } catch (e) {
                setNotFound(true);
            } finally {
                setLoading(false);
            }
        }
        load();
    }, [requestId]);

    if (loading) return (
        <div className="flex items-center justify-center min-h-screen bg-background transition-colors duration-300">
            <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
    );

    if (notFound) return (
        <div className="flex items-center justify-center min-h-screen text-center p-6 bg-background transition-colors duration-300">
            <div>
                <Wrench className="w-16 h-16 text-muted-foreground/20 mx-auto mb-4" />
                <h2 className="text-xl font-bold text-foreground">Report Not Found</h2>
                <p className="text-muted-foreground mt-2 text-sm">This repair report does not exist or has been removed.</p>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-background transition-colors duration-300">
            {/* Header */}
            <div className="bg-card border-b border-border px-6 py-4 flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-900 dark:bg-emerald-800 flex items-center justify-center shadow-sm">
                    <Wrench className="w-5 h-5 text-white" />
                </div>
                <div>
                    <p className="font-black text-foreground text-sm tracking-tight">AssetLink</p>
                    <p className="text-xs text-muted-foreground -mt-0.5">Repair Completion Report</p>
                </div>
                <div className="ml-auto">
                    <span className="text-[10px] font-black uppercase tracking-widest text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-full border border-emerald-500/20">
                        {report.status}
                    </span>
                </div>
            </div>

            <div className="max-w-lg mx-auto p-6 space-y-5">
                {/* Title */}
                <div className="bg-card rounded-2xl border border-border p-5 shadow-sm">
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">Asset Repaired</p>
                    <h1 className="text-xl font-black text-foreground uppercase tracking-tight">{report.asset_name}</h1>
                    {report.request_number && (
                        <span className="inline-block mt-2 text-[10px] font-black text-emerald-700 dark:text-emerald-400 bg-emerald-500/5 px-2 py-1 rounded-lg border border-emerald-500/10 uppercase tracking-widest">
                            Ref: #{report.request_number}
                        </span>
                    )}
                    {report.school_name && (
                        <p className="text-xs text-muted-foreground mt-2 font-medium">{report.school_name}</p>
                    )}
                </div>

                {/* Damage Report */}
                <div className="bg-amber-500/10 rounded-2xl border border-amber-500/20 p-5">
                    <p className="text-[10px] font-black text-amber-600 dark:text-amber-400 uppercase tracking-widest mb-2">Original Damage Report</p>
                    <p className="text-sm font-medium text-amber-900 dark:text-amber-100 italic leading-relaxed">"{report.description}"</p>
                    <p className="text-[10px] font-bold text-amber-600/70 dark:text-amber-400/50 mt-2">— Reported by {report.reported_by_name || 'Teacher'}</p>
                </div>

                {/* Staff Report */}
                {report.maintenance_notes && (
                    <div className="bg-emerald-500/10 rounded-2xl border border-emerald-500/20 p-5">
                        <p className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest mb-2">Staff Service Report</p>
                        <p className="text-sm font-medium text-emerald-900 dark:text-emerald-100 leading-relaxed">"{report.maintenance_notes}"</p>
                        <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-emerald-500/20">
                            <div>
                                <div className="flex items-center gap-1.5 mb-1">
                                    <Package className="w-3.5 h-3.5 text-emerald-500" />
                                    <p className="text-[10px] font-black text-emerald-600/70 dark:text-emerald-400/50 uppercase tracking-widest">Materials Used</p>
                                </div>
                                <p className="text-sm font-bold text-emerald-800 dark:text-emerald-200">{report.materials_used || 'None specified'}</p>
                            </div>
                            <div>
                                <div className="flex items-center gap-1.5 mb-1">
                                    <DollarSign className="w-3.5 h-3.5 text-amber-500" />
                                    <p className="text-[10px] font-black text-emerald-600/70 dark:text-emerald-400/50 uppercase tracking-widest">Total Cost</p>
                                </div>
                                <p className="text-sm font-black text-amber-600 dark:text-amber-400">
                                    ₱{report.actual_cost?.toLocaleString() || '0'}
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Completion Photo */}
                {report.completion_photo && (
                    <div className="bg-card rounded-2xl border border-border p-5 shadow-sm">
                        <div className="flex items-center gap-2 mb-3">
                            <Image className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Proof of Completion</p>
                        </div>
                        <div className="rounded-xl overflow-hidden border border-border">
                            <img
                                src={report.completion_photo}
                                alt="Completion proof"
                                className="w-full h-auto object-cover"
                            />
                        </div>
                    </div>
                )}

                {/* Completion Status */}
                {report.completed_at && (
                    <div className="bg-emerald-500/10 rounded-2xl border border-emerald-500/20 p-5 flex items-center gap-3">
                        <CheckCircle className="w-8 h-8 text-emerald-500 flex-shrink-0" />
                        <div>
                            <p className="text-sm font-black text-emerald-800 dark:text-emerald-300 transition-colors">Repair Completed</p>
                            <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-0.5">
                                {format(new Date(report.completed_at), 'MMMM d, yyyy · h:mm a')}
                            </p>
                        </div>
                    </div>
                )}

                <p className="text-center text-[10px] text-muted-foreground font-bold uppercase tracking-widest pb-4 transition-colors">
                    AssetLink · School Asset Management System
                </p>
            </div>
        </div>
    );
}
