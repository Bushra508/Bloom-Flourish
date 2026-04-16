import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { User, Mail, Sprout, Pencil, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const Account = () => {
  const { user } = useAuth();
  const [username, setUsername] = useState("");
  const [editing, setEditing] = useState(false);
  const [plantCount, setPlantCount] = useState(0);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    const fetchProfile = async () => {
      const { data } = await supabase.from("profiles").select("username").eq("id", user.id).single();
      if (data?.username) setUsername(data.username);
    };
    const fetchPlantCount = async () => {
      const { count } = await supabase.from("plants").select("*", { count: "exact", head: true }).eq("user_id", user.id);
      setPlantCount(count || 0);
    };
    fetchProfile();
    fetchPlantCount();
  }, [user]);

  const handleSave = async () => {
    if (!user || !username.trim()) return;
    setSaving(true);
    const { error } = await supabase.from("profiles").update({ username: username.trim() }).eq("id", user.id);
    if (error) toast.error(error.message);
    else toast.success("Username updated!");
    setSaving(false);
    setEditing(false);
  };

  return (
    <div className="min-h-screen p-6 md:p-10">
      <div className="max-w-xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-2">Account</h1>
          <p className="text-muted-foreground mb-8">Manage your profile settings</p>

          <div className="bg-card rounded-2xl border border-border/50 divide-y divide-border/50">
            {/* Username */}
            <div className="p-6 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <User className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-xs text-muted-foreground block">Username</span>
                  {editing ? (
                    <div className="flex items-center gap-2 mt-1">
                      <Input value={username} onChange={e => setUsername(e.target.value)} className="rounded-lg h-8 text-sm" autoFocus onKeyDown={e => e.key === "Enter" && handleSave()} />
                      <Button size="sm" onClick={handleSave} disabled={saving} className="rounded-lg h-8 px-3 bg-primary hover:bg-primary/90 text-primary-foreground">
                        <Check className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  ) : (
                    <p className="text-sm font-medium text-foreground truncate">{username || "Not set"}</p>
                  )}
                </div>
              </div>
              {!editing && (
                <button onClick={() => setEditing(true)} className="p-2 rounded-lg hover:bg-secondary text-muted-foreground">
                  <Pencil className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Email */}
            <div className="p-6 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center shrink-0">
                <Mail className="w-5 h-5 text-muted-foreground" />
              </div>
              <div>
                <span className="text-xs text-muted-foreground block">Email</span>
                <p className="text-sm font-medium text-foreground">{user?.email || "—"}</p>
              </div>
            </div>

            {/* Plant Count */}
            <div className="p-6 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <Sprout className="w-5 h-5 text-primary" />
              </div>
              <div>
                <span className="text-xs text-muted-foreground block">Plants in Journal</span>
                <p className="text-sm font-medium text-foreground">{plantCount}</p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Account;
