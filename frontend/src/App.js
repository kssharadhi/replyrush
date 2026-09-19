import React from "react";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { Toaster } from "sonner";
import "@/App.css";

import { AuthProvider } from "@/context/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import AuthCallback from "@/components/AuthCallback";

import Landing from "@/pages/Landing";
import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import ConnectView from "@/pages/ConnectView";
import ReplyStudio from "@/pages/ReplyStudio";
import History from "@/pages/History";

function AppRouter() {
  const location = useLocation();
  if (location.hash?.includes("session_id=")) {
    return <AuthCallback />;
  }
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route
        path="/dashboard"
        element={<ProtectedRoute><Dashboard /></ProtectedRoute>}
      />
      <Route
        path="/connect/:platform"
        element={<ProtectedRoute><ConnectView /></ProtectedRoute>}
      />
      <Route
        path="/reply-studio/:reviewId"
        element={<ProtectedRoute><ReplyStudio /></ProtectedRoute>}
      />
      <Route
        path="/history"
        element={<ProtectedRoute><History /></ProtectedRoute>}
      />
    </Routes>
  );
}

function App() {
  return (
    <div className="App">
      <AuthProvider>
        <BrowserRouter>
          <Toaster position="top-center" richColors closeButton />
          <AppRouter />
        </BrowserRouter>
      </AuthProvider>
    </div>
  );
}

export default App;
