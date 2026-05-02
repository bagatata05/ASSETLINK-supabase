import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
    QrCode, Eye, EyeOff, CheckCircle2, ChevronRight, 
    UserCircle, School, Wrench, Camera, Shield, Mail, Lock, ChevronDown, Phone
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { sileo } from "sileo";
import { supabase } from '@/lib/supabase';

export default function Register() {
    const [currentStep, setCurrentStep] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const navigate = useNavigate();
    
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        role: 'teacher',
        employeeId: '',
        department: '',
        phone: ''
    });

    const handleNext = () => setCurrentStep(2);
    const handleBack = () => setCurrentStep(1);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            // 1. Auth Sign Up
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email: formData.email,
                password: formData.password,
                options: {
                    data: {
                        full_name: `${formData.firstName} ${formData.lastName}`.trim(),
                    }
                }
            });

            if (authError) throw authError;

            // 2. Profile Creation
            const { error: profileError } = await supabase
                .from('profiles')
                .insert([{
                    id: authData.user.id,
                    full_name: `${formData.firstName} ${formData.lastName}`.trim(),
                    email: formData.email,
                    role: formData.role,
                    employee_id: formData.employeeId,
                    department: formData.department,
                    phone_number: formData.phone,
                    status: 'pending', // 🔒 Admin approval required
                    updated_at: new Date().toISOString()
                }]);

            if (profileError) {
                // 🔥 Handle Duplicate Employee ID (Postgres Error 23505)
                if (profileError.code === '23505') {
                    throw new Error('This Employee ID is already registered. Please use your own ID or contact the admin.');
                }
                throw profileError;
            }

            sileo.success({
                title: 'Account Created',
                description: 'Registration successful. Awaiting administrator approval.'
            });

            setIsSuccess(true);
        } catch (error) {
            sileo.error({
                title: 'Registration Failed',
                description: error.message
            });
        } finally {
            setIsLoading(false);
        }
    };

    if (isSuccess) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-background p-8 font-sans relative transition-colors duration-300">
                {/* Background Decorations */}
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-500/10 rounded-full blur-[100px] -z-10" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/10 rounded-full blur-[100px] -z-10" />

                <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="w-full max-w-md text-center space-y-8 relative z-10"
                >
                    <div className="relative inline-block">
                        <div className="w-24 h-24 bg-emerald-900 dark:bg-emerald-800 rounded-3xl flex items-center justify-center shadow-2xl shadow-emerald-500/20 transform -rotate-6 mx-auto">
                            <CheckCircle2 className="w-12 h-12 text-white" />
                        </div>
                        <motion.div 
                            animate={{ scale: [1, 1.2, 1] }}
                            transition={{ repeat: Infinity, duration: 2 }}
                            className="absolute -top-2 -right-2 w-8 h-8 bg-emerald-500 rounded-full border-4 border-background flex items-center justify-center"
                        >
                            <Shield className="w-4 h-4 text-white" />
                        </motion.div>
                    </div>

                    <div className="space-y-3">
                        <h2 className="text-4xl font-serif font-black text-foreground tracking-tight">
                            Registration <span className="text-emerald-700 dark:text-emerald-400 italic underline decoration-emerald-500/30">Sent.</span>
                        </h2>
                        <p className="text-muted-foreground font-medium text-lg leading-relaxed">
                            Your account is now <span className="text-emerald-700 dark:text-emerald-400 font-bold">Awaiting Admin Approval</span>. 
                            Please wait for the principal to verify your credentials.
                        </p>
                    </div>

                    <div className="p-6 bg-emerald-500/10 rounded-2xl border border-emerald-500/20 flex items-start gap-4 text-left">
                        <div className="w-10 h-10 bg-card rounded-xl shadow-sm flex items-center justify-center shrink-0">
                            <Mail className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-widest mb-1">Next Steps</p>
                            <p className="text-sm text-emerald-700/80 dark:text-emerald-400/80 font-medium">
                                We'll notify you via email once your account is activated. This usually takes less than 24 hours.
                            </p>
                        </div>
                    </div>

                    <Button 
                        onClick={() => navigate('/login')}
                        variant="outline"
                        className="h-12 px-8 border-border bg-card rounded-xl font-bold hover:bg-muted transition-all gap-2"
                    >
                        Back to Login
                    </Button>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-screen grid lg:grid-cols-2 font-sans bg-background">
            {/* Left Side: Form */}
            <div className="flex flex-col items-center justify-center px-8 py-10 lg:px-20 animate-fade-in relative">
                <div className="w-full max-w-[440px] space-y-8">
                    {/* Logo & Back Link - EXACT MATCH with Login.jsx */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-emerald-900 dark:bg-emerald-800 text-white rounded-lg flex items-center justify-center shadow-lg transform -rotate-3">
                                <QrCode className="w-6 h-6" />
                            </div>
                            <h1 className="text-2xl font-serif font-black text-emerald-900 dark:text-emerald-400 tracking-tight">AssetLink</h1>
                        </div>
                        <a 
                            href={import.meta.env.VITE_LANDING_PAGE_URL || "http://localhost:3000"} 
                            className="text-xs font-bold text-muted-foreground/60 hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors flex items-center gap-1.5 uppercase tracking-widest group"
                        >
                            <ChevronRight className="w-3 h-3 rotate-180 group-hover:-translate-x-0.5 transition-transform" />
                            Back to website
                        </a>
                    </div>

                    <div className="space-y-2">
                        <h2 className="text-4xl font-serif font-black text-foreground tracking-tight">Create account</h2>
                        <p className="text-muted-foreground font-medium">Join the asset management network.</p>
                    </div>

                    {/* Progress Indicator */}
                    <div className="flex gap-2 h-1.5 w-full bg-muted rounded-full overflow-hidden">
                        <motion.div 
                            className="h-full bg-emerald-700 dark:bg-emerald-500 rounded-full"
                            initial={{ width: "50%" }}
                            animate={{ width: currentStep === 1 ? "50%" : "100%" }}
                            transition={{ duration: 0.5, ease: "circOut" }}
                        />
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <AnimatePresence mode="wait">
                            {currentStep === 1 ? (
                                <motion.div 
                                    key="step1"
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 20 }}
                                    className="space-y-6"
                                >
                                    <div className="space-y-3">
                                        <Label className="text-sm font-bold text-foreground ml-1">Primary Role</Label>
                                        <div className="grid gap-3">
                                            {[
                                                { id: 'teacher', label: 'Teacher', desc: 'Report damages & track school assets.', icon: UserCircle },
                                                { id: 'maintenance', label: 'Maintenance', desc: 'Receive tasks and resolve repair requests.', icon: Wrench }
                                            ].map((role) => (
                                                <button
                                                    key={role.id}
                                                    type="button"
                                                    onClick={() => setFormData({...formData, role: role.id})}
                                                    className={`group flex items-center p-4 rounded-2xl border-2 transition-all duration-300 text-left ${
                                                        formData.role === role.id 
                                                        ? 'border-emerald-600 dark:border-emerald-500 bg-emerald-500/5 dark:bg-emerald-500/10' 
                                                        : 'border-border bg-card hover:border-emerald-500/30'
                                                    }`}
                                                >
                                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center mr-4 transition-all ${
                                                        formData.role === role.id ? 'bg-emerald-900 dark:bg-emerald-800 text-white shadow-lg' : 'bg-muted text-muted-foreground'
                                                    }`}>
                                                        <role.icon className="w-6 h-6" />
                                                    </div>
                                                    <div className="flex-1">
                                                        <p className={`font-bold ${formData.role === role.id ? 'text-emerald-700 dark:text-emerald-400' : 'text-foreground'}`}>{role.label}</p>
                                                        <p className="text-xs text-muted-foreground font-medium">{role.desc}</p>
                                                    </div>
                                                    {formData.role === role.id && (
                                                        <CheckCircle2 size={18} className="text-emerald-600 dark:text-emerald-400" />
                                                    )}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className={`grid ${formData.role === 'teacher' ? 'grid-cols-2' : 'grid-cols-1'} gap-4`}>
                                        <div className="space-y-2">
                                            <Label className="text-sm font-bold text-foreground ml-1">Employee ID</Label>
                                            <Input 
                                                placeholder="ID Number" 
                                                className="h-12 border-border bg-card rounded-xl px-4 focus-visible:ring-emerald-600 font-medium shadow-sm transition-all"
                                                value={formData.employeeId}
                                                onChange={e => setFormData({...formData, employeeId: e.target.value})}
                                            />
                                        </div>
                                        
                                        {formData.role === 'teacher' && (
                                            <div className="space-y-2 animate-in fade-in slide-in-from-right-4 duration-300">
                                                <Label className="text-sm font-bold text-foreground ml-1">Department</Label>
                                                <div className="relative group">
                                                    <select 
                                                        className="flex h-12 w-full border border-border bg-card px-4 py-2 text-base font-medium focus:ring-2 focus:ring-emerald-600 focus:border-transparent outline-none rounded-xl appearance-none cursor-pointer transition-all pr-10 hover:border-emerald-500/50 shadow-sm"
                                                        value={formData.department}
                                                        onChange={e => setFormData({...formData, department: e.target.value})}
                                                        required
                                                    >
                                                        <option value="" disabled>Select Dept.</option>
                                                        <option value="English">English</option>
                                                        <option value="Mathematics">Mathematics</option>
                                                        <option value="Science">Science</option>
                                                        <option value="Filipino">Filipino</option>
                                                        <option value="Araling Panlipunan">Araling Panlipunan</option>
                                                        <option value="MAPEH">MAPEH (P.E.)</option>
                                                        <option value="TLE">TLE</option>
                                                        <option value="ESP">ESP</option>
                                                        <option value="Kindergarten">Kindergarten</option>
                                                        <option value="SPED">SPED</option>
                                                        <option value="Administrative">Administrative Office</option>
                                                    </select>
                                                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60 pointer-events-none group-hover:text-emerald-600 transition-colors" />
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <Button 
                                        type="button" 
                                        onClick={handleNext}
                                        className="w-full h-11 bg-emerald-700 hover:bg-emerald-600 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white rounded-xl font-bold transition-all shadow-sm active:scale-[0.98] gap-2"
                                    >
                                        Next Step <ChevronRight className="w-4 h-4" />
                                    </Button>
                                </motion.div>
                            ) : (
                                <motion.div 
                                    key="step2"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="space-y-5"
                                >
                                    <div className="space-y-2">
                                        <Label className="text-sm font-bold text-foreground ml-1">Personal Details</Label>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Input 
                                                    placeholder="First Name" 
                                                    className="h-12 border-border bg-card rounded-xl px-4 focus-visible:ring-emerald-600 font-medium"
                                                    value={formData.firstName}
                                                    onChange={e => setFormData({...formData, firstName: e.target.value})}
                                                    required
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Input 
                                                    placeholder="Last Name" 
                                                    className="h-12 border-border bg-card rounded-xl px-4 focus-visible:ring-[#064e3b] font-medium"
                                                    value={formData.lastName}
                                                    onChange={e => setFormData({...formData, lastName: e.target.value})}
                                                    required
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="text-sm font-bold text-foreground ml-1">Email</Label>
                                        <div className="relative">
                                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60" />
                                            <Input 
                                                type="email" 
                                                placeholder="email@school.edu.ph" 
                                                className="h-12 border-border bg-card rounded-xl pl-11 pr-4 focus-visible:ring-emerald-600 font-medium"
                                                value={formData.email}
                                                onChange={e => setFormData({...formData, email: e.target.value})}
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="text-sm font-bold text-foreground ml-1">Phone Number</Label>
                                        <div className="relative">
                                            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60" />
                                            <Input 
                                                type="tel"
                                                placeholder="09XX XXX XXXX" 
                                                className="h-12 border-border bg-card rounded-xl pl-11 focus-visible:ring-emerald-600 font-medium"
                                                value={formData.phone}
                                                onChange={e => setFormData({...formData, phone: e.target.value})}
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="text-sm font-bold text-foreground ml-1">Password</Label>
                                        <div className="relative">
                                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60" />
                                            <Input 
                                                type={showPassword ? "text" : "password"} 
                                                placeholder="••••••••" 
                                                className="h-12 border-border bg-card rounded-xl pl-11 pr-12 focus-visible:ring-emerald-600 font-medium"
                                                value={formData.password}
                                                onChange={e => setFormData({...formData, password: e.target.value})}
                                                required
                                            />
                                            <button 
                                                type="button" 
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                                            >
                                                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                            </button>
                                        </div>
                                    </div>

                                    <div className="flex gap-3 pt-2">
                                        <Button 
                                            type="button" 
                                            variant="outline"
                                            onClick={handleBack}
                                            className="h-11 px-6 border-border bg-card rounded-xl font-bold hover:bg-muted transition-all"
                                        >
                                            Back
                                        </Button>
                                        <Button 
                                            type="submit" 
                                            disabled={isLoading}
                                            className="flex-1 h-11 bg-emerald-700 hover:bg-emerald-600 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white rounded-xl font-bold transition-all shadow-sm active:scale-[0.98]"
                                        >
                                            {isLoading ? "Creating..." : "Sign up"}
                                        </Button>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <p className="text-center text-sm font-medium text-muted-foreground pt-4">
                            Already have an account? <Link to="/login" className="text-emerald-700 dark:text-emerald-400 font-bold hover:underline ml-1">Sign in</Link>
                        </p>
                    </form>
                </div>
            </div>

            {/* Right Side: Typography Brand Panel */}
            <div className="hidden lg:flex flex-col items-center justify-center bg-[#064e3b] p-12 text-white relative overflow-hidden">
                {/* Dynamic Background Elements matching RoleSelection */}
                <div className="absolute inset-0 bg-gradient-to-br from-[#064e3b] via-[#053e2f] to-[#042f24]" />
                <div className="absolute inset-0 opacity-[0.03] mix-blend-overlay bg-[url('https://www.transparenttextures.com/patterns/pinstriped-suit.png')]" />
                <div className="absolute top-[-10%] left-[-10%] w-[70%] h-[70%] bg-emerald-400/10 rounded-full blur-[120px]" />
                
                <div className="w-full max-w-[540px] space-y-12 relative z-10 text-left">
                    <div className="space-y-8">
                        <motion.div 
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.8 }}
                            className="space-y-6"
                        >
                            <div className="flex items-center gap-4">
                                <div className="h-px w-12 bg-emerald-400" />
                                <span className="text-[10px] font-black uppercase tracking-[0.4em] text-emerald-400/60">Digital Inventory</span>
                            </div>
                            
                            <h2 className="text-7xl font-serif font-black tracking-tight leading-[0.9] text-white">
                                Modern <br/> 
                                <span className="text-emerald-400 italic font-medium serif pr-2">Asset</span> <br/>
                                Management.
                            </h2>
                        </motion.div>

                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.5, duration: 1 }}
                            className="space-y-6"
                        >
                            <p className="text-emerald-50/70 text-xl leading-relaxed font-medium max-w-[440px]">
                                We use words you understand. No complex jargon. Just simple tools to help you manage your school effectively.
                            </p>
                            
                            <div className="grid grid-cols-2 gap-8 pt-4">
                                <div className="space-y-2">
                                    <p className="text-emerald-400 font-serif italic text-2xl">Simple.</p>
                                    <p className="text-emerald-50/40 text-[10px] font-black uppercase tracking-widest leading-relaxed">Easy to use <br/>for everyone</p>
                                </div>
                                <div className="space-y-2">
                                    <p className="text-emerald-400 font-serif italic text-2xl">Safe.</p>
                                    <p className="text-emerald-50/40 text-[10px] font-black uppercase tracking-widest leading-relaxed">Your data <br/>is protected</p>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </div>

                {/* Subtle Brand Watermark - SYNCED WITH LOGIN.JSX */}
                <div className="absolute bottom-12 right-12 opacity-[0.03] pointer-events-none rotate-12 scale-150">
                    <QrCode size={300} strokeWidth={0.2} />
                </div>
            </div>
        </div>
    );
}
