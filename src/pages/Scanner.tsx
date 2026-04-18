import { useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload, Camera, Leaf, Sprout, CheckCircle,
  Scissors, Eye, FlaskConical, Pill, BookOpen, Plus, Phone, RotateCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { predictImage } from "@/integrations/predictapi";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.1, duration: 0.5 },
  }),
};

const iconMap: Record<string, any> = {
  scissors: Scissors,
  eye: Eye,
  sprout: Sprout,
};

type Phase = "upload" | "scanning" | "results";

const Scanner = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [phase, setPhase] = useState<Phase>("upload");
  const [isDragging, setIsDragging] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);

  // Results state
  const [saveOpen, setSaveOpen] = useState(false);
  const [agronomistOpen, setAgronomistOpen] = useState(false);
  const [selectedPlant, setSelectedPlant] = useState("");
  const [newPlant, setNewPlant] = useState("");
  const [showNewPlant, setShowNewPlant] = useState(false);
  const [existingPlants, setExistingPlants] = useState<{ id: string; name: string }[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user || phase !== "results") return;
    const fetchPlants = async () => {
      const { data } = await supabase
        .from("plants")
        .select("id, name")
        .eq("user_id", user.id);
      if (data) {
        const unique = Array.from(new Map(data.map(p => [p.name, p])).values());
        setExistingPlants(unique);
      }
    };
    fetchPlants();
  }, [user, phase]);

const [prediction, setPrediction] = useState<any>(null);
const [allPredictions, setAllPredictions] = useState<any[]>([]);
const [diseaseInfo, setDiseaseInfo] = useState<any>(null);
const disease = prediction?.label?.split(" | ")[1]?.trim().toLowerCase();

const handleFile = useCallback((file: File) => {
  const reader = new FileReader();

  reader.onload = async (e) => {
    const img = e.target?.result as string;
    setUploadedImage(img);
    setPhase("scanning");

    try {
      const result = await predictImage(file);

      if (result?.success) {
        const preds = result.all_predictions;
        let finalPrediction = preds[0];
        // condition: biased strawberry override
        if (
          finalPrediction.label.toLowerCase().includes("strawberry | leaf scorch") &&
          finalPrediction.confidence < 0.995 &&
          preds.length > 1
        ) {
          finalPrediction = preds[1];
        }

        setPrediction(finalPrediction);
        setAllPredictions(preds);
        // FETCH FROM SUPABASE
        const { data, error } = await supabase
          .from("disease_info")
          .select("*")
          .eq("label", finalPrediction.label)
          .single();

        if (error) {
          console.error("Supabase fetch error:", error);
        } else {
          setDiseaseInfo(data);
        }

        setPhase("results");
      } else {
        console.error(result?.error);
        setPhase("upload");
      }

    } catch (err) {
      console.error("API error:", err);
      setPhase("upload");
    }
  };

  reader.readAsDataURL(file);
}, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("image/")) handleFile(file);
  }, [handleFile]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleScanAnother = () => {
    setPhase("upload");
    setUploadedImage(null);
    setSelectedPlant("");
    setNewPlant("");
    setShowNewPlant(false);
  };

  const tag = disease === "healthy" ? "healthy" : "unhealthy";

  const uploadImage = async (): Promise<string | null> => {
    if (!uploadedImage || !user) return null;
    try {
      const res = await fetch(uploadedImage);
      const blob = await res.blob();
      const ext = blob.type.includes("png") ? "png" : "jpg";
      const path = `${user.id}/${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from("scan-images").upload(path, blob, { contentType: blob.type });
      if (error) { console.error(error); return null; }
      const { data: urlData } = supabase.storage.from("scan-images").getPublicUrl(path);
      return urlData.publicUrl;
    } catch { return null; }
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    const imageUrl = await uploadImage();
    const plantName = showNewPlant ? newPlant.trim() : selectedPlant;

    const insertData = {
      user_id: user.id,
      name: plantName,
      issue: prediction?.label || "Unknown",
      confidence_score: prediction ? parseFloat((prediction.confidence * 100).toFixed(2)) : 0,
      main_cure: diseaseInfo?.organic?.[0]?.name || null,
      tag,
      image_url: imageUrl,
    };

    const { error } = await supabase.from("plants").insert(insertData);
    if (error) {
      toast.error(error.message);
      setSaving(false);
      return;
    }

    setSaving(false);
    setSaveOpen(false);
    toast.success(`Saved to ${plantName}!`);
    navigate("/journal");
  };

  return (
    <div className="min-h-screen p-6 md:p-10">
      <AnimatePresence mode="wait">
        {/* ─── UPLOAD PHASE ─── */}
        {phase === "upload" && (
          <motion.div
            key="upload"
            className="flex items-center justify-center min-h-[70vh]"
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.5 }}
          >
            <div className="w-full max-w-xl">
              <div className="text-center mb-8">
                <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-3">Plant Scanner</h1>
                <p className="text-muted-foreground">Upload a clear image of a plant leaf for instant analysis</p>
              </div>

              <div
                className={`glass rounded-3xl p-12 text-center transition-all ${isDragging ? "border-primary bg-primary/5 scale-[1.02]" : ""}`}
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
              >
                <div className="mb-8">
                  <div className="w-24 h-24 mx-auto rounded-full bg-secondary/60 flex items-center justify-center mb-6">
                    <Leaf className="w-10 h-10 text-primary opacity-60" />
                  </div>
                  <p className="text-foreground font-medium mb-1">Drag & drop your leaf image here</p>
                  <p className="text-muted-foreground text-sm">or click to browse files</p>
                </div>

                <label>
                  <input type="file" accept="image/*" className="hidden" onChange={handleInputChange} />
                  <Button asChild className="rounded-full bg-primary hover:bg-primary/90 text-primary-foreground px-8 cursor-pointer active:scale-95 transition-transform">
                    <span><Upload className="w-4 h-4 mr-2" /> Upload Image</span>
                  </Button>
                </label>

                <div className="mt-8 pt-6 border-t border-border/30">
                  <p className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                    <Camera className="w-3.5 h-3.5" /> Supports JPG, PNG, WebP · Max 10MB
                  </p>
                </div>
              </div>

              <motion.div className="mt-6 text-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}>
                <p className="text-xs text-muted-foreground">💡 Tip: Use natural lighting and capture the full leaf for best results</p>
              </motion.div>
            </div>
          </motion.div>
        )}

        {/* ─── SCANNING PHASE ─── */}
        {phase === "scanning" && (
          <motion.div
            key="scanning"
            className="flex items-center justify-center min-h-[70vh]"
            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.5 }}
          >
            <div className="glass rounded-3xl p-12 text-center w-full max-w-xl">
              <div className="relative w-32 h-40 mx-auto mb-8">
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-16 h-10 bg-destructive/20 rounded-b-xl rounded-t-sm" />
                <motion.div
                  className="absolute bottom-10 left-1/2 -translate-x-1/2 w-1.5 bg-primary rounded-full origin-bottom"
                  initial={{ height: 0 }} animate={{ height: 60 }} transition={{ duration: 1, ease: "easeOut" }}
                />
                <motion.div
                  className="absolute bottom-[4.2rem] left-1/2"
                  initial={{ opacity: 0, scale: 0 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.8, duration: 0.5 }}
                >
                  <Sprout className="w-10 h-10 text-primary -translate-x-1/2 -translate-y-1/2" />
                </motion.div>
                <motion.div
                  className="absolute top-4 left-1/2 -translate-x-1/2 w-20 h-20 rounded-full border-2 border-primary/30"
                  animate={{ scale: [1, 1.5, 1], opacity: [0.6, 0, 0.6] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              </div>

              <h3 className="font-display text-xl font-semibold text-foreground mb-2">Analyzing your plant...</h3>
              <p className="text-muted-foreground text-sm">Our model is examining leaf patterns, colors, and textures</p>

              <div className="mt-6 flex justify-center gap-1.5">
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    className="w-2 h-2 rounded-full bg-primary"
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                  />
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* ─── RESULTS PHASE ─── */}
        {phase === "results" && (
          <motion.div
            key="results"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.5 }}
          >
            <div className="max-w-6xl mx-auto grid lg:grid-cols-5 gap-8">
              {/* Left — Image */}
              <motion.div className="lg:col-span-2" initial="hidden" animate="visible" variants={fadeUp} custom={1}>
                <div className="rounded-2xl overflow-hidden border border-border/50 bg-card">
                  {uploadedImage ? (
                    <div className="relative">
                      <img src={uploadedImage} alt="Scanned leaf" className="w-full aspect-square object-cover" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                    </div>
                  ) : (
                    <div className="aspect-square flex items-center justify-center bg-secondary/30">
                      <Leaf className="w-16 h-16 text-muted-foreground/30" />
                    </div>
                  )}
                </div>
              </motion.div>

              {/* Right — Treatment Panel */}
              <div className="lg:col-span-3 space-y-6">
                <motion.div className="bg-card rounded-2xl border border-border/50 p-6" initial="hidden" animate="visible" variants={fadeUp} custom={2}>
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground">{prediction?.label?.split(" | ")[1] || "Unknown"}</h1>
                      <p className="text-muted-foreground text-sm mt-1">{diseaseInfo?.description || "No description available"}</p>
                    </div>
                    <div className="text-right shrink-0 ml-4">
                      <div className="text-2xl font-bold text-primary">{prediction ? (prediction.confidence * 100).toFixed(2) : 0}%</div>
                      <div className="text-xs text-muted-foreground">Confidence</div>
                    </div>
                  </div>
                </motion.div>

                <motion.div className="bg-card rounded-2xl border border-border/50 p-6" initial="hidden" animate="visible" variants={fadeUp} custom={3}>
                  <h2 className="font-display text-lg font-semibold text-foreground mb-4">Action Plan</h2>
                  <div className="grid sm:grid-cols-3 gap-3">
                    {diseaseInfo?.actions?.map((action: any) => {const Icon = iconMap[action.icon] || Leaf;
                      return(
                      <div key={action.label} className="rounded-xl bg-secondary/40 p-4 hover:bg-secondary/60 transition-colors">
                        <Icon className="w-5 h-5 text-primary mb-2" />
                        <h4 className="text-sm font-semibold text-foreground mb-1">{action.label}</h4>
                        <p className="text-xs text-muted-foreground leading-relaxed">{action.desc}</p>
                      </div>
                      );
                    })}
                  </div>
                </motion.div>

                <motion.div className="bg-card rounded-2xl border border-border/50 p-6" initial="hidden" animate="visible" variants={fadeUp} custom={4}>
                  <h2 className="font-display text-lg font-semibold text-foreground mb-4">Treatment Solutions</h2>
                  <div className="grid sm:grid-cols-2 gap-6">
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <FlaskConical className="w-4 h-4 text-primary" />
                        <span className="text-sm font-semibold text-foreground">Organic</span>
                      </div>
                      <div className="space-y-3">
                        {diseaseInfo?.organic?.map((s: any) => (
                          <div key={s.name} className="rounded-lg bg-primary/5 p-3">
                            <p className="text-sm font-medium text-foreground">{s.name}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">{s.dosage}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <Pill className="w-4 h-4 text-destructive" />
                        <span className="text-sm font-semibold text-foreground">Chemical</span>
                      </div>
                      <div className="space-y-3">
                        {diseaseInfo?.chemical?.map((s: any) => (
                          <div key={s.name} className="rounded-lg bg-destructive/5 p-3">
                            <p className="text-sm font-medium text-foreground">{s.name}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">{s.dosage}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </motion.div>

                {/* CTAs */}
                <motion.div className="flex flex-wrap gap-3" initial="hidden" animate="visible" variants={fadeUp} custom={5}>
                  <Dialog open={saveOpen} onOpenChange={setSaveOpen}>
                    <DialogTrigger asChild>
                      <Button className="rounded-full bg-primary hover:bg-primary/90 text-primary-foreground px-6 active:scale-95 transition-transform">
                        <CheckCircle className="w-4 h-4 mr-2" /> Add to Journal
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="rounded-2xl">
                      <DialogHeader>
                        <DialogTitle className="font-display">Save to Growth Journal</DialogTitle>
                      </DialogHeader>
                      <p className="text-sm text-muted-foreground mb-4">Choose an existing plant or add a new one:</p>

                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {existingPlants.map((p) => (
                          <button
                            key={p.id}
                            onClick={() => { setSelectedPlant(p.name); setShowNewPlant(false); }}
                            className={`w-full text-left px-4 py-3 rounded-xl text-sm transition-colors ${selectedPlant === p.name && !showNewPlant ? "bg-primary/10 text-primary font-medium" : "bg-secondary/40 text-foreground hover:bg-secondary/60"}`}
                          >
                            {p.name}
                          </button>
                        ))}
                      </div>

                      <div className="mt-4 pt-4 border-t border-border/50">
                        {!showNewPlant ? (
                          <button
                            onClick={() => { setShowNewPlant(true); setSelectedPlant(""); }}
                            className="flex items-center gap-2 w-full px-4 py-3 rounded-xl text-sm text-primary hover:bg-primary/5 transition-colors font-medium"
                          >
                            <Plus className="w-4 h-4" /> Add New Plant
                          </button>
                        ) : (
                          <div className="space-y-3">
                            <label className="text-sm font-medium text-foreground">New plant name</label>
                            <Input
                              placeholder="e.g. Balcony Tomato"
                              value={newPlant}
                              onChange={(e) => setNewPlant(e.target.value)}
                              className="rounded-xl"
                              autoFocus
                            />
                          </div>
                        )}
                      </div>

                      <Button
                        onClick={handleSave}
                        disabled={(!selectedPlant && !newPlant) || saving}
                        className="w-full mt-4 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground"
                      >
                        {saving ? "Saving..." : "Save Entry"}
                      </Button>
                    </DialogContent>
                  </Dialog>

                  <Dialog open={agronomistOpen} onOpenChange={setAgronomistOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" className="rounded-full border-primary/30 text-primary hover:bg-primary/5 px-6">
                        <BookOpen className="w-4 h-4 mr-2" /> Consult Agronomist
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="rounded-2xl max-w-sm">
                      <DialogHeader>
                        <DialogTitle className="font-display">Contact a Professional</DialogTitle>
                      </DialogHeader>
                      <div className="text-center py-4 space-y-4">
                        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                          <Phone className="w-7 h-7 text-primary" />
                        </div>
                        <div>
                          <p className="text-2xl font-bold text-foreground tracking-wide">1800-PLANT-HELP</p>
                          <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                            Call this number to reach our certified plant health professionals. Available Mon–Sat, 8 AM – 6 PM.
                          </p>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>

                  <Button
                    variant="ghost"
                    onClick={handleScanAnother}
                    className="rounded-full text-muted-foreground hover:text-foreground px-6"
                  >
                    <RotateCcw className="w-4 h-4 mr-2" /> Scan Another
                  </Button>
                </motion.div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Scanner;