import { useState } from "react";
import {
    Dialog, DialogContent, DialogHeader, DialogTitle,
    DialogFooter, DialogTrigger
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { CalendarIcon, PlusCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePoles } from "@/context/PoleContext";
import { toast } from "sonner";

export function AddPoleModal() {
    const { addPole } = usePoles();
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    const [id, setId] = useState("");
    const [zone, setZone] = useState("");
    const [status, setStatus] = useState<"Operational" | "Defective">("Operational");
    const [installDate, setInstallDate] = useState<Date>(new Date());
    const [lastInspected, setLastInspected] = useState<Date>(new Date());

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!id || !zone) {
            toast.error("Please fill in ID and Zone");
            return;
        }

        try {
            setLoading(true);
            await addPole({
                id,
                zone,
                status,
                installDate,
                lastInspected
            });
            toast.success(`Pole ${id} added successfully`);
            setOpen(false);
            resetForm();
        } catch (error) {
            toast.error("Failed to add pole. ID might already exist.");
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setId("");
        setZone("");
        setStatus("Operational");
        setInstallDate(new Date());
        setLastInspected(new Date());
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="gap-2">
                    <PlusCircle className="w-4 h-4" /> New Pole
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle className="font-display font-bold">Add New Streetlight Pole</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="id">Pole ID (e.g., UG-LG-100)</Label>
                        <Input
                            id="id"
                            placeholder="UG-LG-100"
                            value={id}
                            onChange={(e) => setId(e.target.value)}
                            className="font-mono uppercase"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="zone">Campus Zone</Label>
                        <Input
                            id="zone"
                            placeholder="e.g., Balme Library"
                            value={zone}
                            onChange={(e) => setZone(e.target.value)}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="status">Initial Status</Label>
                        <Select value={status} onValueChange={(v) => setStatus(v as any)}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Operational">Operational</SelectItem>
                                <SelectItem value="Defective">Defective</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-2">
                        <div className="space-y-2">
                            <Label>Install Date</Label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant={"outline"}
                                        className={cn(
                                            "w-full justify-start text-left font-normal px-3",
                                            !installDate && "text-muted-foreground"
                                        )}
                                    >
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {installDate ? format(installDate, "PPP") : <span>Pick date</span>}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar
                                        mode="single"
                                        selected={installDate}
                                        onSelect={(date) => date && setInstallDate(date)}
                                        initialFocus
                                    />
                                </PopoverContent>
                            </Popover>
                        </div>

                        <div className="space-y-2">
                            <Label>Last Inspected</Label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant={"outline"}
                                        className={cn(
                                            "w-full justify-start text-left font-normal px-3",
                                            !lastInspected && "text-muted-foreground"
                                        )}
                                    >
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {lastInspected ? format(lastInspected, "PPP") : <span>Pick date</span>}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar
                                        mode="single"
                                        selected={lastInspected}
                                        onSelect={(date) => date && setLastInspected(date)}
                                        initialFocus
                                    />
                                </PopoverContent>
                            </Popover>
                        </div>
                    </div>

                    <DialogFooter className="pt-4">
                        <Button type="submit" disabled={loading} className="w-full">
                            {loading ? "Adding..." : "Add Pole & Save to DB"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
