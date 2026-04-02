import { useState, useMemo, useRef } from "react";
import { Link } from "react-router-dom";
import {
    AlertTriangle, MapPin, Play, Clock, CheckCircle,
    ChevronRight, Filter, Search, ArrowUpDown, Camera
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { usePoles, type Pole } from "@/context/PoleContext";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import LoadingScreen from "@/components/LoadingScreen";
import { compressImage } from "@/lib/image-utils";

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from "@/components/ui/dialog";
import { format } from "date-fns";

const ReportDetailsModal = ({ report, poleId }: { report: any, poleId: string }) => {
    const { fetchReportDetails } = usePoles();
    const [photo, setPhoto] = useState<string | null>(null);
    const [loadingPhoto, setLoadingPhoto] = useState(false);

    const handleOpen = async () => {
        if (!photo && !loadingPhoto) {
            setLoadingPhoto(true);
            const details = await fetchReportDetails(report.id);
            setPhoto(details?.photoUrl || null);
            setLoadingPhoto(false);
        }
    };

    return (
        <Dialog onOpenChange={(open) => open && handleOpen()}>
            <DialogTrigger asChild>
                <Button variant="ghost" className="w-full text-[10px] h-8 font-black uppercase tracking-widest text-[#1A365D]/60 hover:text-[#1A365D] hover:bg-slate-50 gap-2">
                    <AlertTriangle className="w-3 h-3" />
                    View Original Report
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md bg-white border-none rounded-2xl shadow-2xl p-0 overflow-hidden">
                <div className="bg-[#1A365D] p-6 text-white">
                    <DialogTitle className="text-xl font-black uppercase tracking-tight">Fault Report: {poleId}</DialogTitle>
                    <DialogDescription className="text-white/60 text-xs font-bold uppercase tracking-widest mt-1">
                        Reported on {format(new Date(report.timestamp), "MMM dd, yyyy @ h:mm a")}
                    </DialogDescription>
                </div>
                <div className="p-6 space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Issue Category</p>
                            <Badge variant="secondary" className="font-bold">{report.faultType}</Badge>
                        </div>
                        <div className="space-y-1 text-right">
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Severity</p>
                            <Badge className={
                                report.severity === "Critical" ? "bg-red-600" :
                                    report.severity === "High" ? "bg-orange-500" :
                                        "bg-amber-500"
                            }>
                                {report.severity}
                            </Badge>
                        </div>
                    </div>

                    <div className="rounded-xl overflow-hidden border border-slate-100 shadow-inner group">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Evidence Photo</p>
                        {loadingPhoto ? (
                            <div className="w-full h-48 bg-slate-50 animate-pulse flex items-center justify-center">
                                <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">Loading Photo...</span>
                            </div>
                        ) : photo ? (
                            <img
                                src={photo}
                                alt="Fault"
                                className="w-full h-48 object-cover cursor-zoom-in hover:scale-105 transition-transform"
                                onClick={() => window.open(photo, "_blank")}
                            />
                        ) : (
                            <div className="w-full h-48 bg-slate-50 flex items-center justify-center text-slate-300">
                                <span className="text-[10px] font-bold uppercase tracking-widest">No Evidence Provided</span>
                            </div>
                        )}
                    </div>

                    <div className="space-y-2">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Description</p>
                        <div className="p-4 bg-slate-50 rounded-xl italic text-sm text-[#1A365D] border-l-4 border-[#1A365D]/20">
                            "{report.description || "No written description provided."}"
                        </div>
                    </div>
                </div>
                <div className="p-4 bg-slate-50 border-t border-slate-100 text-center">
                    <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">University of Ghana Maintenance Team</p>
                </div>
            </DialogContent>
        </Dialog>
    );
};

const MaintenanceDashboard = () => {
    const { poles, loading, startRepair } = usePoles();
    const [search, setSearch] = useState("");
    const [selectedReportPole, setSelectedReportPole] = useState<Pole | null>(null);
    const [startingPoleId, setStartingPoleId] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const defectivePoles = useMemo(() => {
        return poles
            .filter((p) => p.status === "Defective" || p.status === "In Progress")
            .filter((p) =>
                p.id.toLowerCase().includes(search.toLowerCase()) ||
                p.zone.toLowerCase().includes(search.toLowerCase())
            )
            .sort((a, b) => {
                // Priority 1: "In Progress" first
                if (a.status === "In Progress" && b.status !== "In Progress") return -1;
                if (a.status !== "In Progress" && b.status === "In Progress") return 1;

                // Priority 2: Days Outage (highest first)
                return b.daysOutage - a.daysOutage;
            });
    }, [poles, search]);

    const handlePhotoCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file && startingPoleId) {
            const reader = new FileReader();
            reader.onloadend = async () => {
                const base64Photo = reader.result as string;
                try {
                    const compToast = toast.loading("Compressing photo for sync...");
                    const compressed = await compressImage(base64Photo);
                    await startRepair(startingPoleId, compressed);
                    toast.dismiss(compToast);
                    toast.success(`Work started on ${startingPoleId}`, {
                        description: "Status updated to 'In Progress' with Optimized Photo.",
                        className: "bg-[#1A365D] text-white border-none shadow-xl"
                    });
                } catch (error) {
                    toast.error("Failed to process photo.");
                } finally {
                    setStartingPoleId(null);
                }
            };
            reader.readAsDataURL(file);
        }
    };

    if (loading) {
        return <LoadingScreen message="Syncing task dashboard..." />;
    }

    return (
        <div className="space-y-6">
            <input
                type="file"
                accept="image/*"
                capture="environment"
                ref={fileInputRef}
                className="hidden"
                onChange={handlePhotoCapture}
            />

            {/* Start Work Photo Dialog */}
            <Dialog open={!!startingPoleId} onOpenChange={(open) => !open && setStartingPoleId(null)}>
                <DialogContent className="sm:max-w-md bg-white rounded-2xl p-0 overflow-hidden border-none shadow-2xl">
                    <div className="bg-amber-500 p-8 text-white flex flex-col items-center gap-4">
                        <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-md border border-white/30">
                            <Camera className="w-8 h-8" />
                        </div>
                        <div className="text-center">
                            <DialogTitle className="text-2xl font-black uppercase">Initial Evidence</DialogTitle>
                            <DialogDescription className="text-white/80 font-bold uppercase tracking-widest text-[10px] mt-1">
                                Capture "Before" photo of {startingPoleId}
                            </DialogDescription>
                        </div>
                    </div>
                    <div className="p-8 space-y-4">
                        <p className="text-sm text-slate-500 text-center font-medium">
                            To ensure accurate records, please take a clear photo of the fault before starting any technical work.
                        </p>
                        <Button
                            className="w-full h-16 bg-[#1A365D] hover:bg-[#1A365D]/90 text-lg font-black rounded-xl shadow-lg"
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <Camera className="w-6 h-6 mr-3" />
                            Open Camera
                        </Button>
                        <Button
                            variant="ghost"
                            className="w-full text-slate-400 font-bold uppercase tracking-widest text-[10px]"
                            onClick={() => setStartingPoleId(null)}
                        >
                            Cancel
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Search & Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-[#1A365D]">Task Dashboard</h2>
                    <p className="text-sm text-slate-500 font-medium">Manage and prioritize streetlight repairs.</p>
                </div>
                <div className="relative w-full md:w-72">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                        placeholder="Search Pole ID or Location..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-9 h-11 border-slate-200 focus-visible:ring-[#1A365D] rounded-lg"
                    />
                </div>
            </div>

            <div className="flex items-center gap-2 mb-2">
                <Badge variant="outline" className="bg-slate-100 text-[#1A365D] border-slate-200">
                    Showing {defectivePoles.length} Assigned Tasks
                </Badge>
                <div className="flex flex-col gap-0.5">
                    <span className="text-[10px] uppercase font-black tracking-widest text-[#1A365D]">Status Priority</span>
                    <span className="text-[9px] uppercase font-bold tracking-tight text-slate-400">In Progress {" > "} Outage Urgency</span>
                </div>
            </div>

            {/* Task List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {defectivePoles.map((pole) => {
                    const status = pole.status;
                    const latestReport = pole.reports.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];

                    return (
                        <div
                            key={pole.id}
                            className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow group flex flex-col"
                        >
                            <div className="p-5 space-y-4 flex-1">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h3 className="text-lg font-extrabold text-[#1A365D] tracking-tight">{pole.id}</h3>
                                        <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1 font-medium">
                                            <MapPin className="w-3.5 h-3.5 text-slate-400" />
                                            {pole.zone}
                                        </div>
                                    </div>
                                    {status === "Defective" ? (
                                        <Badge className="bg-red-50 text-red-600 border border-red-100 hover:bg-red-50 text-[10px] font-black uppercase tracking-tighter px-2">
                                            Defective
                                        </Badge>
                                    ) : (
                                        <Badge className="bg-amber-50 text-amber-600 border border-amber-100 hover:bg-amber-50 text-[10px] font-black uppercase tracking-tighter px-2">
                                            In Progress
                                        </Badge>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <div className="flex items-center justify-between text-xs py-2 border-y border-slate-50">
                                        <div className="flex items-center gap-1">
                                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                                            <span className="text-slate-500">Outage Duration:</span>
                                        </div>
                                        <span className={`font-bold ${pole.daysOutage >= 5 ? "text-red-600" : "text-slate-700"}`}>
                                            {pole.daysOutage} Days
                                        </span>
                                    </div>

                                    {latestReport && (
                                        <ReportDetailsModal report={latestReport} poleId={pole.id} />
                                    )}
                                </div>
                            </div>

                            <div className="p-5 pt-0 mt-auto">
                                {status === "Defective" ? (
                                    <Button
                                        className="w-full bg-[#1A365D] hover:bg-[#1A365D]/90 h-11 text-sm font-bold rounded-lg shadow-sm active:scale-95 transition-transform"
                                        onClick={() => setStartingPoleId(pole.id)}
                                    >
                                        <Play className="w-4 h-4 mr-2 fill-current" />
                                        Start Work
                                    </Button>
                                ) : (
                                    <Button
                                        asChild
                                        className="w-full bg-success hover:bg-success/90 h-11 text-sm font-bold rounded-lg shadow-sm active:scale-95 transition-transform"
                                    >
                                        <Link to={`/maintenance/repair/${pole.id}`}>
                                            <CheckCircle className="w-4 h-4 mr-2" />
                                            Action Repair
                                            <ChevronRight className="w-4 h-4 ml-auto" />
                                        </Link>
                                    </Button>
                                )}
                            </div>
                        </div>
                    );
                })}

                {defectivePoles.length === 0 && !loading && (
                    <div className="col-span-full py-20 text-center space-y-4 bg-white border border-dashed border-slate-200 rounded-2xl">
                        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto">
                            <CheckCircle className="w-8 h-8 text-slate-300" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-[#1A365D]">Zero Active Faults</h3>
                            <p className="text-sm text-slate-500">All streetlights in your assigned zones are currently operational.</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default MaintenanceDashboard;
