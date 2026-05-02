import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
    User, Mail, Phone, Shield, 
    Wrench, Camera, Save, 
    LogOut, CheckCircle2
} from 'lucide-react';
import { motion } from 'framer-motion';
import { sileo } from "sileo";

export default function Profile() {
    const { currentUser, refreshProfile, logout } = useAuth();
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        first_name: '',
        last_name: '',
        phone_number: '',
        employee_id: '',
        department: '',
        room_number: '',
        school_name: '',
        specialization: ''
    });

    useEffect(() => {
        if (currentUser) {
            // Split full_name into first and last for the UI
            const nameParts = (currentUser.full_name || '').split(' ');
            const first = nameParts[0] || '';
            const last = nameParts.slice(1).join(' ') || '';

            setFormData({
                first_name: first,
                last_name: last,
                phone_number: currentUser.phone_number || '',
                employee_id: currentUser.employee_id || '',
                department: currentUser.department || '',
                room_number: currentUser.room_number || '',
                school_name: currentUser.school_name || '',
                specialization: currentUser.specialization || ''
            });
        }
    }, [currentUser]);

    const handleUpdate = async (e) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const { error } = await supabase
                .from('profiles')
                .update({
                    full_name: `${formData.first_name} ${formData.last_name}`.trim(),
                    phone_number: formData.phone_number,
                    employee_id: formData.employee_id,
                    department: formData.department,
                    room_number: formData.room_number,
                    specialization: formData.specialization,
                    updated_at: new Date().toISOString()
                })
                .eq('id', currentUser.id);

            if (error) throw error;

            sileo.success({
                title: 'Changes Saved',
                description: 'Your profile has been updated.'
            });
            
            await refreshProfile();
        } catch (error) {
            sileo.error({
                title: 'Error',
                description: error.message
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleSetPassword = async () => {
        try {
            const { error } = await supabase.auth.resetPasswordForEmail(currentUser.email, {
                redirectTo: `${window.location.origin}/reset-password`,
            });
            if (error) throw error;
            sileo.success({
                title: 'Security Link Sent',
                description: 'Check your email to create your account password.'
            });
        } catch (error) {
            sileo.error({
                title: 'Failed to send link',
                description: error.message
            });
        }
    };

    if (!currentUser) return null;

    return (
        <div className="space-y-6 animate-fade-up">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-semibold text-foreground tracking-tight">My Profile</h1>
                    <p className="text-sm text-muted-foreground mt-0.5">Manage your personal information.</p>
                </div>
                <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={logout} 
                    className="h-8 px-3 text-xs font-medium text-destructive hover:text-destructive/80 hover:bg-destructive/5 rounded-lg gap-2"
                >
                    <LogOut className="w-3.5 h-3.5" />
                    Logout
                </Button>
            </div>

            <div className="grid lg:grid-cols-3 gap-6">
                {/* Profile Card */}
                <div className="bg-card border border-border rounded-xl p-6 text-center space-y-4">
                    <div className="relative inline-block">
                        <div className="w-20 h-20 rounded-full bg-primary/10 text-primary flex items-center justify-center text-2xl font-bold border border-primary/20 mx-auto overflow-hidden">
                            {currentUser.user_metadata?.avatar_url ? (
                                <img 
                                    src={currentUser.user_metadata.avatar_url} 
                                    alt={currentUser.full_name} 
                                    className="w-full h-full object-cover"
                                    referrerPolicy="no-referrer"
                                />
                            ) : (
                                (currentUser.full_name?.[0] || currentUser.email?.[0] || 'U').toUpperCase()
                            )}
                        </div>
                        <button className="absolute bottom-0 right-0 p-1.5 bg-primary text-primary-foreground rounded-full shadow-lg border-2 border-background">
                            <Camera className="w-3 h-3" />
                        </button>
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-foreground">{currentUser.full_name}</h2>
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest bg-primary/10 text-primary border border-primary/20 mt-1">
                            {currentUser.role}
                        </span>
                    </div>
                    <div className="pt-4 border-t border-border flex flex-col gap-3 text-left">
                        <div className="pt-2">
                            <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-3">Account Access</h3>
                            <Button 
                                type="button"
                                variant="outline" 
                                onClick={handleSetPassword}
                                className="w-full h-9 text-[11px] font-bold uppercase tracking-wider border-primary/20 hover:bg-primary/5 hover:text-primary hover:border-primary/30 transition-all rounded-lg gap-2"
                            >
                                <Shield className="w-3.5 h-3.5" />
                                Create Password
                            </Button>
                            <p className="text-[9px] text-muted-foreground mt-2 leading-relaxed">
                                Signed in via Google. Creating a password lets you login with email too.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Form Card */}
                <div className="lg:col-span-2 bg-card border border-border rounded-xl overflow-hidden shadow-sm">
                    <div className="p-6 border-b border-border">
                        <h2 className="text-sm font-semibold">Details</h2>
                    </div>
                    <form onSubmit={handleUpdate} className="p-6 space-y-6">
                        <div className="grid md:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <Label className="text-xs font-bold text-muted-foreground ml-1">First Name</Label>
                                <Input 
                                    value={formData.first_name} 
                                    onChange={e => setFormData({...formData, first_name: e.target.value})}
                                    className="h-10 rounded-lg border-border focus-visible:ring-primary font-medium"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-xs font-bold text-muted-foreground ml-1">Last Name</Label>
                                <Input 
                                    value={formData.last_name} 
                                    onChange={e => setFormData({...formData, last_name: e.target.value})}
                                    className="h-10 rounded-lg border-border focus-visible:ring-primary font-medium"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-xs font-bold text-muted-foreground ml-1">Email</Label>
                                <Input disabled value={currentUser.email} className="h-10 rounded-lg bg-muted/50 font-medium opacity-70" />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-xs font-bold text-muted-foreground ml-1">Phone Number</Label>
                                <Input 
                                    value={formData.phone_number} 
                                    onChange={e => setFormData({...formData, phone_number: e.target.value})}
                                    className="h-10 rounded-lg border-border focus-visible:ring-primary font-medium"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-xs font-bold text-muted-foreground ml-1">Employee ID</Label>
                                <Input 
                                    value={formData.employee_id} 
                                    onChange={e => setFormData({...formData, employee_id: e.target.value})}
                                    className="h-10 rounded-lg border-border focus-visible:ring-primary font-medium"
                                    placeholder="Enter ID Number"
                                />
                            </div>

                            {currentUser.role === 'teacher' && (
                                <>
                                    <div className="space-y-1.5">
                                        <Label className="text-xs font-bold text-muted-foreground ml-1">Department</Label>
                                        <Input value={formData.department} onChange={e => setFormData({...formData, department: e.target.value})} className="h-10 rounded-lg font-medium" />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-xs font-bold text-muted-foreground ml-1">Room No.</Label>
                                        <Input value={formData.room_number} onChange={e => setFormData({...formData, room_number: e.target.value})} className="h-10 rounded-lg font-medium" />
                                    </div>
                                </>
                            )}


                            {currentUser.role === 'maintenance' && (
                                <div className="space-y-1.5 col-span-2">
                                    <Label className="text-xs font-bold text-muted-foreground ml-1">Specialization</Label>
                                    <Input value={formData.specialization} onChange={e => setFormData({...formData, specialization: e.target.value})} className="h-10 rounded-lg font-medium" />
                                </div>
                            )}
                        </div>

                        <div className="pt-4 border-t border-border flex items-center justify-between">
                            <p className="text-[10px] text-muted-foreground italic flex items-center gap-1.5">
                                <CheckCircle2 className="w-3 h-3 text-emerald-500" /> Information is saved securely.
                            </p>
                            <Button 
                                type="submit" 
                                disabled={isLoading}
                                className="h-10 px-6 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg font-bold gap-2 transition-all active:scale-[0.98]"
                            >
                                {isLoading ? 'Saving...' : 'Save Changes'} <Save className="w-4 h-4" />
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
