import { useState, useMemo, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import {
  AlertTriangle, CheckCircle, Wrench, Search, Eye, QrCode, LayoutDashboard,
  Activity, Clock, TrendingUp, Filter, ArrowUpDown, BarChart3, MapPin,
  Trash2, PlusCircle, HelpCircle, FileText, User, History as HistoryIcon,
  Settings, LogOut, Users, UserPlus, Phone, MapPinned,
  Eye as EyeIcon, EyeOff
} from "lucide-react";
import { Link } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import LoadingScreen from "@/components/LoadingScreen";
import StatCard from "@/components/StatCard";
import PoleDrawer from "@/components/PoleDrawer";
import QRGenerator from "@/components/QRGenerator";
import { AddPoleModal } from "@/components/AddPoleModal";
import { usePoles, type Pole } from "@/context/PoleContext";
import { format } from "date-fns";
import ugLogo from "@/assets/ug-logo.png";
import DeveloperCredit from "@/components/DeveloperCredit";
import {
  PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar,
  XAxis, YAxis, Tooltip, CartesianGrid
} from "recharts";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import {
  Dialog, DialogContent, DialogTitle, DialogDescription
} from "@/components/ui/dialog";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { generateReceiptHtml } from "@/lib/receipt-utils";

const Dashboard = () => {
  const navigate = useNavigate();
  const {
    poles, loading, loadingRepairs, deletePole, repairs, deleteRepair,
    fetchRepairDetails, deleteReport, deleteAllRepairs
  } = usePoles();
  // Expose methods to window for the inline buttons in the summary lists
  (window as any).deleteReport = deleteReport;
  (window as any).deleteRepair = deleteRepair;
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState("");
  const [selectedPole, setSelectedPole] = useState<Pole | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("id");
  const [processingReceipt, setProcessingReceipt] = useState(false);
  const [showAllStreetlights, setShowAllStreetlights] = useState(false);

  // Get active tab from URL or default to "dashboard"
  const activeTab = searchParams.get("tab") || "dashboard";

  const handleTabChange = (val: string) => {
    setSearchParams({ tab: val });
  };

  // Technician management state
  const [technicians, setTechnicians] = useState<any[]>([]);
  const [loadingTechs, setLoadingTechs] = useState(false);
  const [showAddTech, setShowAddTech] = useState(false);
  const [newTech, setNewTech] = useState({ name: "", employee_id: "", phone: "", zone: "", password: "tech123" });
  const [addingTech, setAddingTech] = useState(false);
  const [showTechPassword, setShowTechPassword] = useState(false);

  // Fetch technicians on mount and when maintenance tab is active
  useEffect(() => {
    fetchTechnicians();
  }, []);

  const fetchTechnicians = async () => {
    setLoadingTechs(true);
    try {
      const { data, error } = await supabase
        .from("technicians")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      setTechnicians(data || []);
    } catch (err) {
      console.error("Failed to fetch technicians:", err);
    } finally {
      setLoadingTechs(false);
    }
  };

  const handleAddTechnician = async () => {
    if (!newTech.name || !newTech.employee_id) {
      toast.error("Name and Employee ID are required.");
      return;
    }
    setAddingTech(true);
    try {
      const { error } = await supabase
        .from("technicians")
        .insert([{
          name: newTech.name,
          employee_id: newTech.employee_id,
          phone: newTech.phone,
          zone: newTech.zone,
          password: newTech.password || "tech123",
        }]);
      if (error) throw error;
      toast.success(`Technician ${newTech.name} onboarded!`, {
        className: "bg-[#1A365D] text-white border-none shadow-xl"
      });
      setNewTech({ name: "", employee_id: "", phone: "", zone: "", password: "tech123" });
      setShowAddTech(false);
      fetchTechnicians();
    } catch (err: any) {
      if (err?.code === "23505") {
        toast.error("Employee ID already exists.");
      } else {
        toast.error("Failed to add technician.");
      }
    } finally {
      setAddingTech(false);
    }
  };

  const handleDeleteTechnician = async (id: string, name: string) => {
    if (!confirm(`Remove technician ${name}?`)) return;
    try {
      const { error } = await supabase
        .from("technicians")
        .delete()
        .eq("id", id);
      if (error) throw error;
      toast.success(`${name} removed.`);
      fetchTechnicians();
    } catch (err) {
      toast.error("Failed to remove technician.");
    }
  };

  const activeFaults = poles.filter((p) => p.status === "Defective").length;
  const operational = poles.filter((p) => p.status === "Operational").length;
  const totalReports = poles.reduce((sum, p) => sum + p.reports.length, 0);
  const totalRepairs = repairs.length;
  const criticalFaults = poles.filter((p) => p.daysOutage >= 5).length;
  const avgOutage = activeFaults > 0 ? Math.round(poles.filter(p => p.status === "Defective").reduce((s, p) => s + p.daysOutage, 0) / activeFaults) : 0;
  const healthPercent = poles.length > 0 ? Math.round((operational / poles.length) * 100) : 0;

  // Fault type breakdown for chart
  const faultTypeData = useMemo(() => {
    const map: Record<string, number> = {};
    poles.forEach(p => p.reports.forEach(r => { map[r.faultType] = (map[r.faultType] || 0) + 1; }));
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [poles]);

  // Zone breakdown
  const zoneData = useMemo(() => {
    const zones: Record<string, { total: number; defective: number }> = {};
    poles.forEach(p => {
      if (!zones[p.zone]) zones[p.zone] = { total: 0, defective: 0 };
      zones[p.zone].total++;
      if (p.status === "Defective") zones[p.zone].defective++;
    });
    return Object.entries(zones).map(([zone, data]) => ({
      zone: zone.length > 12 ? zone.slice(0, 12) + "…" : zone,
      defective: data.defective,
      operational: data.total - data.defective
    }));
  }, [poles]);

  const filtered = useMemo(() => {
    let result = poles.filter(
      (p) =>
        p.id.toLowerCase().includes(search.toLowerCase()) ||
        p.zone.toLowerCase().includes(search.toLowerCase())
    );
    if (statusFilter !== "all") {
      result = result.filter(p => p.status === statusFilter);
    }
    result.sort((a, b) => {
      if (sortBy === "id") return a.id.localeCompare(b.id);
      if (sortBy === "zone") return a.zone.localeCompare(b.zone);
      if (sortBy === "status") return a.status.localeCompare(b.status);
      if (sortBy === "outage") return b.daysOutage - a.daysOutage;
      if (sortBy === "reports") return b.reports.length - a.reports.length;
      return 0;
    });
    return result;
  }, [poles, search, statusFilter, sortBy]);

  const displayedFilteredPoles = showAllStreetlights ? filtered : filtered.slice(0, 12);

  const generatePDFReport = () => {
    try {
      const doc = new jsPDF();
      const timestamp = format(new Date(), "PPpp");

      // Add Logo/Header
      doc.setFillColor(26, 54, 93); // #1A365D Primary Color
      doc.rect(0, 0, 210, 45, "F");

      // Brand Title
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(24);
      doc.setFont("helvetica", "bold");
      doc.text("UNIVERSITY OF GHANA", 105, 20, { align: "center" });
      doc.setFontSize(14);
      doc.text("CAMPUS GLOW: STREETLIGHT ASSESSMENT REPORT", 105, 30, { align: "center" });

      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(200, 200, 200);
      doc.text(`Official System Generated Document · ${timestamp}`, 105, 38, { align: "center" });

      // Section 1: Executive Summary
      doc.setTextColor(26, 54, 93);
      doc.setFontSize(16);
      doc.text("EXECUTIVE SUMMARY", 15, 60);
      doc.setDrawColor(26, 54, 93);
      doc.setLineWidth(0.5);
      doc.line(15, 63, 75, 63);

      // Summary Cards (drawn manually)
      const stats = [
        { label: "Active Faults", value: activeFaults.toString() },
        { label: "Operational", value: operational.toString() },
        { label: "System Health", value: `${healthPercent}%` },
        { label: "Total Repairs", value: totalRepairs.toString() }
      ];

      stats.forEach((stat, i) => {
        const x = 15 + (i * 48);
        doc.setFillColor(248, 250, 252); // slate-50
        doc.roundedRect(x, 70, 42, 25, 3, 3, "F");
        doc.setDrawColor(226, 232, 240); // slate-200
        doc.roundedRect(x, 70, 42, 25, 3, 3, "S");

        doc.setTextColor(100, 116, 139); // slate-500
        doc.setFontSize(8);
        doc.text(stat.label.toUpperCase(), x + 21, 80, { align: "center" });

        doc.setTextColor(26, 54, 93);
        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        doc.text(stat.value, x + 21, 88, { align: "center" });
      });

      // Section 2: Defective Poles (Priority)
      doc.setFont("helvetica", "bold");
      doc.setFontSize(16);
      doc.text("DEFECTIVE UNIT ANALYSIS", 15, 115);
      doc.line(15, 118, 90, 118);

      const defectiveData = poles
        .filter(p => p.status === "Defective")
        .sort((a, b) => b.daysOutage - a.daysOutage)
        .slice(0, 15)
        .map(p => [
          p.id,
          p.zone,
          `${p.daysOutage} Days`,
          p.reports[0]?.faultType || "Power Failure",
          p.reports[0]?.severity || "Medium"
        ]);

      autoTable(doc, {
        startY: 125,
        head: [['POLE ID', 'ZONE/LOCATION', 'OUTAGE', 'ISSUE CATEGORY', 'SEVERITY']],
        body: defectiveData,
        headStyles: { fillColor: [26, 54, 93], textColor: [255, 255, 255], fontStyle: 'bold', halign: 'center' },
        bodyStyles: { textColor: [30, 41, 59] },
        alternateRowStyles: { fillColor: [249, 251, 253] },
        styles: { fontSize: 9, cellPadding: 5 },
        columnStyles: {
          0: { fontStyle: 'bold' },
          2: { halign: 'center' },
          4: { fontStyle: 'bold', halign: 'center' }
        }
      });

      // Section 3: Recent Maintenance
      const finalY = (doc as any).lastAutoTable.finalY + 20;

      if (finalY < 230) {
        doc.setFontSize(16);
        doc.text("RECENT MAINTENANCE TASKS", 15, finalY);
        doc.line(15, finalY + 3, 95, finalY + 3);

        const repairData = repairs.slice(0, 10).map(r => [
          format(new Date(r.timestamp), "MMM dd, yyyy"),
          r.poleId,
          r.techName,
          r.faultCategory
        ]);

        autoTable(doc, {
          startY: finalY + 10,
          head: [['COMPLETION DATE', 'POLE ID', 'ASSIGNED TECHNICIAN', 'REPAIR CATEGORY']],
          body: repairData,
          headStyles: { fillColor: [51, 65, 85], textColor: [255, 255, 255] },
          styles: { fontSize: 8, cellPadding: 4 }
        });
      }

      // Final Branding Footer
      const pageCount = (doc as any).internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setDrawColor(226, 232, 240);
        doc.line(15, 280, 195, 280);
        doc.setFontSize(8);
        doc.setFont("helvetica", "italic");
        doc.setTextColor(148, 163, 184);
        doc.text("University of Ghana · Electronic Maintenance & Logistics Dept · Campus Glow Project", 105, 287, { align: "center" });
        doc.text(`Page ${i} of ${pageCount}`, 195, 287, { align: "right" });
      }

      doc.save(`UG_Campus_Glow_Report_${format(new Date(), "yyyy-MM-dd")}.pdf`);
      toast.success("Professional Assessment Report generated as PDF");
    } catch (error) {
      console.error("PDF generation failed:", error);
      toast.error("Cloud PDF generation failed. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-[#1A365D] text-white border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3">
            <img src={ugLogo} alt="UG Logo" className="w-8 h-8 sm:w-9 sm:h-9 object-contain" />
            <div>
              <h1 className="text-lg sm:text-xl font-display font-bold leading-none">Campus Glow</h1>
              <p className="hidden sm:block text-[10px] opacity-75 mt-0.5 font-medium uppercase tracking-wider">Streetlight Management</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="hidden md:flex items-center gap-2 text-[10px] opacity-75 font-bold uppercase tracking-widest mr-2">
              <Clock className="w-3.5 h-3.5" />
              {format(new Date(), "MMM d, yyyy h:mm a")}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/dashboard/settings")}
              className="text-white hover:bg-white/10 h-8 px-2 sm:px-3"
              title="Settings"
            >
              <Settings className="w-4 h-4" />
              <span className="hidden sm:inline ml-1.5 text-xs font-bold">Settings</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                sessionStorage.removeItem("admin_auth");
                navigate("/admin-login", { replace: true });
              }}
              className="text-white hover:bg-white/10 h-8 px-2 sm:px-3"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline ml-1.5 text-xs font-bold">Sign Out</span>
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {loading || loadingRepairs ? (
          <LoadingScreen message="Syncing with Supabase..." fullScreen />
        ) : (
          <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
              <div className="w-full lg:w-auto overflow-x-auto pb-2 lg:pb-0 scrollbar-hide">
                <TabsList className="inline-flex w-max lg:w-auto h-11 p-1 bg-muted/50 rounded-xl">
                  <TabsTrigger value="dashboard" className="rounded-lg px-4 py-2 transition-all data-[state=active]:bg-white data-[state=active]:shadow-sm">
                    <LayoutDashboard className="w-4 h-4 mr-2" /> <span className="text-sm">Dashboard</span>
                  </TabsTrigger>
                  <TabsTrigger value="analytics" className="rounded-lg px-4 py-2 transition-all data-[state=active]:bg-white data-[state=active]:shadow-sm">
                    <BarChart3 className="w-4 h-4 mr-2" /> <span className="text-sm">Analytics</span>
                  </TabsTrigger>
                  <TabsTrigger value="qr" className="rounded-lg px-4 py-2 transition-all data-[state=active]:bg-white data-[state=active]:shadow-sm">
                    <QrCode className="w-4 h-4 mr-2" /> <span className="text-sm">QR Management</span>
                  </TabsTrigger>
                  <TabsTrigger value="maintenance" className="rounded-lg px-4 py-2 transition-all data-[state=active]:bg-white data-[state=active]:shadow-sm">
                    <HistoryIcon className="w-4 h-4 mr-2" /> <span className="text-sm">Maintenance</span>
                  </TabsTrigger>
                </TabsList>
              </div>

              <div className="flex w-full lg:w-auto flex-wrap items-center gap-2">
                <Button
                  onClick={generatePDFReport}
                  variant="outline"
                  className="flex-1 lg:flex-none justify-center bg-[#1A365D] hover:bg-[#1A365D]/90 text-white font-bold h-10 px-4 rounded-lg shadow-sm gap-2 border-none whitespace-nowrap"
                >
                  <FileText className="w-4 h-4" />
                  <span className="text-xs">Export PDF</span>
                </Button>
                <div className="flex-1 lg:flex-none">
                  <AddPoleModal />
                </div>
              </div>
            </div>

            <TabsContent value="dashboard" className="space-y-6">
              {/* Stats */}
              <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                <StatCard title="Active Faults" value={activeFaults} icon={AlertTriangle} variant="destructive" subtitle={`${criticalFaults} critical`} />
                <StatCard title="Operational" value={operational} icon={CheckCircle} variant="success" subtitle={`${healthPercent}% health`} />
                <StatCard title="Total Poles" value={poles.length} icon={Activity} variant="violet" subtitle="All zones" />
                <StatCard title="Total Technicians" value={technicians.length} icon={Users} variant="warning" subtitle="Active crew" />
                <StatCard title="Total Reports" value={totalReports} icon={TrendingUp} variant="info" subtitle="All time" />
                <StatCard title="Total Repairs" value={totalRepairs} icon={Wrench} variant="default" subtitle="Completed fixes" />
              </div>

              {/* System Health Bar */}
              <div className="rounded-xl border bg-card p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-foreground">System Health</p>
                  <span className={`text-sm font-bold ${healthPercent >= 80 ? "text-success" : healthPercent >= 50 ? "text-warning" : "text-destructive"}`}>{healthPercent}%</span>
                </div>
                <Progress value={healthPercent} className="h-2.5" />
                <p className="text-xs text-muted-foreground mt-1.5">{operational} of {poles.length} poles operational</p>
              </div>

              {/* Table */}
              <div className="rounded-xl border bg-card">
                <div className="p-4 border-b flex flex-col sm:flex-row sm:items-center gap-3">
                  <h2 className="font-display font-semibold text-foreground">All Streetlights</h2>
                  <div className="flex flex-col sm:flex-row sm:ml-auto gap-2 w-full sm:w-auto">
                    <div className="relative w-full sm:w-60">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        placeholder="Search by ID or zone..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-9"
                      />
                    </div>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="w-full sm:w-40">
                        <Filter className="w-3.5 h-3.5 mr-1.5" />
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="Operational">Operational</SelectItem>
                        <SelectItem value="Defective">Defective</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={sortBy} onValueChange={setSortBy}>
                      <SelectTrigger className="w-full sm:w-40">
                        <ArrowUpDown className="w-3.5 h-3.5 mr-1.5" />
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="id">Sort by ID</SelectItem>
                        <SelectItem value="zone">Sort by Zone</SelectItem>
                        <SelectItem value="status">Sort by Status</SelectItem>
                        <SelectItem value="outage">Sort by Outage</SelectItem>
                        <SelectItem value="reports">Sort by Reports</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="px-4 py-2 border-b bg-muted/30">
                  <p className="text-xs text-muted-foreground">Showing {filtered.length} of {poles.length} poles</p>
                </div>

                {/* Desktop Table */}
                <div className="hidden sm:block overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Pole ID</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Location</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Outage</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Reports</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Inspected</th>
                        <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {displayedFilteredPoles.map((pole) => (
                        <tr key={pole.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                          <td className="px-4 py-3 font-mono font-semibold text-sm text-foreground">{pole.id}</td>
                          <td className="px-4 py-3 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{pole.zone}</span>
                          </td>
                          <td className="px-4 py-3">
                            {pole.status === "Operational" ? (
                              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-success">
                                <span className="w-2 h-2 rounded-full bg-success pulse-green" />
                                Operational
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-destructive">
                                <span className="w-2 h-2 rounded-full bg-destructive glow-red" />
                                Defective
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            {pole.daysOutage > 0 ? (
                              <span className={`font-medium ${pole.daysOutage >= 5 ? "text-destructive" : "text-warning"}`}>
                                {pole.daysOutage}d
                              </span>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <Badge variant={pole.reports.length > 0 ? "secondary" : "outline"} className="text-xs">
                              {pole.reports.length}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-xs text-muted-foreground">
                            {format(new Date(pole.lastInspected), "MMM d")}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => { setSelectedPole(pole); setDrawerOpen(true); }}
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-destructive hover:bg-destructive/10"
                                onClick={() => {
                                  if (confirm(`Delete pole ${pole.id}?`)) {
                                    deletePole(pole.id)
                                      .then(() => toast.success("Pole deleted successfully"))
                                      .catch((err) => {
                                        console.error("Delete error:", err);
                                        toast.error(`Could not delete pole: ${err.message || "Unknown error"}. Ensure there are no active reports or repairs linked to it.`);
                                      });
                                  }
                                }}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {filtered.length > 12 && (
                    <div className="p-4 border-t flex justify-center bg-muted/10">
                      <Button variant="ghost" size="sm" onClick={() => setShowAllStreetlights(!showAllStreetlights)}>
                        {showAllStreetlights ? "View Less" : `View All (${filtered.length})`}
                      </Button>
                    </div>
                  )}
                </div>

                {/* Mobile Cards */}
                <div className="sm:hidden divide-y">
                  {displayedFilteredPoles.map((pole) => (
                    <div key={pole.id} className="p-4 space-y-2 active:bg-muted/30" onClick={() => { setSelectedPole(pole); setDrawerOpen(true); }}>
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-semibold text-sm text-foreground">{pole.id}</span>
                        {pole.status === "Operational" ? (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-success">
                            <span className="w-2 h-2 rounded-full bg-success pulse-green" /> Operational
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-destructive">
                            <span className="w-2 h-2 rounded-full bg-destructive glow-red" /> Defective
                          </span>
                        )}
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-muted-foreground flex items-center gap-1"><MapPin className="w-3 h-3" />{pole.zone}</p>
                        {pole.reports.length > 0 && <Badge variant="secondary" className="text-xs">{pole.reports.length} report{pole.reports.length !== 1 ? "s" : ""}</Badge>}
                      </div>
                      {pole.daysOutage > 0 && <p className="text-xs text-destructive font-medium">{pole.daysOutage} day{pole.daysOutage !== 1 ? "s" : ""} outage</p>}
                    </div>
                  ))}
                  {filtered.length > 12 && (
                    <div className="p-4 flex justify-center bg-muted/10">
                      <Button variant="ghost" size="sm" onClick={() => setShowAllStreetlights(!showAllStreetlights)}>
                        {showAllStreetlights ? "View Less" : `View All (${filtered.length})`}
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="analytics" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Status Pie Chart */}
                <div className="rounded-xl border bg-card p-5">
                  <h3 className="font-display font-semibold text-foreground mb-4">Status Distribution</h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={[
                            { name: "Operational", value: operational },
                            { name: "Defective", value: activeFaults },
                          ]}
                          cx="50%" cy="50%" innerRadius={60} outerRadius={90}
                          dataKey="value" paddingAngle={4}
                        >
                          <Cell fill="hsl(142, 71%, 35%)" />
                          <Cell fill="hsl(0, 72%, 51%)" />
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex justify-center gap-6 mt-2">
                    <span className="flex items-center gap-1.5 text-xs"><span className="w-3 h-3 rounded-sm bg-success" /> Operational</span>
                    <span className="flex items-center gap-1.5 text-xs"><span className="w-3 h-3 rounded-sm bg-destructive" /> Defective</span>
                  </div>
                </div>

                {/* Fault Types Bar Chart */}
                <div className="rounded-xl border bg-card p-5">
                  <h3 className="font-display font-semibold text-foreground mb-4">Fault Types</h3>
                  {faultTypeData.length > 0 ? (
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={faultTypeData} layout="vertical">
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(214, 20%, 88%)" />
                          <XAxis type="number" allowDecimals={false} />
                          <YAxis type="category" dataKey="name" width={110} tick={{ fontSize: 12 }} />
                          <Tooltip />
                          <Bar dataKey="value" fill="hsl(215, 56%, 23%)" radius={[0, 4, 4, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground py-10 text-center">No reports yet</p>
                  )}
                </div>

                {/* Zone Health Overview */}
                <div className="rounded-xl border bg-card p-5 lg:col-span-2">
                  <h3 className="font-display font-semibold text-foreground mb-4">Zone Health</h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={zoneData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(214, 20%, 88%)" />
                        <XAxis dataKey="zone" tick={{ fontSize: 11 }} />
                        <YAxis allowDecimals={false} />
                        <Tooltip />
                        <Bar dataKey="operational" stackId="a" fill="hsl(142, 71%, 35%)" name="Operational" />
                        <Bar dataKey="defective" stackId="a" fill="hsl(0, 72%, 51%)" name="Defective" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Recent Active Reports */}
                <div className="rounded-xl border bg-card p-5 lg:col-span-2">
                  <h3 className="font-display font-semibold text-foreground mb-4">Recent Fault Reports</h3>
                  <div className="space-y-3">
                    {poles.flatMap(p => p.reports.map(r => ({ ...r, zone: p.zone }))).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 5).map((r) => (
                      <div key={r.id} className="flex items-center gap-3 p-3 rounded-lg border bg-muted/30">
                        <div className="w-9 h-9 rounded-full bg-destructive/10 flex items-center justify-center shrink-0">
                          <AlertTriangle className="w-4 h-4 text-destructive" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">{r.faultType} — <span className="font-mono">{r.poleId}</span></p>
                          <p className="text-xs text-muted-foreground">{r.zone} • {format(new Date(r.timestamp), "MMM d, h:mm a")}</p>
                        </div>
                        <Badge variant="outline" className="shrink-0 text-xs">{r.severity}</Badge>
                      </div>
                    ))}
                    {totalReports === 0 && <p className="text-sm text-muted-foreground text-center py-6">No reports yet</p>}
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="qr">
              <QRGenerator />
            </TabsContent>

            <TabsContent value="maintenance" className="space-y-6">
              <div className="rounded-xl border bg-card">
                <div className="p-4 border-b flex flex-col sm:flex-row sm:items-center gap-3">
                  <h2 className="font-display font-semibold text-foreground">Maintenance Reports</h2>
                  <div className="flex flex-col sm:ml-auto gap-2 w-full sm:w-auto">
                    <div className="relative w-full sm:w-60">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        placeholder="Search pole or tech..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-9"
                      />
                    </div>
                  </div>
                </div>

                {/* Desktop View */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b bg-muted/50 text-[10px] uppercase font-bold text-muted-foreground">
                        <th className="text-left px-6 py-4">Date/Time</th>
                        <th className="text-left px-6 py-4">Technician</th>
                        <th className="text-left px-6 py-4">Pole ID</th>
                        <th className="text-left px-6 py-4">Status</th>
                        <th className="text-right px-6 py-4">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {repairs.filter(r =>
                        r.poleId.toLowerCase().includes(search.toLowerCase()) ||
                        r.techName.toLowerCase().includes(search.toLowerCase())
                      ).map((repair) => (
                        <tr key={repair.id} className="hover:bg-muted/30 transition-colors">
                          <td className="px-6 py-4 text-xs font-medium">
                            {format(new Date(repair.timestamp), "MMM dd, yyyy")}
                            <div className="text-[10px] text-muted-foreground">{format(new Date(repair.timestamp), "h:mm a")}</div>
                          </td>
                          <td className="px-6 py-4 text-xs font-bold">{repair.techName}</td>
                          <td className="px-6 py-4 text-xs font-mono font-bold">{repair.poleId}</td>
                          <td className="px-6 py-4">
                            <Badge variant="outline" className="text-[10px] uppercase">{repair.faultCategory}</Badge>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="outline" size="sm" className="h-8 text-[10px] font-bold"
                                onClick={async () => {
                                  setProcessingReceipt(true);
                                  try {
                                    const details = await fetchRepairDetails(repair.id);
                                    if (details) {
                                      const win = window.open("", "_blank");
                                      const html = generateReceiptHtml({
                                        poleId: repair.poleId,
                                        techName: repair.techName,
                                        faultCategory: repair.faultCategory,
                                        timestamp: format(new Date(repair.timestamp), "MMM dd, yyyy @ h:mm a"),
                                        beforePhoto: details.before,
                                        afterPhoto: details.after,
                                        workNotes: details.notes,
                                        ugLogo: ugLogo
                                      });
                                      win?.document.write(html);
                                      win?.document.close();
                                    } else {
                                      toast.error("No documentation found.");
                                    }
                                  } catch (e) {
                                    toast.error("Error generating receipt.");
                                  } finally {
                                    setProcessingReceipt(false);
                                  }
                                }}
                              >Receipt</Button>
                              <Button
                                variant="ghost" size="sm" className="h-8 text-destructive hover:bg-destructive/10"
                                onClick={async () => {
                                  if (confirm("Delete this record permanently?")) {
                                    try {
                                      await deleteRepair(repair.id);
                                      toast.success("Record removed");
                                    } catch (e) {
                                      toast.error("Failed to remove");
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
                <div className="md:hidden divide-y divide-border">
                  {repairs.filter(r =>
                    r.poleId.toLowerCase().includes(search.toLowerCase()) ||
                    r.techName.toLowerCase().includes(search.toLowerCase())
                  ).map((repair) => (
                    <div key={repair.id} className="p-4 space-y-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-tight text-muted-foreground font-mono">{repair.poleId}</p>
                          <p className="text-xs font-bold mt-0.5">{repair.techName}</p>
                        </div>
                        <Badge variant="secondary" className="text-[9px] font-bold uppercase">{repair.faultCategory}</Badge>
                      </div>
                      <div className="flex justify-between items-center bg-muted/20 p-3 rounded-xl border border-border/50">
                        <div className="text-[10px] text-muted-foreground font-medium">
                          {format(new Date(repair.timestamp), "MMM dd, yyyy · h:mm a")}
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline" size="sm" className="h-7 text-[9px] font-black uppercase tracking-widest px-3 transition-all active:scale-95"
                            onClick={async () => {
                              setProcessingReceipt(true);
                              try {
                                const details = await fetchRepairDetails(repair.id);
                                if (details) {
                                  const win = window.open("", "_blank");
                                  const html = generateReceiptHtml({
                                    poleId: repair.poleId,
                                    techName: repair.techName,
                                    faultCategory: repair.faultCategory,
                                    timestamp: format(new Date(repair.timestamp), "MMM dd, yyyy @ h:mm a"),
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
                              } catch (e) {
                                toast.error("Error");
                              } finally {
                                setProcessingReceipt(false);
                              }
                            }}
                          >Receipt</Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-destructive"
                            onClick={async () => {
                              if (confirm("Permanently delete?")) {
                                try {
                                  await deleteRepair(repair.id);
                                  toast.success("Removed");
                                } catch (e) {
                                  toast.error("Error");
                                }
                              }
                            }}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Technician Onboarding Section */}
              <div className="rounded-xl border bg-card">
                <div className="p-4 border-b flex flex-col sm:flex-row sm:items-center gap-3">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-muted-foreground" />
                    <h2 className="font-display font-semibold text-foreground">Technician Registry</h2>
                  </div>
                  <div className="flex sm:ml-auto gap-2 w-full sm:w-auto">
                    <Button
                      onClick={() => setShowAddTech(true)}
                      className="flex-1 sm:flex-none bg-[#1A365D] hover:bg-[#1A365D]/90 text-white font-bold h-10 px-4 rounded-lg shadow-sm gap-2 border-none"
                    >
                      <UserPlus className="w-4 h-4" />
                      <span className="text-xs">Add Technician</span>
                    </Button>
                  </div>
                </div>

                {loadingTechs ? (
                  <div className="p-12 text-center">
                    <p className="text-sm text-muted-foreground animate-pulse">Loading technicians...</p>
                  </div>
                ) : technicians.length === 0 ? (
                  <div className="p-12 text-center space-y-3">
                    <Users className="w-10 h-10 text-muted-foreground/30 mx-auto" />
                    <p className="text-sm text-muted-foreground">No technicians onboarded yet.</p>
                    <Button onClick={() => setShowAddTech(true)} variant="outline" size="sm" className="gap-2">
                      <UserPlus className="w-3.5 h-3.5" /> Onboard First Technician
                    </Button>
                  </div>
                ) : (
                  <>
                    {/* Desktop Table */}
                    <div className="hidden md:block overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b bg-muted/50 text-[10px] uppercase font-bold text-muted-foreground">
                            <th className="text-left px-6 py-4">Name</th>
                            <th className="text-left px-6 py-4">Employee ID</th>
                            <th className="text-left px-6 py-4">Zone</th>
                            <th className="text-left px-6 py-4">Phone</th>
                            <th className="text-left px-6 py-4">Joined</th>
                            <th className="text-right px-6 py-4">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                          {technicians.map((tech) => (
                            <tr key={tech.id} className="hover:bg-muted/30 transition-colors">
                              <td className="px-6 py-4 text-xs font-bold">{tech.name}</td>
                              <td className="px-6 py-4 text-xs font-mono font-bold">{tech.employee_id}</td>
                              <td className="px-6 py-4 text-xs text-muted-foreground">{tech.zone || "—"}</td>
                              <td className="px-6 py-4 text-xs text-muted-foreground">{tech.phone || "—"}</td>
                              <td className="px-6 py-4 text-xs text-muted-foreground">
                                {tech.created_at ? format(new Date(tech.created_at), "MMM d, yyyy") : "—"}
                              </td>
                              <td className="px-6 py-4 text-right">
                                <Button
                                  variant="ghost" size="sm" className="h-8 text-destructive hover:bg-destructive/10"
                                  onClick={() => handleDeleteTechnician(tech.id, tech.name)}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    {/* Mobile View */}
                    <div className="md:hidden divide-y divide-border">
                      {technicians.map((tech) => (
                        <div key={tech.id} className="p-4 space-y-2">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="text-xs font-bold">{tech.name}</p>
                              <p className="text-[10px] font-mono text-muted-foreground">{tech.employee_id}</p>
                            </div>
                            <Button
                              variant="ghost" size="sm" className="h-7 text-destructive"
                              onClick={() => handleDeleteTechnician(tech.id, tech.name)}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                          <div className="flex gap-4 text-[10px] text-muted-foreground">
                            {tech.zone && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{tech.zone}</span>}
                            {tech.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{tech.phone}</span>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>

              {/* Add Technician Dialog */}
              <Dialog open={showAddTech} onOpenChange={setShowAddTech}>
                <DialogContent className="sm:max-w-md bg-white rounded-2xl p-0 overflow-hidden border-none shadow-2xl">
                  <div className="bg-[#1A365D] p-6 text-white">
                    <DialogTitle className="text-xl font-black uppercase tracking-tight">Onboard Technician</DialogTitle>
                    <DialogDescription className="text-white/60 text-xs font-bold uppercase tracking-widest mt-1">
                      Register a new field technician
                    </DialogDescription>
                  </div>
                  <div className="p-6 space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Full Name *</label>
                      <Input
                        value={newTech.name}
                        onChange={e => setNewTech(p => ({ ...p, name: e.target.value }))}
                        placeholder="e.g. Isaac Asiedu"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Employee ID *</label>
                      <Input
                        value={newTech.employee_id}
                        onChange={e => setNewTech(p => ({ ...p, employee_id: e.target.value }))}
                        placeholder="e.g. TECH-001"
                        className="font-mono"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Phone</label>
                        <Input
                          value={newTech.phone}
                          onChange={e => setNewTech(p => ({ ...p, phone: e.target.value }))}
                          placeholder="024-XXX-XXXX"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Assigned Zone</label>
                        <Input
                          value={newTech.zone}
                          onChange={e => setNewTech(p => ({ ...p, zone: e.target.value }))}
                          placeholder="e.g. Legon Campus"
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Login Password</label>
                      <div className="relative">
                        <Input
                          type={showTechPassword ? "text" : "password"}
                          value={newTech.password}
                          onChange={e => setNewTech(p => ({ ...p, password: e.target.value }))}
                          placeholder="Default: tech123"
                        />
                        <button
                          type="button"
                          onClick={() => setShowTechPassword(v => !v)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition-colors"
                        >
                          {showTechPassword ? <EyeOff className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
                        </button>
                      </div>
                      <p className="text-[10px] text-slate-400">Technician will use this password with their Employee ID to log in.</p>
                    </div>
                    <Button
                      disabled={addingTech || !newTech.name || !newTech.employee_id}
                      onClick={handleAddTechnician}
                      className="w-full bg-[#1A365D] hover:bg-[#1A365D]/90 text-white font-bold h-11 rounded-xl"
                    >
                      {addingTech ? "Registering..." : "Register Technician"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </TabsContent>
          </Tabs>
        )}

        <footer className="border-t py-12 text-center text-xs text-muted-foreground mt-20">
          University of Ghana, Legon — Campus Glow © {new Date().getFullYear()}
          <DeveloperCredit />
        </footer>
      </div>

      <PoleDrawer pole={selectedPole} open={drawerOpen} onClose={() => setDrawerOpen(false)} />
      {processingReceipt && <LoadingScreen message="Retrieving Documentation..." translucent />}
    </div >
  );
};

export default Dashboard;
