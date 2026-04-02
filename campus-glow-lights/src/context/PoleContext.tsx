import React, { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { supabase } from "@/lib/supabase";

export interface FaultReport {
  id: string;
  poleId: string;
  faultType: string;
  severity: "Low" | "Medium" | "High" | "Critical";
  description: string;
  photoUrl?: string;
  timestamp: Date;
  reportedBy: string;
  contactInfo: string;
}

export interface Pole {
  id: string;
  zone: string;
  status: "Operational" | "Defective" | "In Progress";
  daysOutage: number;
  lastInspected: Date;
  installDate: Date;
  reports: FaultReport[];
  beforePhoto?: string; // Temp storage for "In Progress" states
}

export interface Repair {
  id: string;
  poleId: string;
  techName: string;
  faultCategory: string;
  workNotes?: string;
  beforePhotoUrl?: string;
  afterPhotoUrl?: string;
  status: string;
  timestamp: Date;
}

interface PoleContextType {
  poles: Pole[];
  repairs: Repair[];
  submitReport: (poleId: string, faultType: string, severity: string, description: string, photoUrl: string, contactInfo: string) => Promise<void>;
  startRepair: (poleId: string, beforePhoto: string) => Promise<void>;
  markRepaired: (poleId: string) => Promise<void>;
  submitRepair: (repair: Partial<Repair>) => Promise<void>;
  addPole: (pole: Partial<Pole>) => Promise<void>;
  deletePole: (id: string) => Promise<void>;
  deleteRepair: (id: string) => Promise<void>;
  deleteReport: (id: string) => Promise<void>;
  deleteAllRepairs: () => Promise<void>;
  deleteAllReports: () => Promise<void>;
  fetchReportDetails: (id: string) => Promise<{ photoUrl: string | null, description: string } | null>;
  fetchRepairDetails: (id: string) => Promise<{ before: string, after: string, notes: string } | null>;
  fetchPoleBeforePhoto: (id: string) => Promise<string | null>;
  loading: boolean;
  loadingRepairs: boolean;
}

const PoleContext = createContext<PoleContextType | undefined>(undefined);

export const PoleProvider = ({ children }: { children: ReactNode }) => {
  const [poles, setPoles] = useState<Pole[]>([]);
  const [repairs, setRepairs] = useState<Repair[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingRepairs, setLoadingRepairs] = useState(true);

  const fetchPoles = async () => {
    try {
      const { data: polesData, error: polesError } = await supabase
        .from("poles")
        .select(`
          id, zone, status, days_outage, last_inspected, install_date,
          reports (id, pole_id, fault_type, severity, description, timestamp, reported_by, contact_info)
        `);

      if (polesError) throw polesError;

      const mappedPoles: Pole[] = (polesData || []).map((p: any) => ({
        id: p.id,
        zone: p.zone,
        status: p.status,
        daysOutage: p.days_outage || 0,
        lastInspected: new Date(p.last_inspected),
        installDate: new Date(p.install_date),
        reports: (p.reports || []).map((r: any) => ({
          id: r.id,
          poleId: r.pole_id,
          faultType: r.fault_type,
          severity: r.severity,
          description: r.description,
          photoUrl: r.photo_url,
          timestamp: new Date(r.timestamp),
          reportedBy: r.reported_by,
          contactInfo: r.contact_info,
        })),
      }));

      setPoles(mappedPoles);
    } catch (error) {
      console.error("Error fetching poles:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRepairs = async () => {
    try {
      const { data, error } = await supabase
        .from("repairs")
        .select("id, pole_id, tech_name, fault_category, status, timestamp")
        .order("timestamp", { ascending: false });

      if (error) throw error;

      const mappedRepairs: Repair[] = (data || []).map((r: any) => ({
        id: r.id,
        poleId: r.pole_id,
        techName: r.tech_name,
        faultCategory: r.fault_category,
        workNotes: r.work_notes,
        status: r.status,
        timestamp: new Date(r.timestamp),
      }));

      setRepairs(mappedRepairs);
    } catch (error) {
      console.error("Error fetching repairs:", error);
    } finally {
      setLoadingRepairs(false);
    }
  };

  const fetchReportDetails = async (id: string) => {
    const { data, error } = await supabase.from("reports").select("photo_url, description").eq("id", id).single();
    if (error) return null;
    return { photoUrl: data.photo_url, description: data.description };
  };

  const fetchRepairDetails = async (id: string) => {
    const { data, error } = await supabase.from("repairs").select("before_photo_url, after_photo_url, work_notes").eq("id", id).single();
    if (error) return null;
    return { before: data.before_photo_url, after: data.after_photo_url, notes: data.work_notes };
  };

  useEffect(() => {
    fetchPoles();
    fetchRepairs();

    const channel = supabase
      .channel("db-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "poles" },
        () => fetchPoles()
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "reports" },
        () => fetchPoles()
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "repairs" },
        () => fetchRepairs()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const submitReport = async (
    poleId: string,
    faultType: string,
    severity: string,
    description: string,
    photoUrl: string,
    contactInfo: string
  ) => {
    try {
      const { error: reportError } = await supabase.from("reports").insert([
        {
          pole_id: poleId,
          fault_type: faultType,
          severity,
          description,
          photo_url: photoUrl,
          reported_by: "Student",
          contact_info: contactInfo,
        },
      ]);

      if (reportError) throw reportError;

      const { error: poleError } = await supabase
        .from("poles")
        .update({ status: "Defective", days_outage: 0 })
        .eq("id", poleId);

      if (poleError) throw poleError;
    } catch (error: any) {
      console.error("Supabase Submit Report Error:", error.message || error);
      throw error;
    }
  };

  const startRepair = async (poleId: string, beforePhoto: string) => {
    try {
      const { error } = await supabase
        .from("poles")
        .update({
          status: "In Progress",
          current_repair_before_photo: beforePhoto
        })
        .eq("id", poleId);

      if (error) throw error;
    } catch (error) {
      console.error("Error starting repair:", error);
      throw error;
    }
  };

  const markRepaired = async (poleId: string) => {
    try {
      const { error } = await supabase
        .from("poles")
        .update({
          status: "Operational",
          days_outage: 0,
          last_inspected: new Date().toISOString(),
          current_repair_before_photo: null
        })
        .eq("id", poleId);

      if (error) throw error;
    } catch (error) {
      console.error("Error marking pole as repaired:", error);
      throw error;
    }
  };

  const submitRepair = async (repair: Partial<Repair>) => {
    try {
      const { error } = await supabase.from("repairs").insert([
        {
          pole_id: repair.poleId,
          tech_name: repair.techName,
          fault_category: repair.faultCategory,
          work_notes: repair.workNotes,
          before_photo_url: repair.beforePhotoUrl,
          after_photo_url: repair.afterPhotoUrl,
          status: "Success",
        },
      ]);

      if (error) throw error;

      // When submitting a repair, we also mark the pole as operational
      if (repair.poleId) {
        await markRepaired(repair.poleId);
      }
    } catch (error: any) {
      console.error("Supabase Submit Repair Error:", error.message || error);
      throw error;
    }
  };

  const addPole = async (pole: Partial<Pole>) => {
    try {
      const { error } = await supabase.from("poles").insert([
        {
          id: pole.id,
          zone: pole.zone,
          status: pole.status || "Operational",
          days_outage: pole.daysOutage || 0,
          last_inspected: pole.lastInspected?.toISOString() || new Date().toISOString(),
          install_date: pole.installDate?.toISOString() || new Date().toISOString(),
        },
      ]);

      if (error) throw error;
    } catch (error) {
      console.error("Error adding pole:", error);
      throw error;
    }
  };

  const deletePole = async (id: string) => {
    try {
      // First, delete associated reports and repairs to avoid foreign key constraints
      await supabase.from("reports").delete().eq("pole_id", id);
      await supabase.from("repairs").delete().eq("pole_id", id);

      const { error } = await supabase.from("poles").delete().eq("id", id);
      if (error) throw error;

      // Local state will be updated by subscription, but manual filter ensures immediate UI feedback
      setPoles(prev => prev.filter(p => p.id !== id));
    } catch (error) {
      console.error("Error deleting pole:", error);
      throw error;
    }
  };

  const deleteRepair = async (id: string) => {
    try {
      const { error } = await supabase.from("repairs").delete().eq("id", id);
      if (error) throw error;
      // Local state will be updated by subscription, but we can also do it manually for immediate feedback
      setRepairs(prev => prev.filter(r => r.id !== id));
    } catch (error) {
      console.error("Error deleting repair record:", error);
      throw error;
    }
  };

  const deleteReport = async (id: string) => {
    try {
      const { error } = await supabase.from("reports").delete().eq("id", id);
      if (error) throw error;
      // Subscription will handle state, but manual update for safety
      setPoles(prev => prev.map(p => ({
        ...p,
        reports: p.reports.filter(r => r.id !== id)
      })));
    } catch (error) {
      console.error("Error deleting report:", error);
      throw error;
    }
  };

  const deleteAllRepairs = async () => {
    try {
      const { error } = await supabase.from("repairs").delete().neq("id", "placeholder"); // Delete all
      if (error) throw error;
      setRepairs([]);
    } catch (error) {
      console.error("Error deleting all repairs:", error);
      throw error;
    }
  };

  const deleteAllReports = async () => {
    try {
      const { error } = await supabase.from("reports").delete().neq("id", "placeholder"); // Delete all
      if (error) throw error;
      setPoles(prev => prev.map(p => ({ ...p, reports: [] })));
    } catch (error) {
      console.error("Error deleting all reports:", error);
      throw error;
    }
  };

  const fetchPoleBeforePhoto = async (id: string) => {
    const { data, error } = await supabase.from("poles").select("current_repair_before_photo").eq("id", id).single();
    if (error) return null;
    return data.current_repair_before_photo;
  };

  return (
    <PoleContext.Provider value={{
      poles,
      repairs,
      submitReport,
      startRepair,
      markRepaired,
      submitRepair,
      addPole,
      deletePole,
      deleteRepair,
      deleteReport,
      deleteAllRepairs,
      deleteAllReports,
      fetchReportDetails,
      fetchRepairDetails,
      fetchPoleBeforePhoto,
      loading,
      loadingRepairs
    }}>
      {children}
    </PoleContext.Provider>
  );
};

export const usePoles = () => {
  const ctx = useContext(PoleContext);
  if (!ctx) throw new Error("usePoles must be used within PoleProvider");
  return ctx;
};
