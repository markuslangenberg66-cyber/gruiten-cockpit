import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// Exakte Koordinaten via TomTom Geocoding ermittelt (von api/traffic)
const HAAN_HOME  = "51.218725,7.014044"; // Bahnstr. 56, 42781 Haan
const DUS_OFFICE = "51.217395,6.770523"; // Kavalleriestraße 22, 40213 Düsseldorf

/** Berechnet die Distanz zweier Koordinaten in Metern (Haversine) */
function distanceMeters(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371e3;
  const r = Math.PI / 180;
  const dLat = (lat2 - lat1) * r;
  const dLon = (lon2 - lon1) * r;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + 
            Math.cos(lat1 * r) * Math.cos(lat2 * r) * 
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const direction = searchParams.get("direction") || "outbound";

  const from = direction === "outbound" ? HAAN_HOME  : DUS_OFFICE;
  const to   = direction === "outbound" ? DUS_OFFICE : HAAN_HOME;

  const KEY = process.env.TOMTOM_API_KEY;
  if (!KEY) {
    return NextResponse.json({ error: "No TomTom API key defined" }, { status: 500 });
  }

  try {
    // 1. TomTom Routen laden (um den genauen Streckenverlauf zu haben)
    const base   = "https://api.tomtom.com/routing/1/calculateRoute";
    const common = `key=${KEY}&traffic=true&travelMode=car&computeTravelTimeFor=all`;
    const mainUrl = `${base}/${from}:${to}/json?${common}`;
    const altUrl  = `${base}/${from}:${to}/json?${common}&avoid=motorways`;

    // 2. Atudo Blitzer im Großraum laden (nur mobile und Laser: type 1 und 5)
    // Box Format: lat_min, lng_min, lat_max, lng_max
    const blitzerUrl = "https://cdn2.atudo.net/api/1.0/vl.php?type=1,5&box=51.15,6.7,51.3,7.1";

    const [mainRes, altRes, blitzerRes] = await Promise.all([
      fetch(mainUrl),
      fetch(altUrl),
      fetch(blitzerUrl, { headers: { "User-Agent": "Mozilla/5.0" }, next: { revalidate: 60 } }),
    ]);

    const mainData = mainRes.ok ? await mainRes.json() : null;
    const altData  = altRes.ok  ? await altRes.json()  : null;
    
    if (!blitzerRes.ok) throw new Error("Atudo API gestört");
    const blitzerData = await blitzerRes.json();
    const allPois = blitzerData.pois || [];

    // Punkte beider Routen zusammenführen
    const a46Points = mainData?.routes?.[0]?.legs?.[0]?.points || [];
    const altPoints = altData?.routes?.[0]?.legs?.[0]?.points || [];
    const routePoints = [...a46Points, ...altPoints];

    // Blitzer filtern: Nur wenn sie < 100 Meter von der gefahrenen Route entfernt sind
    const onRouteBlitzers = allPois.filter((p: any) => {
      const pLat = parseFloat(p.lat);
      const pLng = parseFloat(p.lng);
      // Finde den minimalen Abstand dieses Blitzers zu irgendeinem Punkt der Route
      return routePoints.some((point: any) => {
        return distanceMeters(pLat, pLng, point.latitude, point.longitude) < 100;
      });
    });

    // Mappen
    const mapped = onRouteBlitzers.map((p: any) => {
      const typeNum = parseInt(p.type);
      return {
        id: p.id,
        street: p.street || "Unbekannte Straße",
        vmax: p.vmax && p.vmax !== "0" && p.vmax !== "?" ? p.vmax : null,
        type: typeNum,
        typeText: typeNum === 1 ? "Mobiler Blitzer" : "Laser Radar",
        confirmDate: p.confirm_date || p.create_date,
      };
    });

    // Nach Frische sortieren
    mapped.sort((a: any, b: any) => 
      new Date(b.confirmDate).getTime() - new Date(a.confirmDate).getTime()
    );

    return NextResponse.json({ blitzers: mapped });
  } catch (error: any) {
    console.error("Blitzer API Error:", error.message);
    return NextResponse.json(
      { error: "Blitzer-Daten momentan nicht abrufbar." },
      { status: 503 }
    );
  }
}
