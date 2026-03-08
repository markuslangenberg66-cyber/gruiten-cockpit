"use client";
import React, { useState, useEffect } from 'react';
import { Sun, Cloud, CloudRain, CloudSnow, CloudLightning, Droplets, Wind } from 'lucide-react';
import { motion } from 'framer-motion';

// ── WMO-Wettercode → Icon & Textbeschreibung ─────────────────────────────
function WeatherIcon({ code, size = "md" }: { code: number; size?: "sm" | "md" | "lg" }) {
  const cls = size === "lg" ? "w-10 h-10" : size === "sm" ? "w-5 h-5" : "w-7 h-7";
  if (code <= 1)  return <Sun className={`${cls} text-yellow-400`} />;
  if (code <= 3)  return <Cloud className={`${cls} text-gray-300`} />;
  if (code <= 48) return <Cloud className={`${cls} text-gray-400`} />;
  if (code <= 57) return <Droplets className={`${cls} text-blue-300`} />;  // Nieselregen
  if (code <= 67) return <CloudRain className={`${cls} text-blue-400`} />;
  if (code <= 77) return <CloudSnow className={`${cls} text-sky-200`} />;
  if (code <= 82) return <CloudRain className={`${cls} text-blue-500`} />;
  if (code <= 99) return <CloudLightning className={`${cls} text-purple-400`} />;
  return <Cloud className={cls} />;
}

function weatherLabel(code: number): string {
  if (code <= 0)  return "Klar";
  if (code <= 1)  return "Sonnig";
  if (code <= 3)  return "Bewölkt";
  if (code <= 48) return "Nebel";
  if (code <= 57) return "Nieselregen";
  if (code <= 67) return "Regen";
  if (code <= 77) return "Schnee";
  if (code <= 82) return "Schauer";
  if (code <= 99) return "Gewitter";
  return "–";
}

// ── Hauptkomponente ──────────────────────────────────────────────────────
export default function WeatherWidget({ isMorning }: { isMorning: boolean }) {
  const [haanData, setHaanData]   = useState<any>(null);
  const [dusData,  setDusData]    = useState<any>(null);
  const [forecast, setForecast]   = useState<any[]>([]);
  const [loading,  setLoading]    = useState(true);

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        // Haan: current + 4-Tage-Prognose
        const [haanRes, dusRes] = await Promise.all([
          fetch("https://api.open-meteo.com/v1/forecast?latitude=51.196&longitude=7.009&current=temperature_2m,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum&forecast_days=4&timezone=Europe%2FBerlin"),
          fetch("https://api.open-meteo.com/v1/forecast?latitude=51.2277&longitude=6.7735&current=temperature_2m,weather_code&timezone=Europe%2FBerlin"),
        ]);
        const haan = await haanRes.json();
        const dus  = await dusRes.json();

        setHaanData(haan);
        setDusData(dus);

        // 3-Tage-Prognose für Haan (Tage 1–3, Tag 0 = heute)
        const daily = haan.daily;
        const days: any[] = [];
        for (let i = 1; i <= 3; i++) {
          const date = new Date(daily.time[i] + "T00:00:00");
          days.push({
            label: date.toLocaleDateString("de-DE", { weekday: "short", day: "2-digit", month: "2-digit" }),
            code:  daily.weather_code[i],
            max:   Math.round(daily.temperature_2m_max[i]),
            min:   Math.round(daily.temperature_2m_min[i]),
            rain:  daily.precipitation_sum[i],
          });
        }
        setForecast(days);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchWeather();
    const interval = setInterval(fetchWeather, 30 * 60000);
    return () => clearInterval(interval);
  }, []);

  if (loading) return <div className="glass-panel p-6 animate-pulse bg-white/5 h-48 rounded-xl"></div>;
  if (!haanData || !dusData) return <div className="glass-panel p-6 text-red-400 text-sm">Wetterdaten nicht verfügbar</div>;

  const primData   = isMorning ? haanData : dusData;
  const secData    = isMorning ? dusData  : haanData;
  const primLabel  = isMorning ? "Haan (Aktuell)"       : "Düsseldorf (Aktuell)";
  const secLabel   = isMorning ? "Düsseldorf (Ziel)"    : "Haan (Ziel)";

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="glass-panel p-6"
    >
      <h2 className="text-xs font-bold mb-4 opacity-80 uppercase tracking-widest font-mono flex items-center gap-2">
        <Sun className="w-4 h-4" /> Wetter &amp; Pollen
      </h2>

      {/* ── Aktuell: 2 Städte ── */}
      <div className="grid grid-cols-2 gap-4 mb-5">
        <div className="flex flex-col items-center">
          <p className="text-xs opacity-60 mb-2">{primLabel}</p>
          <WeatherIcon code={primData?.current?.weather_code} size="lg" />
          <p className="text-3xl font-light mt-2">{primData?.current?.temperature_2m}°C</p>
          <p className="text-xs opacity-40 mt-1">{weatherLabel(primData?.current?.weather_code)}</p>
        </div>
        <div className="flex flex-col items-center border-l border-white/10 pl-4">
          <p className="text-xs opacity-60 mb-2">{secLabel}</p>
          <WeatherIcon code={secData?.current?.weather_code} size="md" />
          <p className="text-xl font-light mt-2">{secData?.current?.temperature_2m}°C</p>
          <p className="text-xs opacity-40 mt-1">{weatherLabel(secData?.current?.weather_code)}</p>
        </div>
      </div>

      {/* ── 3-Tage-Prognose Haan ── */}
      {forecast.length > 0 && (
        <>
          <div className="border-t border-white/10 pt-4 mb-3">
            <p className="text-xs opacity-50 uppercase tracking-widest font-mono mb-3">3-Tage-Prognose · Haan</p>
            <div className="grid grid-cols-3 gap-2">
              {forecast.map((day, i) => (
                <div
                  key={i}
                  className="flex flex-col items-center gap-1 p-2 rounded-xl bg-white/5 border border-white/10"
                >
                  <span className="text-xs opacity-60 font-medium">{day.label}</span>
                  <WeatherIcon code={day.code} size="sm" />
                  <div className="flex items-center gap-1 text-xs">
                    <span className="text-orange-300 font-semibold">{day.max}°</span>
                    <span className="opacity-30">/</span>
                    <span className="opacity-50">{day.min}°</span>
                  </div>
                  {day.rain > 0 && (
                    <span className="text-[10px] text-blue-400 opacity-80 flex items-center gap-0.5">
                      <Droplets className="w-2.5 h-2.5" />{day.rain.toFixed(1)} mm
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* ── Pollenflug ── */}
      <div className="pt-3 border-t border-white/10 text-sm flex gap-2 items-center text-teal-300">
        <Wind className="w-4 h-4 flex-shrink-0" />
        <span>Pollenflug: Niedrig (Erle, Hasel)</span>
      </div>
    </motion.div>
  );
}
