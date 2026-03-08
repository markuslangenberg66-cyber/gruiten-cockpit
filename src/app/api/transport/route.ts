import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

// Station IDs (EVA-Nummern)
const HAAN_GRUITEN = "8000138"; // Bahnhof Haan-Gruiten
const DUS_HBF      = "8000085"; // Düsseldorf Hauptbahnhof

// Nur S8 und S28 anzeigen
const ALLOWED_LINES = ["S8", "S28"];

/** Fetch mit Retry – bis zu 3 Versuche bei 503 / 429 */
async function fetchWithRetry(url: string, options: RequestInit, retries = 3): Promise<Response> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, options);
      if (res.ok) return res;
      if (res.status !== 503 && res.status !== 429) return res; // nicht wiederholbare Fehler
      if (attempt < retries) await sleep(1500 * attempt);
    } catch (err) {
      if (attempt === retries) throw err;
      await sleep(1500);
    }
  }
  throw new Error("Alle Retry-Versuche fehlgeschlagen");
}

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const direction = searchParams.get("direction") || "outbound";

  const from = direction === "outbound" ? HAAN_GRUITEN : DUS_HBF;
  const to   = direction === "outbound" ? DUS_HBF : HAAN_GRUITEN;

  try {
    const res = await fetchWithRetry(
      `https://v6.db.transport.rest/journeys?from=${from}&to=${to}&results=15&stopovers=false`,
      {
        headers: {
          "User-Agent": "HaanPendlerHub/1.0 (privates Dashboard)",
          "Accept": "application/json",
        },
      }
    );

    if (!res.ok) {
      const txt = await res.text();
      throw new Error(`DB API ${res.status}: ${txt.slice(0, 200)}`);
    }

    const data = await res.json();

    // Nur S-Bahn-Verbindungen (S8 / S28 nach Düsseldorf)
    const filtered = (data.journeys || []).filter((journey: any) =>
      journey.legs.some((leg: any) =>
        ALLOWED_LINES.some(a => (leg.line?.name || "").includes(a))
      )
    );

    const simplified = filtered.map((journey: any) => {
      const sbLeg    = journey.legs.find((leg: any) =>
        ALLOWED_LINES.some(a => (leg.line?.name || "").includes(a)) &&
        leg.line?.product === "suburban"
      );
      const firstLeg = journey.legs[0];
      const lastLeg  = journey.legs[journey.legs.length - 1];

      return {
        plannedDeparture:  firstLeg.plannedDeparture,
        departure:         firstLeg.departure,
        delay:             firstLeg.delay,
        cancelled:         firstLeg.cancelled || sbLeg?.cancelled,
        departurePlatform: firstLeg.departurePlatform,
        plannedArrival:    lastLeg.plannedArrival,
        line:              sbLeg?.line || firstLeg.line,
        direction:         sbLeg?.direction || "Düsseldorf Hbf",
        origin:            firstLeg.origin,
        destination:       lastLeg.destination,
      };
    });

    return NextResponse.json({ journeys: simplified });
  } catch (error: any) {
    console.error("DB Transport error:", error.message);
    return NextResponse.json(
      { error: "ÖPNV-Daten momentan nicht verfügbar." },
      { status: 503 }
    );
  }
}
