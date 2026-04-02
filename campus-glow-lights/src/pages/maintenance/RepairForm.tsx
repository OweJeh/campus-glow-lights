import { useState, useRef, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
    Camera, Upload, CheckCircle, AlertTriangle,
    ArrowLeft, FileText, ImageIcon, ShieldCheck,
    Info, ExternalLink
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { usePoles } from "@/context/PoleContext";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import LoadingScreen from "@/components/LoadingScreen";
import { compressImage } from "@/lib/image-utils";

const faultTypes = [
    "Flickering",
    "Complete Outage",
    "Dim Light",
    "Physical Damage",
    "Wiring Issue",
    "Broken Glass/Cover",
    "Leaning/Tilted Pole",
    "Buzzing/Noise",
    "Intermittent On/Off",
    "Water Damage",
];

const ImageUploader = ({ label, id, photo, setPhoto, readOnly = false }: { label: string, id: string, photo: string | null, setPhoto: (p: string | null) => void, readOnly?: boolean }) => {
    const fileRef = useRef<HTMLInputElement>(null);

    const handleCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (readOnly) return;
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = async () => {
                const base64 = reader.result as string;
                try {
                    const compToast = toast.loading("Optimizing photo...");
                    const compressed = await compressImage(base64, 1000, 1000, 0.6);
                    setPhoto(compressed);
                    toast.dismiss(compToast);
                } catch (error) {
                    toast.error("Process error, using original.");
                    setPhoto(base64);
                }
            };
            reader.readAsDataURL(file);
        }
    };

    return (
        <div className="space-y-3">
            <Label className="text-xs font-black uppercase tracking-widest text-[#1A365D] flex items-center gap-2">
                {label} {!readOnly && <span className="text-destructive font-bold">*</span>}
            </Label>
            {!readOnly && (
                <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    onChange={handleCapture}
                />
            )}

            {!photo ? (
                <button
                    disabled={readOnly}
                    onClick={() => fileRef.current?.click()}
                    className="w-full py-8 border-2 border-dashed border-slate-200 bg-slate-50/50 rounded-xl flex flex-col items-center justify-center gap-2 hover:border-[#1A365D]/30 hover:bg-slate-50 transition-all group disabled:opacity-50"
                >
                    <div className="w-12 h-12 bg-white border border-slate-100 rounded-lg flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
                        <Camera className="w-6 h-6 text-[#1A365D]" />
                    </div>
                    <div className="text-center">
                        <span className="text-xs text-slate-600 font-bold block">Upload {label}</span>
                        <span className="text-[10px] text-slate-400 uppercase tracking-tight">Large targets for fingers</span>
                    </div>
                </button>
            ) : (
                <div className="relative rounded-xl overflow-hidden shadow-inner group border border-slate-200 h-40">
                    <img src={photo} alt={label} className="w-full h-full object-cover" />
                    {!readOnly && (
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <button
                                onClick={() => { setPhoto(null); if (fileRef.current) fileRef.current.value = ""; }}
                                className="bg-red-500 text-white px-4 py-2 rounded-full text-xs font-bold shadow-lg flex items-center gap-2"
                            >
                                <AlertTriangle className="w-4 h-4" /> Retake
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

const RepairForm = () => {
    const { poleId } = useParams();
    const navigate = useNavigate();
    const { submitRepair, poles, loading, fetchPoleBeforePhoto, fetchReportDetails } = usePoles();

    const [faultCategory, setFaultCategory] = useState("");
    const [workNotes, setWorkNotes] = useState("");
    const [beforePhoto, setBeforePhoto] = useState<string | null>(null);
    const [afterPhoto, setAfterPhoto] = useState<string | null>(null);
    const [referencePhoto, setReferencePhoto] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);

    const pole = poles.find(p => p.id === poleId);

    // Effect to pre-fill data from the latest report and the "In Progress" photo
    useEffect(() => {
        const loadInitialData = async () => {
            if (pole) {
                // 1. Pre-fill Before Photo from the "Start Work" capture (fetching on demand)
                if (pole.status === "In Progress") {
                    const photo = await fetchPoleBeforePhoto(pole.id);
                    if (photo) setBeforePhoto(photo);
                }

                // 2. Pre-fill Fault Category from the latest student report
                const latestReport = [...pole.reports].sort((a, b) =>
                    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
                )[0];

                if (latestReport) {
                    setFaultCategory(latestReport.faultType);
                    // Fetch the photo for the latest report specifically for reference
                    const details = await fetchReportDetails(latestReport.id);
                    if (details?.photoUrl) setReferencePhoto(details.photoUrl);
                }
            }
        };
        loadInitialData();
    }, [pole]);

    if (loading) {
        return <LoadingScreen message="Retrieving pole data..." />;
    }

    const handleSubmit = async () => {
        if (!faultCategory || !beforePhoto || !afterPhoto || !poleId) {
            toast.error("Please provide all required photos and fault category.");
            return;
        }

        try {
            setSubmitting(true);

            await submitRepair({
                poleId,
                techName: sessionStorage.getItem("tech_name") || "Unknown Technician",
                faultCategory,
                workNotes,
                beforePhotoUrl: beforePhoto,
                afterPhotoUrl: afterPhoto
            });

            toast.success(`Success! ${poleId} is now back online.`, {
                description: "Repair record has been synchronized with the database.",
                className: "bg-success text-white border-none shadow-xl"
            });

            navigate("/maintenance/history");
        } catch (error: any) {
            console.error("Repair Submission Error:", error);
            toast.error(`Sync failed: ${error.message || "Please try again"}`);
        } finally {
            setSubmitting(false);
        }
    };

    const latestReport = pole?.reports.sort((a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    )[0];

    return (
        <div className="max-w-2xl mx-auto space-y-6 pb-12">
            {/* Header */}
            <div className="flex items-center gap-3">
                <Button
                    variant="ghost"
                    size="icon"
                    className="rounded-full bg-slate-50 border border-slate-200"
                    onClick={() => navigate(-1)}
                >
                    <ArrowLeft className="w-5 h-5 text-[#1A365D]" />
                </Button>
                <div>
                    <h2 className="text-xl font-black text-[#1A365D]">Repair Report for <span className="underline decoration-[#1A365D]/30">{poleId}</span></h2>
                    <p className="text-xs text-slate-500 font-medium">{pole?.zone || "Assigned Zone"}</p>
                </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
                {/* Reference Data Card */}
                {latestReport && (
                    <div className="bg-[#1A365D]/5 border border-[#1A365D]/10 rounded-2xl p-4 overflow-hidden mb-6">
                        <div className="flex items-center gap-2 mb-3">
                            <Info className="w-4 h-4 text-[#1A365D]" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-[#1A365D]">Original Report Reference</span>
                            <Badge className="ml-auto bg-white text-[#1A365D] border-slate-200 uppercase text-[9px]">{latestReport.severity} Severity</Badge>
                        </div>
                        <div className="flex gap-4">
                            {referencePhoto && (
                                <div className="w-16 h-16 rounded-lg overflow-hidden border border-white shadow-sm flex-shrink-0">
                                    <img src={referencePhoto} className="w-full h-full object-cover" />
                                </div>
                            )}
                            <div className="space-y-1">
                                <p className="text-xs font-bold text-[#1A365D]">{latestReport.faultType}</p>
                                <p className="text-[10px] text-slate-500 leading-relaxed line-clamp-2">
                                    "{latestReport.description || "No description provided."}"
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Fault Category */}
                <div className="space-y-3">
                    <Label className="text-xs font-black uppercase tracking-widest text-[#1A365D] block">
                        1. Fault Category <span className="text-destructive">*</span>
                    </Label>
                    <Select value={faultCategory} onValueChange={setFaultCategory}>
                        <SelectTrigger className="h-12 border-slate-200 rounded-xl focus:ring-[#1A365D]">
                            <SelectValue placeholder="Identify the primary issue..." />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl">
                            {faultTypes.map((ft) => (
                                <SelectItem key={ft} value={ft} className="py-3">{ft}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* Photos */}
                <div className="grid grid-cols-2 gap-4">
                    <ImageUploader
                        label="Before Photo"
                        id="before"
                        photo={beforePhoto}
                        setPhoto={setBeforePhoto}
                        readOnly={!!pole?.beforePhoto}
                    />
                    <ImageUploader
                        label="After Photo"
                        id="after"
                        photo={afterPhoto}
                        setPhoto={setAfterPhoto}
                    />
                </div>

                {/* Work Notes */}
                <div className="space-y-3">
                    <Label className="text-xs font-black uppercase tracking-widest text-[#1A365D] flex items-center gap-2">
                        <FileText className="w-4 h-4" /> 2. Work Notes
                    </Label>
                    <Textarea
                        placeholder="Document any additional components used or specific actions taken..."
                        className="min-h-[120px] rounded-xl border-slate-200 focus-visible:ring-[#1A365D] resize-none"
                        value={workNotes}
                        onChange={(e) => setWorkNotes(e.target.value)}
                    />
                </div>

                {/* Action Button */}
                <Button
                    className="w-full h-16 bg-success hover:bg-success/90 text-lg font-black rounded-2xl shadow-lg active:scale-95 transition-transform"
                    onClick={handleSubmit}
                    disabled={submitting}
                >
                    {submitting ? (
                        <div className="flex items-center gap-3">
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            Syncing...
                        </div>
                    ) : (
                        <div className="flex items-center gap-2">
                            <ShieldCheck className="w-6 h-6" /> Submit & Mark as Operational
                        </div>
                    )}
                </Button>
                <p className="text-[10px] text-center text-slate-400 font-bold uppercase tracking-widest mt-4">
                    Action will be logged to maintenance history
                </p>
            </div>
        </div>
    );
};

export default RepairForm;
