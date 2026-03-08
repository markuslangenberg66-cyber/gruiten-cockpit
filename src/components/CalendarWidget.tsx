"use client";
import React, { useState, useEffect } from 'react';
import { Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';
import clsx from 'clsx';

// ── Inline SVG: Gelber Sack ────────────────────────────────────────────────
function GelberSackIcon({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 36" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Sack-Knoten oben */}
      <ellipse cx="16" cy="5" rx="5" ry="3.5" fill="#FCD34D" opacity="0.9"/>
      <rect x="13" y="2" width="6" height="4" rx="2" fill="#F59E0B"/>
      {/* Sack-Körper */}
      <path d="M6 10 Q4 24 6 30 Q10 36 16 36 Q22 36 26 30 Q28 24 26 10 Q22 7 16 7 Q10 7 6 10Z"
            fill="#FCD34D"/>
      {/* Glanz-Reflex */}
      <path d="M10 12 Q9 20 10 26" stroke="#FEF3C7" strokeWidth="2" strokeLinecap="round" opacity="0.6"/>
      {/* Schattenfalten */}
      <path d="M20 10 Q22 18 21 28" stroke="#D97706" strokeWidth="1.2" strokeLinecap="round" opacity="0.5"/>
      <path d="M15 8 Q14 16 15 28" stroke="#D97706" strokeWidth="0.8" strokeLinecap="round" opacity="0.3"/>
      {/* Verschluss-Knoten */}
      <ellipse cx="16" cy="8" rx="4" ry="2" fill="#F59E0B"/>
    </svg>
  );
}

// ── Inline SVG: Restmüll-Tonne ─────────────────────────────────────────────
function RestmuellIcon({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 36" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Deckel */}
      <rect x="4" y="5" width="24" height="5" rx="2.5" fill="#6B7280"/>
      <rect x="12" y="2" width="8" height="4" rx="2" fill="#4B5563"/>
      {/* Tonne-Körper */}
      <path d="M6 10 L7 32 Q7 34 10 34 L22 34 Q25 34 25 32 L26 10Z" fill="#9CA3AF"/>
      {/* Längsstreifen */}
      <line x1="12" y1="12" x2="11" y2="32" stroke="#6B7280" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="16" y1="12" x2="16" y2="32" stroke="#6B7280" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="20" y1="12" x2="21" y2="32" stroke="#6B7280" strokeWidth="1.5" strokeLinecap="round"/>
      {/* Glanz */}
      <path d="M8 13 L8.5 28" stroke="#E5E7EB" strokeWidth="1.5" strokeLinecap="round" opacity="0.4"/>
    </svg>
  );
}

// ── Mülltyp → Icon & Farbe ────────────────────────────────────────────────
function WasteIcon({ type }: { type: string }) {
  const lower = type.toLowerCase();
  if (lower.includes("gelb") || lower.includes("sack") || lower.includes("wertstoff")) {
    return <GelberSackIcon />;
  }
  if (lower.includes("rest")) {
    return <RestmuellIcon />;
  }
  if (lower.includes("papier") || lower.includes("blaue")) {
    return (
      <svg width="28" height="36" viewBox="0 0 32 36" fill="none">
        <rect x="5" y="5" width="22" height="29" rx="3" fill="#3B82F6"/>
        <rect x="9" y="10" width="14" height="2" rx="1" fill="#BFDBFE"/>
        <rect x="9" y="15" width="14" height="2" rx="1" fill="#BFDBFE"/>
        <rect x="9" y="20" width="10" height="2" rx="1" fill="#BFDBFE"/>
        <rect x="12" y="2" width="8" height="4" rx="2" fill="#2563EB"/>
      </svg>
    );
  }
  if (lower.includes("bio") || lower.includes("braun")) {
    return (
      <svg width="28" height="36" viewBox="0 0 32 36" fill="none">
        <path d="M6 10 L7 32 Q7 34 10 34 L22 34 Q25 34 25 32 L26 10Z" fill="#92400E"/>
        <rect x="4" y="5" width="24" height="5" rx="2.5" fill="#78350F"/>
        <rect x="12" y="2" width="8" height="4" rx="2" fill="#451A03"/>
      </svg>
    );
  }
  // Fallback
  return <Trash2 className="w-6 h-6 opacity-50" />;
}

// ── Hauptkomponente ─────────────────────────────────────────────────────────
export default function CalendarWidget() {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const res = await fetch("/api/calendar");
        const json = await res.json();
        setEvents(json);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, []);

  if (loading || !events.length) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="glass-panel p-6"
    >
      <h2 className="text-xs font-bold mb-4 opacity-80 uppercase tracking-widest font-mono flex items-center gap-2">
        <Trash2 className="w-4 h-4" /> Smarter Müllkalender
      </h2>
      <div className="space-y-3">
        {events.map((event: any, i: number) => {
          const date   = new Date(event.start);
          const today  = new Date();
          const tmrw   = new Date(today);
          tmrw.setDate(tmrw.getDate() + 1);

          let dateStr   = date.toLocaleDateString("de-DE", { weekday: "short", day: "2-digit", month: "2-digit" });
          let highlight = false;

          if (date.toDateString() === today.toDateString()) { dateStr = "Heute";  highlight = true; }
          else if (date.toDateString() === tmrw.toDateString())  { dateStr = "Morgen"; highlight = true; }

          return (
            <div key={i} className={clsx(
              "flex justify-between items-center rounded-xl px-3 py-2 transition-colors",
              highlight ? "bg-white/5 border border-white/10" : ""
            )}>
              <span className={clsx("font-bold text-sm", highlight ? "text-emerald-400" : "opacity-60")}>
                {dateStr}
              </span>
              <div className="flex items-center gap-2">
                <span className={clsx("text-sm font-medium", highlight ? "text-white/90" : "opacity-50")}>
                  {event.summary}
                </span>
                <WasteIcon type={event.summary} />
              </div>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}
