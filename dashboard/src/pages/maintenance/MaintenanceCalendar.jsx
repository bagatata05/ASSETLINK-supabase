import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import StatusBadge from '../../components/StatusBadge';
import { ChevronLeft, ChevronRight, Wrench, AlertTriangle, Clock, Lock, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { format, startOfWeek, addDays, addWeeks, subWeeks, isToday, isBefore, isAfter, parseISO, startOfDay, endOfDay } from 'date-fns';
import { useAuth } from '@/lib/AuthContext';
import { getSLAStatus, getSLAColorClass } from '@/lib/slaUtils';

const PRIORITY_COLORS = {
    Critical: 'bg-red-100 border-red-300 text-red-800',
    High: 'bg-orange-100 border-orange-300 text-orange-800',
    Medium: 'bg-amber-100 border-amber-300 text-amber-800',
    Low: 'bg-slate-100 border-slate-300 text-slate-700',
};

const WORKLOAD_BG = (count) => {
    if (count === 0) return 'bg-card';
    if (count <= 2) return 'bg-emerald-500/5';
    if (count <= 4) return 'bg-amber-500/5';
    return 'bg-destructive/5';
};

const WORKLOAD_LABEL = (count) => {
    if (count === 0) return null;
    if (count <= 2) return { label: 'Light', color: 'text-emerald-700 bg-emerald-500/10' };
    if (count <= 4) return { label: 'Moderate', color: 'text-amber-700 bg-amber-500/10' };
    return { label: 'Heavy', color: 'text-destructive bg-destructive/10' };
};

export default function MaintenanceCalendar() {
    const { currentUser } = useAuth();
    const [isAdminEditing, setIsAdminEditing] = useState(false); // 🔒 Safety lock for Admins
    const role = currentUser?.role || 'teacher';
    const isMaintenance = role === 'maintenance';
    const isAdmin = role === 'admin' || role === 'principal';
    const canEdit = isMaintenance || (isAdmin && isAdminEditing);
    
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [weekStart, setWeekStart] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }));
    const [tasksByDay, setTasksByDay] = useState({});
    const [unscheduled, setUnscheduled] = useState([]);
    const [pendingReschedule, setPendingReschedule] = useState(null);
    const [rescheduleReason, setRescheduleReason] = useState('');
    const [saving, setSaving] = useState(false);

    useEffect(() => { 
        if (!currentUser) return;
        
        const fetchTasks = async () => {
            const { data, error } = await supabase
                .from('maintenance_tasks')
                .select('*')
                .order('created_at', { ascending: false });

            if (!error && data) {
                const myEmail = currentUser.email?.toLowerCase() || '';
                const myName = currentUser.full_name?.toLowerCase() || '';
                const myFirstName = myName.split(' ')[0] || '';

                // 🏛️ ADMIN/PRINCIPAL can see EVERYTHING
                // 🛠️ MAINTENANCE only see their assigned tasks
                const filtered = (role === 'admin' || role === 'principal') 
                    ? data 
                    : data.filter(t => {
                        const assignedName = t.assigned_to_name?.toLowerCase() || '';
                        const assignedEmail = t.assigned_to_email?.toLowerCase() || '';
                        return assignedEmail === myEmail || 
                               assignedName.includes(myEmail) ||
                               assignedName.includes(myFirstName) ||
                               myName.includes(assignedName);
                    });

                setTasks(filtered);
                distribute(filtered);
                setLoading(false);
            }
        };

        fetchTasks();

        const subscription = supabase.channel('maintenance_tasks_calendar')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'maintenance_tasks' }, fetchTasks)
            .subscribe();

        return () => { supabase.removeChannel(subscription); };
    }, [currentUser, weekStart]);



    function distribute(data) {
        const days = {};
        const unsched = [];
        for (let i = 0; i < 7; i++) {
            const key = format(addDays(weekStart, i), 'yyyy-MM-dd');
            days[key] = [];
        }
        data.forEach(task => {
            // Normalize the date string to yyyy-MM-dd to match the calendar grid keys
            const dateKey = task.scheduled_start_date ? format(parseISO(task.scheduled_start_date), 'yyyy-MM-dd') : null;
            
            if (dateKey && days[dateKey] !== undefined) {
                days[dateKey].push(task);
            } else if (!dateKey) {
                unsched.push(task);
            }
        });
        setTasksByDay(days);
        setUnscheduled(unsched);
    }

    const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

    function getDayKey(date) { return format(date, 'yyyy-MM-dd'); }

    function getDayTasks(date) {
        return tasksByDay[getDayKey(date)] || [];
    }

    async function onDragEnd(result) {
        if (!canEdit) {
            toast.error('Only Maintenance staff can reschedule tasks');
            return;
        }

        const { source, destination, draggableId } = result;
        if (!destination || (source.droppableId === destination.droppableId && source.index === destination.index)) return;

        const taskId = draggableId;
        const task = tasks.find(t => t.id === taskId);
        if (!task) return;

        const destDate = destination.droppableId === 'unscheduled' ? null : destination.droppableId;
        
        // OPTIMISTIC UPDATE: Move the task locally first so it snaps instantly
        const updatedTasks = tasks.map(t => 
            t.id === taskId ? { ...t, scheduled_start_date: destDate } : t
        );
        setTasks(updatedTasks);
        distribute(updatedTasks);

        // SLA CHECK: If moving to a date, check if it's past SLA
        if (destDate && task.sla_deadline) {
            const newDateEnd = endOfDay(parseISO(destDate));
            const deadline = parseISO(task.sla_deadline);
            
            if (isAfter(newDateEnd, deadline)) {
                // Past SLA! Need reason.
                setPendingReschedule({ taskId, destDate });
                setRescheduleReason('');
                return;
            }
        }

        await performUpdate(taskId, destDate);
    }

    async function performUpdate(taskId, destDate, reason = '') {
        setSaving(true);
        try {
            const updatePayload = { 
                scheduled_start_date: destDate || null,
                updated_at: new Date().toISOString()
            };
            
            if (reason) {
                const task = tasks.find(t => t.id === taskId);
                updatePayload.reschedule_notes = (task?.reschedule_notes ? task.reschedule_notes + '\n' : '') + reason;
                updatePayload.reschedule_count = (task?.reschedule_count || 0) + 1;
            }

            const { error } = await supabase.from('maintenance_tasks').update(updatePayload).eq('id', taskId);
            if (error) throw error;
            toast.success(destDate ? `Task scheduled for ${format(parseISO(destDate), 'EEE, MMM d')}` : 'Task moved to unscheduled');
        } catch (error) {
            console.error('Failed to update task:', error);
            toast.error('Failed to update task');
        } finally {
            setSaving(false);
            setPendingReschedule(null);
        }
    }

    const today = startOfDay(new Date());

    const overdueTasks = tasks.filter(t =>
        t.scheduled_start_date && isBefore(parseISO(t.scheduled_start_date), today) && !['Completed'].includes(t.status)
    );

    if (loading) {
        return <div className="flex justify-center py-16"><div className="w-8 h-8 border-4 border-teal/30 border-t-teal rounded-full animate-spin" /></div>;
    }

    return (
        <div className="space-y-6">
            {/* Role-based Banners */}
            {isAdmin && !isAdminEditing && (
                <div className="flex items-center justify-between gap-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 rounded-xl px-4 py-3 shadow-sm">
                    <div className="flex items-center gap-3">
                        <Lock className="w-4 h-4 text-amber-600 dark:text-amber-500 flex-shrink-0" />
                        <span className="text-sm text-amber-800 dark:text-amber-200">
                            <strong>Safety Lock Active</strong> — You are currently in view-only mode to prevent accidental changes.
                        </span>
                    </div>
                    <Button 
                        onClick={() => setIsAdminEditing(true)}
                        variant="outline" 
                        size="sm" 
                        className="h-8 border-amber-300 text-amber-700 hover:bg-amber-100 font-bold gap-1.5"
                    >
                        <Wrench className="w-3.5 h-3.5" />
                        Unlock Editing
                    </Button>
                </div>
            )}

            {isAdmin && isAdminEditing && (
                <div className="flex items-center justify-between gap-3 bg-[#064e3b] border border-emerald-800 rounded-xl px-4 py-3 shadow-sm text-white">
                    <div className="flex items-center gap-3">
                        <Wrench className="w-4 h-4 text-emerald-300 flex-shrink-0 animate-pulse" />
                        <span className="text-sm font-medium">
                            <strong>Admin Overwrite Mode</strong> — Drag-and-drop editing is now active. Changes will sync to the database.
                        </span>
                    </div>
                    <Button 
                        onClick={() => setIsAdminEditing(false)}
                        variant="outline" 
                        size="sm" 
                        className="h-8 border-emerald-400 bg-emerald-900/50 text-white hover:bg-emerald-900 font-bold gap-1.5"
                    >
                        <Lock className="w-3.5 h-3.5" />
                        Lock Session
                    </Button>
                </div>
            )}

            {!isMaintenance && !isAdmin && (
                <div className="flex items-center gap-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/50 rounded-xl px-4 py-3">
                    <Lock className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                    <span className="text-sm text-blue-700 dark:text-blue-200"><strong>View Only</strong> — Only Maintenance staff and Administration can reschedule tasks.</span>
                </div>
            )}

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Maintenance Calendar</h1>
                    <p className="text-muted-foreground text-sm mt-1">{canEdit ? 'Drag tasks between days to reschedule. Color indicates workload.' : 'View the maintenance schedule and workload.'}</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="icon" onClick={() => { const next = subWeeks(weekStart, 1); setWeekStart(next); distribute(tasks); }}><ChevronLeft className="w-4 h-4" /></Button>
                    <div className="text-sm font-medium text-foreground px-2 min-w-[160px] text-center">
                        {format(weekStart, 'MMM d')} — {format(addDays(weekStart, 6), 'MMM d, yyyy')}
                    </div>
                    <Button variant="outline" size="icon" onClick={() => { const next = addWeeks(weekStart, 1); setWeekStart(next); distribute(tasks); }}><ChevronRight className="w-4 h-4" /></Button>
                    <Button variant="outline" size="sm" onClick={() => { const next = startOfWeek(new Date(), { weekStartsOn: 1 }); setWeekStart(next); distribute(tasks); }} className="text-teal border-teal/30 hover:bg-teal/5">Today</Button>
                </div>
            </div>

            {/* Overdue banner */}
            {overdueTasks.length > 0 && (
                <div className="flex items-center gap-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 rounded-xl px-4 py-3 text-sm text-red-700 dark:text-red-400">
                    <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                    <span><strong>{overdueTasks.length} overdue task{overdueTasks.length > 1 ? 's' : ''}</strong> — drag them to a new day to reschedule.</span>
                </div>
            )}

            {/* Legend */}
            <div className="flex flex-wrap items-center gap-3 text-xs">
                <span className="text-muted-foreground font-medium">Workload:</span>
                {[{ label: 'Light (1–2)', color: 'bg-emerald-100 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400' }, { label: 'Moderate (3–4)', color: 'bg-amber-100 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400' }, { label: 'Heavy (5+)', color: 'bg-red-100 dark:bg-red-500/10 text-red-700 dark:text-red-400' }].map(w => (
                    <span key={w.label} className={`px-2.5 py-1 rounded-full font-medium ${w.color}`}>{w.label}</span>
                ))}
                <span className="text-muted-foreground ml-2 font-medium">Priority:</span>
                {['Critical', 'High', 'Medium', 'Low'].map(p => (
                    <span key={p} className={`px-2.5 py-1 rounded-full text-xs font-medium border ${PRIORITY_COLORS[p]} dark:bg-opacity-20`}>{p}</span>
                ))}
            </div>

            <DragDropContext onDragEnd={onDragEnd}>
                {/* Weekly grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-7 gap-3">
                    {weekDays.map(day => {
                        const key = getDayKey(day);
                        const dayTasks = getDayTasks(day);
                        const workload = WORKLOAD_LABEL(dayTasks.length);
                        const overdue = isBefore(day, today);
                        const today_ = isToday(day);
                        return (
                            <div key={key} className={`rounded-xl border flex flex-col min-h-[200px] overflow-hidden ${today_ ? 'border-primary shadow-sm ring-1 ring-primary/20' : overdue && dayTasks.length > 0 ? 'border-destructive/30' : 'border-border'} ${WORKLOAD_BG(dayTasks.length)}`}>
                                {/* Day header */}
                                <div className={`px-3 py-2.5 border-b flex items-center justify-between ${today_ ? 'bg-primary text-primary-foreground border-primary' : overdue && dayTasks.length > 0 ? 'bg-destructive/10 border-destructive/20' : 'bg-muted/30 border-border'}`}>
                                    <div>
                                        <p className={`text-[10px] font-semibold uppercase tracking-wider ${today_ ? 'text-primary-foreground/80' : 'text-muted-foreground'}`}>{format(day, 'EEE')}</p>
                                        <p className={`text-lg font-bold leading-tight ${today_ ? 'text-primary-foreground' : overdue && dayTasks.length > 0 ? 'text-destructive' : 'text-foreground'}`}>{format(day, 'd')}</p>
                                    </div>
                                    {workload && (
                                        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${today_ ? 'bg-primary-foreground/20 text-primary-foreground' : workload.color}`}>{workload.label}</span>
                                    )}
                                </div>
                                {/* Droppable area */}
                                <Droppable droppableId={key} isDropDisabled={!canEdit}>
                                    {(provided, snapshot) => (
                                        <div
                                            ref={provided.innerRef}
                                            {...provided.droppableProps}
                                            className={`flex-1 p-2 space-y-2 transition-colors min-h-[120px] ${snapshot.isDraggingOver && canEdit ? 'bg-primary/5 ring-1 ring-inset ring-primary/20' : ''}`}
                                        >
                                            {dayTasks.map((task, idx) => (
                                                <Draggable key={task.id} draggableId={task.id} index={idx} isDragDisabled={!canEdit}>
                                                    {(prov, snap) => {
                                                        const slaStatus = getSLAStatus(task);
                                                        const slaClasses = getSLAColorClass(slaStatus);
                                                        const isCompleted = task.status === 'Completed';
                                                        return (
                                                            <div
                                                                ref={prov.innerRef}
                                                                {...prov.draggableProps}
                                                                {...(canEdit ? prov.dragHandleProps : {})}
                                                                className={`text-xs p-3 rounded-lg border bg-card transition-all ${isCompleted ? 'bg-emerald-50/50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20 opacity-60' : slaClasses} ${canEdit ? 'cursor-grab active:cursor-grabbing select-none' : 'cursor-default'} ${snap.isDragging ? 'shadow-lg rotate-1 opacity-90 ring-1 ring-primary' : 'hover:shadow-sm'}`}
                                                            >
                                                                <div className="flex justify-between items-start mb-1">
                                                                    <div className="flex items-start gap-1.5 min-w-0">
                                                                        {isCompleted && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 mt-0.5 flex-shrink-0" />}
                                                                        <p className={`font-bold truncate pr-1 ${isCompleted ? 'text-emerald-900/70' : ''}`}>{task.asset_name}</p>
                                                                    </div>
                                                                    {task.reschedule_count > 0 && <span className="flex-shrink-0 bg-white/50 px-1 rounded text-[10px] font-bold">R{task.reschedule_count}</span>}
                                                                </div>
                                                                <p className={`opacity-70 truncate text-[10px] mb-1.5 ${isCompleted ? 'text-emerald-800/60' : ''}`}>{task.school_name}</p>
                                                                <div className={`flex ${isCompleted ? 'flex-col gap-1' : 'items-center justify-between gap-1'}`}>
                                                                    <div className="flex items-center justify-between w-full">
                                                                        <StatusBadge status={isCompleted ? 'Completed' : (task.priority || 'Medium')} size="xs" />
                                                                        {task.sla_deadline && !isCompleted && (
                                                                            <div className={`flex items-center gap-0.5 text-[10px] font-medium ${slaStatus === 'overdue' ? 'text-red-700' : 'text-muted-foreground'}`}>
                                                                                <Clock className="w-2.5 h-2.5" />
                                                                                {format(parseISO(task.sla_deadline), 'MM/dd')}
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                    {isCompleted && (
                                                                        <div className="flex items-center justify-between w-full pt-1 border-t border-emerald-500/10">
                                                                            <span className="text-[9px] font-bold text-emerald-600/60 dark:text-emerald-400/60 uppercase tracking-tighter">Resolution Done</span>
                                                                            <span className="text-[8px] font-mono text-emerald-600/40 dark:text-emerald-400/40">{format(new Date(), 'HH:mm')}</span>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        );
                                                    }}
                                                </Draggable>
                                            ))}
                                            {provided.placeholder}
                                            {dayTasks.length === 0 && !snapshot.isDraggingOver && (
                                                <p className="text-xs text-muted-foreground/40 text-center pt-4">{canEdit ? 'Drop here' : '—'}</p>
                                            )}
                                        </div>
                                    )}
                                </Droppable>
                            </div>
                        );
                    })}
                </div>

                {/* Unscheduled tasks */}
                <div className="bg-card rounded-xl border border-border overflow-hidden mt-6">
                    <div className="flex items-center gap-3 px-5 py-4 border-b border-border bg-muted/30">
                        <Clock className="w-4 h-4 text-muted-foreground" />
                        <h2 className="text-sm font-semibold text-foreground">Unscheduled Tasks</h2>
                        <span className="ml-auto text-xs bg-background border border-border text-muted-foreground px-2 py-0.5 rounded-full">{unscheduled.length}</span>
                    </div>
                    <Droppable droppableId="unscheduled" direction="horizontal" isDropDisabled={!canEdit}>
                        {(provided, snapshot) => (
                            <div
                                ref={provided.innerRef}
                                {...provided.droppableProps}
                                className={`flex flex-wrap gap-3 p-4 min-h-[80px] transition-colors ${snapshot.isDraggingOver && canEdit ? 'bg-primary/5 ring-1 ring-inset ring-primary/20' : ''}`}
                            >
                                {unscheduled.length === 0 && !snapshot.isDraggingOver && (
                                    <p className="text-sm text-muted-foreground/50 py-2">All tasks are scheduled 🎉</p>
                                )}
                                {unscheduled.map((task, idx) => (
                                    <Draggable key={task.id} draggableId={task.id} index={idx} isDragDisabled={!canEdit}>
                                        {(prov, snap) => (
                                            <div
                                                ref={prov.innerRef}
                                                {...prov.draggableProps}
                                                {...(canEdit ? prov.dragHandleProps : {})}
                                                className={`text-xs p-3 bg-card rounded-lg border w-44 ${PRIORITY_COLORS[task.priority || 'Medium']} ${canEdit ? 'cursor-grab active:cursor-grabbing select-none' : 'cursor-default'} ${snap.isDragging ? 'shadow-lg rotate-1 opacity-90 ring-1 ring-primary' : 'hover:shadow-sm'}`}
                                            >
                                                <p className="font-semibold truncate">{task.asset_name}</p>
                                                <p className="opacity-70 truncate mt-0.5">{task.school_name}</p>
                                                <div className="mt-1.5"><StatusBadge status={task.status} /></div>
                                                <div className="mt-1"><StatusBadge status={task.priority || 'Medium'} /></div>
                                            </div>
                                        )}
                                    </Draggable>
                                ))}
                                {provided.placeholder}
                            </div>
                        )}
                    </Droppable>
                </div>
            </DragDropContext>

            {/* Completed Archive Section */}
            <div className="bg-emerald-50/30 dark:bg-emerald-950/20 rounded-xl border border-emerald-200/50 dark:border-emerald-900/50 overflow-hidden">
                <div className="flex items-center gap-3 px-5 py-4 border-b border-emerald-100 dark:border-emerald-900/50 bg-emerald-50/50 dark:bg-emerald-900/20">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <h2 className="text-sm font-bold text-emerald-900 dark:text-emerald-100">Completed Protocols</h2>
                    <span className="text-[10px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-100/50 dark:bg-emerald-400/10 px-2 py-0.5 rounded-full uppercase tracking-wider">Registry</span>
                    <span className="ml-auto text-xs bg-white/80 dark:bg-emerald-900 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 px-2.5 py-1 rounded-full font-bold">
                        {tasks.filter(t => t.status === 'Completed').length} Total
                    </span>
                </div>
                <div className="p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {tasks.filter(t => t.status === 'Completed').length === 0 ? (
                            <div className="col-span-full py-8 text-center">
                                <p className="text-sm text-emerald-600/40 italic">No protocols finalized yet ✨</p>
                            </div>
                        ) : (
                            tasks.filter(t => t.status === 'Completed')
                                .slice(0, 6) // Show last 6 completed tasks
                                .map(task => (
                                    <div key={task.id} className="flex items-center gap-3 p-3 bg-white dark:bg-card border border-emerald-100 dark:border-emerald-900/50 rounded-xl shadow-sm">
                                        <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center flex-shrink-0 text-emerald-600 dark:text-emerald-400">
                                            <CheckCircle2 className="w-5 h-5" />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="text-sm font-bold text-emerald-900 dark:text-emerald-100 truncate">{task.asset_name}</p>
                                            <p className="text-[10px] text-emerald-600/70 dark:text-emerald-400/60 truncate">{task.school_name}</p>
                                        </div>
                                        <div className="text-right flex-shrink-0">
                                            <p className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400">DONE</p>
                                            <p className="text-[9px] text-emerald-600/60 dark:text-emerald-400/40 uppercase">
                                                {task.scheduled_start_date ? format(parseISO(task.scheduled_start_date), 'MMM d') : 'No Date'}
                                            </p>
                                        </div>
                                    </div>
                                ))
                        )}
                    </div>
                </div>
            </div>

            <Dialog open={!!pendingReschedule} onOpenChange={(open) => !open && setPendingReschedule(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>SLA Deadline Exceeded</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 pt-4">
                        <div className="bg-destructive/10 text-destructive p-3 rounded-md text-sm border border-destructive/20">
                            This date is past the Service Level Agreement (SLA) deadline for this task. You must provide a reason for the delay.
                        </div>
                        <div className="space-y-2">
                            <Label>Reason for Delay</Label>
                            <Textarea 
                                value={rescheduleReason} 
                                onChange={e => setRescheduleReason(e.target.value)} 
                                placeholder="Why is this maintenance delayed?"
                            />
                        </div>
                        <Button 
                            className="w-full" 
                            disabled={!rescheduleReason.trim() || saving}
                            onClick={() => performUpdate(pendingReschedule.taskId, pendingReschedule.destDate, rescheduleReason)}
                        >
                            {saving ? 'Saving...' : 'Confirm Reschedule'}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
