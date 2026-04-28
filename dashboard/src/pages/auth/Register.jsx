import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
    QrCode, Eye, EyeOff, CheckCircle2, ChevronRight, 
    UserCircle, School, Wrench, Camera, Shield, Mail, Lock, ChevronDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { sileo } from "sileo";
import { supabase } from '@/lib/supabase';

export default function Register() {
    const [currentStep, setCurrentStep] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const navigate = useNavigate();
    
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        role: 'teacher',
        employeeId: '',
        department: ''
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
                description: 'Registration successful. You can now log in.'
            });

            navigate('/login');
        } catch (error) {
            sileo.error({
                title: 'Registration Failed',
                description: error.message
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="h-screen grid lg:grid-cols-2 font-sans bg-white overflow-hidden">
            {/* Left Side: Form */}
            <div className="flex flex-col items-center justify-center px-8 py-10 lg:px-20 animate-fade-in relative overflow-y-auto">
                <div className="w-full max-w-[440px] space-y-8">
                    {/* Logo & Back Link - EXACT MATCH with Login.jsx */}
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
                        <h2 className="text-4xl font-serif font-black text-[#1a1a1a] tracking-tight">Create account</h2>
                        <p className="text-muted-foreground font-medium">Join the asset management network.</p>
                    </div>

                    {/* Progress Indicator */}
                    <div className="flex gap-2 h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                        <motion.div 
                            className="h-full bg-[#064e3b] rounded-full"
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
                                        <Label className="text-sm font-bold text-[#1a1a1a] ml-1">Primary Role</Label>
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
                                                        ? 'border-[#064e3b] bg-emerald-50/30' 
                                                        : 'border-gray-100 bg-white hover:border-emerald-200'
                                                    }`}
                                                >
                                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center mr-4 transition-all ${
                                                        formData.role === role.id ? 'bg-[#064e3b] text-white shadow-lg' : 'bg-gray-50 text-gray-400'
                                                    }`}>
                                                        <role.icon className="w-6 h-6" />
                                                    </div>
                                                    <div className="flex-1">
                                                        <p className={`font-bold ${formData.role === role.id ? 'text-[#064e3b]' : 'text-gray-900'}`}>{role.label}</p>
                                                        <p className="text-xs text-gray-500 font-medium">{role.desc}</p>
                                                    </div>
                                                    {formData.role === role.id && (
                                                        <CheckCircle2 size={18} className="text-[#064e3b]" />
                                                    )}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label className="text-sm font-bold text-[#1a1a1a] ml-1">Employee ID</Label>
                                            <Input 
                                                placeholder="ID Number" 
                                                className="h-12 border-gray-200 rounded-xl px-4 focus-visible:ring-[#064e3b] font-medium"
                                                value={formData.employeeId}
                                                onChange={e => setFormData({...formData, employeeId: e.target.value})}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-sm font-bold text-[#1a1a1a] ml-1">Department</Label>
                                            <div className="relative group">
                                                <select 
                                                    className="flex h-12 w-full border border-gray-200 bg-white px-4 py-2 text-base font-medium focus:ring-2 focus:ring-[#064e3b] focus:border-transparent outline-none rounded-xl appearance-none cursor-pointer transition-all pr-10 hover:border-gray-300 shadow-sm"
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
                                                </select>
                                                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none group-hover:text-[#064e3b] transition-colors" />
                                            </div>
                                        </div>
                                    </div>

                                    <Button 
                                        type="button" 
                                        onClick={handleNext}
                                        className="w-full h-11 bg-[#8eb2a6] hover:bg-[#7da195] text-white rounded-xl font-bold transition-all shadow-sm active:scale-[0.98] gap-2"
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
                                        <Label className="text-sm font-bold text-[#1a1a1a] ml-1">Personal Details</Label>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Input 
                                                    placeholder="First Name" 
                                                    className="h-12 border-gray-200 rounded-xl px-4 focus-visible:ring-[#064e3b] font-medium"
                                                    value={formData.firstName}
                                                    onChange={e => setFormData({...formData, firstName: e.target.value})}
                                                    required
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Input 
                                                    placeholder="Last Name" 
                                                    className="h-12 border-gray-200 rounded-xl px-4 focus-visible:ring-[#064e3b] font-medium"
                                                    value={formData.lastName}
                                                    onChange={e => setFormData({...formData, lastName: e.target.value})}
                                                    required
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="text-sm font-bold text-[#1a1a1a] ml-1">Email</Label>
                                        <div className="relative">
                                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                            <Input 
                                                type="email" 
                                                placeholder="email@school.edu.ph" 
                                                className="h-12 border-gray-200 rounded-xl pl-11 pr-4 focus-visible:ring-[#064e3b] font-medium"
                                                value={formData.email}
                                                onChange={e => setFormData({...formData, email: e.target.value})}
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="text-sm font-bold text-[#1a1a1a] ml-1">Password</Label>
                                        <div className="relative">
                                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                            <Input 
                                                type={showPassword ? "text" : "password"} 
                                                placeholder="••••••••" 
                                                className="h-12 border-gray-200 rounded-xl pl-11 pr-12 focus-visible:ring-[#064e3b] font-medium"
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
                                            className="h-11 px-6 border-gray-200 rounded-xl font-bold hover:bg-gray-50 transition-all"
                                        >
                                            Back
                                        </Button>
                                        <Button 
                                            type="submit" 
                                            disabled={isLoading}
                                            className="flex-1 h-11 bg-[#8eb2a6] hover:bg-[#7da195] text-white rounded-xl font-bold transition-all shadow-sm active:scale-[0.98]"
                                        >
                                            {isLoading ? "Creating..." : "Sign up"}
                                        </Button>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <p className="text-center text-sm font-medium text-gray-500 pt-4">
                            Already have an account? <Link to="/login" className="text-[#064e3b] font-bold hover:underline ml-1">Sign in</Link>
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
