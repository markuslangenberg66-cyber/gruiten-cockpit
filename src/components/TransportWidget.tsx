"use client";
import React, { useState, useEffect } from 'react';
import { Train, AlertCircle, Clock } from 'lucide-react';
import { motion } from 'framer-motion';
import clsx from 'clsx';
import { format } from 'date-fns';

export default function TransportWidget({ isMorning, onWarning }: { isMorning: boolean, onWarning: (warn: boolean) => void }) {
  const [journeys, setJourneys] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTransport = async () => {
      try {
        setError(null);
        const direction = isMorning ? "outbound" : "inbound";
        const res = await fetch(`/api/transport?direction=${direction}`);
        const data = await res.json();

        if (data.journeys) {
          setJourneys(data.journeys);

          // Warnung wenn Ausfall oder Verspätung > 10 Min (delay in Sekunden)
          const anySevere = data.journeys.some((j: any) => {
            if (j.cancelled) return true;
            const delayMin = (j.delay || 0) / 60;
            if (delayMin > 10) return true;
            return false;
          });
          onWarning(anySevere);
        } else {
          setError(data.error || "Keine S-Bahn-Verbindungen gefunden");
          onWarning(false);
        }
      } catch (err) {
        console.error(err);
        setError("Verbindungsfehler zur ÖPNV-API");
      } finally {
        setLoading(false);
      }
    };
    fetchTransport();
    const interval = setInterval(fetchTransport, 5 * 60000); // alle 5 Min
    return () => clearInterval(interval);
  }, [isMorning, onWarning]);

  if (loading) return <div className="glass-panel p-6 animate-pulse bg-white/5 h-48 rounded-xl"></div>;

  if (error || !journeys.length) {
    return (
      <div className="glass-panel p-6">
        <h2 className="text-xs font-bold mb-3 opacity-80 uppercase tracking-widest font-mono flex items-center gap-2">
          <Train className="w-4 h-4" /> S-Bahn Monitor
        </h2>
        <p className="text-sm text-orange-400 opacity-80 mb-3">
          {error || "Keine S-Bahn-Verbindungen gefunden"}
        </p>
        <button
          onClick={() => { setLoading(true); setError(null); }}
          className="text-xs opacity-50 hover:opacity-100 transition-opacity underline"
        >
          Jetzt erneut versuchen
        </button>
      </div>
    );
  }

  const routeLabel = isMorning
    ? "Haan-Gruiten → Düsseldorf Hbf"
    : "Düsseldorf Hbf → Haan-Gruiten";

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="glass-panel p-6"
    >
      <h2 className="text-xs font-bold mb-1 opacity-80 uppercase tracking-widest font-mono flex items-center gap-2">
        <Train className="w-4 h-4" /> S-Bahn Monitor
      </h2>
      <p className="text-xs opacity-50 mb-4">{routeLabel}</p>

      <div className="space-y-4">
        {journeys.slice(0, 4).map((journey, i) => {
          const plannedDep = new Date(journey.plannedDeparture);
          const plannedArr = new Date(journey.plannedArrival);
          const delayMin = Math.round((journey.delay || 0) / 60);
          const cancelled = journey.cancelled;
          const durationMin = Math.round((plannedArr.getTime() - plannedDep.getTime()) / 60000);

          return (
            <div
              key={i}
              className={clsx(
                "flex justify-between items-center pb-3 border-b border-white/10 last:border-0 last:pb-0",
                cancelled && "opacity-40"
              )}
            >
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-xl tabular-nums">{format(plannedDep, "HH:mm")}</span>
                  {delayMin > 0 && !cancelled && (
                    <span className="text-xs text-red-400 font-bold bg-red-500/10 px-1.5 py-0.5 rounded border border-red-500/20">
                      +{delayMin} Min
                    </span>
                  )}
                  {cancelled && (
                    <span className="text-xs text-red-500 font-bold bg-red-500/10 px-1.5 py-0.5 rounded border border-red-500/20 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" /> Ausfall
                    </span>
                  )}
                </div>
                <span className="text-xs opacity-60 font-semibold tracking-wide">
                  {journey.line?.name || "S-Bahn"}
                </span>
              </div>

              <div className="text-right flex flex-col items-end gap-1">
                <span className="font-bold text-xl tabular-nums opacity-80">{format(plannedArr, "HH:mm")}</span>
                <span className="text-xs opacity-50 flex items-center gap-1">
                  <Clock className="w-3 h-3" /> {durationMin} min
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}
