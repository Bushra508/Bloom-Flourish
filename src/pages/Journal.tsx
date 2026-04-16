import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Leaf, Calendar, ArrowLeft, Plus, TrendingUp, ChevronRight, Pencil, Check, X, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.1, duration: 0.5 },
  }),
};

interface Plant {
  id: string;
  name: string;
  scan_date: string;
  issue: string | null;
  confidence_score: number | null;
  main_cure: string | null;
  tag: string;
  image_url: string | null;
}

interface GroupedPlant {
  name: string;
  latestScan: Plant;
  scanCount: number;
}

const tagColor = (tag: string) => {
  switch (tag) {
    case "healthy": return "text-primary bg-primary/10";
    case "monitor": return "text-yellow-600 bg-yellow-50";
    case "unhealthy": return "text-destructive bg-destructive/10";
    default: return "text-muted-foreground bg-secondary";
  }
};

const tagEmoji = (tag: string) => {
  switch (tag) {
    case "healthy": return "🌿";
    case "monitor": return "👀";
    case "unhealthy": return "🍂";
    default: return "🌱";
  }
};

/* ── Arrow connector between timeline cards ── */
const TimelineArrow = () => (
  <div className="hidden sm:flex items-center justify-center shrink-0 w-12">
    <svg width="48" height="24" viewBox="0 0 48 24" fill="none" className="text-primary/30">
      <line x1="0" y1="12" x2="38" y2="12" stroke="currentColor" strokeWidth="2" strokeDasharray="4 3" />
      <polygon points="38,6 48,12 38,18" fill="currentColor" />
    </svg>
  </div>
);

const Journal = () => {
  const { user } = useAuth();
  const [plants, setPlants] = useState<Plant[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlantName, setSelectedPlantName] = useState<string | null>(null);
  const [scans, setScans] = useState<Plant[]>([]);
  const [addOpen, setAddOpen] = useState(false);
  const [newPlantName, setNewPlantName] = useState("");
  const [addingPlant, setAddingPlant] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [editName, setEditName] = useState("");

  const fetchPlants = useCallback(async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from("plants")
      .select("*")
      .eq("user_id", user.id)
      .order("scan_date", { ascending: false });
    if (error) console.error(error);
    else setPlants(data || []);
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchPlants(); }, [fetchPlants]);

  // Group plants by name
  const grouped: GroupedPlant[] = (() => {
    const map = new Map<string, Plant[]>();
    plants.forEach(p => {
      const list = map.get(p.name) || [];
      list.push(p);
      map.set(p.name, list);
    });
    return Array.from(map.entries()).map(([name, list]) => ({
      name,
      latestScan: list[0], // already sorted desc
      scanCount: list.length,
    }));
  })();

  // Fetch scans for selected plant
  const openPlant = async (name: string) => {
    setSelectedPlantName(name);
    if (!user) return;
    const { data } = await supabase
      .from("plants")
      .select("*")
      .eq("user_id", user.id)
      .eq("name", name)
      .order("scan_date", { ascending: true });
    setScans(data || []);
  };

  const handleAddPlant = async () => {
    if (!user || !newPlantName.trim()) return;
    setAddingPlant(true);
    const { error } = await supabase.from("plants").insert({
      user_id: user.id,
      name: newPlantName.trim(),
    });
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Plant added!");
      setNewPlantName("");
      setAddOpen(false);
      fetchPlants();
    }
    setAddingPlant(false);
  };

  const handleRenamePlant = async () => {
    if (!selectedPlantName || !editName.trim() || !user) return;
    if (editName.trim() === selectedPlantName) { setEditingName(false); return; }
    const { error } = await supabase
      .from("plants")
      .update({ name: editName.trim() })
      .eq("user_id", user.id)
      .eq("name", selectedPlantName);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Plant renamed!");
      setSelectedPlantName(editName.trim());
      setScans(scans.map(s => ({ ...s, name: editName.trim() })));
      fetchPlants();
    }
    setEditingName(false);
  };

  const handleDeleteScan = async (scanId: string) => {
    const { error } = await supabase.from("plants").delete().eq("id", scanId);
    if (error) { toast.error(error.message); return; }
    toast.success("Scan deleted");
    const updated = scans.filter(s => s.id !== scanId);
    setScans(updated);
    fetchPlants();
    if (updated.length === 0) setSelectedPlantName(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Leaf className="w-8 h-8 text-primary animate-pulse" />
      </div>
    );
  }

  const AddPlantDialog = () => (
    <Dialog open={addOpen} onOpenChange={setAddOpen}>
      <DialogTrigger asChild>
        <motion.button
          variants={fadeUp} custom={grouped.length + 1}
          initial="hidden" animate="visible"
          className="rounded-2xl border-2 border-dashed border-border p-6 flex flex-col items-center justify-center text-center hover:border-primary/30 hover:bg-primary/5 transition-all min-h-[200px]"
        >
          <Plus className="w-8 h-8 text-muted-foreground/40 mb-2" />
          <span className="text-sm text-muted-foreground">Add new plant</span>
        </motion.button>
      </DialogTrigger>
      <DialogContent className="rounded-2xl">
        <DialogHeader><DialogTitle className="font-display">Add a New Plant</DialogTitle></DialogHeader>
        <div className="space-y-4 pt-2">
          <Input placeholder="e.g. Kitchen Basil" value={newPlantName} onChange={e => setNewPlantName(e.target.value)} className="rounded-xl" autoFocus />
          <Button onClick={handleAddPlant} disabled={!newPlantName.trim() || addingPlant} className="w-full rounded-full bg-primary hover:bg-primary/90 text-primary-foreground">
            {addingPlant ? "Adding..." : "Add Plant"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );

  return (
    <div className="min-h-screen p-6 md:p-10">
      <div className="max-w-5xl mx-auto">
        <AnimatePresence mode="wait">
          {!selectedPlantName ? (
            <motion.div key="grid" initial="hidden" animate="visible" exit={{ opacity: 0 }}>
              <motion.div variants={fadeUp} custom={0} className="mb-8">
                <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground">Growth Journal</h1>
                <p className="text-muted-foreground mt-2">Track and monitor your plant family's health journey</p>
              </motion.div>

              {grouped.length === 0 ? (
                <motion.div variants={fadeUp} custom={1} className="text-center py-20 bg-card rounded-2xl border border-border/50">
                  <Leaf className="w-16 h-16 text-muted-foreground/20 mx-auto mb-4" />
                  <h3 className="font-display text-xl font-semibold text-foreground mb-2">Start tracking your plant's journey</h3>
                  <p className="text-muted-foreground text-sm mb-6">Scan your first plant or add one manually to begin</p>
                  <Dialog open={addOpen} onOpenChange={setAddOpen}>
                    <DialogTrigger asChild>
                      <Button className="rounded-full bg-primary hover:bg-primary/90 text-primary-foreground px-6">
                        <Plus className="w-4 h-4 mr-2" /> Add First Plant
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="rounded-2xl">
                      <DialogHeader><DialogTitle className="font-display">Add a New Plant</DialogTitle></DialogHeader>
                      <div className="space-y-4 pt-2">
                        <Input placeholder="e.g. Kitchen Basil" value={newPlantName} onChange={e => setNewPlantName(e.target.value)} className="rounded-xl" autoFocus />
                        <Button onClick={handleAddPlant} disabled={!newPlantName.trim() || addingPlant} className="w-full rounded-full bg-primary hover:bg-primary/90 text-primary-foreground">
                          {addingPlant ? "Adding..." : "Add Plant"}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </motion.div>
              ) : (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {grouped.map((g, i) => (
                    <motion.button
                      key={g.name}
                      variants={fadeUp} custom={i + 1}
                      initial="hidden" animate="visible"
                      onClick={() => openPlant(g.name)}
                      className="bg-card rounded-2xl border border-border/50 p-6 text-left hover:-translate-y-1 hover:shadow-lg hover:shadow-primary/10 transition-all group overflow-hidden"
                    >
                      {g.latestScan.image_url && (
                        <img src={g.latestScan.image_url} alt={g.name} className="w-full h-32 object-cover rounded-xl mb-4" />
                      )}
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-2xl">{tagEmoji(g.latestScan.tag)}</span>
                        <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                      </div>
                      <h3 className="font-display text-lg font-semibold text-foreground mb-1">{g.name}</h3>
                      <p className="text-xs text-muted-foreground mb-3">
                        {g.scanCount} scan{g.scanCount !== 1 ? "s" : ""} · Latest{" "}
                        {new Date(g.latestScan.scan_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      </p>
                      <div className="flex items-center justify-between">
                        <span className={`text-xs font-medium px-3 py-1 rounded-full capitalize ${tagColor(g.latestScan.tag)}`}>{g.latestScan.tag}</span>
                        {g.latestScan.confidence_score && (
                          <div className="flex items-center gap-1">
                            <TrendingUp className="w-3.5 h-3.5 text-primary" />
                            <span className="text-xs text-muted-foreground">{g.latestScan.confidence_score}% conf.</span>
                          </div>
                        )}
                      </div>
                    </motion.button>
                  ))}
                  <AddPlantDialog />
                </div>
              )}
            </motion.div>
          ) : (
            /* ── Plant Detail: Timeline Grid ── */
            <motion.div key="detail" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <Button variant="ghost" onClick={() => { setSelectedPlantName(null); setEditingName(false); }} className="mb-6 text-muted-foreground hover:text-foreground">
                <ArrowLeft className="w-4 h-4 mr-2" /> All Plants
              </Button>

              <div className="flex items-center gap-4 mb-8">
                <span className="text-4xl">{scans.length > 0 ? tagEmoji(scans[scans.length - 1].tag) : "🌱"}</span>
                <div className="flex-1">
                  {editingName ? (
                    <div className="flex items-center gap-2">
                      <Input value={editName} onChange={e => setEditName(e.target.value)} className="rounded-xl max-w-xs" autoFocus onKeyDown={e => e.key === "Enter" && handleRenamePlant()} />
                      <button onClick={handleRenamePlant} className="p-1.5 rounded-lg hover:bg-primary/10 text-primary"><Check className="w-4 h-4" /></button>
                      <button onClick={() => setEditingName(false)} className="p-1.5 rounded-lg hover:bg-destructive/10 text-destructive"><X className="w-4 h-4" /></button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground">{selectedPlantName}</h1>
                      <button onClick={() => { setEditingName(true); setEditName(selectedPlantName); }} className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground"><Pencil className="w-4 h-4" /></button>
                    </div>
                  )}
                  <p className="text-sm text-muted-foreground mt-1">{scans.length} scan{scans.length !== 1 ? "s" : ""} recorded</p>
                </div>
              </div>

              {scans.length === 0 ? (
                <div className="text-center py-16 bg-card rounded-2xl border border-border/50">
                  <Leaf className="w-12 h-12 text-muted-foreground/20 mx-auto mb-3" />
                  <p className="text-muted-foreground text-sm">No scans yet. Head to the scanner to add one!</p>
                </div>
              ) : (
                <>
                  <p className="text-xs text-muted-foreground mb-4 uppercase tracking-wider font-medium">Health Journey Timeline</p>
                  <div className="flex flex-wrap sm:flex-nowrap items-start overflow-x-auto pb-4 gap-y-4">
                    {scans.map((scan, idx) => (
                      <div key={scan.id} className="flex items-start shrink-0">
                        {idx > 0 && <TimelineArrow />}
                        <motion.div
                          initial={{ opacity: 0, y: 16 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: idx * 0.08 }}
                          className="bg-card rounded-2xl border border-border/50 p-4 w-64 shrink-0 relative group"
                        >
                          <button
                            onClick={() => handleDeleteScan(scan.id)}
                            className="absolute top-2 right-2 p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-destructive/10 text-destructive transition-opacity"
                            title="Delete scan"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                          {scan.image_url && (
                            <img src={scan.image_url} alt="scan" className="w-full h-32 object-cover rounded-xl mb-3" />
                          )}
                          <div className="flex items-center justify-between mb-2">
                            <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full capitalize ${tagColor(scan.tag)}`}>
                              {tagEmoji(scan.tag)} {scan.tag}
                            </span>
                            {scan.confidence_score && (
                              <span className="text-xs text-muted-foreground">{scan.confidence_score}%</span>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground flex items-center gap-1 mb-2">
                            <Calendar className="w-3 h-3" />
                            {new Date(scan.scan_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                          </p>
                          {scan.issue && <p className="text-sm font-medium text-foreground mb-1">{scan.issue}</p>}
                          {scan.main_cure && <p className="text-xs text-muted-foreground">💊 {scan.main_cure}</p>}
                        </motion.div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Journal;
