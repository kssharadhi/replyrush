import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { LogOut, LayoutDashboard, History as HistoryIcon, Sparkles } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuLabel, DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const Navbar = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const links = [
    { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { to: "/history", label: "History", icon: HistoryIcon },
  ];

  const handleLogout = async () => {
    await logout();
    navigate("/login", { replace: true });
  };

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/70 bg-white/80 backdrop-blur-xl">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 h-16 flex items-center justify-between">
        <Link to="/dashboard" className="flex items-center gap-2" data-testid="navbar-logo">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-indigo-500 via-violet-500 to-pink-500 grid place-items-center shadow-lg shadow-indigo-500/30">
            <Sparkles className="text-white" size={18} />
          </div>
          <span className="font-display text-xl font-extrabold tracking-tight">ReplyRush</span>
        </Link>

        <nav className="hidden sm:flex items-center gap-1">
          {links.map((l) => {
            const active = location.pathname === l.to;
            const Icon = l.icon;
            return (
              <Link
                key={l.to}
                to={l.to}
                data-testid={`nav-${l.label.toLowerCase()}`}
                className={`relative flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                  active ? "text-indigo-600" : "text-slate-500 hover:text-slate-900"
                }`}
              >
                <Icon size={16} />
                {l.label}
                {active && (
                  <motion.div layoutId="nav-underline" className="absolute inset-0 -z-10 rounded-lg bg-indigo-50" />
                )}
              </Link>
            );
          })}
        </nav>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 rounded-full p-1 pr-3 hover:bg-slate-100 transition-colors" data-testid="user-menu-trigger">
              <Avatar className="h-8 w-8">
                <AvatarImage src={user?.picture} alt={user?.name} />
                <AvatarFallback className="bg-indigo-100 text-indigo-700 text-sm font-semibold">
                  {user?.name?.[0]?.toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
              <span className="hidden sm:block text-sm font-semibold text-slate-700 max-w-[120px] truncate">{user?.name}</span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="truncate">{user?.email}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="sm:hidden" onClick={() => navigate("/dashboard")}>
              <LayoutDashboard size={16} className="mr-2" /> Dashboard
            </DropdownMenuItem>
            <DropdownMenuItem className="sm:hidden" onClick={() => navigate("/history")}>
              <HistoryIcon size={16} className="mr-2" /> History
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleLogout} data-testid="logout-btn" className="text-red-600 focus:text-red-600">
              <LogOut size={16} className="mr-2" /> Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
};

export default Navbar;
