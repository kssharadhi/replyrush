import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Sparkles, ShieldCheck } from "lucide-react";
import { FcGoogle } from "react-icons/fc";
import { useAuth } from "@/context/AuthContext";

const Login = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && user) navigate("/dashboard", { replace: true });
  }, [user, loading, navigate]);

  const handleGoogleLogin = () => {
    // REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
    const redirectUrl = window.location.origin + "/dashboard";
    // prompt=select_account forces Google's account chooser so the user picks which account to use
    window.location.href =
      `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}&prompt=select_account`;
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-slate-950 px-4">
      {/* animated gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-violet-600 to-pink-600 animate-gradient opacity-90" />
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-20 left-1/4 h-96 w-96 rounded-full bg-white/20 blur-3xl animate-blob" />
        <div className="absolute bottom-0 right-1/4 h-96 w-96 rounded-full bg-pink-300/30 blur-3xl animate-blob" style={{ animationDelay: "4s" }} />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="relative w-full max-w-md rounded-3xl border border-white/40 bg-white/85 backdrop-blur-xl p-8 sm:p-10 shadow-2xl"
        data-testid="login-card"
      >
        <div className="flex flex-col items-center text-center">
          <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-indigo-500 via-violet-500 to-pink-500 grid place-items-center shadow-lg shadow-indigo-500/40">
            <Sparkles className="text-white" size={26} />
          </div>
          <h1 className="mt-5 font-display text-3xl font-extrabold tracking-tight text-slate-900">ReplyRush</h1>
          <p className="mt-2 text-slate-500 text-sm leading-relaxed max-w-xs">
            AI review &amp; complaint assistant for local business owners.
          </p>

          <button
            onClick={handleGoogleLogin}
            data-testid="google-login-btn"
            className="mt-8 w-full flex items-center justify-center gap-3 rounded-xl border border-slate-200 bg-white px-5 py-3.5 text-slate-700 font-semibold shadow-sm hover:shadow-md hover:bg-slate-50 transition-all"
          >
            <FcGoogle size={22} />
            Sign in with Google
          </button>

          <p className="mt-6 flex items-center gap-1.5 text-xs text-slate-400">
            <ShieldCheck size={13} /> We draft replies only — we never post on your behalf.
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
