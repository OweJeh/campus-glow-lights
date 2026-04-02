import { useState, useMemo } from "react";
import {
    Search, FileText, ChevronRight, Download, Trash2,
    Calendar, User, Smartphone, History, Clock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

import { usePoles } from "@/context/PoleContext";
import LoadingScreen from "@/components/LoadingScreen";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import ugLogo from "@/assets/ug-logo.png";
import { generateReceiptHtml } from "@/lib/receipt-utils";

const MaintenanceHistory = () => {
    const { repairs, loadingRepairs, fetchRepairDetails, deleteRepair } = usePoles();
    const [search, setSearch] = useState("");
    const [processingReceipt, setProcessingReceipt] = useState(false);

    // Only show this technician's repairs
    const techName = sessionStorage.getItem("tech_name") || "";

    const filteredFixes = useMemo(() => {
        const normalizedTechName = (techName || "").trim().toLowerCase();

        return repairs
            .filter((f) => {
                const repairTech = (f.techName || "").trim().toLowerCase();
                return repairTech === normalizedTechName;
            })
            .filter((f) =>
                f.poleId.toLowerCase().includes(search.toLowerCase()) ||
                f.faultCategory.toLowerCase().includes(search.toLowerCase())
            );
    }, [repairs, search, techName]);

    if (loadingRepairs) {
        return <LoadingScreen message="Loading history records..." />;
    }

    return (
        <div className="space-y-6">
            {/* Search & Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-[#1A365D]">My Work History</h2>
                    <p className="text-sm text-slate-500 font-medium">Your completed maintenance actions.</p>
                </div>
                <div className="flex flex-col md:flex-row md:items-center gap-3 w-full md:w-auto mt-4 md:mt-0">
                    <div className="relative w-full md:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <Input
                            placeholder="Search by Pole ID or Fault..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-9 h-11 border-slate-200 focus-visible:ring-[#1A365D] rounded-lg"
                        />
                    </div>
                    {(window as any).deleteAllRepairs && (
                        <Button
                            variant="outline"
                            size="sm"
                            className="h-11 px-4 text-destructive border-destructive/20 hover:bg-destructive/10 font-bold uppercase tracking-tight"
                            onClick={async () => {
                                if (confirm("Clear your entire work history? This action is permanent.")) {
                                    try {
                                        await (window as any).deleteAllRepairs();
                                        toast.success("History cleared");
                                    } catch (err) {
                                        toast.error("Failed to clear history");
                                    }
                                }
                            }}
                        >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Clear History
                        </Button>
                    )}
                </div>
            </div>

            <div className="flex items-center gap-2 mb-2">
                <Badge variant="outline" className="bg-slate-100 text-[#1A365D] border-slate-200">
                    {filteredFixes.length} Completed Repairs
                </Badge>
                <span className="text-[10px] uppercase font-black tracking-widest text-slate-400">Personal Records</span>
            </div>

            {/* Table Container */}
            {/* Table/Cards Container */}
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                {/* Desktop View */}
                <div className="hidden md:block overflow-x-auto overflow-y-auto max-h-[600px]">
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50 border-b border-slate-100 sticky top-0 z-10">
                                <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-slate-400">Date/Time</th>
                                <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-slate-400">Technician</th>
                                <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-slate-400">Pole ID</th>
                                <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-slate-400">Fault Type</th>
                                <th className="px-6 py-4 text-right text-[10px] font-black uppercase tracking-widest text-slate-400">Receipt</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {filteredFixes.map((f) => (
                                <tr key={f.id} className="hover:bg-slate-50/50 transition-colors group">
                                    <td className="px-6 py-4 text-xs font-bold text-[#1A365D]">
                                        {format(f.timestamp, "MMM dd, yyyy")}
                                        <div className="text-[10px] text-slate-400 font-medium">{format(f.timestamp, "h:mm a")}</div>
                                    </td>
                                    <td className="px-6 py-4 text-xs font-bold text-slate-700">{f.techName}</td>
                                    <td className="px-6 py-4 text-xs font-black text-[#1A365D]">{f.poleId}</td>
                                    <td className="px-6 py-4">
                                        <Badge variant="secondary" className="bg-slate-100 text-slate-600 text-[10px] font-bold">{f.faultCategory}</Badge>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end gap-2 text-right">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="h-8 text-[10px] font-bold uppercase transition-all active:scale-95"
                                                onClick={async () => {
                                                    setProcessingReceipt(true);
                                                    try {
                                                        const details = await fetchRepairDetails(f.id);
                                                        if (details) {
                                                            const win = window.open("", "_blank");
                                                            const html = generateReceiptHtml({
                                                                poleId: f.poleId,
                                                                techName: f.techName,
                                                                faultCategory: f.faultCategory,
                                                                timestamp: format(new Date(f.timestamp), "MMM dd, yyyy @ h:mm a"),
                                                                beforePhoto: details.before,
                                                                afterPhoto: details.after,
                                                                workNotes: details.notes,
                                                                ugLogo: ugLogo
                                                            });
                                                            win?.document.write(html);
                                                            win?.document.close();
                                                        } else {
                                                            toast.error("Documentation not found.");
                                                        }
                                                    }
                                                    catch (e) {
                                                        toast.error("Error generating receipt.");
                                                    } finally {
                                                        setProcessingReceipt(false);
                                                    }
                                                }}
                                            >
                                                View
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-8 text-destructive hover:bg-destructive/10"
                                                onClick={async () => {
                                                    if (confirm("Permanently delete this repair record?")) {
                                                        try {
                                                            await deleteRepair(f.id);
                                                            toast.success("Record removed.");
                                                        } catch (e) {
                                                            toast.error("Failed to remove.");
                                                        }
                                                    }
                                                }}
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Mobile View */}
                <div className="md:hidden divide-y divide-slate-100">
                    {filteredFixes.map((f) => (
                        <div key={f.id} className="p-5 space-y-4">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{format(f.timestamp, "MMM dd, yyyy · h:mm a")}</p>
                                    <h3 className="text-sm font-black text-[#1A365D] tracking-tight mt-0.5">{f.poleId}</h3>
                                </div>
                                <Badge variant="secondary" className="bg-slate-100 text-slate-600 text-[9px] font-bold uppercase">{f.faultCategory}</Badge>
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="w-6 h-6 bg-[#1A365D]/5 text-[#1A365D] rounded-full flex items-center justify-center text-[9px] font-bold uppercase">{f.techName[0]}</div>
                                    <span className="text-xs font-bold text-slate-600">{f.techName}</span>
                                </div>
                                <div className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="h-8 text-[10px] font-black uppercase tracking-widest px-4 transition-all active:scale-95"
                                        onClick={async () => {
                                            setProcessingReceipt(true);
                                            try {
                                                const details = await fetchRepairDetails(f.id);
                                                if (details) {
                                                    const win = window.open("", "_blank");
                                                    const html = generateReceiptHtml({
                                                        poleId: f.poleId,
                                                        techName: f.techName,
                                                        faultCategory: f.faultCategory,
                                                        timestamp: format(new Date(f.timestamp), "MMM dd, yyyy @ h:mm a"),
                                                        beforePhoto: details.before,
                                                        afterPhoto: details.after,
                                                        workNotes: details.notes,
                                                        ugLogo: ugLogo
                                                    });
                                                    win?.document.write(html);
                                                    win?.document.close();
                                                } else {
                                                    toast.error("Photos missing");
                                                }
                                            }
                                            catch (e) {
                                                toast.error("Error");
                                            } finally {
                                                setProcessingReceipt(false);
                                            }
                                        }}
                                    >
                                        Receipt
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-8 text-destructive"
                                        onClick={async () => {
                                            if (confirm("Delete permanently?")) {
                                                try {
                                                    await deleteRepair(f.id);
                                                    toast.success("Removed");
                                                } catch (e) {
                                                    toast.error("Failed");
                                                }
                                            }
                                        }}
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {filteredFixes.length === 0 && (
                    <div className="py-20 text-center space-y-4">
                        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto">
                            <History className="w-8 h-8 text-slate-300" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-[#1A365D]">No records found</h3>
                            <p className="text-sm text-slate-500">Adjust your search to find archived maintenance logs.</p>
                        </div>
                    </div>
                )}
            </div>

            {/* Footer Info */}
            <div className="bg-[#1A365D]/5 border border-[#1A365D]/10 rounded-xl p-4 flex items-center gap-4">
                <div className="p-3 bg-white rounded-lg shadow-inner">
                    <Smartphone className="w-5 h-5 text-[#1A365D]" />
                </div>
                <div>
                    <p className="text-xs font-bold text-[#1A365D]">Cloud Synchronized</p>
                    <p className="text-[10px] text-slate-500 font-medium">All repairs are recorded for University of Ghana maintenance analytics.</p>
                </div>
                <Button
                    variant="outline"
                    className="ml-auto h-9 bg-white border-slate-200 text-[#1A365D] font-bold text-xs"
                    onClick={() => {
                        const csvData = filteredFixes.map(f => ({
                            "Date": format(f.timestamp, "yyyy-MM-dd"),
                            "Time": format(f.timestamp, "h:mm a"),
                            "Technician": f.techName,
                            "Pole ID": f.poleId,
                            "Fault Category": f.faultCategory,
                            "Work Notes": f.workNotes || "N/A",
                            "Status": f.status
                        }));
                        const ws = XLSX.utils.json_to_sheet(csvData);
                        const wb = XLSX.utils.book_new();
                        XLSX.utils.book_append_sheet(wb, ws, "Maintenance History");
                        const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
                        const data = new Blob([excelBuffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8" });
                        saveAs(data, `Maintenance_History_${format(new Date(), "yyyy-MM-dd")}.xlsx`);
                    }}
                >
                    Export Sheet
                    <Download className="w-3.5 h-3.5 ml-2" />
                </Button>
            </div>
            {processingReceipt && <LoadingScreen message="Retrieving Documentation..." translucent />}
        </div >
    );
};

export default MaintenanceHistory;
