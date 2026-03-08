"use client";
import React, { useState, useEffect } from 'react';
import { Train, AlertCircle, Clock, ChevronDown, MapPin, Footprints } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';
import { format } from 'date-fns';

export default function TransportWidget({ isMorning, onWarning }: { isMorning: boolean, onWarning: (warn: boolean) => void }) {
  const [journeys, setJourneys] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

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
                "pb-3 border-b border-white/10 last:border-0 last:pb-0",
                cancelled && "opacity-40"
              )}
            >
              <div 
                className="flex justify-between items-center cursor-pointer hover:bg-white/5 p-2 -mx-2 rounded transition-colors group"
                onClick={() => setExpandedIndex(expandedIndex === i ? null : i)}
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
                  <span className="text-xs opacity-60 font-semibold tracking-wide flex items-center gap-1">
                    {journey.line?.name || "S-Bahn"} 
                    <ChevronDown className={clsx("w-3 h-3 transition-transform", expandedIndex === i && "rotate-180")} />
                  </span>
                </div>

                <div className="text-right flex flex-col items-end gap-1">
                  <span className="font-bold text-xl tabular-nums opacity-80">{format(plannedArr, "HH:mm")}</span>
                  <span className="text-xs opacity-50 flex items-center gap-1">
                    <Clock className="w-3 h-3" /> {durationMin} min
                  </span>
                </div>
              </div>

              <AnimatePresence>
                {expandedIndex === i && journey.legs && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="mt-2 pl-3 ml-2 border-l-2 border-white/10 space-y-3 py-2 text-xs">
                      {journey.legs.map((leg: any, idx: number) => {
                        const isWalk = leg.name === "Fußweg";
                        return (
                          <div key={idx} className="relative">
                            <div className="absolute -left-[17px] top-1 w-2 h-2 rounded-full bg-slate-500 ring-4 ring-[#0b0f19]"></div>
                            <div className="flex justify-between items-start mb-0.5">
                              <span className={clsx("font-semibold flex items-center gap-1", isWalk ? "text-emerald-400/80" : "text-emerald-400")}>
                                {isWalk ? <Footprints className="w-3 h-3" /> : <Train className="w-3 h-3" />}
                                {leg.name}
                              </span>
                              <span className="tabular-nums font-mono opacity-60">
                                {leg.plannedDeparture ? format(new Date(leg.plannedDeparture), "HH:mm") : ""}
                                {leg.plannedDeparture && leg.plannedArrival ? " - " : ""}
                                {leg.plannedArrival ? format(new Date(leg.plannedArrival), "HH:mm") : ""}
                              </span>
                            </div>
                            <div className="flex flex-col opacity-60">
                              <span className="truncate flex items-center gap-1">
                                <div className="w-1 h-1 rounded-full bg-white/30 mr-1" /> {leg.origin}
                              </span>
                              <span className="truncate flex items-center gap-1 ml-2">
                                <MapPin className="w-3 h-3 text-emerald-400/50" /> {leg.destination}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}
