import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import {
    LayoutDashboard, History, ShieldAlert,
    Settings, LogOut, Wrench
} from "lucide-react";
import ugLogo from "@/assets/ug-logo.png";
import { Button } from "@/components/ui/button";
import DeveloperCredit from "@/components/DeveloperCredit";

const MaintenanceLayout = () => {
    const location = useLocation();
    const navigate = useNavigate();

    const techName = sessionStorage.getItem("tech_name") || "Technician";
    const techInitials = techName.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();

    const navItems = [
        { label: "Tasks", icon: LayoutDashboard, path: "/maintenance" },
        { label: "History", icon: History, path: "/maintenance/history" },
    ];

    const activePath = (path: string) => location.pathname === path;

    const handleLogout = () => {
        sessionStorage.removeItem("tech_auth");
        sessionStorage.removeItem("tech_name");
        sessionStorage.removeItem("tech_id");
        sessionStorage.removeItem("tech_zone");
        navigate("/tech-login", { replace: true });
    };

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
            {/* Sidebar Desktop */}
            <aside className="hidden md:flex w-72 bg-[#1A365D] text-white flex-col h-screen sticky top-0">
                <div className="p-8 border-b border-white/10 flex items-center gap-4">
                    <div className="w-12 h-12 bg-white/10 rounded-xl p-2.5 backdrop-blur-sm border border-white/20 shadow-xl">
                        <img src={ugLogo} alt="UG Logo" className="w-full h-full object-contain brightness-110" />
                    </div>
                    <div>
                        <h1 className="text-xl font-black tracking-tighter text-white uppercase">Campus Glow</h1>
                        <p className="text-[9px] font-black uppercase tracking-[0.2em] text-white/50">Maintenance Team Portal</p>
                    </div>
                </div>

                <nav className="flex-1 p-6 space-y-3 mt-4">
                    <p className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-4 pl-4">Primary Navigation</p>
                    {navItems.map((item) => (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={`flex items-center gap-4 px-6 py-4 rounded-xl text-sm font-bold transition-all ${activePath(item.path)
                                ? "bg-white text-[#1A365D] shadow-xl translate-x-1"
                                : "text-white/70 hover:bg-white/5 hover:text-white"
                                }`}
                        >
                            <item.icon className={`w-5 h-5 ${activePath(item.path) ? "text-[#1A365D]" : "text-white/40"}`} />
                            {item.label}
                            {activePath(item.path) && (
                                <div className="ml-auto w-1.5 h-1.5 bg-[#1A365D] rounded-full" />
                            )}
                        </Link>
                    ))}
                </nav>

                <div className="mt-auto p-6 space-y-4 border-t border-white/10">
                    <div className="flex items-center gap-3 px-4 py-3 bg-white/5 rounded-xl border border-white/10">
                        <div className="w-10 h-10 bg-success/20 rounded-full flex items-center justify-center border border-success/30">
                            <span className="text-xs font-black text-success">{techInitials}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-xs font-black truncate">{techName}</p>
                            <p className="text-[10px] text-white/40 font-bold">Field Technician</p>
                        </div>
                    </div>
                    <Button
                        variant="ghost"
                        className="w-full justify-start text-white/60 hover:text-white hover:bg-white/10 rounded-xl px-6 py-5 gap-4"
                        onClick={handleLogout}
                    >
                        <LogOut className="w-4 h-4" />
                        <span className="text-sm font-bold">Logout</span>
                    </Button>
                </div>
            </aside>

            {/* Mobile Top Header */}
            <header className="md:hidden bg-[#1A365D] text-white p-3 px-4 flex items-center justify-between sticky top-0 z-50 border-b border-white/10">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-white/10 rounded-lg p-1.5 flex items-center justify-center">
                        <img src={ugLogo} alt="UG Logo" className="w-full h-full object-contain" />
                    </div>
                    <h1 className="text-xs font-black tracking-tight uppercase">Portal</h1>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-7 h-7 bg-success/30 rounded-full flex items-center justify-center text-[9px] font-black border border-success/50">{techInitials}</div>
                </div>
            </header>

            {/* Main Content Area */}
            <main className="flex-1 p-6 md:p-12 overflow-y-auto max-w-6xl mx-auto w-full flex flex-col">
                <div className="flex-1">
                    <Outlet />
                </div>
                <footer className="border-t py-8 text-center text-xs text-muted-foreground mt-12">
                    University of Ghana, Legon — Campus Glow © {new Date().getFullYear()}
                    <DeveloperCredit />
                </footer>
            </main>

            {/* Mobile Bottom Navigation */}
            <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-2 py-2 flex justify-around items-center z-50">
                {navItems.map((item) => (
                    <Link
                        key={item.path}
                        to={item.path}
                        className={`flex flex-col items-center gap-1.5 px-6 py-2.5 rounded-xl transition-all ${activePath(item.path)
                            ? "text-[#1A365D]"
                            : "text-slate-400"
                            }`}
                    >
                        <item.icon className="w-6 h-6" />
                        <span className="text-[10px] font-black uppercase tracking-widest">{item.label}</span>
                    </Link>
                ))}
                <button
                    onClick={handleLogout}
                    className="flex flex-col items-center gap-1.5 px-6 py-2.5 rounded-xl text-slate-400"
                >
                    <LogOut className="w-6 h-6" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Logout</span>
                </button>
            </nav>
            {/* Spacer for bottom nav on mobile */}
            <div className="h-20 md:hidden" />
        </div>
    );
};

export default MaintenanceLayout;
