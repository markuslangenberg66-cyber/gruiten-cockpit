import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const TANKERKOENIG_API_KEY = process.env.TANKERKOENIG_API_KEY;

  if (!TANKERKOENIG_API_KEY) {
    return NextResponse.json({ error: "No Tankerkonig API key defined" }, { status: 500 });
  }

  // Shell Tankstelle: GRUITENER STR. 2, 42781, HAAN, DE
  // ID: 896f1856-5255-4eae-aa80-9636335ae927
  const stationId = "896f1856-5255-4eae-aa80-9636335ae927";

  const url = `https://creativecommons.tankerkoenig.de/json/prices.php?ids=${stationId}&apikey=${TANKERKOENIG_API_KEY}`;
  
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error("Tankerkonig API error");
    const data = await res.json();
    if (!data.ok) throw new Error(data.message || "Failed");
    return NextResponse.json(data);
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: error.message || "Failed to fetch gas prices" }, { status: 500 });
  }
}
