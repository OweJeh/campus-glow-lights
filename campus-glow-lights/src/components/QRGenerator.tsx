import { useState, useRef, useEffect } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Check, ChevronsUpDown, Download, Plus, Printer } from "lucide-react";
import { usePoles } from "@/context/PoleContext";
import { toast } from "sonner";
import ugLogo from "@/assets/ug-logo.png";
import html2canvas from "html2canvas";
import { cn } from "@/lib/utils";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

const QRGenerator = () => {
  const { addPole, poles } = usePoles();
  const [poleId, setPoleId] = useState("");
  const [zone, setZone] = useState("");
  const [generated, setGenerated] = useState<{ id: string; zone: string }[]>(() => {
    const saved = localStorage.getItem("generated_labels");
    return saved ? JSON.parse(saved) : [];
  });
  const cardRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  const [baseUrl, setBaseUrl] = useState(() => {
    return localStorage.getItem("qr_base_url") || window.location.origin;
  });
  const [open, setOpen] = useState(false);

  // Persist to localStorage
  useEffect(() => {
    localStorage.setItem("generated_labels", JSON.stringify(generated));
  }, [generated]);

  useEffect(() => {
    localStorage.setItem("qr_base_url", baseUrl);
  }, [baseUrl]);

  const handleSelectPole = (id: string) => {
    setPoleId(id);
    const existing = poles.find(p => p.id === id);
    if (existing) {
      setZone(existing.zone);
    }
    setOpen(false);
  };

  const handleGenerate = async () => {
    if (!poleId || !zone) {
      toast.error("Please fill in both fields");
      return;
    }
    try {
      // We still use addPole because if it's new, it saves. 
      // If it exists, Supabase will handle the constraint or we could check here.
      const isExisting = poles.some(p => p.id === poleId);
      if (!isExisting) {
        await addPole({ id: poleId, zone });
      }

      setGenerated((prev) => [...prev, { id: poleId, zone }]);
      setPoleId("");
      setZone("");
      toast.success(`QR label generated${!isExisting ? " and saved" : ""} for ${poleId}`);
    } catch (error) {
      toast.error("Failed to process request");
    }
  };

  const handleDownload = async (id: string) => {
    const el = cardRefs.current.get(id);
    if (!el) return;
    const canvas = await html2canvas(el, { backgroundColor: "#ffffff", scale: 2 });
    const link = document.createElement("a");
    link.download = `${id}-label.png`;
    link.href = canvas.toDataURL();
    link.click();
  };

  const handlePrintAll = () => window.print();

  return (
    <div className="space-y-6">
      {/* Input */}
      <div className="rounded-xl border bg-card p-5">
        <h3 className="font-display font-semibold text-foreground mb-4">Generate Pole Label</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 items-end">
          <div>
            <Label className="text-xs text-muted-foreground flex items-center justify-between">
              App URL (Use your IP for mobile)
              {baseUrl.includes("localhost") && (
                <span className="text-[10px] text-destructive animate-pulse font-bold">Localhost fails on mobile!</span>
              )}
            </Label>
            <Input
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
              placeholder="e.g. http://192.168.1.10:8080"
              className={cn(baseUrl.includes("localhost") ? "border-destructive/50" : "")}
            />

          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Pole ID</Label>
            <Popover open={open} onOpenChange={setOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={open}
                  className="w-full justify-between font-mono h-10"
                >
                  {poleId ? poleId : "Select or type ID..."}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[250px] p-0" align="start">
                <Command>
                  <CommandInput
                    placeholder="Search pole ID..."
                    value={poleId}
                    onValueChange={(v) => {
                      const val = v.toUpperCase();
                      setPoleId(val);
                      const existing = poles.find(p => p.id === val);
                      if (existing) setZone(existing.zone);
                    }}
                  />
                  <CommandList>
                    <CommandEmpty>No pole found. Type to create new.</CommandEmpty>
                    <CommandGroup heading="Existing Poles">
                      {poles.map((pole) => (
                        <CommandItem
                          key={pole.id}
                          value={pole.id}
                          onSelect={() => handleSelectPole(pole.id)}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              poleId === pole.id ? "opacity-100" : "opacity-0"
                            )}
                          />
                          {pole.id}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Campus Zone</Label>
            <Input value={zone} onChange={(e) => setZone(e.target.value)} placeholder="e.g. Main Library" />
          </div>
          <Button onClick={handleGenerate} className="gap-2">
            <Plus className="w-4 h-4" /> Generate & Save
          </Button>
        </div>
      </div>

      {/* Generated Labels */}
      {generated.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-display font-semibold text-foreground">Generated Labels ({generated.length})</h3>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={() => { if (confirm("Clear all labels?")) setGenerated([]) }} className="text-destructive h-8 px-2">
                Clear All
              </Button>
              <Button variant="outline" size="sm" onClick={handlePrintAll} className="h-8">
                <Printer className="w-4 h-4 mr-1" /> Print All
              </Button>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {generated.map((g) => (
              <div key={g.id} className="relative group">
                <div
                  ref={(el) => { if (el) cardRefs.current.set(g.id, el); }}
                  className="rounded-xl border-2 border-primary/20 bg-card p-5 text-center space-y-3"
                >
                  <img src={ugLogo} alt="UG" className="w-10 h-10 mx-auto object-contain" />
                  <p className="text-xs font-semibold text-primary tracking-wider uppercase">Campus Glow</p>
                  <div className="flex justify-center">
                    <QRCodeSVG
                      value={`${baseUrl.replace(/\/$/, "")}/report?poleId=${g.id}`}
                      size={140}
                      level="H"
                      fgColor="hsl(215,56%,23%)"
                    />
                  </div>
                  <p className="font-mono text-lg font-bold text-foreground">{g.id}</p>
                  <p className="text-xs text-muted-foreground">{g.zone}</p>
                  <div className="border-t pt-2">
                    <p className="text-[10px] text-muted-foreground">Scan to report a fault</p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => handleDownload(g.id)}
                >
                  <Download className="w-3 h-3" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default QRGenerator;
