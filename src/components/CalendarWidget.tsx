"use client";
import React, { useState, useEffect } from 'react';
import { Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';
import clsx from 'clsx';

// ── Universelles Tonnen-Icon ───────────────────────────────────────────────
function BinIcon({ lidColor, handleColor, bodyColor, stripeColor, size = 28 }: { lidColor: string, handleColor: string, bodyColor: string, stripeColor: string, size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 36" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Räder */}
      <rect x="5" y="30" width="3" height="4" rx="1.5" fill="#374151"/>
      <rect x="24" y="30" width="3" height="4" rx="1.5" fill="#374151"/>
      {/* Deckel */}
      <rect x="4" y="5" width="24" height="5" rx="2.5" fill={lidColor}/>
      <rect x="12" y="2" width="8" height="4" rx="2" fill={handleColor}/>
      {/* Tonne-Körper */}
      <path d="M6 10 L7 32 Q7 34 10 34 L22 34 Q25 34 25 32 L26 10Z" fill={bodyColor}/>
      {/* Längsstreifen */}
      <line x1="12" y1="12" x2="11" y2="30" stroke={stripeColor} strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="16" y1="12" x2="16" y2="30" stroke={stripeColor} strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="20" y1="12" x2="21" y2="30" stroke={stripeColor} strokeWidth="1.5" strokeLinecap="round"/>
      {/* Glanz */}
      <path d="M8 13 L8.5 28" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" opacity="0.3"/>
    </svg>
  );
}

// ── Schadstoffe Icon (Warndreieck) ─────────────────────────────────────────
function SchadstoffeIcon({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 36" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M16 5 L3 30 Q2 32 5 32 L27 32 Q30 32 29 30 Z" fill="#EF4444"/>
      <rect x="14" y="12" width="4" height="10" rx="2" fill="#FFFFFF"/>
      <circle cx="16" cy="27" r="2.5" fill="#FFFFFF"/>
    </svg>
  );
}

// ── Weihnachtsbaum Icon ───────────────────────────────────────────────────
function TreeIcon({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 36" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="13" y="28" width="6" height="6" fill="#4B5563"/>
      <path d="M16 16 L28 28 L4 28 Z" fill="#15803D"/>
      <path d="M16 10 L26 21 L6 21 Z" fill="#16A34A"/>
      <path d="M16 4 L24 14 L8 14 Z" fill="#22C55E"/>
    </svg>
  );
}

// ── Mülltyp → Icon & Farbe ────────────────────────────────────────────────
function WasteIcon({ type }: { type: string }) {
  const lower = type.toLowerCase();
  
  if (lower.includes("schadstoff")) {
    return <SchadstoffeIcon />;
  }
  if (lower.includes("baum") || lower.includes("weihnacht") || lower.includes("tanne")) {
    return <TreeIcon />;
  }
  if (lower.includes("gelb") || lower.includes("sack") || lower.includes("wertstoff") || lower.includes("verpackung")) {
    return <BinIcon lidColor="#EAB308" handleColor="#CA8A04" bodyColor="#FCD34D" stripeColor="#F59E0B" />;
  }
  if (lower.includes("papier") || lower.includes("blau")) {
    return <BinIcon lidColor="#3B82F6" handleColor="#2563EB" bodyColor="#60A5FA" stripeColor="#3B82F6" />;
  }
  if (lower.includes("bio") || lower.includes("braun")) {
    return <BinIcon lidColor="#92400E" handleColor="#78350F" bodyColor="#B45309" stripeColor="#92400E" />;
  }
  if (lower.includes("rest") || lower.includes("grau")) {
    return <BinIcon lidColor="#6B7280" handleColor="#4B5563" bodyColor="#9CA3AF" stripeColor="#6B7280" />;
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
              <div className="flex flex-col items-end flex-1 pl-4">
                <div className="flex items-center gap-2 justify-end w-full">
                  <span className={clsx("text-sm font-medium text-right", highlight ? "text-white/90" : "opacity-50")}>
                    {event.summary}
                  </span>
                  <div className="flex-shrink-0">
                    <WasteIcon type={event.summary} />
                  </div>
                </div>
                {event.description && (
                  <span className="text-[10px] text-white/50 text-right leading-tight mt-0.5 max-w-[180px]">
                    {event.description}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}
