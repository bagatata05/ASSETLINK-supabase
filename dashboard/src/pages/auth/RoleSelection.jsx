import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    UserCircle, Wrench, ChevronRight, QrCode, 
    CheckCircle2, Mail, Phone, Hash, ChevronDown, ArrowLeft
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/AuthContext';
import { sileo } from 'sileo';

export default function RoleSelection() {
    const { currentUser, refreshProfile } = useAuth();
    const [currentStep, setCurrentStep] = useState(1);
    const [selectedRole, setSelectedRole] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    
    const [details, setDetails] = useState({
        employeeId: '',
        department: '',
        specialization: '',
        phone: ''
    });

    const roles = [
        { 
            id: 'teacher', 
            label: 'Teacher', 
            desc: 'Report damages and track school assets.', 
            icon: UserCircle
        },
        { 
            id: 'maintenance', 
            label: 'Maintenance', 
            desc: 'Receive tasks and resolve repair requests.', 
            icon: Wrench
        }
    ];

    const handleNextStep = () => {
        if (!selectedRole) return;
        setCurrentStep(2);
    };

    const handleBackStep = () => {
        setCurrentStep(1);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);

        try {
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
                    employee_id: details.employeeId,
                    department: selectedRole === 'teacher' ? details.department : null,
                    specialization: selectedRole === 'maintenance' ? details.specialization : null,
                    phone_number: details.phone,
                    status: 'pending', // 🔒 Wait for admin approval
                    updated_at: new Date().toISOString()
                });

            if (error) {
                if (error.code === '23505') {
                    throw new Error('This Employee ID is already registered. Please use your own ID or contact the admin.');
                }
                throw error;
            }

            sileo.success({ title: 'Profile Updated', description: 'Your request has been sent for admin approval.' });
            if (refreshProfile) await refreshProfile();
        } catch (error) {
            console.error('RoleSelection error:', error);
            sileo.error({ 
                title: 'Submission Failed', 
                description: error.message || 'Could not save your details.' 
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="h-screen grid lg:grid-cols-2 bg-background selection:bg-emerald-100/30 overflow-hidden transition-colors duration-300">
            {/* Left Side: Multi-Step Form */}
            <div className="flex flex-col items-center justify-center px-8 py-6 lg:px-20 animate-fade-in relative overflow-y-auto">
                <div className="w-full max-w-[480px] space-y-8">
                    {/* Logo */}
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-emerald-900 dark:bg-emerald-800 text-white rounded-lg flex items-center justify-center shadow-lg transform rotate-3 transition-colors">
                            <QrCode className="w-6 h-6" />
                        </div>
                        <h1 className="text-2xl font-serif font-black text-emerald-900 dark:text-emerald-400 tracking-tight transition-colors">AssetLink</h1>
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

                    <AnimatePresence mode="wait">
                        {currentStep === 1 ? (
                            <motion.div 
                                key="step1"
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                className="space-y-8"
                            >
                                <div className="space-y-3">
                                    <h2 className="text-4xl font-serif font-black text-foreground tracking-tight leading-tight transition-colors">
                                        Choose your <span className="text-emerald-700 dark:text-emerald-400 italic underline decoration-emerald-200">role.</span>
                                    </h2>
                                    <p className="text-muted-foreground font-medium text-lg">
                                        Select your primary role to configure your permissions and dashboard.
                                    </p>
                                </div>

                                <div className="grid gap-4">
                                    {roles.map((role) => (
                                        <button
                                            key={role.id}
                                            onClick={() => setSelectedRole(role.id)}
                                            className={`group flex items-center p-4 rounded-2xl border-2 transition-all duration-300 text-left ${
                                                selectedRole === role.id 
                                                ? 'border-emerald-600 dark:border-emerald-500 bg-emerald-50/30 dark:bg-emerald-500/10 ring-4 ring-emerald-500/5' 
                                                : 'border-border bg-card hover:border-emerald-200 hover:bg-muted/50'
                                            }`}
                                        >
                                            <div className={`w-14 h-14 rounded-xl flex items-center justify-center mr-5 transition-all ${
                                                selectedRole === role.id ? 'bg-emerald-700 dark:bg-emerald-600 text-white shadow-lg' : 'bg-muted text-muted-foreground'
                                            }`}>
                                                <role.icon className="w-8 h-8" />
                                            </div>
                                            <div className="flex-1">
                                                <p className={`text-lg font-bold transition-colors ${selectedRole === role.id ? 'text-emerald-700 dark:text-emerald-400' : 'text-foreground'}`}>{role.label}</p>
                                                <p className="text-sm text-muted-foreground font-medium">{role.desc}</p>
                                            </div>
                                            {selectedRole === role.id && (
                                                <div className="w-6 h-6 bg-emerald-600 dark:bg-emerald-500 text-white rounded-full flex items-center justify-center shadow-md transition-all">
                                                    <CheckCircle2 size={14} />
                                                </div>
                                            )}
                                        </button>
                                    ))}
                                </div>

                                <Button 
                                    onClick={handleNextStep}
                                    disabled={!selectedRole}
                                    className="w-full h-12 bg-emerald-700 hover:bg-emerald-600 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white rounded-xl gap-3 font-bold text-lg shadow-xl shadow-emerald-900/10 transition-all active:scale-[0.98]"
                                >
                                    Next Step <ChevronRight className="w-5 h-5" />
                                </Button>
                            </motion.div>
                        ) : (
                            <motion.form 
                                key="step2"
                                onSubmit={handleSubmit}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-6"
                            >
                                <div className="space-y-3">
                                    <button 
                                        type="button" 
                                        onClick={handleBackStep}
                                        className="flex items-center gap-2 text-sm font-bold text-emerald-700 dark:text-emerald-400 hover:opacity-70 transition-opacity uppercase tracking-widest"
                                    >
                                        <ArrowLeft size={14} /> Back to roles
                                    </button>
                                    <h2 className="text-4xl font-serif font-black text-foreground tracking-tight leading-tight transition-colors">
                                        Professional <span className="text-emerald-700 dark:text-emerald-400 italic underline decoration-emerald-200">Details.</span>
                                    </h2>
                                    <p className="text-muted-foreground font-medium">Please provide your school credentials to continue.</p>
                                </div>

                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label className="text-sm font-bold text-foreground/80 ml-1 transition-colors">Employee ID</Label>
                                        <div className="relative">
                                            <Hash className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                            <Input 
                                                placeholder="Enter your ID Number" 
                                                className="h-12 bg-card border-border rounded-xl pl-11 focus-visible:ring-emerald-600 font-medium shadow-sm transition-all"
                                                value={details.employeeId}
                                                onChange={e => setDetails({...details, employeeId: e.target.value})}
                                                required
                                            />
                                        </div>
                                    </div>

                                    {selectedRole === 'teacher' ? (
                                        <div className="space-y-2">
                                            <Label className="text-sm font-bold text-foreground/80 ml-1 transition-colors">Department</Label>
                                            <div className="relative group">
                                                <select 
                                                    className="flex h-12 w-full border border-border bg-card px-4 py-2 text-base font-medium focus:ring-2 focus:ring-emerald-600 focus:border-transparent outline-none rounded-xl appearance-none cursor-pointer transition-all pr-10 hover:border-emerald-500/50 shadow-sm"
                                                    value={details.department}
                                                    onChange={e => setDetails({...details, department: e.target.value})}
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
                                                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none group-hover:text-[#064e3b] transition-colors" />
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="space-y-2">
                                            <Label className="text-sm font-bold text-foreground/80 ml-1 transition-colors">Specialization</Label>
                                            <Input 
                                                placeholder="e.g. Electrical, Plumbing, IT" 
                                                className="h-12 bg-card border-border rounded-xl px-4 focus-visible:ring-emerald-600 font-medium shadow-sm transition-all"
                                                value={details.specialization}
                                                onChange={e => setDetails({...details, specialization: e.target.value})}
                                                required
                                            />
                                        </div>
                                    )}

                                    <div className="space-y-2">
                                        <Label className="text-sm font-bold text-foreground/80 ml-1 transition-colors">Phone Number</Label>
                                        <div className="relative">
                                            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                            <Input 
                                                type="tel"
                                                placeholder="09XX XXX XXXX" 
                                                className="h-12 bg-card border-border rounded-xl pl-11 focus-visible:ring-emerald-600 font-medium shadow-sm transition-all"
                                                value={details.phone}
                                                onChange={e => setDetails({...details, phone: e.target.value})}
                                                required
                                            />
                                        </div>
                                    </div>
                                </div>

                                <Button 
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-full h-12 bg-emerald-700 hover:bg-emerald-600 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white rounded-xl gap-3 font-bold text-lg shadow-xl shadow-emerald-900/10 transition-all active:scale-[0.98]"
                                >
                                    {isLoading ? 'Saving Details...' : 'Initialize Dashboard'} <ChevronRight className="w-5 h-5" />
                                </Button>
                            </motion.form>
                        )}
                    </AnimatePresence>

                    <div className="pt-4 text-center border-t border-border">
                        <button 
                            onClick={() => {
                                supabase.auth.signOut();
                                window.location.href = '/login';
                            }}
                            className="text-xs font-bold text-muted-foreground hover:text-red-500 uppercase tracking-widest transition-colors"
                        >
                            Sign out and switch account
                        </button>
                    </div>
                </div>
            </div>

            {/* Right Side: Brand Panel */}
            <div className="hidden lg:flex flex-col items-center justify-center bg-[#064e3b] p-12 text-white relative overflow-hidden">
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
                        </motion.div>
                    </div>
                </div>

                <div className="absolute top-12 right-12 opacity-[0.03] pointer-events-none -rotate-12 scale-150">
                    <QrCode size={300} strokeWidth={0.2} />
                </div>
            </div>
        </div>
    );
}
