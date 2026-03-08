"use client";
import React, { useState, useEffect } from 'react';
import { Camera, AlertCircle, MapPin, Gauge } from 'lucide-react';
import { motion } from 'framer-motion';

export default function BlitzerWidget({ isMorning }: { isMorning: boolean }) {
  const [blitzers, setBlitzers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBlitzers = async () => {
      try {
        const dir = isMorning ? "outbound" : "inbound";
        const res = await fetch(`/api/blitzer?direction=${dir}`);
        if (!res.ok) throw new Error("Blitzer-Melder momentan gestört");
        const json = await res.json();
        
        if (json.error) {
          throw new Error(json.error);
        }
        
        setBlitzers(json.blitzers || []);
      } catch (err: any) {
        console.error(err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchBlitzers();
    // Update every 5 minutes
    const interval = setInterval(fetchBlitzers, 5 * 60000);
    return () => clearInterval(interval);
  }, [isMorning]);

  if (loading) return <div className="glass-panel p-6 animate-pulse bg-white/5 h-40 rounded-xl"></div>;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="glass-panel p-6"
    >
      <h2 className="text-xs font-bold mb-4 opacity-80 uppercase tracking-widest font-mono flex items-center gap-2">
        <Camera className="w-4 h-4 text-rose-400" /> Blitzer- & Gefahren-Melder
      </h2>

      {error ? (
        <p className="text-sm text-rose-400 opacity-80">{error}</p>
      ) : blitzers.length === 0 ? (
        <div className="flex items-center gap-2 text-emerald-400 text-sm opacity-80 mt-2 py-4">
          <AlertCircle className="w-4 h-4" /> Keine Störungen oder Blitzer gemeldet. Freie Fahrt!
        </div>
      ) : (
        <div className="space-y-3 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
          {/* Zeige max. 5 aktuelle Meldungen */}
          {blitzers.slice(0, 5).map((blitzer: any) => {
            const isMobile = blitzer.type === 1 || blitzer.type === 5;
            const isDanger = blitzer.type === 6;

            return (
              <div 
                key={blitzer.id}
                className={`p-3 rounded-lg border flex flex-col gap-1 transition-colors ${
                  isMobile || isDanger
                    ? "bg-rose-950/20 border-rose-500/20"
                    : "bg-white/5 border-white/10"
                }`}
              >
                <div className="flex justify-between items-start">
                  <span className={`text-sm font-semibold flex items-center gap-1.5 ${
                    isMobile || isDanger ? "text-rose-400" : "text-amber-400"
                  }`}>
                    {blitzer.typeText}
                  </span>
                  
                  {blitzer.vmax && (
                    <span className="flex items-center justify-center font-bold text-xs ring-2 ring-rose-500 rounded-full w-6 h-6 bg-white text-black shadow-lg">
                      {blitzer.vmax}
                    </span>
                  )}
                </div>

                <span className="text-xs opacity-80 flex items-center gap-1.5 mt-0.5">
                  <MapPin className="w-3 h-3 opacity-60 flex-shrink-0" />
                  <span className="truncate">{blitzer.street}</span>
                </span>
                
                <span className="text-[10px] opacity-40 mt-1">
                  Gemeldet: {blitzer.confirmDate ? new Date(blitzer.confirmDate).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" }) : "Gerade eben"}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}
