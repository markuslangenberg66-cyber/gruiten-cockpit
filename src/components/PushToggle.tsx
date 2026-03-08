"use client";
import React, { useState, useEffect } from 'react';
import { Bell, BellOff } from 'lucide-react';

export default function PushToggle() {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    // Check local storage and current permissions
    const stored = localStorage.getItem("pushEnabled");
    if (stored === "true" && Notification.permission === "granted") {
      setEnabled(true);
    }
  }, []);

  const toggle = async () => {
    if (!enabled) {
      if (typeof window !== "undefined" && "Notification" in window) {
        let perm = Notification.permission;
        if (perm !== "granted") {
          perm = await window.Notification.requestPermission();
        }
        if (perm === "granted") {
          setEnabled(true);
          localStorage.setItem("pushEnabled", "true");
          new Notification("Haan Pendler-Hub", {
              body: "Benachrichtigungen sind nun aktiv! Du wirst bei extremen Staus (+20 Min) oder Zugausfällen informiert.",
              icon: "/favicon.ico"
          });
        } else {
            alert("Bitte erlaube Benachrichtigungen im Browser.");
        }
      } else {
          alert("Dein Browser unterstützt keine Benachrichtigungen.");
      }
    } else {
      setEnabled(false);
      localStorage.setItem("pushEnabled", "false");
    }
  };

  return (
    <button 
      onClick={toggle}
      className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
          enabled 
            ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shadow-[0_0_15px_rgba(52,211,153,0.3)]"
            : "bg-white/5 text-white/50 border border-white/10 hover:bg-white/10"
      }`}
    >
      {enabled ? <Bell className="w-3.5 h-3.5" /> : <BellOff className="w-3.5 h-3.5" />}
      {enabled ? "Push: Aktiv" : "Push"}
    </button>
  );
}
