import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Leaf, Camera, Search, Sprout, BookOpen, ArrowRight, Github, Linkedin, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import heroImage from "@/assets/hero-leaves.jpg";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.1, duration: 0.6, ease: "easeOut" },
  }),
};

const Index = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      {/* Top Nav */}
      <nav className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-md border-b border-border/50">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <Leaf className="w-6 h-6 text-primary" />
            <span className="font-display text-xl font-semibold text-foreground">Bloom & Flourish</span>
          </Link>
          <div className="hidden md:flex items-center gap-8 text-sm text-muted-foreground">
            <a href="#how-it-works" className="hover:text-foreground transition-colors">How It Works</a>
            <a href="#features" className="hover:text-foreground transition-colors">Features</a>
            <a href="#eco-insights" className="hover:text-foreground transition-colors">Eco-Insights</a>
            {user ? (
              <Link to="/scanner">
                <Button className="rounded-full bg-primary hover:bg-primary/90 text-primary-foreground px-6">
                  Dashboard
                </Button>
              </Link>
            ) : (
              <div className="flex items-center gap-3">
                <Link to="/login" className="hover:text-foreground transition-colors font-medium">Log in</Link>
                <Link to="/register">
                  <Button className="rounded-full bg-primary hover:bg-primary/90 text-primary-foreground px-6">
                    Sign Up
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-16 relative overflow-hidden">
        <div className="relative min-h-[85vh] flex items-center">
          {/* Background Image */}
          <div className="absolute inset-0">
            <img src={heroImage} alt="Lush green leaves with dew" className="w-full h-full object-cover" width={1920} height={1080} />
            <div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/70 to-background/30" />
          </div>

          <div className="relative z-10 max-w-6xl mx-auto px-6 py-20 w-full">
            <div className="max-w-2xl">
              <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={0}>
                <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6 border border-primary/20">
                  <Sprout className="w-4 h-4" /> Self-Made Model Plant Care
                </span>
              </motion.div>
              <motion.h1
                className="font-display text-5xl md:text-7xl font-bold text-foreground leading-tight mb-6"
                initial="hidden" animate="visible" variants={fadeUp} custom={1}
              >
                Nurture nature with{" "}
                <span className="text-primary italic">intelligence.</span>
              </motion.h1>
              <motion.p
                className="text-lg md:text-xl text-muted-foreground max-w-xl mb-10 leading-relaxed"
                initial="hidden" animate="visible" variants={fadeUp} custom={2}
              >
                Detect plant diseases instantly and manage your garden with AI-driven, sustainable insights.
              </motion.p>
              <motion.div className="flex flex-wrap gap-4" initial="hidden" animate="visible" variants={fadeUp} custom={3}>
                <Link to={user ? "/scanner" : "/register"}>
                  <Button size="lg" className="rounded-full bg-primary hover:bg-primary/90 text-primary-foreground px-10 py-6 text-lg shadow-lg shadow-primary/20 transition-all hover:shadow-xl hover:shadow-primary/30 hover:-translate-y-0.5 active:scale-95">
                    <Camera className="w-5 h-5 mr-2" />
                    Scan Your First Leaf
                  </Button>
                </Link>
                <a href="#how-it-works">
                  <Button size="lg" variant="outline" className="rounded-full border-primary/30 text-foreground px-10 py-6 text-lg hover:bg-primary/5 transition-all">
                    See How It Works
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </a>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <motion.h2
            className="font-display text-3xl md:text-4xl font-bold text-center mb-16 text-foreground"
            initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0}
          >
            How it works
          </motion.h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: Camera, title: "Capture", desc: "Take a clear photo of any plant leaf using your camera or gallery." },
              { icon: Search, title: "Analyze", desc: "Our AI engine scans for diseases, deficiencies, and health markers." },
              { icon: Sprout, title: "Restore", desc: "Get a tailored treatment plan with organic and chemical solutions." },
            ].map((step, i) => (
              <motion.div
                key={step.title}
                className="group relative bg-card rounded-2xl p-8 border border-border/50 hover:border-primary/30 transition-all hover:-translate-y-1 hover:shadow-lg hover:shadow-primary/5"
                initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i + 1}
              >
                <div className="w-14 h-14 rounded-2xl bg-secondary flex items-center justify-center mb-6 group-hover:bg-primary/10 transition-colors">
                  <step.icon className="w-6 h-6 text-primary" />
                </div>
                <span className="text-xs font-semibold uppercase tracking-widest text-primary/70 mb-2 block">Step {i + 1}</span>
                <h3 className="font-display text-xl font-semibold mb-2 text-foreground">{step.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 px-6 bg-secondary/30">
        <div className="max-w-5xl mx-auto">
          <motion.h2
            className="font-display text-3xl md:text-4xl font-bold text-center mb-16 text-foreground"
            initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0}
          >
            Everything your garden needs
          </motion.h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: Search, title: "Smart Diagnostics", desc: "Instant disease detection powered by our self-made model trained on thousands of plant species.", bg: "bg-primary/5" },
              { icon: Sprout, title: "Lifecycle Tracking", desc: "Journal your plant's growth, monitor health trends, and compare progress over time.", bg: "bg-accent/50" },
              { icon: BookOpen, title: "Eco Library", desc: "Explore sustainable gardening practices, companion planting guides, and plant care tips.", bg: "bg-card" },
            ].map((feature, i) => (
              <motion.div
                key={feature.title}
                className={`${feature.bg} rounded-2xl p-8 border border-border/30 hover:-translate-y-1 transition-all hover:shadow-lg hover:shadow-primary/5`}
                initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i + 1}
              >
                <div className="w-12 h-12 rounded-xl bg-white/60 flex items-center justify-center mb-5">
                  <feature.icon className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-display text-lg font-semibold mb-2 text-foreground">{feature.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Eco Insight */}
      <section id="eco-insights" className="py-20 px-6">
        <motion.div
          className="max-w-3xl mx-auto bg-primary/5 border border-primary/10 rounded-2xl p-10 text-center"
          initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0}
        >
          <Leaf className="w-8 h-8 text-primary mx-auto mb-4" />
          <h3 className="font-display text-xl font-semibold text-foreground mb-3">Did you know?</h3>
          <p className="text-muted-foreground leading-relaxed">
            Indoor plants can remove up to 87% of air toxins within 24 hours. A single spider plant can purify air in a 200 sq ft room. Nurturing plants isn't just a hobby — it's a health investment.
          </p>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 py-12 px-6">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <Leaf className="w-5 h-5 text-primary" />
            <span className="font-display text-lg font-semibold text-foreground">Bloom & Flourish</span>
          </div>
          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <a href="#" className="hover:text-foreground transition-colors">About</a>
            <a href="#" className="hover:text-foreground transition-colors">Tech Stack</a>
            <a href="#" className="hover:text-foreground transition-colors">Contact</a>
          </div>
          <div className="flex items-center gap-4">
            <a href="#" className="text-muted-foreground hover:text-foreground transition-colors"><Github className="w-5 h-5" /></a>
            <a href="#" className="text-muted-foreground hover:text-foreground transition-colors"><Linkedin className="w-5 h-5" /></a>
          </div>
        </div>
        <p className="text-center text-xs text-muted-foreground mt-8 flex items-center justify-center gap-1">
          Made with Love for the Planet
        </p>
      </footer>
    </div>
  );
};

export default Index;
