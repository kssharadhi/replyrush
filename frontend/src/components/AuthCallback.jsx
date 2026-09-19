import React, { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

// REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
const AuthCallback = () => {
  const navigate = useNavigate();
  const { setUser } = useAuth();
  const hasProcessed = useRef(false);

  useEffect(() => {
    if (hasProcessed.current) return;
    hasProcessed.current = true;

    const hash = window.location.hash;
    const sessionId = new URLSearchParams(hash.replace("#", "")).get("session_id");

    const run = async () => {
      try {
        const res = await api.post("/auth/session", { session_id: sessionId });
        setUser(res.data);
        window.history.replaceState(null, "", "/dashboard");
        navigate("/dashboard", { state: { user: res.data }, replace: true });
      } catch (e) {
        navigate("/login", { replace: true });
      }
    };
    if (sessionId) run();
    else navigate("/login", { replace: true });
  }, [navigate, setUser]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="flex flex-col items-center gap-4">
        <div className="h-12 w-12 rounded-full border-4 border-indigo-200 border-t-indigo-600 animate-spin" />
        <p className="text-slate-500 font-medium">Signing you in…</p>
      </div>
    </div>
  );
};

export default AuthCallback;
