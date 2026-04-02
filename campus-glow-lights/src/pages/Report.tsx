import { useState, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Camera, Upload, CheckCircle, AlertTriangle, Lightbulb,
  MapPin, Phone, FileText, ShieldAlert, HelpCircle
} from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { usePoles } from "@/context/PoleContext";
import LoadingScreen from "@/components/LoadingScreen";
import { toast } from "sonner";
import ugLogo from "@/assets/ug-logo.png";
import { compressImage } from "@/lib/image-utils";
import DeveloperCredit from "@/components/DeveloperCredit";

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

const severityLevels = [
  { value: "Low", label: "Low — Minor inconvenience", color: "text-muted-foreground" },
  { value: "Medium", label: "Medium — Noticeable issue", color: "text-warning" },
  { value: "High", label: "High — Safety concern", color: "text-destructive" },
  { value: "Critical", label: "Critical — Immediate danger", color: "text-destructive" },
];

const Report = () => {
  const [searchParams] = useSearchParams();
  const poleId = searchParams.get("poleId") || "";
  const { submitReport, poles, loading } = usePoles();

  const [photo, setPhoto] = useState<string | null>(null);
  const [faultType, setFaultType] = useState("");
  const [severity, setSeverity] = useState("");
  const [description, setDescription] = useState("");
  const [contactInfo, setContactInfo] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const pole = poles.find((p) => p.id === poleId);

  const handleCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = reader.result as string;
        try {
          // Add a loading toast for the compression if it's potentially slow
          const compToast = toast.loading("Optimizing high-res photo...");
          const compressed = await compressImage(base64, 1000, 1000, 0.6);
          setPhoto(compressed);
          toast.dismiss(compToast);
        } catch (error) {
          console.error("Compression failed:", error);
          setPhoto(base64); // Fallback to original
          toast.error("Failed to fully optimize photo, using original.");
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async () => {
    if (!photo || !faultType || !poleId || !severity) {
      toast.error("Please fill in all required fields.");
      return;
    }
    try {
      setSubmitting(true);
      await submitReport(poleId, faultType, severity, description, photo, contactInfo);
      setSubmitted(true);
      toast.success("Report submitted successfully!");
    } catch (error: any) {
      console.error("Report Submission Error:", error);
      toast.error(`Submission failed: ${error.message || "Please try again"}`);
    } finally {
      setSubmitting(false);
    }
  };

  if (submitting) {
    return <LoadingScreen message="Syncing with Supabase..." fullScreen />;
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center space-y-6 max-w-sm">
          <div className="mx-auto w-20 h-20 rounded-full bg-success/10 flex items-center justify-center animate-bounce">
            <CheckCircle className="w-10 h-10 text-success" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-display font-bold text-foreground">Report Received!</h2>
            <p className="text-muted-foreground text-sm">
              Your fault report for pole <span className="font-mono font-bold text-foreground">{poleId}</span> has been synced with the database.
            </p>
          </div>
          <div className="rounded-xl border bg-card p-4 text-left space-y-2 shadow-sm">
            <div className="flex justify-between items-center">
              <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-tighter">Issue Summary</p>
              <Badge variant="secondary" className="text-[10px]">{severity}</Badge>
            </div>
            <p className="text-sm font-semibold text-foreground">{faultType}</p>
            {description && <p className="text-xs text-muted-foreground italic border-l-2 pl-2">"{description}"</p>}
          </div>
          <Button variant="outline" className="w-full" onClick={() => { setSubmitted(false); setPhoto(null); setFaultType(""); setSeverity(""); setDescription(""); setContactInfo(""); }}>
            Return to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/20">
      {/* Header */}
      <div className="bg-primary text-primary-foreground px-4 py-6 shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl" />
        <div className="flex items-center justify-between max-w-lg mx-auto relative">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-white/20 p-2 shadow-inner">
              <img src={ugLogo} alt="UG Logo" className="w-full h-full object-contain" />
            </div>
            <div>
              <h1 className="text-xl font-display font-bold tracking-tight">Campus Glow</h1>
              <p className="text-[10px] opacity-80 uppercase tracking-widest font-bold text-white/90">University of Ghana Safety</p>
            </div>
          </div>
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="text-white hover:bg-white/10 rounded-full gap-2 px-4 h-9 font-bold"
          >
            <Link to="/faq">
              <HelpCircle className="w-4 h-4" />
              <span className="hidden sm:inline">Support</span>
            </Link>
          </Button>
        </div>
      </div>

      <div className="max-w-lg mx-auto p-4 space-y-4 pb-12">
        {loading ? (
          <LoadingScreen message="Verifying Streetlight ID..." />
        ) : !poleId ? (
          <div className="rounded-2xl border-2 border-dashed border-muted p-12 text-center space-y-4 bg-background">
            <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto">
              <AlertTriangle className="w-10 h-10 text-muted-foreground" />
            </div>
            <div className="space-y-2">
              <h3 className="font-display font-bold text-lg text-foreground">No ID Detected</h3>
              <p className="text-sm text-muted-foreground px-4">Scan a QR code on any streetlight pole to instantly file a maintenance report.</p>
            </div>
          </div>
        ) : !pole ? (
          <div className="rounded-2xl border-2 border-destructive/20 p-12 text-center space-y-6 bg-background shadow-xl">
            <div className="w-20 h-20 bg-destructive/10 rounded-full flex items-center justify-center mx-auto">
              <ShieldAlert className="w-10 h-10 text-destructive" />
            </div>
            <div className="space-y-2">
              <h3 className="font-display font-bold text-xl text-foreground">Unrecognized Pole</h3>
              <p className="text-sm text-muted-foreground font-mono bg-muted p-2 rounded">ID: {poleId}</p>
              <p className="text-xs text-muted-foreground leading-relaxed mt-2">This ID was not found in the system. Please ensure you are scanning an official Campus Glow QR code.</p>
            </div>
            <Button variant="default" className="w-full font-bold" onClick={() => window.location.href = "/"}>
              Return to Site
            </Button>
          </div>
        ) : (
          <>
            {/* Pole Info Banner */}
            <div className="rounded-2xl border bg-card p-6 shadow-sm relative overflow-hidden">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2.5 bg-warning/10 rounded-xl">
                  <Lightbulb className="w-5 h-5 text-warning" />
                </div>
                <h2 className="font-display font-bold text-lg text-foreground tracking-tight">Active Reporting</h2>
              </div>

              <div className="space-y-5">
                <div className="space-y-1.5">
                  <Label className="text-muted-foreground text-[10px] uppercase font-black tracking-widest pl-1">Pole Identity</Label>
                  <div className="bg-primary/5 p-4 rounded-xl border border-primary/10 font-mono font-bold text-xl text-primary flex justify-between items-center shadow-inner">
                    {poleId}
                    <Badge className="bg-success/20 text-success border-success/30 hover:bg-success/20 text-[10px] font-sans">ACTIVE</Badge>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-muted-foreground text-[10px] uppercase font-black tracking-widest pl-1">Current Location</Label>
                  <div className="flex items-center gap-3 text-sm font-semibold text-foreground bg-muted p-3 rounded-xl border">
                    <MapPin className="w-4 h-4 text-primary" />
                    {pole.zone}
                  </div>
                </div>
              </div>
            </div>

            {/* Photo Capture Section */}
            <div className="rounded-2xl border bg-card p-5 shadow-sm space-y-3">
              <Label className="text-xs font-black uppercase tracking-widest text-foreground flex items-center gap-2">
                1. Capture Proof <span className="text-destructive font-bold">*</span>
              </Label>
              <input ref={fileRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleCapture} />

              {!photo ? (
                <button
                  onClick={() => fileRef.current?.click()}
                  className="w-full py-12 rounded-2xl border-2 border-dashed border-primary/20 bg-primary/5 flex flex-col items-center justify-center gap-3 hover:border-primary/50 hover:bg-primary/10 transition-all group"
                >
                  <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                    <Camera className="w-8 h-8 text-primary" />
                  </div>
                  <div className="text-center">
                    <span className="text-sm text-foreground font-bold block">Snap a Photo</span>
                    <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Required for verification</span>
                  </div>
                </button>
              ) : (
                <div className="relative rounded-2xl overflow-hidden shadow-inner group">
                  <img src={photo} alt="Fault" className="w-full aspect-video object-cover" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <button
                      onClick={() => { setPhoto(null); if (fileRef.current) fileRef.current.value = ""; }}
                      className="bg-destructive text-white px-4 py-2 rounded-full text-xs font-bold shadow-lg flex items-center gap-2"
                    >
                      <AlertTriangle className="w-4 h-4" /> Retake Photo
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Fault Selection */}
            <div className="rounded-2xl border bg-card p-5 shadow-sm space-y-4">
              <div>
                <Label className="text-xs font-black uppercase tracking-widest text-foreground block mb-3">
                  2. Fault Type <span className="text-destructive">*</span>
                </Label>
                <Select value={faultType} onValueChange={setFaultType}>
                  <SelectTrigger className="h-12 rounded-xl">
                    <SelectValue placeholder="What's the issue?" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    {faultTypes.map((ft) => (
                      <SelectItem key={ft} value={ft} className="py-3">{ft}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-xs font-black uppercase tracking-widest text-foreground flex items-center gap-2 mb-3">
                  3. Severity <span className="text-destructive">*</span>
                </Label>
                <Select value={severity} onValueChange={setSeverity}>
                  <SelectTrigger className="h-12 rounded-xl">
                    <SelectValue placeholder="How urgent is this?" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    {severityLevels.map((s) => (
                      <SelectItem key={s.value} value={s.value} className="py-3 font-semibold">
                        <span className={s.color}>{s.label}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Additional Details */}
            <div className="rounded-2xl border bg-card p-5 shadow-sm space-y-4">
              <div>
                <Label className="text-xs font-black uppercase tracking-widest text-foreground flex items-center gap-2 mb-3">
                  <FileText className="w-4 h-4" /> 4. Description
                </Label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Tell us more... (e.g. 'Light flickers when cars pass by')"
                  className="min-h-[100px] resize-none rounded-xl"
                  maxLength={500}
                />
              </div>

              <div>
                <Label className="text-xs font-black uppercase tracking-widest text-foreground flex items-center gap-2 mb-3">
                  <Phone className="w-4 h-4" /> 5. Contact Info
                </Label>
                <Input
                  value={contactInfo}
                  onChange={(e) => setContactInfo(e.target.value)}
                  placeholder="Optional: Phone/Email"
                  className="h-12 rounded-xl"
                />
              </div>
            </div>

            {/* Submission Button */}
            <Button
              onClick={handleSubmit}
              disabled={!photo || !faultType || !severity || submitting}
              className="w-full h-16 text-lg font-black rounded-2xl shadow-xl active:scale-95 transition-transform"
              size="lg"
            >
              {submitting ? (
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Uploading...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Upload className="w-6 h-6" /> Submit Report
                </div>
              )}
            </Button>

            {!photo && (
              <p className="text-[10px] text-center text-muted-foreground uppercase font-bold tracking-widest animate-pulse">
                Photo Proof Required to Submit
              </p>
            )}
          </>
        )}
      </div>

      <footer className="border-t py-8 text-center text-xs text-muted-foreground mt-8 bg-background">
        University of Ghana, Legon — Campus Glow © {new Date().getFullYear()}
        <DeveloperCredit />
      </footer>
    </div>
  );
};

export default Report;
