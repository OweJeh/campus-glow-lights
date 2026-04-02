import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Lock, Eye, EyeOff, Wrench, AlertTriangle, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import ugLogo from "@/assets/ug-logo.png";
import DeveloperCredit from "@/components/DeveloperCredit";
import techBg from "@/assets/tech-bg.jpg";

const TechnicianLogin = () => {
    const navigate = useNavigate();
    const [employeeId, setEmployeeId] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    // If already authenticated, skip login
    useEffect(() => {
        if (sessionStorage.getItem("tech_auth") === "true") {
            navigate("/maintenance", { replace: true });
        }
    }, [navigate]);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!employeeId || !password) return;
        setLoading(true);
        setError("");

        try {
            const { data, error: fetchErr } = await supabase
                .from("technicians")
                .select("id, name, employee_id, password, zone")
                .eq("employee_id", employeeId.trim())
                .maybeSingle();

            if (fetchErr) throw fetchErr;

            if (!data) {
                setError("Employee ID not found. Contact your administrator.");
                setPassword("");
            } else if (data.password !== password) {
                setError("Incorrect password. Please try again.");
                setPassword("");
            } else {
                sessionStorage.setItem("tech_auth", "true");
                sessionStorage.setItem("tech_name", data.name);
                sessionStorage.setItem("tech_id", data.employee_id);
                sessionStorage.setItem("tech_zone", data.zone || "");
                toast.success(`Welcome, ${data.name}!`, {
                    className: "bg-[#1A365D] text-white border-none shadow-xl"
                });
                navigate("/maintenance", { replace: true });
            }
        } catch (err) {
            console.error(err);
            toast.error("Authentication error. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col lg:flex-row-reverse">
            {/* Image Side — Right on Desktop, Top on Mobile */}
            <div className="relative lg:w-1/2 min-h-[40vh] sm:min-h-[45vh] lg:h-auto lg:min-h-screen overflow-hidden">
                <img
                    src={techBg}
                    alt="University of Ghana Campus"
                    className="absolute inset-0 w-full h-full object-cover object-[center_top] lg:object-[65%_top]"
                />
                {/* Navy + Amber tinted Overlay */}
                <div className="absolute inset-0 bg-gradient-to-b lg:bg-gradient-to-l from-[#0f1c2e]/80 via-[#1A365D]/65 to-[#0f1c2e]/90 lg:from-[#0f1c2e]/90 lg:via-[#1A365D]/75 lg:to-[#0f1c2e]/95" />

                {/* Overlay Content */}
                <div className="relative z-10 flex flex-col justify-between h-full p-6 sm:p-8 lg:p-12">
                    <div className="lg:text-right">
                        <Link
                            to="/"
                            className="inline-flex items-center gap-1.5 text-white/50 hover:text-white/80 text-xs font-bold uppercase tracking-widest transition-colors"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Back
                        </Link>
                    </div>

                    <div className="hidden lg:block space-y-6 max-w-sm ml-auto text-right">
                        <div className="flex items-center gap-4 justify-end">
                            <div>
                                <h1 className="text-3xl font-display font-black text-white tracking-tight">Campus Glow</h1>
                                <p className="text-xs text-amber-400/60 font-bold uppercase tracking-[0.15em] mt-0.5">Maintenance Portal</p>
                            </div>
                            <div className="w-14 h-14 rounded-2xl bg-amber-500/15 border border-amber-400/20 flex items-center justify-center backdrop-blur-sm shadow-xl">
                                <img src={ugLogo} alt="UG Logo" className="w-9 h-9 object-contain" />
                            </div>
                        </div>
                        <p className="text-white/60 text-sm leading-relaxed">
                            Field technician access to the maintenance task system. Track, repair, and document streetlight infrastructure.
                        </p>
                        <div className="flex gap-3 justify-end">
                            <div className="px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-400/15 text-[10px] font-bold text-amber-300/60 uppercase tracking-widest">
                                Field Access
                            </div>
                            <div className="px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-400/15 text-[10px] font-bold text-amber-300/60 uppercase tracking-widest">
                                Technicians
                            </div>
                        </div>
                    </div>

                    {/* Mobile Branding & Title */}
                    <div className="lg:hidden animate-in fade-in slide-in-from-bottom-4 duration-700">
                        <div className="flex items-center gap-4 mb-3">
                            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center backdrop-blur-md shadow-2xl">
                                <img src={ugLogo} alt="UG Logo" className="w-7 h-7 object-contain" />
                            </div>
                            <div className="h-10 w-px bg-white/20" />
                            <div>
                                <h1 className="text-2xl font-display font-black text-white tracking-tight leading-none">Maintenance</h1>
                                <p className="text-[10px] text-amber-400/60 font-bold uppercase tracking-[0.2em] mt-1">Technician Portal</p>
                            </div>
                        </div>
                        <div className="h-1 w-12 bg-amber-500 rounded-full" />
                    </div>

                    <div className="hidden lg:block text-right">
                        <p className="text-white/25 text-[10px] font-bold uppercase tracking-[0.2em]">
                            University of Ghana · Physical Development Directorate
                        </p>
                    </div>
                </div>
            </div>

            {/* Form Side — Left on Desktop, Bottom on Mobile */}
            <div className="flex-1 bg-[#0f1c2e] flex items-center justify-center p-6 sm:p-10 lg:p-12 relative overflow-hidden -mt-6 lg:mt-0 rounded-t-3xl lg:rounded-none z-20">
                {/* Decorative Background */}
                <div className="absolute inset-0 pointer-events-none overflow-hidden">
                    {/* Amber-tinted glowing orbs */}
                    <div className="absolute -top-24 -left-24 w-80 h-80 rounded-full bg-amber-500/[0.08] blur-[80px]" />
                    <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-[#1A365D]/30 blur-[100px]" />
                    <div className="absolute top-1/3 left-1/4 w-48 h-48 rounded-full bg-amber-400/[0.05] blur-[60px]" />
                    {/* Subtle grid pattern */}
                    <div className="absolute inset-0 opacity-[0.05]" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '40px 40px' }} />
                    {/* Floating accent rings */}
                    <div className="absolute top-16 left-16 w-32 h-32 rounded-full border border-amber-400/[0.08]" />
                    <div className="absolute bottom-24 right-12 w-20 h-20 rounded-full border border-white/[0.04]" />
                    <div className="absolute top-1/2 left-8 w-12 h-12 rounded-full border border-amber-400/[0.08]" />
                </div>
                <div className="w-full max-w-sm space-y-6">
                    {/* Login Card */}
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-sm shadow-2xl space-y-5">
                        <div className="flex items-center gap-2.5">
                            <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-400/20 flex items-center justify-center">
                                <Wrench className="w-4 h-4 text-amber-400" />
                            </div>
                            <div>
                                <p className="text-sm font-bold text-white">Technician Access</p>
                                <p className="text-[10px] text-white/50">Enter your credentials to continue</p>
                            </div>
                        </div>

                        <form onSubmit={handleLogin} className="space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-white/50">
                                    Employee ID
                                </label>
                                <Input
                                    type="text"
                                    value={employeeId}
                                    onChange={e => { setEmployeeId(e.target.value); setError(""); }}
                                    placeholder="e.g. TECH-001"
                                    className="bg-white/5 border-white/10 text-white placeholder:text-white/25 focus:border-amber-400/50 focus:ring-amber-400/20"
                                    autoFocus
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-white/50">
                                    Password
                                </label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                                    <Input
                                        type={showPassword ? "text" : "password"}
                                        value={password}
                                        onChange={e => { setPassword(e.target.value); setError(""); }}
                                        placeholder="Enter your password"
                                        className="pl-9 pr-10 bg-white/5 border-white/10 text-white placeholder:text-white/25 focus:border-amber-400/50 focus:ring-amber-400/20"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(v => !v)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/75 transition-colors"
                                    >
                                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>

                            {error && (
                                <div className="flex items-center gap-2 text-[11px] text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2.5">
                                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                                    {error}
                                </div>
                            )}

                            <Button
                                type="submit"
                                disabled={loading || !employeeId || !password}
                                className="w-full bg-amber-500 hover:bg-amber-500/80 text-white font-bold h-11 rounded-xl border border-amber-400/20 shadow-lg"
                            >
                                {loading ? "Verifying..." : "Access Portal →"}
                            </Button>
                        </form>
                    </div>

                    <p className="text-center text-[10px] text-white/25 font-medium">
                        University of Ghana · Physical Development Directorate
                        <DeveloperCredit />
                    </p>
                </div>
            </div>
        </div>
    );
};

export default TechnicianLogin;
