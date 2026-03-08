"use client";
import React, { useState, useEffect } from 'react';
import { Rss, ExternalLink, Clock } from 'lucide-react';
import { motion } from 'framer-motion';

export default function NewsWidget() {
  const [news, setNews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchNews = async () => {
      try {
        const res = await fetch("/api/news");
        if (!res.ok) throw new Error("Feed nicht erreichbar");
        const json = await res.json();
        if (json.error) throw new Error(json.error);
        setNews(json);
      } catch (err: any) {
        console.error(err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchNews();
  }, []);

  if (loading) return <div className="glass-panel p-6 animate-pulse bg-white/5 h-48 rounded-xl"></div>;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="glass-panel p-6"
    >
      <h2 className="text-xs font-bold mb-4 opacity-80 uppercase tracking-widest font-mono flex items-center gap-2">
        <Rss className="w-4 h-4" /> Lokalnachrichten · Haan & Umgebung
      </h2>

      {error ? (
        <p className="text-sm text-orange-400 opacity-80">{error}</p>
      ) : news.length === 0 ? (
        <p className="text-sm opacity-50">Keine Nachrichten verfügbar.</p>
      ) : (
        <div className="space-y-4">
          {news.map((item: any, i: number) => {
            const age = item.pubDate
              ? getRelativeTime(new Date(item.pubDate))
              : null;

            return (
              <a
                key={i}
                href={item.link}
                target="_blank"
                rel="noopener noreferrer"
                className="block group border-b border-white/10 pb-3 last:border-0 last:pb-0"
              >
                <h3 className="text-sm font-semibold leading-snug group-hover:text-sky-400 transition-colors line-clamp-2 flex gap-1 items-start">
                  <span className="flex-1">{item.title}</span>
                  <ExternalLink className="w-3 h-3 flex-shrink-0 mt-0.5 opacity-0 group-hover:opacity-60 transition-opacity" />
                </h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs opacity-40">{item.source}</span>
                  {age && (
                    <>
                      <span className="text-xs opacity-20">·</span>
                      <span className="text-xs opacity-40 flex items-center gap-1">
                        <Clock className="w-2.5 h-2.5" /> {age}
                      </span>
                    </>
                  )}
                </div>
              </a>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}

function getRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffH = Math.floor(diffMs / (1000 * 60 * 60));
  if (diffH < 1) return "vor wenigen Minuten";
  if (diffH < 24) return `vor ${diffH} Std.`;
  const diffD = Math.floor(diffH / 24);
  if (diffD === 1) return "gestern";
  return `vor ${diffD} Tagen`;
}
