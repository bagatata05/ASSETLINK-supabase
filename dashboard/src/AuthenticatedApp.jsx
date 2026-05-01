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

// Shared Pages
import Profile from './pages/shared/Profile';

// Dashboards
import DashboardTeacher from './pages/teacher/Dashboard';
import DashboardMaintenance from './pages/maintenance/Dashboard';
import DashboardPrincipal from './pages/principal/Dashboard';
import UserApprovals from './pages/principal/UserApprovals';

// Admin/System Pages
import Assets from './pages/admin/Assets';
import Analytics from './pages/admin/Analytics';
import Schools from './pages/admin/Schools';

// Repair & Damage Pages
import RepairRequestsTeacher from './pages/teacher/RepairRequests';
import ReportDamage from './pages/teacher/ReportDamage';
import RepairRequestsPrincipal from './pages/principal/RepairRequests';

// Maintenance Pages
import Tasks from './pages/maintenance/Tasks';
import MaintenanceCalendar from './pages/maintenance/MaintenanceCalendar';

// Supervisor Pages
import DashboardSupervisor from './pages/supervisor/Dashboard';
import SupervisorOversight from './pages/supervisor/SupervisorOversight';

// Public Pages
import AssetPublic from './pages/public/AssetPublic';

// UI Components
import { Button } from '@/components/ui/button';
import { Shield } from 'lucide-react';

const AuthenticatedApp = () => {
    const { currentUser, isLoadingAuth, logout } = useAuth();
    const role = currentUser?.role;

    // ✅ 1. ALWAYS wait for auth to resolve
    if (isLoadingAuth) {
        return (
            <div className="fixed inset-0 flex items-center justify-center bg-background">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-10 h-10 border-4 border-emerald-500/20 border-t-emerald-600 rounded-full animate-spin"></div>
                    <p className="text-sm font-medium text-muted-foreground animate-pulse">
                        Authenticating...
                    </p>
                </div>
            </div>
        );
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
        return (
            <div className="fixed inset-0 flex items-center justify-center bg-background">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-10 h-10 border-4 border-blue-500/20 border-t-blue-600 rounded-full animate-spin"></div>
                    <p className="text-sm text-muted-foreground">Loading profile...</p>
                </div>
            </div>
        );
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
    if (currentUser && role && currentUser.status === 'pending' && role !== 'principal' && role !== 'admin') {
        return (
            <div className="h-screen flex flex-col items-center justify-center bg-white p-8 text-center font-sans">
                <div className="w-full max-w-[440px] space-y-8 animate-fade-in">
                    <div className="w-20 h-20 bg-emerald-50 text-[#064e3b] rounded-[2rem] flex items-center justify-center mx-auto shadow-xl shadow-emerald-900/5 rotate-3">
                        <Shield className="w-10 h-10" />
                    </div>
                    
                    <div className="space-y-3">
                        <h1 className="text-4xl font-serif font-black text-gray-900 tracking-tight">Account Pending.</h1>
                        <p className="text-gray-500 font-medium text-lg leading-relaxed">
                            Your account is currently being reviewed by the Principal. We'll grant you access once your details are verified.
                        </p>
                    </div>

                    <div className="p-6 bg-gray-50 rounded-2xl border border-gray-100 space-y-4">
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">Role</span>
                            <span className="text-[#064e3b] font-black uppercase tracking-wider">{role}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">Status</span>
                            <span className="bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">Awaiting Admin</span>
                        </div>
                    </div>

                    <Button 
                        variant="ghost" 
                        onClick={logout}
                        className="text-gray-400 hover:text-red-500 font-bold uppercase tracking-widest text-[10px]"
                    >
                        Sign out and try again later
                    </Button>
                </div>
            </div>
        );
    }

    // ✅ 6. NORMAL APP FLOW
    const renderDashboard = () => {
        if (role === 'maintenance') return <DashboardMaintenance />;
        if (role === 'principal' || role === 'admin') return <DashboardPrincipal />;
        if (role === 'supervisor') return <DashboardSupervisor />;
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
                <Route path="/repair-requests" element={renderRepairRequests()} />
                <Route path="/report-damage" element={<ReportDamage />} />
                <Route path="/tasks" element={<Tasks />} />
                <Route path="/analytics" element={<Analytics />} />
                <Route path="/calendar" element={<MaintenanceCalendar />} />
                <Route path="/schools" element={<Schools />} />
                <Route path="/user-approvals" element={<UserApprovals />} />
                <Route path="/asset-view" element={<AssetPublic />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="*" element={<PageNotFound />} />
            </Route>
        </Routes>
    );
};

export default AuthenticatedApp;