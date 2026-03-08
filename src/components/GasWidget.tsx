"use client";
import React, { useState, useEffect } from 'react';
import { Fuel, KeyRound } from 'lucide-react';
import { motion } from 'framer-motion';

type PriceState = "loading" | "no-key" | "error" | "ok";

export default function GasWidget() {
  const [prices, setPrices] = useState<{ e5: number | false; e10: number | false; status: string } | null>(null);
  const [state, setState] = useState<PriceState>("loading");

  useEffect(() => {
    const fetchGas = async () => {
      try {
        const res = await fetch("/api/gas");
        const json = await res.json();

        if (json.error?.includes("No Tankerkonig API key")) {
          setState("no-key");
          return;
        }

        if (json.ok && json.prices) {
          const id = "896f1856-5255-4eae-aa80-9636335ae927"; // Shell Gruitener Str. 2
          const data = json.prices[id];
          if (data) {
            setPrices(data);
            setState("ok");
          } else {
            setState("error");
          }
        } else {
          setState("error");
        }
      } catch {
        setState("error");
      }
    };
    fetchGas();
    const interval = setInterval(fetchGas, 15 * 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="glass-panel p-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xs font-bold opacity-80 uppercase tracking-widest font-mono flex items-center gap-2">
          <Fuel className="w-4 h-4" /> Spritpreise · Shell Haan
        </h2>
        {state === "ok" && prices && (
          <span className={`text-xs font-bold px-2 py-0.5 rounded ${
            prices.status === "open"
              ? "text-emerald-400 bg-emerald-500/10"
              : "text-red-400 bg-red-500/10"
          }`}>
            {prices.status === "open" ? "Geöffnet" : "Geschlossen"}
          </span>
        )}
      </div>

      {/* Adresse */}
      <p className="text-xs opacity-40 mb-4">Gruitener Str. 2 · 42781 Haan</p>

      {/* States */}
      {state === "loading" && (
        <div className="space-y-3 animate-pulse">
          <div className="h-8 bg-white/10 rounded-lg w-3/4"></div>
          <div className="h-8 bg-white/10 rounded-lg w-2/4"></div>
        </div>
      )}

      {state === "no-key" && (
        <div className="flex flex-col items-center justify-center py-4 text-center gap-3">
          <KeyRound className="w-8 h-8 text-amber-400/60" />
          <div>
            <p className="text-sm font-semibold text-amber-300">API-Key ausstehend</p>
            <p className="text-xs opacity-50 mt-1">
              Tankerkönig-Schlüssel in<br /><code className="text-amber-400/70">.env.local</code> eintragen
            </p>
          </div>
        </div>
      )}

      {state === "error" && (
        <p className="text-sm text-orange-400 opacity-80">Preisdaten momentan nicht verfügbar.</p>
      )}

      {state === "ok" && prices && prices.status === "open" && (
        <div className="grid grid-cols-2 gap-4">
          {/* Super E5 */}
          <div className="flex flex-col gap-1 p-3 rounded-xl bg-white/5 border border-white/10">
            <span className="text-xs opacity-60 font-medium">Super E5</span>
            <span className="text-2xl font-light text-emerald-400 tabular-nums">
              {prices.e5 !== false ? `${prices.e5}` : <span className="text-sm opacity-40">–</span>}
            </span>
            {prices.e5 !== false && <span className="text-xs opacity-40">€ / Liter</span>}
          </div>

          {/* Super E10 (kein "Super Plus" in Tankerkönig-API) */}
          <div className="flex flex-col gap-1 p-3 rounded-xl bg-white/5 border border-white/10">
            <span className="text-xs opacity-60 font-medium">Super E10</span>
            <span className="text-2xl font-light text-emerald-400 tabular-nums">
              {prices.e10 !== false ? `${prices.e10}` : <span className="text-sm opacity-40">–</span>}
            </span>
            {prices.e10 !== false && <span className="text-xs opacity-40">€ / Liter</span>}
          </div>
        </div>
      )}

      {state === "ok" && prices && prices.status !== "open" && (
        <p className="text-sm opacity-50 text-center py-4">Tankstelle aktuell geschlossen</p>
      )}
    </motion.div>
  );
}
