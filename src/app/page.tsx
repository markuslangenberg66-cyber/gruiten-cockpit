"use client";
import React, { useState, useEffect } from 'react';
import WeatherWidget from '@/components/WeatherWidget';
import TrafficWidget from '@/components/TrafficWidget';
import TransportWidget from '@/components/TransportWidget';
import CalendarWidget from '@/components/CalendarWidget';
import PushToggle from '@/components/PushToggle';
import LiveClock from '@/components/LiveClock';
import BlitzerWidget from '@/components/BlitzerWidget';
import InstallButton from '@/components/InstallButton';
import GasWidget from '@/components/GasWidget';
import NewsWidget from '@/components/NewsWidget';
import { ShieldAlert, Sun, Moon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Dashboard() {
  const [isMorning, setIsMorning] = useState(true);
  const [trafficWarn, setTrafficWarn] = useState(false);
  const [trainWarn, setTrainWarn] = useState(false);

  useEffect(() => {
    const checkTime = () => {
      const hour = new Date().getHours();
      // Vor 14 Uhr = Hinfahrt (Haan -> Düsseldorf)
      // Ab 14 Uhr = Rückfahrt (Düsseldorf -> Haan)
      setIsMorning(hour < 14);
    };
    checkTime();
    // Prüfe jede Minute, ob sich die Tageszeit geändert hat
    const interval = setInterval(checkTime, 60000);
    return () => clearInterval(interval);
  }, []);

  // Push-Benachrichtigungen
  useEffect(() => {
    const notify = (title: string, msg: string) => {
      const on = localStorage.getItem("pushEnabled") === "true";
      if (on && Notification?.permission === "granted") {
        new Notification(title, { body: msg, icon: '/favicon.ico' });
      }
    };
    if (trafficWarn) notify("Stauwarnung A46", "Über 20 Min Stau – bitte Ausweichroute prüfen!");
  }, [trafficWarn]);

  useEffect(() => {
    const notify = (title: string, msg: string) => {
      const on = localStorage.getItem("pushEnabled") === "true";
      if (on && Notification?.permission === "granted") {
        new Notification(title, { body: msg, icon: '/favicon.ico' });
      }
    };
    if (trainWarn) notify("Zugausfall / Verspätung", "Probleme im ÖPNV auf der Strecke Haan ↔ Düsseldorf.");
  }, [trainWarn]);

  const hasWarning = trafficWarn || trainWarn;

  return (
    <div className="space-y-4 sm:space-y-6">

      {/* ── Header ── */}
      <motion.header
        initial={{ y: -16, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="flex items-start justify-between gap-3"
      >
        {/* Links: Titel + Fokus-Label */}
        <div className="min-w-0 flex-1">
          <h1 className="text-xl sm:text-3xl md:text-4xl font-extrabold tracking-tight
                         bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-teal-200
                         leading-tight">
            Gruitener Cockpit
          </h1>
          <p className="text-xs sm:text-sm font-medium opacity-70 mt-1 flex items-center gap-1.5">
            {isMorning
              ? <><Sun className="w-3.5 h-3.5 text-yellow-400 flex-shrink-0" /> Hinfahrt nach Düsseldorf</>
              : <><Moon className="w-3.5 h-3.5 text-purple-400 flex-shrink-0" /> Rückfahrt nach Haan</>
            }
          </p>
        </div>

        {/* Rechts: Uhr + Push-Toggle */}
        <div className="flex flex-col items-end gap-2 flex-shrink-0">
          <LiveClock />
          <PushToggle />
        </div>
      </motion.header>

      {/* ── Warnbanner ── */}
      <AnimatePresence>
        {hasWarning && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-red-900/40 border border-red-500/50 rounded-xl p-3 sm:p-4 flex gap-3 items-start text-red-200">
              <ShieldAlert className="w-6 h-6 flex-shrink-0 mt-0.5 text-red-400" />
              <div>
                <h3 className="font-bold text-base text-white leading-tight">Pendler-Warnung!</h3>
                <p className="text-xs sm:text-sm opacity-90 mt-1">
                  {trafficWarn && trainWarn
                    ? "Stau auf A46 UND Störungen im ÖPNV. Beide Routen beeinträchtigt!"
                    : trafficWarn
                    ? "Mindestens 20 Min Stau auf der A46. Ausweichroute im Widget prüfen."
                    : "Zugausfall oder Verspätung auf der Strecke. Ggf. auf Pkw ausweichen."}
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Mobile-first: 1 Spalte → ab md: 2/3-Spalten-Grid ── */}
      {/*
          Reihenfolge auf Handy (von oben nach unten, nach Wichtigkeit):
          1. Autofahrt A46         ← häufigste Info, groß
          2. S-Bahn Monitor
          3. Wetter & Pollen
          4. Spritpreise
          5. Müllkalender
          6. Lokalnachrichten
      */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">

        {/* Hauptbereich – auf großen Screens 2/3 */}
        <div className="md:col-span-1 lg:col-span-2 space-y-4 sm:space-y-6">
          <TrafficWidget isMorning={isMorning} onWarning={setTrafficWarn} />

          {/* S-Bahn + Wetter: auf Mobile untereinander, ab md nebeneinander */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            <TransportWidget isMorning={isMorning} onWarning={setTrainWarn} />
            <WeatherWidget isMorning={isMorning} />
          </div>
          
          {/* Blitzer-Melder direkt drunter für Verkehrsrelevanz */}
          <BlitzerWidget isMorning={isMorning} />
        </div>

        {/* Sidebar – auf Mobile nach den Hauptwidgets */}
        <div className="space-y-4 sm:space-y-6">
          <GasWidget />
          <CalendarWidget />
          <NewsWidget />
        </div>

      </div>

      <div className="md:max-w-md mx-auto">
         <InstallButton />
      </div>

      <footer className="pt-4 pb-2 text-center text-xs opacity-30">
        TomTom · Tankerkönig · DB · Open-Meteo
      </footer>
    </div>
  );
}
