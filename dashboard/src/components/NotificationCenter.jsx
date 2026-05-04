import React, { useState, useEffect, useRef } from 'react';
import { Bell, CheckCircle, AlertCircle, Info, X, ExternalLink, Trash2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';

/** Lightweight relative time helper (avoids date-fns dependency) */
function timeAgo(dateStr) {
    const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
    if (seconds < 60) return 'just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return new Date(dateStr).toLocaleDateString();
}

export default function NotificationCenter() {
    const { currentUser } = useAuth();
    const [notifications, setNotifications] = useState([]);
    const [isOpen, setIsOpen] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const dropdownRef = useRef(null);
    const navigate = useNavigate();

    useEffect(() => {
        if (!currentUser?.email) return;

        // Fetch initial notifications
        fetchNotifications();

        // Subscribe to real-time changes
        const userEmail = currentUser.email.toLowerCase();
        const channel = supabase
            .channel(`notifications-${userEmail}`)
            .on('postgres_changes', { 
                event: 'INSERT', 
                schema: 'public', 
                // @ts-ignore - notifications table is newly created and not yet in types
                table: 'notifications',
                filter: `user_email=eq.${userEmail}`
            }, (payload) => {
                setNotifications(prev => [payload.new, ...prev]);
                setUnreadCount(prev => prev + 1);
                
                // Optional: Play a subtle sound or show a toast
                if (window.Notification && Notification.permission === 'granted') {
                    new Notification(payload.new.title, { body: payload.new.message });
                }
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [currentUser]);

    // Close dropdown on click outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const fetchNotifications = async () => {
        if (!currentUser?.email) return;
        const userEmail = currentUser.email.toLowerCase();
        
        // @ts-ignore - notifications table is newly created and not yet in types
        const { data, error } = await supabase.from('notifications')
            .select('*')
            .eq('user_email', userEmail)
            .order('created_at', { ascending: false })
            .limit(20);

        if (!error && data) {
            setNotifications(data);
            setUnreadCount(data.filter(n => !n.is_read).length);
        }
    };

    const markAsRead = async (id) => {
        // @ts-ignore - notifications table is newly created and not yet in types
        const { error } = await supabase.from('notifications')
            .update({ is_read: true })
            .eq('id', id);

        if (!error) {
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
            setUnreadCount(prev => Math.max(0, prev - 1));
        }
    };

    const markAllRead = async () => {
        // @ts-ignore - notifications table is newly created and not yet in types
        const { error } = await supabase.from('notifications')
            .update({ is_read: true })
            .eq('user_email', currentUser.email)
            .eq('is_read', false);

        if (!error) {
            setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
            setUnreadCount(0);
        }
    };

    const deleteNotification = async (e, id) => {
        e.stopPropagation();
        // @ts-ignore - notifications table is newly created and not yet in types
        const { error } = await supabase.from('notifications')
            .delete()
            .eq('id', id);

        if (!error) {
            const wasUnread = notifications.find(n => n.id === id && !n.is_read);
            setNotifications(prev => prev.filter(n => n.id !== id));
            if (wasUnread) setUnreadCount(prev => Math.max(0, prev - 1));
        }
    };

    const handleNotificationClick = (n) => {
        if (!n.is_read) markAsRead(n.id);
        if (n.link) {
            navigate(n.link);
            setIsOpen(false);
        }
    };

    const getIcon = (type) => {
        switch (type) {
            case 'success': return <CheckCircle className="w-4 h-4 text-emerald-500" />;
            case 'warning': return <AlertCircle className="w-4 h-4 text-amber-500" />;
            case 'error': return <AlertCircle className="w-4 h-4 text-rose-500" />;
            default: return <Info className="w-4 h-4 text-sky-500" />;
        }
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={cn(
                    "relative w-9 h-9 flex items-center justify-center rounded-xl transition-all duration-300",
                    isOpen ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20 scale-95" : "hover:bg-muted text-muted-foreground hover:text-foreground"
                )}
            >
                <Bell className={cn("w-5 h-5", unreadCount > 0 && "animate-[bell-ring_1s_ease-in-out_infinite]")} />
                {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-background shadow-sm animate-in zoom-in duration-300">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                        className="absolute right-[-48px] sm:right-0 mt-3 w-[calc(100vw-32px)] sm:w-[380px] bg-background/95 backdrop-blur-xl border border-border/80 rounded-2xl shadow-2xl z-50 overflow-hidden"
                    >
                        <div className="p-4 border-b border-border/50 flex items-center justify-between bg-muted/30">
                            <div>
                                <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
                                    Notifications
                                    {unreadCount > 0 && (
                                        <span className="px-2 py-0.5 bg-primary/10 text-primary text-[10px] rounded-full">
                                            {unreadCount} New
                                        </span>
                                    )}
                                </h4>
                                <p className="text-[10px] text-muted-foreground mt-0.5">Stay updated with operational activity.</p>
                            </div>
                            {unreadCount > 0 && (
                                <button 
                                    onClick={markAllRead}
                                    className="text-[10px] font-bold text-primary hover:underline transition-all"
                                >
                                    Mark all as read
                                </button>
                            )}
                        </div>

                        <div className="max-h-[420px] overflow-y-auto custom-scrollbar">
                            {notifications.length === 0 ? (
                                <div className="p-10 flex flex-col items-center justify-center text-center space-y-3 opacity-60">
                                    <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                                        <Bell className="w-6 h-6 text-muted-foreground/50" />
                                    </div>
                                    <p className="text-xs font-medium text-muted-foreground">All caught up! No new alerts.</p>
                                </div>
                            ) : (
                                <div className="divide-y divide-border/40">
                                    {notifications.map((n) => (
                                        <div
                                            key={n.id}
                                            onClick={() => handleNotificationClick(n)}
                                            className={cn(
                                                "group p-4 flex gap-3 cursor-pointer transition-all hover:bg-muted/40 relative",
                                                !n.is_read && "bg-primary/[0.02]"
                                            )}
                                        >
                                            {!n.is_read && (
                                                <div className="absolute left-1 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary rounded-full shadow-[0_0_8px_rgba(var(--primary),0.4)]" />
                                            )}
                                            
                                            <div className="flex-shrink-0 mt-0.5">
                                                {getIcon(n.type)}
                                            </div>

                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-start justify-between gap-2">
                                                    <h5 className={cn(
                                                        "text-[13px] leading-tight transition-colors",
                                                        n.is_read ? "text-foreground/80 font-medium" : "text-foreground font-bold"
                                                    )}>
                                                        {n.title}
                                                    </h5>
                                                    <span className="text-[10px] text-muted-foreground whitespace-nowrap pt-0.5 font-medium italic">
                                                        {timeAgo(n.created_at)}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-muted-foreground mt-1 line-clamp-2 leading-relaxed">
                                                    {n.message}
                                                </p>
                                                
                                                {n.link && (
                                                    <div className="mt-2 flex items-center gap-1.5 text-[10px] font-bold text-primary opacity-0 group-hover:opacity-100 transition-all transform translate-x-[-4px] group-hover:translate-x-0">
                                                        <ExternalLink className="w-2.5 h-2.5" /> VIEW DETAILS
                                                    </div>
                                                )}
                                            </div>

                                            <button
                                                onClick={(e) => deleteNotification(e, n.id)}
                                                className="absolute top-4 right-4 p-1 rounded-md opacity-0 group-hover:opacity-100 hover:bg-rose-500/10 hover:text-rose-500 transition-all text-muted-foreground/40"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {notifications.length > 0 && (
                            <div className="p-3 bg-muted/20 border-t border-border/50 text-center">
                                <button 
                                    className="text-[11px] font-bold text-muted-foreground hover:text-foreground transition-all flex items-center justify-center gap-1.5 w-full uppercase tracking-widest"
                                    onClick={() => setIsOpen(false)}
                                >
                                    Dismiss Panel <X className="w-3 h-3" />
                                </button>
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
