import { Drawer as DrawerPrimitive } from "vaul";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { MapPin, Clock, AlertTriangle, Calendar, ShieldAlert, FileText, Phone, Camera, X } from "lucide-react";
import { Pole, usePoles } from "@/context/PoleContext";
import { format } from "date-fns";
import { toast } from "sonner";
import LoadingScreen from "./LoadingScreen";
import { useState } from "react";

interface PoleDrawerProps {
  pole: Pole | null;
  open: boolean;
  onClose: () => void;
}

const severityColor: Record<string, string> = {
  Low: "bg-muted text-muted-foreground",
  Medium: "bg-warning/10 text-warning border-warning/30",
  High: "bg-destructive/10 text-destructive border-destructive/30",
  Critical: "bg-destructive text-destructive-foreground",
};

const PoleDrawer = ({ pole, open, onClose }: PoleDrawerProps) => {
  const { markRepaired, fetchReportDetails } = usePoles();
  const [fetchingPhoto, setFetchingPhoto] = useState(false);
  const [viewingPhoto, setViewingPhoto] = useState<string | null>(null);

  if (!pole) return null;

  return (
    <DrawerPrimitive.Root
      direction="right"
      open={open}
      onOpenChange={(val) => !val && onClose()}
      // Prevent drawer from closing when the lightbox is active
      dismissible={!viewingPhoto && !fetchingPhoto}
    >
      <DrawerPrimitive.Portal>
        <DrawerPrimitive.Overlay className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm" />
        <DrawerPrimitive.Content
          className="fixed inset-y-0 right-0 z-50 flex h-full w-full flex-col border-l bg-background sm:max-w-lg outline-none shadow-2xl"
          onPointerDownOutside={(e) => {
            // Prevent closure if clicking on our overlays which are inside the portal
            if (viewingPhoto || fetchingPhoto) e.preventDefault();
          }}
        >
          {/* Premium Navy Header */}
          <div className="bg-[#1A365D] p-6 text-white flex items-center justify-between shadow-lg shrink-0">
            <div>
              <DrawerPrimitive.Title className="text-xl font-black uppercase tracking-tight">
                Pole Details: {pole.id}
              </DrawerPrimitive.Title>
              <p className="text-white/60 text-[10px] font-black uppercase tracking-[0.2em] mt-1">
                Streetlight Management System
              </p>
            </div>
            <button
              onClick={onClose}
              className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors"
              aria-label="Close drawer"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto">
            <div className="p-6 space-y-6">
              {/* Status & Location Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Badge
                    variant={pole.status === "Operational" ? "default" : "destructive"}
                    className={`px-3 py-1 text-[10px] font-black uppercase tracking-widest ${pole.status === "Operational" ? "bg-success text-success-foreground" : "bg-red-600"}`}
                  >
                    {pole.status}
                  </Badge>
                  <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-slate-400">
                    <MapPin className="w-3 h-3" />
                    {pole.zone}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-4 space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Installation Date</p>
                    <p className="text-sm font-bold text-[#1A365D]">{format(pole.installDate, "MMM d, yyyy")}</p>
                  </div>
                  <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-4 space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Last Inspection</p>
                    <p className="text-sm font-bold text-[#1A365D]">{format(pole.lastInspected, "MMM d, yyyy")}</p>
                  </div>
                </div>

                {pole.daysOutage > 0 && (
                  <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-100 rounded-xl">
                    <AlertTriangle className="w-4 h-4 text-red-600" />
                    <span className="text-xs font-black uppercase tracking-widest text-red-600">
                      {pole.daysOutage} Day{pole.daysOutage !== 1 ? "s" : ""} Total Outage
                    </span>
                  </div>
                )}
              </div>

              <Separator className="bg-slate-100" />

              {/* Repair Control Section */}
              <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-6 space-y-4 group">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Maintenance Status</p>
                    <p className="font-bold text-[#1A365D]">Mark as Repaired</p>
                  </div>
                  <Switch
                    checked={pole.status === "Operational"}
                    onCheckedChange={async () => {
                      if (pole.status === "Defective" || pole.status === "In Progress") {
                        try {
                          await markRepaired(pole.id);
                          toast.success(`Pole ${pole.id} marked as operational`, {
                            className: "bg-[#1A365D] text-white border-none shadow-xl"
                          });
                        } catch (error) {
                          toast.error("Failed to update pole status");
                        }
                      }
                    }}
                  />
                </div>
                <p className="text-[10px] text-slate-400 font-medium leading-relaxed italic border-l-2 border-slate-100 pl-3">
                  Syncing status will notify the maintenance team that this unit is once again drawing power correctly.
                </p>
              </div>

              <Separator className="bg-slate-100" />

              {/* Fault Reports Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                    Fault History ({pole.reports.length})
                  </h3>
                </div>

                {pole.reports.length === 0 ? (
                  <div className="text-center py-12 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                    <CheckCircle className="w-8 h-8 text-slate-200 mx-auto mb-3" />
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-300">No fault logs found</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {pole.reports.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()).map((r) => (
                      <div key={r.id} className="rounded-2xl border border-slate-200 bg-white p-5 space-y-4 hover:shadow-md transition-all">
                        <div className="flex items-center justify-between border-b border-slate-50 pb-3">
                          <Badge variant="outline" className="font-bold uppercase text-[9px] tracking-tighter bg-slate-50">
                            {r.faultType}
                          </Badge>
                          <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                            <Clock className="w-3 h-3" />
                            {format(r.timestamp, "MMM d, yyyy")}
                          </div>
                        </div>

                        <div className="space-y-3">
                          {r.description && (
                            <div className="space-y-1">
                              <p className="text-[9px] font-black uppercase tracking-widest text-slate-300">Observation</p>
                              <p className="text-sm text-[#1A365D] leading-relaxed font-medium">"{r.description}"</p>
                            </div>
                          )}

                          {r.contactInfo && (
                            <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400">
                              <Phone className="w-3 h-3" />
                              {r.contactInfo}
                            </div>
                          )}

                          <button
                            className="w-full relative group cursor-pointer overflow-hidden rounded-xl border-2 border-dashed border-[#1A365D]/10 bg-slate-50/50 p-4 hover:bg-[#1A365D]/5 hover:border-[#1A365D]/30 transition-all text-center"
                            onClick={async () => {
                              setFetchingPhoto(true);
                              try {
                                const details = await fetchReportDetails(r.id);
                                if (details?.photoUrl) {
                                  setViewingPhoto(details.photoUrl);
                                } else {
                                  toast.error("No photo evidence attached to this report.");
                                }
                              } catch (e) {
                                toast.error("Error fetching photo evidence.");
                              } finally {
                                setFetchingPhoto(false);
                              }
                            }}
                          >
                            <div className="flex flex-col items-center gap-2">
                              <Camera className="w-5 h-5 text-[#1A365D]/40 group-hover:scale-110 transition-transform" />
                              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#1A365D]/60 group-hover:text-[#1A365D]">
                                Inspect Evidence
                              </span>
                            </div>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Premium Footer */}
          <div className="p-4 bg-slate-50 border-t border-slate-100 text-center shrink-0">
            <p className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-400">
              Infrastructure Integrity Management
            </p>
          </div>
        </DrawerPrimitive.Content>

        {/* Global Overlays Moved INSIDE Portal to maintain context */}
        {fetchingPhoto && <LoadingScreen message="Establishing Secure View..." translucent />}

        {viewingPhoto && (
          <div
            className="fixed inset-0 bg-black/95 z-[1000] flex items-center justify-center p-4 animate-in fade-in duration-300 backdrop-blur-md"
            onPointerDown={(e) => e.stopPropagation()}
          >
            {/* Overlay for clicking to close */}
            <div className="absolute inset-0 z-0" onClick={(e) => { e.stopPropagation(); setViewingPhoto(null); }} />

            <div className="relative max-w-5xl w-full h-full flex flex-col justify-center items-center gap-6 z-10 pointer-events-none">
              {/* Close Button */}
              <button
                onClick={(e) => { e.stopPropagation(); setViewingPhoto(null); }}
                className="absolute top-4 right-4 bg-white/10 hover:bg-white/20 p-3 rounded-full text-white transition-colors pointer-events-auto shadow-2xl backdrop-blur-xl border border-white/20"
                aria-label="Close photo"
              >
                <X className="w-6 h-6" />
              </button>

              <div className="relative pointer-events-auto">
                <img
                  src={viewingPhoto}
                  className="max-h-[85vh] w-auto object-contain rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.5)] animate-in zoom-in-95 duration-300 border border-white/10"
                  alt="Fault Detail"
                />
              </div>

              <div className="text-center pointer-events-auto">
                <p className="text-white/60 text-[10px] font-black uppercase tracking-[0.5em] animate-pulse">
                  Click Button or Outside to return
                </p>
              </div>
            </div>
          </div>
        )}
      </DrawerPrimitive.Portal>
    </DrawerPrimitive.Root>
  );
};

// Internal CheckCircle for the Redesign
const CheckCircle = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
  </svg>
);

export default PoleDrawer;
