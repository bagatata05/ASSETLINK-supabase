import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Eye, EyeOff, QrCode, CheckCircle2, ChevronRight, X, Mail } from 'lucide-react';
import { motion } from 'framer-motion';
import { sileo } from "sileo";
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/AuthContext';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [imageSrc, setImageSrc] = useState('/preview.png');
    const [showForgotModal, setShowForgotModal] = useState(false);
    const [forgotEmail, setForgotEmail] = useState('');
    const [isResetting, setIsResetting] = useState(false);
    const navigate = useNavigate();
    const { refreshProfile } = useAuth();

    const handleLogin = async (e) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const { error } = await supabase.auth.signInWithPassword({ email, password });
            if (error) throw error;

            sileo.success({ title: 'Welcome back', description: 'Authentication successful.' });
            
            // Wait for profile refresh if available
            if (typeof refreshProfile === 'function') {
                await refreshProfile();
            }
            
            // Navigate to root as specified in AuthenticatedApp.jsx
            navigate('/');
        } catch (error) {
            sileo.error({ title: 'Login Failed', description: error.message });
        } finally {
            setIsLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        try {
            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: window.location.origin,
                    queryParams: {
                        prompt: 'select_account'
                    }
                }
            });
            if (error) throw error;
        } catch (error) {
            sileo.error({ title: 'Google Login Failed', description: error.message });
        }
    };

    const handleResetRequest = async (e) => {
        e.preventDefault();
        if (!forgotEmail) return;
        setIsResetting(true);

        try {
            const { error } = await supabase.auth.resetPasswordForEmail(forgotEmail, {
                redirectTo: `${window.location.origin}/reset-password`,
            });
            if (error) throw error;

            sileo.success({ 
                title: 'Reset Link Sent', 
                description: 'Please check your email (including spam) for the verification link.' 
            });
            setShowForgotModal(false);
        } catch (error) {
            sileo.error({ title: 'Request Failed', description: error.message });
        } finally {
            setIsResetting(false);
        }
    };

    return (
        <div className="h-screen grid lg:grid-cols-2 font-sans bg-white overflow-hidden">
            {/* Left Side: Form */}
            <div className="flex flex-col items-center justify-center px-8 py-6 lg:px-20 animate-fade-in relative">
                <div className="w-full max-w-[400px] space-y-8">
                    {/* Logo & Back Link */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-[#064e3b] text-white rounded-lg flex items-center justify-center shadow-lg transform -rotate-3">
                                <QrCode className="w-6 h-6" />
                            </div>
                            <h1 className="text-2xl font-serif font-black text-[#064e3b] tracking-tight">AssetLink</h1>
                        </div>
                        <a 
                            href={import.meta.env.VITE_LANDING_PAGE_URL || "http://localhost:3000"} 
                            className="text-xs font-bold text-gray-400 hover:text-[#064e3b] transition-colors flex items-center gap-1.5 uppercase tracking-widest group"
                        >
                            <ChevronRight className="w-3 h-3 rotate-180 group-hover:-translate-x-0.5 transition-transform" />
                            Back to website
                        </a>
                    </div>

                    <div className="space-y-2">
                        <h2 className="text-4xl font-serif font-black text-[#1a1a1a] tracking-tight">Log in</h2>
                        <p className="text-muted-foreground font-medium">Welcome back! Please enter your details.</p>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-6">
                        <div className="space-y-2">
                            <Label className="text-sm font-bold text-[#1a1a1a] ml-1">Email</Label>
                            <Input 
                                type="email" 
                                placeholder="naphiera@gmail.com" 
                                className="h-12 border-gray-200 rounded-xl px-4 focus-visible:ring-[#064e3b] text-base font-medium"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center justify-between px-1">
                                <Label className="text-sm font-bold text-[#1a1a1a]">Password</Label>
                                <button 
                                    type="button" 
                                    onClick={() => setShowForgotModal(true)}
                                    className="text-xs font-bold text-[#064e3b] hover:underline uppercase tracking-wider"
                                >
                                    Forgot password
                                </button>
                            </div>
                            <div className="relative">
                                <Input 
                                    type={showPassword ? "text" : "password"} 
                                    placeholder="••••••••" 
                                    className="h-12 border-gray-200 rounded-xl px-4 focus-visible:ring-[#064e3b] pr-12 text-base font-medium"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                                <button 
                                    type="button" 
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>

                        <div className="flex items-center space-x-2 ml-1">
                            <input 
                                type="checkbox"
                                id="remember" 
                                className="h-4 w-4 rounded border-gray-300 text-[#064e3b] focus:ring-[#064e3b] accent-[#064e3b]" 
                            />
                            <label htmlFor="remember" className="text-sm font-medium text-gray-500 leading-none cursor-pointer">
                                Remember for 30 days
                            </label>
                        </div>

                        <div className="space-y-4 pt-2">
                            <Button 
                                type="submit" 
                                disabled={isLoading}
                                className="w-full h-11 bg-[#8eb2a6] hover:bg-[#7da195] text-white rounded-xl font-bold transition-all text-base shadow-sm active:scale-[0.98]"
                            >
                                {isLoading ? "Signing in..." : "Sign in"}
                            </Button>

                            <Button 
                                variant="outline" 
                                type="button"
                                onClick={handleGoogleLogin}
                                className="w-full h-11 border-gray-200 rounded-xl font-bold flex items-center justify-center gap-3 text-gray-700 hover:bg-gray-50 transition-all active:scale-[0.98]"
                            >
                                <svg className="w-5 h-5" viewBox="0 0 24 24">
                                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                                </svg>
                                Sign in with Google
                            </Button>
                        </div>

                        <p className="text-center text-sm font-medium text-gray-500 pt-4">
                            Don't have an account? <Link to="/register" className="text-[#064e3b] font-bold hover:underline ml-1">Sign up</Link>
                        </p>
                    </form>
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
                                <span className="text-[10px] font-black uppercase tracking-[0.4em] text-emerald-400/60">AssetLink Protocol</span>
                            </div>
                            
                            <h2 className="text-7xl font-serif font-black tracking-tight leading-[0.9] text-white">
                                School <br/> 
                                <span className="text-emerald-400 italic font-medium serif pr-2">Tracking</span> <br/>
                                Made Simple.
                            </h2>
                        </motion.div>

                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.5, duration: 1 }}
                            className="space-y-6"
                        >
                            <p className="text-emerald-50/70 text-xl leading-relaxed font-medium max-w-[440px]">
                                Keep track of all school equipment and report repairs in just a few clicks. The easiest way to manage your school's assets.
                            </p>
                            
                            <div className="grid grid-cols-2 gap-8 pt-4">
                                <div className="space-y-2">
                                    <p className="text-emerald-400 font-serif italic text-2xl">Fast.</p>
                                    <p className="text-emerald-50/40 text-[10px] font-black uppercase tracking-widest leading-relaxed">Report issues <br/>in seconds</p>
                                </div>
                                <div className="space-y-2">
                                    <p className="text-emerald-400 font-serif italic text-2xl">Easy.</p>
                                    <p className="text-emerald-50/40 text-[10px] font-black uppercase tracking-widest leading-relaxed">No complex <br/>manuals needed</p>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </div>

                {/* Subtle Brand Watermark */}
                <div className="absolute bottom-12 right-12 opacity-[0.03] pointer-events-none rotate-12 scale-150">
                    <QrCode size={300} strokeWidth={0.2} />
                </div>
            </div>

            {/* Forgot Password Modal */}
            {showForgotModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-300">
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-white rounded-[2rem] shadow-2xl w-full max-w-[440px] overflow-hidden"
                    >
                        <div className="p-8 space-y-6">
                            <div className="flex justify-between items-start">
                                <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-[#064e3b]">
                                    <Mail className="w-6 h-6" />
                                </div>
                                <button 
                                    onClick={() => setShowForgotModal(false)}
                                    className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="space-y-2">
                                <h3 className="text-2xl font-serif font-black text-gray-900">Reset your password</h3>
                                <p className="text-sm font-medium text-gray-500 leading-relaxed">
                                    No worries! Enter your institutional email and we'll send you a secure link to reset your account credentials.
                                </p>
                            </div>

                            <form onSubmit={handleResetRequest} className="space-y-4">
                                <div className="space-y-1.5">
                                    <Label className="text-xs font-bold text-gray-700 ml-1">Account Email</Label>
                                    <Input 
                                        type="email" 
                                        placeholder="Enter your email" 
                                        className="h-12 border-gray-200 rounded-xl px-4 focus-visible:ring-[#064e3b]"
                                        value={forgotEmail}
                                        onChange={(e) => setForgotEmail(e.target.value)}
                                        required
                                    />
                                </div>
                                <Button 
                                    disabled={isResetting}
                                    className="w-full h-12 bg-[#064e3b] hover:bg-[#053e2f] text-white rounded-xl font-bold transition-all text-base shadow-lg shadow-emerald-900/10"
                                >
                                    {isResetting ? "Sending..." : "Send Reset Link"}
                                </Button>
                            </form>
                        </div>
                    </motion.div>
                </div>
            )}
        </div>
    );
}
