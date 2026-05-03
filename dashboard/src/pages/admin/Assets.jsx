import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/AuthContext';
import StatusBadge from '../../components/StatusBadge';
import { Package, Plus, Search, QrCode, Edit2, Trash2, Printer, CheckSquare, Square, X, History } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { sileo } from 'sileo';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

const CATEGORIES = ['Furniture', 'Electronics', 'Laboratory Equipment', 'Sports Equipment', 'Books & Materials', 'Appliances', 'Structural', 'Other'];
const CONDITIONS = ['Excellent', 'Good', 'Fair', 'Poor', 'Damaged', 'Condemned'];

export default function Assets() {
    const { currentUser } = useAuth();
    const role = currentUser?.role || 'teacher';
    const [assets, setAssets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filterCategory, setFilterCategory] = useState('all');
    const [filterCondition, setFilterCondition] = useState('all');
    const [showModal, setShowModal] = useState(false);
    const [editing, setEditing] = useState(null);
    const [form, setForm] = useState({ name: '', asset_code: '', category: 'Furniture', condition: 'Good', location: '', description: '' });
    const [saving, setSaving] = useState(false);
    const [selected, setSelected] = useState(new Set());
    const [selectMode, setSelectMode] = useState(false);

    const fetchAssets = async () => {
        try {
            const { data, error } = await supabase
                .from('assets')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setAssets(data || []);
        } catch (error) {
            console.error('Error fetching assets:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAssets();

        const channel = supabase
            .channel('assets-inventory')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'assets' }, fetchAssets)
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    const filtered = assets.filter(a => {
        const matchSearch = !search || a.name?.toLowerCase().includes(search.toLowerCase()) || a.asset_code?.toLowerCase().includes(search.toLowerCase());
        const matchCat = filterCategory === 'all' || a.category === filterCategory;
        const matchCond = filterCondition === 'all' || a.condition === filterCondition;
        return matchSearch && matchCat && matchCond;
    });

    function toggleSelect(id) {
        setSelected(prev => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });
    }

    function toggleSelectAll() {
        if (selected.size === filtered.length) setSelected(new Set());
        else setSelected(new Set(filtered.map(a => a.id)));
    }

    function getAssetUrl(assetId) {
        return `${window.location.origin}/asset-view?id=${assetId}`;
    }

    function getQrUrl(assetId) {
        const url = encodeURIComponent(getAssetUrl(assetId));
        return `https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${url}&margin=8`;
    }

    function handleOpenQrTab() {
        if (selected.size === 0) return;
        const selectedAssets = filtered.filter(a => selected.has(a.id));

        const cards = selectedAssets.map(asset => {
            const qrUrl = getQrUrl(asset.id);
            return `
                <div class="asset-tag">
                    <div class="tag-header">
                        <svg class="tag-logo" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2"/><rect width="9" height="9" x="3" y="3" rx="2"/><path d="M7 14h.01"/><path d="M7 18h.01"/><path d="M11 14h.01"/><path d="M11 18h.01"/><path d="M15 14h.01"/><path d="M15 18h.01"/></svg>
                        <span>AssetLink Verified</span>
                    </div>
                    <div class="tag-body">
                        <div class="qr-container">
                            <img src="${qrUrl}" alt="${asset.name}" crossorigin="anonymous" />
                        </div>
                        <div class="asset-info">
                            <h2 class="asset-name">${asset.name}</h2>
                            <div class="asset-meta">
                                <div class="meta-item">
                                    <span class="meta-label">ID NUMBER</span>
                                    <span class="meta-value font-mono">${asset.asset_code}</span>
                                </div>
                                <div class="meta-item">
                                    <span class="meta-label">LOCATION</span>
                                    <span class="meta-value">${asset.location || 'Unassigned'}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="tag-footer">
                        <span>Official Inventory Control</span>
                        <span>Guiwan Elementary School</span>
                    </div>
                </div>`;
        }).join('');

        const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8" />
    <title>Asset Labels - AssetLink</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Geist+Mono:wght@400;600&family=Geist:wght@400;600;700;800&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
    <style>
        :root {
            --primary: #003333;
            --primary-light: #004d4d;
            --accent: #f59e0b;
            --background: #f8fafc;
            --border: #e2e8f0;
            --text: #001a1a;
            --text-muted: #64748b;
        }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { 
            font-family: 'Inter', sans-serif; 
            background: var(--background); 
            color: var(--text);
            padding: 40px;
        }
        
        /* Toolbar */
        .toolbar {
            position: fixed; top: 0; left: 0; right: 0; z-index: 100;
            background: rgba(255, 255, 255, 0.8);
            backdrop-filter: blur(12px);
            border-bottom: 1px solid var(--border);
            display: flex; align-items: center; justify-content: space-between;
            padding: 12px 40px;
        }
        .toolbar h1 { 
            font-family: 'Geist', sans-serif;
            font-size: 16px; font-weight: 800; color: var(--primary); 
            display: flex; align-items: center; gap: 8px;
        }
        .toolbar .count { font-size: 11px; color: var(--text-muted); font-weight: 500; }
        .btn-print {
            background: var(--primary); color: #fff; border: none;
            padding: 8px 20px; border-radius: 8px;
            font-size: 13px; font-weight: 600;
            cursor: pointer; display: flex; align-items: center; gap: 8px;
            transition: all 0.2s ease;
        }
        .btn-print:hover { background: var(--primary-light); transform: translateY(-1px); }

        /* Print Grid */
        .sheet { max-width: 1000px; margin: 60px auto 0; }
        .grid { 
            display: grid; 
            grid-template-columns: repeat(2, 1fr); 
            gap: 20px; 
        }

        /* Asset Tag Design */
        .asset-tag {
            background: white;
            border: 1.5px solid var(--primary);
            border-radius: 12px;
            width: 100%;
            overflow: hidden;
            display: flex;
            flex-direction: column;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
            page-break-inside: avoid;
        }
        .tag-header {
            background: var(--primary);
            color: white;
            padding: 8px 16px;
            display: flex;
            align-items: center;
            gap: 8px;
            font-family: 'Geist', sans-serif;
            font-size: 10px;
            font-weight: 700;
            letter-spacing: 0.05em;
            text-transform: uppercase;
        }
        .tag-logo { width: 14px; height: 14px; color: var(--accent); }
        
        .tag-body {
            display: flex;
            padding: 16px;
            gap: 16px;
            align-items: center;
            flex: 1;
        }
        .qr-container {
            width: 100px;
            height: 100px;
            padding: 4px;
            border: 1px solid var(--border);
            border-radius: 8px;
            background: white;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .qr-container img { width: 100%; height: 100%; }

        .asset-info { flex: 1; min-width: 0; }
        .asset-name {
            font-family: 'Geist', sans-serif;
            font-size: 16px;
            font-weight: 800;
            color: var(--primary);
            margin-bottom: 12px;
            line-height: 1.2;
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
            overflow: hidden;
        }
        
        .asset-meta { display: grid; gap: 8px; }
        .meta-item { display: flex; flex-direction: column; }
        .meta-label { 
            font-size: 8px; 
            font-weight: 700; 
            color: var(--text-muted); 
            letter-spacing: 0.05em;
            margin-bottom: 2px;
        }
        .meta-value { 
            font-size: 11px; 
            font-weight: 600; 
            color: var(--text);
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }
        .font-mono { font-family: 'Geist Mono', monospace; font-size: 12px; }

        .tag-footer {
            border-top: 1px solid var(--border);
            padding: 6px 16px;
            background: #fcfdfd;
            display: flex;
            justify-content: space-between;
            font-size: 8px;
            font-weight: 600;
            color: var(--text-muted);
            text-transform: uppercase;
            letter-spacing: 0.02em;
        }

        @media print {
            body { background: white; padding: 0; }
            .toolbar { display: none; }
            .sheet { margin-top: 0; padding: 0; max-width: 100%; }
            .grid { grid-template-columns: repeat(2, 1fr); gap: 10mm; }
            .asset-tag { box-shadow: none; border-color: #000; }
        }
    </style>
</head>
<body>
    <div class="toolbar">
        <h1>
            <svg style="width: 20px; height: 20px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2"/><rect width="9" height="9" x="3" y="3" rx="2"/><path d="M7 14h.01"/><path d="M7 18h.01"/><path d="M11 14h.01"/><path d="M11 18h.01"/><path d="M15 14h.01"/><path d="M15 18h.01"/></svg>
            AssetLink Tag Generation
        </h1>
        <div class="count">${selectedAssets.length} labels generated</div>
        <button class="btn-print" onclick="window.print()">
            <svg style="width: 16px; height: 16px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect width="12" height="8" x="6" y="14"/></svg>
            Print Labels
        </button>
    </div>
    <div class="sheet">
        <div class="grid">${cards}</div>
    </div>
</body>
</html>`;

        const blob = new Blob([html], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        window.open(url, '_blank');
    }

    function openCreate() {
        setEditing(null);
        setForm({ name: '', asset_code: '', category: 'Furniture', condition: 'Good', location: '', description: '' });
        setShowModal(true);
    }

    function openEdit(asset) {
        setEditing(asset);
        setForm({ name: asset.name, asset_code: asset.asset_code, category: asset.category, condition: asset.condition, location: asset.location || '', description: asset.description || '' });
        setShowModal(true);
    }

    async function handleSave() {
        if (!form.name || !form.asset_code) { 
            sileo.error({ title: 'Validation Error', description: 'Name and Code are required.' }); 
            return; 
        }
        
        console.log("Assets: Starting save operation...", { isEditing: !!editing, data: form });
        setSaving(true);

        // Safety timeout to prevent infinite "Saving..." state
        const saveTimeout = setTimeout(() => {
            if (saving) {
                console.warn("Assets: Save operation timed out after 10s");
                setSaving(false);
                sileo.error({ title: 'Request Timeout', description: 'The server is taking too long to respond.' });
            }
        }, 10000);

        try {
            let result;
            if (editing) {
                result = await supabase
                    .from('assets')
                    .update({ 
                        name: form.name,
                        asset_code: form.asset_code,
                        category: form.category,
                        condition: form.condition,
                        location: form.location,
                        description: form.description,
                        updated_at: new Date().toISOString() 
                    })
                    .eq('id', editing.id);
            } else {
                result = await supabase
                    .from('assets')
                    .insert([{ 
                        ...form, 
                        created_at: new Date().toISOString(), 
                        updated_at: new Date().toISOString() 
                    }]);
            }

            const { error } = result;
            
            if (error) {
                console.error("Supabase Save Error:", error);
                throw error;
            }

            console.log("Assets: Save successful!");
            sileo.success({ 
                title: editing ? 'Asset Updated' : 'Asset Created', 
                description: `Successfully ${editing ? 'updated' : 'added'} ${form.name}.` 
            });
            setShowModal(false);
        } catch (error) {
            console.error("Detailed Save Error:", error);
            sileo.error({ 
                title: 'Save Failed', 
                description: error.message || 'Could not save asset information. Check your connection or permissions.' 
            });
        } finally {
            clearTimeout(saveTimeout);
            setSaving(false);
        }
    }

    async function handleDelete(id) {
        if (!confirm('Permanently delete this asset?')) return;
        try {
            const { error } = await supabase
                .from('assets')
                .delete()
                .eq('id', id);
            if (error) throw error;
            sileo.success({ title: 'Asset Deleted', description: 'Registration has been removed.' });
        } catch (error) {
            console.error(error);
            sileo.error({ title: 'Delete Failed', description: 'Could not remove the asset.' });
        }
    }

    return (
        <div className="space-y-6 max-w-6xl mx-auto pb-12">
            {/* Header Section */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-semibold text-foreground tracking-tight">Inventory Control</h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        Tracking {assets.length} architectural units
                    </p>
                </div>
                <div className="flex flex-wrap gap-2">
                    {selectMode && selected.size > 0 && (
                        <Button onClick={handleOpenQrTab} variant="outline" className="h-9 text-sm gap-2">
                            <Printer className="w-4 h-4" /> Export Labels ({selected.size})
                        </Button>
                    )}
                    {(role === 'admin' || role === 'principal') && (
                        <Button onClick={() => { setSelectMode(s => !s); setSelected(new Set()); }} variant={selectMode ? 'secondary' : 'outline'} className="h-9 text-sm gap-2">
                            <QrCode className="w-4 h-4" /> {selectMode ? 'Dismiss' : 'Batch Labels'}
                        </Button>
                    )}
                    {(role === 'admin' || role === 'principal') && (
                        <Button onClick={openCreate} className="h-9 bg-[hsl(172,75%,17%)] hover:bg-[hsl(172,75%,22%)] text-white text-sm gap-2">
                            <Plus className="w-4 h-4" /> New Asset
                        </Button>
                    )}
                </div>
            </div>

            {/* Filters Bar */}
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input 
                        placeholder="Search registry by name, serial, or taxonomy..." 
                        className="pl-9 h-9 bg-background border-border text-sm w-full focus-visible:ring-1 focus-visible:ring-primary/50" 
                        value={search} 
                        onChange={e => setSearch(e.target.value)} 
                    />
                </div>
                <Select value={filterCategory} onValueChange={setFilterCategory}>
                    <SelectTrigger className="w-full sm:w-[180px] h-9 bg-background text-sm">
                        <SelectValue placeholder="All Categories" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Categories</SelectItem>
                        {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                </Select>
            </div>

            {/* Select All Bar (if selectMode) */}
            {selectMode && (
                <div className="flex items-center gap-4 bg-muted/50 border border-border rounded-lg px-4 py-2 text-sm">
                    <button onClick={toggleSelectAll} className="flex items-center gap-2 text-primary font-medium hover:underline">
                        {selected.size === filtered.length ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                        {selected.size === filtered.length ? 'Deselect All' : 'Select All'}
                    </button>
                    <span className="text-muted-foreground">| {selected.size} selected</span>
                </div>
            )}

            {/* Table */}
            <div className="bg-card border border-border rounded-xl overflow-hidden">
                {loading ? (
                    <div className="p-12 flex justify-center">
                        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="p-12 text-center text-sm text-muted-foreground">
                        No assets found matching your criteria.
                    </div>
                ) : (
                    <div className="divide-y divide-border">
                        <div className="grid grid-cols-[auto_1fr_auto_auto] sm:grid-cols-[auto_2fr_1fr_1fr_auto] gap-4 px-5 py-3 bg-muted/30">
                            <span className="label-mono w-5"></span>
                            <span className="label-mono">Asset Details</span>
                            <span className="label-mono hidden sm:block">Category</span>
                            <span className="label-mono">Status</span>
                            <span className="label-mono w-16"></span>
                        </div>
                        {filtered.map(asset => (
                            <div key={asset.id} className="data-row grid grid-cols-[auto_1fr_auto_auto] sm:grid-cols-[auto_2fr_1fr_1fr_auto] gap-4 items-center px-5 py-3 hover:bg-muted/30 transition-colors cursor-pointer" onClick={selectMode ? () => toggleSelect(asset.id) : undefined}>
                                <div className="w-5 flex items-center justify-center">
                                    {selectMode ? (
                                        selected.has(asset.id) ? <CheckSquare className="w-4 h-4 text-primary" /> : <Square className="w-4 h-4 text-muted-foreground/40" />
                                    ) : (
                                        <Package className="w-4 h-4 text-muted-foreground/40" />
                                    )}
                                </div>
                                <div className="min-w-0">
                                    <p className="text-sm font-medium text-foreground truncate">{asset.name}</p>
                                    <p className="text-xs text-muted-foreground truncate">{asset.asset_code} {asset.location && `• ${asset.location}`}</p>
                                </div>
                                <div className="hidden sm:flex items-center">
                                    <span className="text-xs text-muted-foreground">{asset.category}</span>
                                </div>
                                <div className="flex items-center">
                                    <StatusBadge status={asset.condition} size="sm" />
                                </div>
                                <div className="w-16 flex justify-end gap-1">
                                    {!selectMode && (
                                        <Link to={`/assets/${asset.id}/history`} className="p-1.5 text-muted-foreground hover:text-primary transition-colors rounded-md hover:bg-primary/5" onClick={(e) => e.stopPropagation()}>
                                            <History className="w-3.5 h-3.5" />
                                        </Link>
                                    )}
                                    {!selectMode && (role === 'admin' || role === 'principal') && (
                                        <>
                                            <button onClick={(e) => { e.stopPropagation(); openEdit(asset); }} className="p-1.5 text-muted-foreground hover:text-foreground transition-colors rounded-md hover:bg-muted">
                                                <Edit2 className="w-3.5 h-3.5" />
                                            </button>
                                            <button onClick={(e) => { e.stopPropagation(); handleDelete(asset.id); }} className="p-1.5 text-muted-foreground hover:text-rose-500 transition-colors rounded-md hover:bg-rose-500/10">
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Asset Modal */}
            <Dialog open={showModal} onOpenChange={setShowModal}>
                <DialogContent className="sm:max-w-md p-6 bg-card border border-border rounded-xl shadow-lg">
                    <DialogHeader className="mb-4">
                        <DialogTitle className="text-lg font-semibold tracking-tight text-foreground">
                            {editing ? 'Edit Asset' : 'Register Asset'}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label className="text-xs font-medium text-foreground">Asset Name</Label>
                            <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Dell Smart Hub" className="h-9 bg-background border-border text-sm" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-xs font-medium text-foreground">Serial / Code</Label>
                                <Input value={form.asset_code} onChange={e => setForm({ ...form, asset_code: e.target.value })} placeholder="AL-001" className="h-9 bg-background border-border text-sm" />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs font-medium text-foreground">Category</Label>
                                <Select value={form.category} onValueChange={v => setForm({ ...form, category: v })}>
                                    <SelectTrigger className="h-9 bg-background border-border text-sm"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs font-medium text-foreground">Condition</Label>
                                <Select value={form.condition} onValueChange={v => setForm({ ...form, condition: v })}>
                                    <SelectTrigger className="h-9 bg-background border-border text-sm"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        {CONDITIONS.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs font-medium text-foreground">Location</Label>
                                <Input value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} placeholder="e.g. Room 101" className="h-9 bg-background border-border text-sm" />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs font-medium text-foreground">Description</Label>
                            <Input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Additional details..." className="h-9 bg-background border-border text-sm" />
                        </div>
                    </div>
                    <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-border">
                        <Button variant="ghost" onClick={() => setShowModal(false)} className="h-9 text-sm">Cancel</Button>
                        <Button onClick={handleSave} disabled={saving} className="h-9 bg-[hsl(172,75%,17%)] hover:bg-[hsl(172,75%,22%)] text-white text-sm px-4">
                            {saving ? 'Saving...' : (editing ? 'Update' : 'Create')}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
