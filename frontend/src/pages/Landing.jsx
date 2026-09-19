import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Sparkles, Plug, Wand2, Copy, ArrowRight, ShieldCheck, Star } from "lucide-react";
import { SiZomato } from "react-icons/si";
import { PLATFORM_LIST } from "@/lib/platforms";

const steps = [
  { icon: Plug, title: "Connect", desc: "Link Google, Zomato, Amazon, Yelp & Instagram in one tap.", color: "from-indigo-500 to-blue-500" },
  { icon: Wand2, title: "Generate", desc: "AI drafts a personal reply that references the real details.", color: "from-violet-500 to-purple-500" },
  { icon: Copy, title: "Copy", desc: "Tweak if you like, copy, and paste it wherever you reply.", color: "from-pink-500 to-rose-500" },
];

const Landing = () => {
  return (
    <div className="min-h-screen bg-slate-50 overflow-hidden">
      {/* Nav */}
      <header className="relative z-20 mx-auto max-w-7xl px-4 sm:px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-indigo-500 via-violet-500 to-pink-500 grid place-items-center shadow-lg shadow-indigo-500/30">
            <Sparkles className="text-white" size={18} />
          </div>
          <span className="font-display text-xl font-extrabold tracking-tight">ReplyRush</span>
        </div>
        <Link
          to="/login"
          data-testid="nav-signin-btn"
          className="rounded-full bg-slate-900 px-5 py-2 text-sm font-semibold text-white hover:bg-slate-800 transition-colors"
        >
          Sign In
        </Link>
      </header>

      {/* Hero */}
      <section className="relative">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute -top-24 -left-24 h-96 w-96 rounded-full bg-indigo-300/40 blur-3xl animate-blob" />
          <div className="absolute top-10 right-0 h-96 w-96 rounded-full bg-pink-300/40 blur-3xl animate-blob" style={{ animationDelay: "3s" }} />
          <div className="absolute bottom-0 left-1/3 h-80 w-80 rounded-full bg-violet-300/40 blur-3xl animate-blob" style={{ animationDelay: "6s" }} />
        </div>

        <div className="mx-auto max-w-7xl px-4 sm:px-6 pt-14 pb-10 grid lg:grid-cols-2 gap-12 items-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <div className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-white/70 px-3 py-1 text-xs font-semibold text-indigo-700 backdrop-blur">
              <ShieldCheck size={14} /> Drafts only — never auto-posts
            </div>
            <h1 className="mt-5 font-display text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.05]">
              <span className="bg-gradient-to-r from-indigo-600 via-violet-600 to-pink-600 bg-clip-text text-transparent animate-gradient">
                Never leave a review
              </span>
              <br />unanswered again.
            </h1>
            <p className="mt-5 text-lg text-slate-600 max-w-xl leading-relaxed">
              ReplyRush drafts fast, personal replies to your reviews and complaints across every platform — so unanswered feedback never costs you another customer.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link
                to="/login"
                data-testid="get-started-btn"
                className="group inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-indigo-600 to-violet-600 px-7 py-3.5 text-base font-semibold text-white shadow-lg shadow-indigo-500/30 hover:shadow-xl hover:shadow-indigo-500/40 transition-all"
              >
                Get Started
                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </Link>
              <div className="flex items-center gap-3 text-slate-400">
                {PLATFORM_LIST.map(({ key, Icon, color }) => (
                  <Icon key={key} size={22} style={{ color }} className="opacity-80" />
                ))}
              </div>
            </div>
          </motion.div>

          {/* Mock preview card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="relative"
          >
            <div className="animate-float rounded-3xl border border-white/60 bg-white/80 backdrop-blur-xl p-6 shadow-2xl shadow-indigo-500/10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-red-50 grid place-items-center">
                    <SiZomato size={20} style={{ color: "#CB202D" }} />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900">Rohan Malhotra</p>
                    <div className="flex items-center gap-0.5">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <Star key={i} size={13} className={i <= 1 ? "fill-amber-400 text-amber-400" : "fill-slate-200 text-slate-200"} />
                      ))}
                    </div>
                  </div>
                </div>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700">
                  <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" /> High
                </span>
              </div>
              <p className="mt-4 text-sm text-slate-600 leading-relaxed">
                "Order arrived almost 2 hours late and completely cold. The biryani was inedible…"
              </p>
              <div className="mt-4 rounded-2xl bg-gradient-to-br from-indigo-50 to-violet-50 border border-indigo-100 p-4">
                <div className="flex items-center gap-2 text-xs font-bold text-indigo-600 uppercase tracking-wide">
                  <Sparkles size={13} /> AI Reply
                </div>
                <p className="mt-2 text-sm text-slate-700 leading-relaxed">
                  Hi Rohan, a two-hour wait with cold biryani is absolutely not the experience we want you to have — thank you for flagging it. We'd genuinely like to make this right; please reach out so we can look into what went wrong with your order.
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* 3 steps */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 py-16">
        <div className="text-center max-w-2xl mx-auto">
          <h2 className="font-display text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-slate-900">Three steps. Under a minute.</h2>
          <p className="mt-3 text-slate-600">From an angry one-star to a thoughtful reply — without the writer's block.</p>
        </div>
        <div className="mt-12 grid md:grid-cols-3 gap-6">
          {steps.map((s, i) => {
            const Icon = s.icon;
            return (
              <motion.div
                key={s.title}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
                className="relative rounded-3xl border border-slate-200 bg-white p-7 hover:-translate-y-1 hover:shadow-xl transition-all"
              >
                <div className="absolute -top-3 -right-3 h-9 w-9 rounded-full bg-slate-900 text-white grid place-items-center text-sm font-bold">
                  {i + 1}
                </div>
                <div className={`h-12 w-12 rounded-2xl bg-gradient-to-br ${s.color} grid place-items-center shadow-lg`}>
                  <Icon className="text-white" size={22} />
                </div>
                <h3 className="mt-5 font-display text-xl font-semibold text-slate-900">{s.title}</h3>
                <p className="mt-2 text-slate-600 leading-relaxed">{s.desc}</p>
              </motion.div>
            );
          })}
        </div>
      </section>

      <footer className="border-t border-slate-200 py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-slate-400">
          <span>© {new Date().getFullYear()} ReplyRush. Drafts replies — never auto-posts.</span>
          <Link to="/login" className="font-semibold text-indigo-600 hover:text-indigo-700">Get started free →</Link>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
