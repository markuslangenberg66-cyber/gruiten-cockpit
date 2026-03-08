import { NextResponse } from "next/server";

// Exakte Koordinaten via TomTom Geocoding
const HAAN_HOME  = "51.218725,7.014044"; // Bahnstr. 56, 42781 Haan
const DUS_OFFICE = "51.217395,6.770523"; // Kavalleriestraße 22, 40213 Düsseldorf

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const direction = searchParams.get("direction") || "outbound";

  const from = direction === "outbound" ? HAAN_HOME  : DUS_OFFICE;
  const to   = direction === "outbound" ? DUS_OFFICE : HAAN_HOME;

  const KEY = process.env.TOMTOM_API_KEY;
  if (!KEY) {
    return NextResponse.json({ error: "No TomTom API key defined" }, { status: 500 });
  }

  const base   = "https://api.tomtom.com/routing/1/calculateRoute";
  const common = `key=${KEY}&traffic=true&travelMode=car&computeTravelTimeFor=all`;

  // ── Route 1: Hauptroute – TomTom wählt automatisch die A46 als schnellste Strecke ──
  const mainUrl = `${base}/${from}:${to}/json?${common}`;

  // ── Route 2: Ausweichroute ohne Autobahnen (Landstraßen/B-Straßen) ────────────────
  const altUrl  = `${base}/${from}:${to}/json?${common}&avoid=motorways`;

  try {
    const fetchOpts = { next: { revalidate: 60 } }; // 60 Sekunden Cache für TomTom
    const [mainRes, altRes] = await Promise.all([
      fetch(mainUrl, fetchOpts),
      fetch(altUrl, fetchOpts),
    ]);

    const mainData = mainRes.ok ? await mainRes.json() : null;
    const altData  = altRes.ok  ? await altRes.json()  : null;

    const mainRoute = mainData?.routes?.[0] ?? null;
    const altRoute  = altData?.routes?.[0]  ?? null;

    if (!mainRoute) throw new Error("A46 route calculation failed");

    const delaySec  = mainRoute.summary.trafficDelayInSeconds ?? 0;
    const travelSec = mainRoute.summary.travelTimeInSeconds   ?? 0;
    const baseSec   = travelSec - delaySec;

    return NextResponse.json({
      a46: {
        travelTimeMin: Math.round(travelSec / 60),
        delayMin:      Math.round(delaySec  / 60),
        baseTimeMin:   Math.round(baseSec   / 60),
        lengthKm:      Math.round((mainRoute.summary.lengthInMeters ?? 0) / 100) / 10,
      },
      alternative: altRoute ? {
        travelTimeMin: Math.round(altRoute.summary.travelTimeInSeconds / 60),
        lengthKm:      Math.round((altRoute.summary.lengthInMeters ?? 0) / 100) / 10,
        via:           extractViaLabel(altRoute),
      } : null,
    });
  } catch (error: any) {
    console.error("TomTom error:", error.message);
    return NextResponse.json({ error: "Failed to fetch traffic data" }, { status: 500 });
  }
}

function extractViaLabel(route: any): string {
  try {
    const legs = route.legs ?? [];
    const roadNames: string[] = [];
    for (const leg of legs) {
      for (const point of (leg.points ?? [])) {
        if (point.roadName
            && !point.roadName.match(/^A\s?\d/)   // keine Autobahn-Namen
            && !roadNames.includes(point.roadName)) {
          roadNames.push(point.roadName);
          if (roadNames.length >= 2) break;
        }
      }
      if (roadNames.length >= 2) break;
    }
    return roadNames.length > 0 ? `über ${roadNames.join(" / ")}` : "Ausweichroute";
  } catch {
    return "Ausweichroute";
  }
}
