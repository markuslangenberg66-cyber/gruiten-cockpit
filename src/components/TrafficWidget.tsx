"use client";
import React, { useState, useEffect } from 'react';
import { Car, AlertTriangle, Map, Clock } from 'lucide-react';
import { motion } from 'framer-motion';
import clsx from 'clsx';

export default function TrafficWidget({ isMorning, onWarning }: { isMorning: boolean, onWarning: (warn: boolean) => void }) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTraffic = async () => {
      try {
        const direction = isMorning ? 'outbound' : 'inbound';
        const res = await fetch(`/api/traffic?direction=${direction}`);
        const json = await res.json();
        setData(json);

        // Warnung wenn Stau > 20 Min auf der A46
        onWarning((json.a46?.delayMin ?? 0) >= 20);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchTraffic();
    const interval = setInterval(fetchTraffic, 10 * 60000); // alle 10 Min
    return () => clearInterval(interval);
  }, [isMorning, onWarning]);

  if (loading) return <div className="glass-panel p-6 animate-pulse bg-white/5 h-48 rounded-xl"></div>;
  if (!data || !data.a46) return <div className="glass-panel p-6 text-sm text-red-400">TomTom Data unavailable (Check API Key)</div>;

  const { a46, alternative } = data;
  const hasHeavyDelay = a46.delayMin >= 20;
  const hasLightDelay = a46.delayMin >= 5;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={clsx(
        "glass-panel p-6 border transition-colors duration-500",
        hasHeavyDelay ? "border-red-500/50 bg-red-950/20" : "border-white/10"
      )}
    >
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xs font-bold opacity-80 uppercase tracking-widest font-mono flex items-center gap-2">
          <Car className="w-4 h-4" />
          Autofahrt via A46 {isMorning ? '→ Düsseldorf' : '→ Haan'}
        </h2>
        {hasLightDelay && (
          <div className={clsx(
            "flex items-center gap-1 text-xs px-2 py-1 rounded font-bold border",
            hasHeavyDelay
              ? "bg-red-500/20 text-red-400 border-red-500/30"
              : "bg-orange-500/20 text-orange-400 border-orange-500/30"
          )}>
            <AlertTriangle className="w-3 h-3" /> +{a46.delayMin} Min Stau
          </div>
        )}
      </div>

      {/* Hauptzeit */}
      <div className="flex items-end gap-3 mb-1">
        <span className="text-5xl font-extralight tabular-nums">{a46.travelTimeMin}</span>
        <span className="text-lg opacity-60 mb-1">min</span>
      </div>
      <p className="text-xs opacity-40 mb-1">
        Regulär: {a46.baseTimeMin} min · {a46.lengthKm} km · A46
      </p>
      <p className="text-xs opacity-30">
        {isMorning ? 'Bahnstr. 56, Haan → Kavalleriestr. 22, Düsseldorf' : 'Kavalleriestr. 22, Düsseldorf → Bahnstr. 56, Haan'}
      </p>

      {/* Ausweichroute – nur bei starkem Stau (≥ 20 Min) */}
      {hasHeavyDelay && alternative && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="mt-5 p-4 rounded-xl bg-amber-950/40 border border-amber-500/30"
        >
          <div className="flex items-center gap-2 text-amber-400 mb-2 font-bold text-xs uppercase tracking-wider">
            <Map className="w-3.5 h-3.5" /> Ausweichroute empfohlen
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-amber-200 font-semibold">{alternative.via}</p>
              <p className="text-xs opacity-60 mt-0.5">{alternative.lengthKm} km ohne Autobahn</p>
            </div>
            <div className="text-right">
              <span className="text-2xl font-light text-amber-300 tabular-nums">{alternative.travelTimeMin}</span>
              <span className="text-sm text-amber-300 opacity-70"> min</span>
              {alternative.travelTimeMin < a46.travelTimeMin && (
                <p className="text-xs text-emerald-400 font-bold mt-0.5">
                  -{a46.travelTimeMin - alternative.travelTimeMin} Min schneller
                </p>
              )}
            </div>
          </div>
        </motion.div>
      )}

      {/* Leichte Verzögerung – kleiner Hinweis */}
      {hasLightDelay && !hasHeavyDelay && (
        <div className="mt-4 pt-3 border-t border-white/10 flex items-center gap-2 text-xs text-orange-400/80">
          <Clock className="w-3 h-3" />
          Leichte Verzögerung auf der A46 – Ausweichroute wird ab +20 Min angezeigt.
        </div>
      )}
    </motion.div>
  );
}
