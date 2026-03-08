import { NextResponse } from "next/server";
import Parser from "rss-parser";

const parser = new Parser({
  headers: {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    "Accept": "application/rss+xml, application/xml, text/xml, */*",
  },
});

// Verfügbare RSS-Feeds für Haan / Kreis Mettmann (getestet, liefern 200)
const FEEDS = [
  {
    url: "https://www.rp-online.de/nrw/staedte/hilden/feed.rss",
    label: "RP Online – Hilden & Haan",
  },
  {
    url: "https://www.rp-online.de/nrw/kreis-mettmann/feed.rss",
    label: "RP Online – Kreis Mettmann",
  },
];

export const dynamic = "force-dynamic";

export async function GET() {
  const results: any[] = [];

  for (const feed of FEEDS) {
    try {
      const parsed = await parser.parseURL(feed.url);
      const items = (parsed.items || []).slice(0, 5).map((item) => ({
        title: item.title || "",
        link: item.link || "",
        contentSnippet: item.contentSnippet || item.content || "",
        pubDate: item.pubDate || item.isoDate || "",
        source: feed.label,
      }));
      results.push(...items);
    } catch (err: any) {
      console.warn(`Feed ${feed.url} failed:`, err.message);
    }
  }

  if (!results.length) {
    return NextResponse.json(
      { error: "Keine Lokalnachrichten verfügbar." },
      { status: 503 }
    );
  }

  // Sortiere nach Datum (neueste zuerst) und gib max. 6 zurück
  const sorted = results
    .sort((a, b) => {
      const da = a.pubDate ? new Date(a.pubDate).getTime() : 0;
      const db = b.pubDate ? new Date(b.pubDate).getTime() : 0;
      return db - da;
    })
    .slice(0, 6);

  return NextResponse.json(sorted);
}
