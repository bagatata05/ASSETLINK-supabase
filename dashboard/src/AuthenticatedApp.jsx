import React from 'react';
import { Route, Routes, Navigate } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import PageNotFound from './lib/PageNotFound';

// Auth Pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import RoleSelection from './pages/auth/RoleSelection';
import ResetPassword from './pages/auth/ResetPassword';

// Layout
import Layout from './components/Layout';
import DashboardLoading from './components/DashboardLoading';
import AuthLoading from './components/AuthLoading';

// Shared Pages
import Profile from './pages/shared/Profile';
import AssetHistory from './pages/shared/AssetHistory';

// Dashboards
import DashboardTeacher from './pages/teacher/Dashboard';
import DashboardMaintenance from './pages/maintenance/Dashboard';
import DashboardPrincipal from './pages/principal/Dashboard';
import UserApprovals from './pages/principal/UserApprovals';

// Admin/System Pages
import Assets from './pages/admin/Assets';
import Analytics from './pages/admin/Analytics';


// Repair & Damage Pages
import RepairRequestsTeacher from './pages/teacher/RepairRequests';
import ReportDamage from './pages/teacher/ReportDamage';
import RepairRequestsPrincipal from './pages/principal/RepairRequests';

// Maintenance Pages
import Tasks from './pages/maintenance/Tasks';
import MaintenanceCalendar from './pages/maintenance/MaintenanceCalendar';

// Supervisor Pages

// Public Pages
import AssetPublic from './pages/public/AssetPublic';

// UI Components
import { Button } from '@/components/ui/button';
import { Shield, Clock, ShieldAlert } from 'lucide-react';
import { motion } from 'framer-motion';

const AuthenticatedApp = () => {
    const { currentUser, isLoadingAuth, logout } = useAuth();
    const role = currentUser?.role;

    // ✅ 1. ALWAYS wait for auth to resolve
    if (isLoadingAuth) {
        // If the user is at /login or /register, show the Auth skeleton
        const isAuthPage = ['/login', '/register', '/reset-password'].includes(window.location.pathname);
        return isAuthPage ? <AuthLoading /> : <DashboardLoading />;
    }

    // ✅ 2. NOT LOGGED IN → allow only auth pages
    if (!currentUser) {
        return (
            <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
        );
    }

    // ✅ 3. LOGGED IN but ROLE still loading → show loading (prevents wrong redirect)
    if (currentUser && role === 'loading') {
        return <DashboardLoading />;
    }

    // ✅ 4. ROLE STILL NOT SET (after loading) → go to role selection
    if (!role) {
        return (
            <Routes>
                <Route path="/role-selection" element={<RoleSelection />} />
                <Route path="*" element={<Navigate to="/role-selection" replace />} />
            </Routes>
        );
    }

    // ✅ 5. LOGGED IN but PENDING APPROVAL → show waiting screen
    // 💡 Note: We allow 'principal' and 'admin' roles to bypass this so they can access the approval dashboard
    if (currentUser?.status === 'pending' && role !== 'principal' && role !== 'admin') {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-background p-8 font-sans relative">
                {/* Background Decorations */}
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-50 dark:bg-emerald-500/5 rounded-full blur-[100px] -z-10" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-50 dark:bg-blue-500/5 rounded-full blur-[100px] -z-10" />

                <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="w-full max-w-md text-center space-y-8 relative z-10"
                >
                    <div className="relative inline-block">
                        <div className="w-24 h-24 bg-emerald-700 rounded-3xl flex items-center justify-center shadow-2xl shadow-emerald-200 dark:shadow-none transform -rotate-6 mx-auto">
                            <Clock className="w-12 h-12 text-white" />
                        </div>
                    </div>

                    <div className="space-y-3">
                        <h2 className="text-4xl font-serif font-black text-foreground tracking-tight">
                            Account <span className="text-emerald-700 dark:text-emerald-400 italic underline decoration-emerald-200">Pending.</span>
                        </h2>
                        <p className="text-muted-foreground font-medium text-lg leading-relaxed">
                            Hello <span className="text-emerald-700 dark:text-emerald-400 font-bold">{currentUser.full_name}</span>! 
                            Your account is currently awaiting administrator approval.
                        </p>
                    </div>

                    <div className="p-6 bg-emerald-50/50 dark:bg-emerald-500/10 rounded-2xl border border-emerald-100 dark:border-emerald-500/20 flex items-start gap-4 text-left">
                        <div className="w-10 h-10 bg-card rounded-xl shadow-sm flex items-center justify-center shrink-0">
                            <ShieldAlert className="w-5 h-5 text-emerald-700" />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-widest mb-1">Access Restricted</p>
                            <p className="text-sm text-emerald-700/80 dark:text-emerald-400/80 font-medium">
                                To ensure security, the principal must verify your employee credentials before you can access the dashboard.
                            </p>
                        </div>
                    </div>

                    <Button 
                        variant="ghost" 
                        onClick={logout}
                        className="text-muted-foreground/40 hover:text-rose-500 font-bold uppercase tracking-widest text-[10px] transition-colors"
                    >
                        Sign out and try again later
                    </Button>
                </motion.div>
            </div>
        );
    }

    // ✅ 6. NORMAL APP FLOW
    const renderDashboard = () => {
        if (role === 'maintenance') return <DashboardMaintenance />;
        if (role === 'principal' || role === 'admin') return <DashboardPrincipal />;
        return <DashboardTeacher />;
    };

    const renderRepairRequests = () => {
        if (role === 'principal' || role === 'admin') return <RepairRequestsPrincipal />;
        return <RepairRequestsTeacher />;
    };

    return (
        <Routes>
            {/* prevent going back to login/register when already logged in */}
            <Route path="/login" element={<Navigate to="/" replace />} />
            <Route path="/register" element={<Navigate to="/" replace />} />
            <Route path="/role-selection" element={<Navigate to="/" replace />} />
            <Route path="/reset-password" element={<ResetPassword />} />

            <Route element={<Layout />}>
                <Route path="/" element={renderDashboard()} />
                <Route path="/assets" element={<Assets />} />
                <Route path="/assets/:id/history" element={<AssetHistory />} />
                <Route path="/repair-requests" element={renderRepairRequests()} />
                <Route path="/report-damage" element={<ReportDamage />} />
                <Route path="/tasks" element={<Tasks />} />
                <Route path="/analytics" element={<Analytics />} />
                <Route path="/calendar" element={<MaintenanceCalendar />} />

                <Route path="/user-approvals" element={<UserApprovals />} />
                <Route path="/asset-view" element={<AssetPublic />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="*" element={<PageNotFound />} />
            </Route>
        </Routes>
    );
};

export default AuthenticatedApp;