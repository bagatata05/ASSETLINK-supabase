import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Eye, EyeOff, QrCode, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { sileo } from "sileo";
import { supabase } from '@/lib/supabase';

export default function ResetPassword() {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const navigate = useNavigate();

    const handleReset = async (e) => {
        e.preventDefault();
        
        if (password !== confirmPassword) {
            sileo.error({ title: 'Validation Error', description: 'Passwords do not match.' });
            return;
        }

        if (password.length < 8) {
            sileo.error({ title: 'Weak Password', description: 'Password must be at least 8 characters long.' });
            return;
        }

        setIsLoading(true);

        try {
            const { error } = await supabase.auth.updateUser({ password });
            if (error) throw error;

            sileo.success({ 
                title: 'Security Synchronized', 
                description: 'Your account has been updated with the new credentials.' 
            });
            setIsSuccess(true);
            setTimeout(() => navigate('/login'), 3000);
        } catch (error) {
            sileo.error({ title: 'Update Failed', description: error.message });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen grid lg:grid-cols-2 bg-background font-sans overflow-hidden selection:bg-emerald-100 transition-colors duration-300">
            {/* Left Side: Reset Form */}
            <div className="flex flex-col items-center justify-center px-8 py-6 lg:px-20 animate-fade-in relative">
                <div className="w-full max-w-[400px] space-y-8">
                    {/* Logo */}
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-emerald-900 dark:bg-emerald-800 text-white rounded-lg flex items-center justify-center shadow-lg transform -rotate-3">
                            <QrCode className="w-6 h-6" />
                        </div>
                        <h1 className="text-2xl font-serif font-black text-emerald-900 dark:text-emerald-400 tracking-tight">AssetLink</h1>
                    </div>

                    <div className="space-y-3">
                        <h2 className="text-4xl font-serif font-black text-foreground tracking-tight">Security Update</h2>
                        <p className="text-muted-foreground font-medium text-lg">Set a new secure password for your account.</p>
                    </div>

                    {isSuccess ? (
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="bg-card border border-border p-8 rounded-3xl text-center space-y-4 shadow-sm"
                        >
                            <div className="w-16 h-16 bg-muted text-emerald-700 dark:text-emerald-400 rounded-2xl flex items-center justify-center mx-auto shadow-sm">
                                <CheckCircle2 className="w-8 h-8" />
                            </div>
                            <div className="space-y-1">
                                <p className="text-lg font-bold text-foreground">Success!</p>
                                <p className="text-sm text-muted-foreground font-medium leading-relaxed">
                                    Your password has been updated. You'll be redirected to login shortly.
                                </p>
                            </div>
                        </motion.div>
                    ) : (
                        <form onSubmit={handleReset} className="space-y-6">
                            <div className="space-y-1.5">
                                <Label className="text-sm font-bold text-foreground ml-1">New Password</Label>
                                <div className="relative">
                                    <Input 
                                        type={showPassword ? "text" : "password"} 
                                        placeholder="••••••••" 
                                        className="h-12 border-border bg-card rounded-xl px-4 focus-visible:ring-emerald-600 pr-12 text-base font-medium"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                    />
                                    <button 
                                        type="button" 
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground/40 hover:text-foreground transition-colors"
                                    >
                                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-sm font-bold text-foreground ml-1">Confirm Password</Label>
                                <Input 
                                    type="password" 
                                    placeholder="••••••••" 
                                    className="h-12 border-border bg-card rounded-xl px-4 focus-visible:ring-emerald-600 text-base font-medium"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    required
                                />
                            </div>

                            <div className="pt-4">
                                <Button 
                                    type="submit" 
                                    disabled={isLoading}
                                    className="w-full h-12 bg-emerald-700 dark:bg-emerald-600 hover:bg-emerald-800 dark:hover:bg-emerald-700 text-white rounded-xl font-bold transition-all text-base shadow-xl shadow-emerald-900/10 active:scale-[0.98]"
                                >
                                    {isLoading ? "Synchronizing..." : "Update Password"}
                                </Button>
                                <button 
                                    type="button"
                                    onClick={() => navigate('/login')}
                                    className="w-full text-center text-sm font-bold text-muted-foreground/60 hover:text-emerald-700 dark:hover:text-emerald-400 mt-4 transition-colors"
                                >
                                    Back to Login
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>

            {/* Right Side: Typography Brand Panel */}
            <div className="hidden lg:flex flex-col items-center justify-center bg-[#064e3b] p-12 text-white relative overflow-hidden">
                {/* Dynamic Background Elements */}
                <div className="absolute inset-0 bg-gradient-to-br from-[#064e3b] via-[#053e2f] to-[#042f24]" />
                <div className="absolute inset-0 opacity-[0.03] mix-blend-overlay bg-[url('https://www.transparenttextures.com/patterns/pinstriped-suit.png')]" />
                <div className="absolute top-[-10%] right-[-10%] w-[70%] h-[70%] bg-emerald-400/10 rounded-full blur-[120px]" />
                
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
                                <span className="text-[10px] font-black uppercase tracking-[0.4em] text-emerald-400/60">Security Protocol</span>
                            </div>
                            
                            <h2 className="text-7xl font-serif font-black tracking-tight leading-[0.9] text-white">
                                Get Back <br/> 
                                <span className="text-emerald-400 italic font-medium serif pr-2">Inside</span> <br/>
                                Your Account.
                            </h2>
                        </motion.div>

                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.5, duration: 1 }}
                            className="space-y-6"
                        >
                            <p className="text-emerald-50/70 text-xl leading-relaxed font-medium max-w-[440px]">
                                Reset your password to keep your account safe. We make security simple so you don't have to worry about a thing.
                            </p>
                            
                            <div className="grid grid-cols-2 gap-8 pt-4">
                                <div className="space-y-2">
                                    <p className="text-emerald-400 font-serif italic text-2xl">Secure.</p>
                                    <p className="text-emerald-50/40 text-[10px] font-black uppercase tracking-widest leading-relaxed">Protected by <br/>modern tech</p>
                                </div>
                                <div className="space-y-2">
                                    <p className="text-emerald-400 font-serif italic text-2xl">Private.</p>
                                    <p className="text-emerald-50/40 text-[10px] font-black uppercase tracking-widest leading-relaxed">Your data <br/>stays yours</p>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </div>

                {/* Subtle Brand Watermark */}
                <div className="absolute top-12 left-12 opacity-[0.03] pointer-events-none rotate-90 scale-150">
                    <QrCode size={300} strokeWidth={0.2} />
                </div>
            </div>
        </div>
    );
}
