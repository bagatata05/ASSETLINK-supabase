import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { UserCircle, Wrench, ChevronRight, QrCode, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/AuthContext';
import { sileo } from 'sileo';

export default function RoleSelection() {
    const { currentUser, refreshProfile } = useAuth();
    const [selectedRole, setSelectedRole] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [imageSrc, setImageSrc] = useState('https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&q=80&w=1200');

    const roles = [
        { 
            id: 'teacher', 
            label: 'Teacher', 
            desc: 'Report damages and track school assets.', 
            icon: UserCircle,
            previewImg: 'https://images.unsplash.com/photo-1544717297-fa154daaf762?auto=format&fit=crop&q=80&w=1200'
        },
        { 
            id: 'maintenance', 
            label: 'Maintenance', 
            desc: 'Receive tasks and resolve repair requests.', 
            icon: Wrench,
            previewImg: 'https://images.unsplash.com/photo-1581092921461-7d15ca55a40a?auto=format&fit=crop&q=80&w=1200'
        }
    ];

    const handleConfirm = async () => {
        if (!selectedRole) return;
        setIsLoading(true);

        try {
            // 🔥 Get full name from Google metadata if available
            const meta = currentUser.user_metadata || {};
            const fullName = meta.full_name || meta.name || 
                           (meta.given_name ? `${meta.given_name} ${meta.family_name || ''}`.trim() : 'Google User');

            const { error } = await supabase
                .from('profiles')
                .upsert({
                    id: currentUser.id,
                    role: selectedRole,
                    email: currentUser.email,
                    full_name: fullName,
                    status: 'pending', // 🔒 Wait for admin approval
                    updated_at: new Date().toISOString()
                });

            if (error) throw error;
            sileo.success({ title: 'Profile Updated', description: 'Your workspace is being prepared.' });
            if (refreshProfile) await refreshProfile();
        } catch (error) {
            console.error('RoleSelection error:', error);
            sileo.error({ 
                title: 'Selection Failed', 
                description: error.message || 'We could not save your preference. Please try again.' 
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="h-screen grid lg:grid-cols-2 bg-white selection:bg-emerald-100">
            {/* Left Side: Role Choice */}
            <div className="flex flex-col items-center justify-center px-8 py-6 lg:px-20 animate-fade-in relative">
                <div className="w-full max-w-[480px] space-y-8">
                    {/* Logo */}
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-[#064e3b] text-white rounded-lg flex items-center justify-center shadow-lg transform rotate-3">
                            <QrCode className="w-6 h-6" />
                        </div>
                        <h1 className="text-2xl font-serif font-black text-[#064e3b] tracking-tight">AssetLink</h1>
                    </div>

                    <div className="space-y-3">
                        <h2 className="text-4xl font-serif font-black text-[#1a1a1a] tracking-tight leading-tight">
                            Choose your <span className="text-[#064e3b] italic underline decoration-emerald-200">workspace.</span>
                        </h2>
                        <p className="text-gray-500 font-medium text-lg">
                            Select your primary role to configure your permissions and dashboard.
                        </p>
                    </div>

                    <div className="grid gap-4">
                        {roles.map((role) => (
                            <button
                                key={role.id}
                                onClick={() => {
                                    setSelectedRole(role.id);
                                    setImageSrc(role.previewImg);
                                }}
                                className={`group flex items-center p-4 rounded-2xl border-2 transition-all duration-300 text-left ${
                                    selectedRole === role.id 
                                    ? 'border-[#064e3b] bg-emerald-50/30 ring-4 ring-emerald-500/5' 
                                    : 'border-gray-100 bg-white hover:border-emerald-200 hover:bg-gray-50/50'
                                }`}
                            >
                                <div className={`w-14 h-14 rounded-xl flex items-center justify-center mr-5 transition-all ${
                                    selectedRole === role.id ? 'bg-[#064e3b] text-white shadow-lg' : 'bg-gray-50 text-gray-400'
                                }`}>
                                    <role.icon className="w-8 h-8" />
                                </div>
                                <div className="flex-1">
                                    <p className={`text-lg font-bold ${selectedRole === role.id ? 'text-[#064e3b]' : 'text-gray-900'}`}>{role.label}</p>
                                    <p className="text-sm text-gray-500 font-medium">{role.desc}</p>
                                </div>
                                {selectedRole === role.id && (
                                    <div className="w-6 h-6 bg-[#064e3b] text-white rounded-full flex items-center justify-center shadow-md">
                                        <CheckCircle2 size={14} />
                                    </div>
                                )}
                            </button>
                        ))}
                    </div>

                    <Button 
                        onClick={handleConfirm}
                        disabled={!selectedRole || isLoading}
                        className="w-full h-12 bg-[#064e3b] hover:bg-[#053e2f] text-white rounded-xl gap-3 font-bold text-lg shadow-xl shadow-emerald-900/10 transition-all active:scale-[0.98] disabled:opacity-50"
                    >
                        {isLoading ? 'Preparing Workspace...' : 'Initialize Dashboard'} <ChevronRight className="w-5 h-5" />
                    </Button>

                    <div className="pt-4 text-center">
                        <button 
                            onClick={() => {
                                supabase.auth.signOut();
                                window.location.href = '/login';
                            }}
                            className="text-xs font-bold text-gray-400 hover:text-red-500 uppercase tracking-widest transition-colors"
                        >
                            Sign out and switch account
                        </button>
                    </div>
                </div>
            </div>

            {/* Right Side: Typography Brand Panel */}
            <div className="hidden lg:flex flex-col items-center justify-center bg-[#064e3b] p-12 text-white relative overflow-hidden">
                {/* Dynamic Background Elements */}
                <div className="absolute inset-0 bg-gradient-to-br from-[#064e3b] via-[#053e2f] to-[#042f24]" />
                <div className="absolute inset-0 opacity-[0.03] mix-blend-overlay bg-[url('https://www.transparenttextures.com/patterns/pinstriped-suit.png')]" />
                <div className="absolute top-[-10%] left-[-10%] w-[70%] h-[70%] bg-emerald-400/10 rounded-full blur-[120px]" />
                
                <div className="w-full max-w-[540px] space-y-12 relative z-10 text-left">
                    {/* Simplified Typography Composition */}
                    <div className="space-y-8">
                        <motion.div 
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.8 }}
                            className="space-y-6"
                        >
                            <div className="flex items-center gap-4">
                                <div className="h-px w-12 bg-emerald-400" />
                                <span className="text-[10px] font-black uppercase tracking-[0.4em] text-emerald-400/60">Workspace Config</span>
                            </div>
                            
                            <h2 className="text-7xl font-serif font-black tracking-tight leading-[0.9] text-white">
                                Pick your <br/> 
                                <span className="text-emerald-400 italic font-medium serif pr-2">Role</span> <br/>
                                In the school.
                            </h2>
                        </motion.div>

                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.5, duration: 1 }}
                            className="space-y-6"
                        >
                            <p className="text-emerald-50/70 text-xl leading-relaxed font-medium max-w-[440px]">
                                Tell us who you are so we can show you the right tools. Are you a Teacher reporting issues or Maintenance fixing them?
                            </p>
                            
                            <div className="grid grid-cols-2 gap-8 pt-4">
                                <div className="space-y-2">
                                    <p className="text-emerald-400 font-serif italic text-2xl">Custom.</p>
                                    <p className="text-emerald-50/40 text-[10px] font-black uppercase tracking-widest leading-relaxed">Tools built <br/>just for you</p>
                                </div>
                                <div className="space-y-2">
                                    <p className="text-emerald-400 font-serif italic text-2xl">Simple.</p>
                                    <p className="text-emerald-50/40 text-[10px] font-black uppercase tracking-widest leading-relaxed">Focus on <br/>your daily work</p>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </div>

                {/* Subtle Brand Watermark */}
                <div className="absolute top-12 right-12 opacity-[0.03] pointer-events-none -rotate-12 scale-150">
                    <QrCode size={300} strokeWidth={0.2} />
                </div>
            </div>
        </div>
    );
}
