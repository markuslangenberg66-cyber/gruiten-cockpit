"use client";
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

// ── Ostersonntag berechnen (Gauss-Algorithmus) ───────────────────────────
function getEaster(year: number): Date {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(year, month - 1, day);
}

// Nächsten Wochentag-Offset ab bestimmtem Datum
function nextWeekday(date: Date, wd: number): Date {
  const d = new Date(date);
  while (d.getDay() !== wd) d.setDate(d.getDate() + 1);
  return d;
}

// Nth Wochentag eines Monats (z.B. 2. Sonntag im Mai)
function nthWeekdayOfMonth(year: number, month: number, weekday: number, n: number): Date {
  const d = new Date(year, month - 1, 1);
  let count = 0;
  while (true) {
    if (d.getDay() === weekday) { count++; if (count === n) return new Date(d); }
    d.setDate(d.getDate() + 1);
  }
}

// ── Alle besonderen Tage für ein Jahr berechnen ──────────────────────────
function getSpecialDays(year: number): Record<string, { label: string; emoji: string; isHoliday: boolean }> {
  const easter = getEaster(year);
  const rel = (d: Date, offset: number) => {
    const r = new Date(d); r.setDate(r.getDate() + offset); return r;
  };
  const key = (d: Date) => `${d.getMonth() + 1}-${d.getDate()}`;

  const days: Record<string, { label: string; emoji: string; isHoliday: boolean }> = {};
  const add = (d: Date, label: string, emoji: string, isHoliday = false) => {
    days[key(d)] = { label, emoji, isHoliday };
  };

  // ── Feste gesetzliche Feiertage (NRW) ───────────────────────────────
  add(new Date(year,  0,  1), "Neujahr",                      "🎆", true);
  add(new Date(year,  0,  6), "Heilige Drei Könige",          "👑", false); // kein NRW-Feiertag, aber bekannt
  add(new Date(year,  4,  1), "Tag der Arbeit",               "⚒️",  true);
  add(new Date(year,  9,  3), "Tag der Deutschen Einheit",    "🇩🇪", true);
  add(new Date(year, 10,  1), "Allerheiligen",                "🕯️",  true);
  add(new Date(year, 11, 25), "1. Weihnachtstag",             "🎄", true);
  add(new Date(year, 11, 26), "2. Weihnachtstag",             "🎄", true);
  add(new Date(year, 11, 31), "Silvester",                    "🎉", false);

  // ── Bewegliche Feiertage (Oster-basiert) ────────────────────────────
  add(rel(easter, -2),  "Karfreitag",                         "✝️",  true);
  add(easter,           "Ostersonntag",                       "🐣", true);
  add(rel(easter, +1),  "Ostermontag",                       "🐣", true);
  add(rel(easter, +39), "Christi Himmelfahrt / Vatertag",    "🍺", true);
  add(rel(easter, +49), "Pfingstsonntag",                    "🕊️",  true);
  add(rel(easter, +50), "Pfingstmontag",                     "🕊️",  true);
  add(rel(easter, +60), "Fronleichnam (NRW)",                "⛪", true);

  // ── Besondere Tage / Anlässe ─────────────────────────────────────────
  add(new Date(year,  1, 14), "Valentinstag",                 "💝");
  add(new Date(year,  2,  8), "Internationaler Frauentag",    "💜");
  add(new Date(year,  3,  1), "Aprilscherz-Tag",              "🤡");
  add(new Date(year,  9, 31), "Halloween",                    "🎃");
  add(new Date(year, 11, 24), "Heiligabend",                  "🎁");
  add(new Date(year, 11,  6), "Nikolaus",                     "🎅");

  // ── Bewegliche besondere Tage ────────────────────────────────────────
  // Muttertag: 2. Sonntag im Mai
  add(nthWeekdayOfMonth(year, 5, 0, 2),  "Muttertag", "💐");
  // Kindertag: 1. Sonntag im Juni
  add(nthWeekdayOfMonth(year, 6, 0, 1),  "Internationaler Kindertag", "👶");
  // Erntedankfest: 1. Sonntag im Oktober
  add(nthWeekdayOfMonth(year, 10, 0, 1), "Erntedankfest", "🌾");
  // Volkstrauertag: 2. Sonntag vor dem 1. Advent
  // 1. Advent: 4. Sonntag vor Weihnachten
  const advent1 = (() => {
    const xmas = new Date(year, 11, 25);
    const d = new Date(xmas); 
    d.setDate(d.getDate() - ((d.getDay() || 7) - 1 + 21) % 7 - 21);
    return d;
  })();
  const volkstrauer = new Date(advent1); volkstrauer.setDate(volkstrauer.getDate() - 14);
  add(volkstrauer, "Volkstrauertag", "🕯️");
  const totensonntag = new Date(advent1); totensonntag.setDate(totensonntag.getDate() - 7);
  add(totensonntag, "Totensonntag", "🕯️");
  
  // Karneval / Rosenmontag
  add(rel(easter, -48), "Rosenmontag", "🎭");
  add(rel(easter, -47), "Fastnacht",   "🎭");

  return days;
}

// ── Hauptkomponente ──────────────────────────────────────────────────────
export default function LiveClock() {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const tick = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(tick);
  }, []);

  const specialDays = getSpecialDays(now.getFullYear());
  const todayKey = `${now.getMonth() + 1}-${now.getDate()}`;
  const special = specialDays[todayKey];

  const dateStr = now.toLocaleDateString("de-DE", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  const timeStr = now.toLocaleTimeString("de-DE", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  return (
    <div className="flex flex-col items-end gap-0.5 min-w-0">
      {/* Uhrzeit */}
      <div className="text-2xl sm:text-3xl font-extralight tabular-nums tracking-tight opacity-90 leading-none">
        {timeStr}
      </div>

      {/* Datum */}
      <div className="text-xs opacity-50 text-right leading-tight">
        {dateStr}
      </div>

      {/* Besonderer Tag */}
      <AnimatePresence>
        {special && (
          <motion.div
            key={todayKey}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            className={`mt-1 text-xs px-2 py-0.5 rounded-full font-semibold flex items-center gap-1 ${
              special.isHoliday
                ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/25"
                : "bg-white/5 text-white/60 border border-white/10"
            }`}
          >
            <span>{special.emoji}</span>
            <span>{special.label}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
