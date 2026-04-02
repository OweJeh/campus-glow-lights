import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
    Shield, Eye, EyeOff, Lock, CheckCircle, AlertTriangle,
    Save, ArrowLeft, KeyRound, RefreshCw, RotateCcw, Trash2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import ugLogo from "@/assets/ug-logo.png";
import { format } from "date-fns";
import DeveloperCredit from "@/components/DeveloperCredit";

const DEFAULT_PASSWORD = "admin123";

const AdminSettings = () => {
    const navigate = useNavigate();
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showCurrent, setShowCurrent] = useState(false);
    const [showNew, setShowNew] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [saving, setSaving] = useState(false);
    const [resetting, setResetting] = useState(false);
    const [lastUpdated, setLastUpdated] = useState<string | null>(null);
    const [loadingMeta, setLoadingMeta] = useState(true);
    const [showResetConfirm, setShowResetConfirm] = useState(false);

    // Password strength
    const strength = (() => {
        if (!newPassword) return { score: 0, label: "", color: "" };
        let score = 0;
        if (newPassword.length >= 8) score++;
        if (newPassword.length >= 12) score++;
        if (/[A-Z]/.test(newPassword)) score++;
        if (/[0-9]/.test(newPassword)) score++;
        if (/[^A-Za-z0-9]/.test(newPassword)) score++;
        if (score <= 1) return { score, label: "Weak", color: "#ef4444" };
        if (score <= 3) return { score, label: "Moderate", color: "#f59e0b" };
        return { score, label: "Strong", color: "#22c55e" };
    })();

    useEffect(() => {
        fetchMeta();
    }, []);

    const fetchMeta = async () => {
        try {
            const { data } = await supabase
                .from("admin_settings")
                .select("updated_at")
                .eq("key", "admin_password")
                .maybeSingle();
            if (data?.updated_at) {
                setLastUpdated(format(new Date(data.updated_at), "MMM d, yyyy 'at' h:mm a"));
            }
        } catch (_) {
            // table may not exist yet
        } finally {
            setLoadingMeta(false);
        }
    };

    const handleChangePassword = async () => {
        if (!currentPassword || !newPassword || !confirmPassword) {
            toast.error("Please fill in all fields.");
            return;
        }
        if (newPassword !== confirmPassword) {
            toast.error("New passwords do not match.");
            return;
        }
        if (newPassword.length < 6) {
            toast.error("Password must be at least 6 characters.");
            return;
        }
        if (newPassword === currentPassword) {
            toast.error("New password must be different from the current one.");
            return;
        }

        setSaving(true);
        try {
            const { data, error: fetchErr } = await supabase
                .from("admin_settings")
                .select("value, updated_at")
                .eq("key", "admin_password")
                .maybeSingle();

            if (fetchErr) throw fetchErr;

            const stored = data?.value ?? DEFAULT_PASSWORD;
            if (currentPassword !== stored) {
                toast.error("Current password is incorrect.");
                setSaving(false);
                return;
            }

            const now = new Date().toISOString();

            if (data) {
                const { error } = await supabase
                    .from("admin_settings")
                    .update({ value: newPassword, updated_at: now })
                    .eq("key", "admin_password");
                if (error) throw error;
            } else {
                const { error } = await supabase
                    .from("admin_settings")
                    .insert({ key: "admin_password", value: newPassword, updated_at: now });
                if (error) throw error;
            }

            const formatted = format(new Date(), "MMM d, yyyy 'at' h:mm a");
            setLastUpdated(formatted);
            setCurrentPassword("");
            setNewPassword("");
            setConfirmPassword("");
            toast.success("Password updated successfully!");
        } catch (err: any) {
            console.error(err);
            toast.error("Failed to update password. Check console.");
        } finally {
            setSaving(false);
        }
    };

    const handleResetToDefault = async () => {
        setResetting(true);
        try {
            const now = new Date().toISOString();

            const { data: existing } = await supabase
                .from("admin_settings")
                .select("id")
                .eq("key", "admin_password")
                .maybeSingle();

            if (existing) {
                const { error } = await supabase
                    .from("admin_settings")
                    .update({ value: DEFAULT_PASSWORD, updated_at: now })
                    .eq("key", "admin_password");
                if (error) throw error;
            } else {
                const { error } = await supabase
                    .from("admin_settings")
                    .insert({ key: "admin_password", value: DEFAULT_PASSWORD, updated_at: now });
                if (error) throw error;
            }

            setLastUpdated(format(new Date(), "MMM d, yyyy 'at' h:mm a"));
            setShowResetConfirm(false);
            setCurrentPassword("");
            setNewPassword("");
            setConfirmPassword("");
            toast.success(`Password reset to default: "${DEFAULT_PASSWORD}"`);
        } catch (err: any) {
            console.error(err);
            toast.error("Reset failed. Check console.");
        } finally {
            setResetting(false);
        }
    };

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <header className="bg-[#1A365D] text-white border-b border-white/10">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
                    <div className="flex items-center gap-2 sm:gap-3">
                        <img src={ugLogo} alt="UG Logo" className="w-8 h-8 sm:w-9 sm:h-9 object-contain" />
                        <div>
                            <h1 className="text-lg sm:text-xl font-display font-bold leading-none">Campus Glow</h1>
                            <p className="hidden sm:block text-[10px] opacity-75 mt-0.5 font-medium uppercase tracking-wider">Admin Settings</p>
                        </div>
                    </div>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate("/dashboard")}
                        className="text-white hover:bg-white/10 gap-2"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        <span className="hidden sm:inline">Back to Dashboard</span>
                    </Button>
                </div>
            </header>

            <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">
                {/* Page title */}
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#1A365D]/10 flex items-center justify-center shrink-0">
                        <Shield className="w-5 h-5 text-[#1A365D]" />
                    </div>
                    <div>
                        <h2 className="text-xl font-display font-bold text-foreground">Security Settings</h2>
                        <p className="text-sm text-muted-foreground">Manage admin access and authentication</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Password Change Form */}
                    <div className="lg:col-span-2 space-y-4">
                        <div className="rounded-xl border bg-card p-6 space-y-5">
                            <div className="flex items-center gap-2 pb-4 border-b">
                                <KeyRound className="w-4 h-4 text-[#1A365D]" />
                                <h3 className="font-display font-semibold text-foreground text-sm">Change Admin Password</h3>
                            </div>

                            {/* Current Password */}
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                                    Current Password
                                </label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                    <Input
                                        type={showCurrent ? "text" : "password"}
                                        value={currentPassword}
                                        onChange={e => setCurrentPassword(e.target.value)}
                                        placeholder="Enter current password"
                                        className="pl-9 pr-10"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowCurrent(v => !v)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                    >
                                        {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>

                            {/* New Password */}
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                                    New Password
                                </label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                    <Input
                                        type={showNew ? "text" : "password"}
                                        value={newPassword}
                                        onChange={e => setNewPassword(e.target.value)}
                                        placeholder="Enter new password"
                                        className="pl-9 pr-10"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowNew(v => !v)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                    >
                                        {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>

                                {/* Strength indicator */}
                                {newPassword && (
                                    <div className="space-y-1.5 pt-1">
                                        <div className="flex gap-1">
                                            {[1, 2, 3, 4, 5].map(i => (
                                                <div
                                                    key={i}
                                                    className="h-1.5 flex-1 rounded-full transition-all duration-300"
                                                    style={{
                                                        background: i <= strength.score ? strength.color : "#e2e8f0"
                                                    }}
                                                />
                                            ))}
                                        </div>
                                        <p className="text-[10px] font-bold" style={{ color: strength.color }}>
                                            {strength.label} password
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* Confirm Password */}
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                                    Confirm New Password
                                </label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                    <Input
                                        type={showConfirm ? "text" : "password"}
                                        value={confirmPassword}
                                        onChange={e => setConfirmPassword(e.target.value)}
                                        placeholder="Re-enter new password"
                                        className="pl-9 pr-10"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirm(v => !v)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                    >
                                        {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                                {confirmPassword && newPassword && (
                                    <p className={`text-[10px] font-bold flex items-center gap-1 ${confirmPassword === newPassword ? "text-green-600" : "text-destructive"}`}>
                                        {confirmPassword === newPassword ? (
                                            <><CheckCircle className="w-3 h-3" /> Passwords match</>
                                        ) : (
                                            <><AlertTriangle className="w-3 h-3" /> Passwords do not match</>
                                        )}
                                    </p>
                                )}
                            </div>

                            <Button
                                onClick={handleChangePassword}
                                disabled={saving}
                                className="w-full bg-[#1A365D] hover:bg-[#1A365D]/90 text-white font-bold gap-2"
                            >
                                {saving ? (
                                    <><RefreshCw className="w-4 h-4 animate-spin" /> Updating...</>
                                ) : (
                                    <><Save className="w-4 h-4" /> Update Password</>
                                )}
                            </Button>
                        </div>

                        {/* ── Reset to Default Section ── */}
                        <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-5 space-y-4">
                            <div className="flex items-start gap-3">
                                <div className="w-9 h-9 rounded-lg bg-destructive/10 flex items-center justify-center shrink-0 mt-0.5">
                                    <RotateCcw className="w-4 h-4 text-destructive" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-semibold text-sm text-foreground">Reset to Default Password</h3>
                                    <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                                        This will immediately reset the admin password back to{" "}
                                        <code className="px-1.5 py-0.5 bg-muted rounded text-[11px] font-mono font-bold text-foreground">
                                            {DEFAULT_PASSWORD}
                                        </code>.
                                        Use this if you are locked out.
                                    </p>
                                </div>
                            </div>

                            {!showResetConfirm ? (
                                <Button
                                    variant="outline"
                                    onClick={() => setShowResetConfirm(true)}
                                    className="w-full border-destructive/30 text-destructive hover:bg-destructive/10 hover:border-destructive/50 font-bold gap-2"
                                >
                                    <RotateCcw className="w-4 h-4" />
                                    Reset to Default
                                </Button>
                            ) : (
                                <div className="space-y-3">
                                    <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-50 border border-amber-200">
                                        <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                                        <p className="text-xs text-amber-700 font-medium">
                                            Are you sure? This cannot be undone. You'll need to set a new password after logging in.
                                        </p>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button
                                            variant="outline"
                                            onClick={() => setShowResetConfirm(false)}
                                            className="flex-1 font-bold"
                                            disabled={resetting}
                                        >
                                            Cancel
                                        </Button>
                                        <Button
                                            onClick={handleResetToDefault}
                                            disabled={resetting}
                                            className="flex-1 bg-destructive hover:bg-destructive/90 text-white font-bold gap-2"
                                        >
                                            {resetting ? (
                                                <><RefreshCw className="w-4 h-4 animate-spin" /> Resetting...</>
                                            ) : (
                                                <><Trash2 className="w-4 h-4" /> Yes, Reset Now</>
                                            )}
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Info Cards */}
                    <div className="space-y-4">
                        {/* Status Card */}
                        <div className="rounded-xl border bg-card p-5 space-y-4">
                            <div className="flex items-center gap-2 pb-3 border-b">
                                <Shield className="w-4 h-4 text-[#1A365D]" />
                                <h3 className="font-semibold text-sm text-foreground">Access Status</h3>
                            </div>
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs text-muted-foreground">Protection</span>
                                    <Badge variant="secondary" className="text-[10px] font-bold bg-green-100 text-green-700 border-green-200">Active</Badge>
                                </div>
                                <div className="flex items-center justify-between gap-2">
                                    <span className="text-xs text-muted-foreground shrink-0">Last Changed</span>
                                    <span className="text-[10px] font-bold text-right text-foreground">
                                        {loadingMeta ? "..." : lastUpdated ?? "Never"}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-xs text-muted-foreground">Storage</span>
                                    <Badge variant="outline" className="text-[10px] font-semibold">Supabase</Badge>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-xs text-muted-foreground">Default</span>
                                    <code className="text-[10px] font-mono font-bold bg-muted px-1.5 py-0.5 rounded">{DEFAULT_PASSWORD}</code>
                                </div>
                            </div>
                        </div>

                        {/* Tips */}
                        <div className="rounded-xl border bg-amber-50 border-amber-200 p-5 space-y-3">
                            <div className="flex items-center gap-2">
                                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                                <h3 className="font-semibold text-sm text-amber-800">Password Tips</h3>
                            </div>
                            <ul className="text-[11px] text-amber-700 space-y-1.5 leading-relaxed">
                                <li>• Use at least <strong>8 characters</strong></li>
                                <li>• Mix uppercase &amp; lowercase letters</li>
                                <li>• Include numbers and symbols</li>
                                <li>• Avoid common words or dates</li>
                                <li>• Keep it confidential — do not share</li>
                            </ul>
                        </div>

                        {/* Recovery Info */}
                        <div className="rounded-xl border bg-blue-50 border-blue-200 p-5 space-y-3">
                            <div className="flex items-center gap-2">
                                <RotateCcw className="w-4 h-4 text-blue-600 shrink-0" />
                                <h3 className="font-semibold text-sm text-blue-800">Recovery</h3>
                            </div>
                            <p className="text-[11px] text-blue-700 leading-relaxed">
                                If you forget your password, use the{" "}
                                <strong>"Forgot Password?"</strong> link on the login page to
                                reset it back to the default.
                            </p>
                        </div>
                    </div>
                </div>

                <footer className="border-t py-8 text-center text-xs text-muted-foreground mt-12">
                    University of Ghana, Legon — Campus Glow © {new Date().getFullYear()}
                    <DeveloperCredit />
                </footer>
            </div>
        </div>
    );
};

export default AdminSettings;
