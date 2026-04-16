import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Leaf, Sprout, Recycle, Heart, ArrowLeft, Sparkles, ChevronRight, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.1, duration: 0.5 },
  }),
};

interface Blog {
  id: string;
  name: string;
  content: string;
  img_url: string | null;
  category: string;
}

const categoryMeta: Record<string, { title: string; description: string; icon: any; color: string }> = {
  care: { title: "Plant Care", description: "Essential guides for keeping your plants thriving year-round", icon: Leaf, color: "bg-[#E8F0E4]" },
  companion: { title: "Companion Planting", description: "Strategic plant pairings for a healthier, more productive garden", icon: Sprout, color: "bg-[#E0EDE8]" },
  sustainable: { title: "Sustainable Practices", description: "Eco-friendly gardening methods for a greener planet", icon: Recycle, color: "bg-[#F0EDE4]" },
  benefits: { title: "Plant Benefits", description: "Discover the health and wellness advantages of your green companions", icon: Heart, color: "bg-[#F0E4E8]" },
};

const snippetOfTheDay = {
  title: "🌱 Snippet of the Day",
  content: "Talking to your plants isn't crazy — the CO₂ you exhale while speaking actually helps them photosynthesize. Plus, the vibrations from your voice may stimulate growth.",
};

const Guide = () => {
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedBlog, setSelectedBlog] = useState<Blog | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const fetchBlogs = async () => {
      const { data } = await supabase.from("blogs").select("*").order("created_at");
      if (data) setBlogs(data);
      setLoading(false);
    };
    fetchBlogs();
  }, []);

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    return blogs.filter(b => b.name.toLowerCase().includes(q) || b.content.toLowerCase().includes(q));
  }, [searchQuery, blogs]);

  const categoryBlogs = useMemo(() => {
    if (!selectedCategory) return [];
    return blogs.filter(b => b.category === selectedCategory);
  }, [selectedCategory, blogs]);

  const categories = Object.entries(categoryMeta).map(([id, meta]) => ({
    id,
    ...meta,
    count: blogs.filter(b => b.category === id).length,
  }));

  const showSearch = searchQuery.trim().length > 0;

  const readTime = (content: string) => `${Math.max(1, Math.ceil(content.split(" ").length / 200))} min`;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Leaf className="w-8 h-8 text-primary animate-pulse" />
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 md:p-10">
      <div className="max-w-5xl mx-auto">
        <AnimatePresence mode="wait">
          {!selectedCategory && !selectedBlog ? (
            <motion.div key="main" initial="hidden" animate="visible" exit={{ opacity: 0 }}>
              <motion.div variants={fadeUp} custom={0} className="mb-8">
                <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground">Flourish Guide</h1>
                <p className="text-muted-foreground mt-2">Your eco library for sustainable, intelligent plant care</p>
              </motion.div>

              <motion.div variants={fadeUp} custom={0.5} className="mb-8">
                <div className="relative max-w-md">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input placeholder="Search articles..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10 rounded-xl" />
                </div>
              </motion.div>

              {showSearch ? (
                <div>
                  <p className="text-sm text-muted-foreground mb-4">{searchResults.length} result{searchResults.length !== 1 ? "s" : ""} for "{searchQuery}"</p>
                  {searchResults.length === 0 ? (
                    <div className="text-center py-12">
                      <Leaf className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                      <p className="text-muted-foreground">No articles found. Try a different search term.</p>
                    </div>
                  ) : (
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                      {searchResults.map((blog, i) => (
                        <motion.button
                          key={blog.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.05 }}
                          onClick={() => { setSelectedCategory(blog.category); setSelectedBlog(blog); }}
                          className="bg-card rounded-2xl border border-border/50 overflow-hidden text-left hover:-translate-y-1 hover:shadow-lg transition-all group"
                        >
                          {blog.img_url && <img src={blog.img_url} alt={blog.name} className="w-full h-40 object-cover" loading="lazy" />}
                          <div className="p-4">
                            <span className="text-xs text-primary font-medium">{categoryMeta[blog.category]?.title}</span>
                            <h3 className="font-display text-base font-semibold text-foreground mt-1 mb-1 group-hover:text-primary transition-colors">{blog.name}</h3>
                            <p className="text-xs text-muted-foreground line-clamp-2">{blog.content.slice(0, 120)}...</p>
                            <span className="text-xs text-muted-foreground mt-2 block">{readTime(blog.content)} read</span>
                          </div>
                        </motion.button>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <>
                  <motion.div variants={fadeUp} custom={1} className="bg-primary/5 border border-primary/10 rounded-2xl p-6 mb-10 flex items-start gap-4">
                    <Sparkles className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                    <div>
                      <h3 className="text-sm font-semibold text-foreground mb-1">{snippetOfTheDay.title}</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">{snippetOfTheDay.content}</p>
                    </div>
                  </motion.div>

                  <div className="grid sm:grid-cols-2 gap-5">
                    {categories.map((cat, i) => {
                      const Icon = cat.icon;
                      return (
                        <motion.button
                          key={cat.id}
                          variants={fadeUp} custom={i + 2}
                          initial="hidden" animate="visible"
                          onClick={() => setSelectedCategory(cat.id)}
                          className={`${cat.color} rounded-2xl p-6 text-left border border-border/30 hover:-translate-y-1 hover:shadow-lg hover:shadow-primary/5 transition-all group`}
                        >
                          <div className="flex items-center justify-between mb-3">
                            <div className="w-10 h-10 rounded-xl bg-white/60 flex items-center justify-center">
                              <Icon className="w-5 h-5 text-primary" />
                            </div>
                            <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                          </div>
                          <h3 className="font-display text-lg font-semibold text-foreground mb-1">{cat.title}</h3>
                          <p className="text-sm text-muted-foreground leading-relaxed">{cat.description}</p>
                          <span className="text-xs text-muted-foreground mt-3 block">{cat.count} articles</span>
                        </motion.button>
                      );
                    })}
                  </div>
                </>
              )}
            </motion.div>
          ) : selectedCategory && !selectedBlog ? (
            <motion.div key="category" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <Button variant="ghost" onClick={() => { setSelectedCategory(null); setSearchQuery(""); }} className="mb-6 text-muted-foreground hover:text-foreground">
                <ArrowLeft className="w-4 h-4 mr-2" /> All Categories
              </Button>

              {(() => {
                const meta = categoryMeta[selectedCategory];
                const Icon = meta?.icon || Leaf;
                return (
                  <div className="flex items-center gap-3 mb-8">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${meta?.color}`}>
                      <Icon className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground">{meta?.title}</h1>
                      <p className="text-muted-foreground text-sm">{meta?.description}</p>
                    </div>
                  </div>
                );
              })()}

              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {categoryBlogs.map((blog, i) => (
                  <motion.button
                    key={blog.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    onClick={() => setSelectedBlog(blog)}
                    className="bg-card rounded-2xl border border-border/50 overflow-hidden text-left hover:-translate-y-1 hover:shadow-lg transition-all group"
                  >
                    {blog.img_url && <img src={blog.img_url} alt={blog.name} className="w-full h-40 object-cover" loading="lazy" />}
                    <div className="p-5">
                      <h3 className="font-display text-base font-semibold text-foreground mb-1 group-hover:text-primary transition-colors">{blog.name}</h3>
                      <p className="text-sm text-muted-foreground line-clamp-2">{blog.content.slice(0, 120)}...</p>
                      <span className="text-xs text-muted-foreground mt-3 block">{readTime(blog.content)} read</span>
                    </div>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          ) : selectedBlog && selectedCategory ? (
            <motion.div key="blog" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <Button variant="ghost" onClick={() => setSelectedBlog(null)} className="mb-6 text-muted-foreground hover:text-foreground">
                <ArrowLeft className="w-4 h-4 mr-2" /> {categoryMeta[selectedCategory]?.title}
              </Button>

              <article className="max-w-2xl">
                {selectedBlog.img_url && <img src={selectedBlog.img_url} alt={selectedBlog.name} className="w-full h-64 object-cover rounded-2xl mb-6" />}
                <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-2">{selectedBlog.name}</h1>
                <span className="text-sm text-muted-foreground">{readTime(selectedBlog.content)} read</span>
                <div className="mt-8 space-y-4">
                  {selectedBlog.content.split("\n\n").map((para, i) => (
                    <p key={i} className="text-foreground/80 leading-relaxed">{para}</p>
                  ))}
                </div>
              </article>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Guide;
