import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // City ID 21804 (Haan), Area ID 40 (Bahnstraße)
    const url = "https://mymuell.jumomind.com/mmapp/api.php?r=dates&city_id=21804&area_id=40";
    
    const response = await fetch(url, { next: { revalidate: 3600 } });
    if (!response.ok) {
      throw new Error(`Failed to fetch API: ${response.status}`);
    }
    
    const data = await response.json();
    
    const events = data.map((item: any) => {
      // API returns something like "2026-03-09"
      // We parse it into a real Date object string at 8 AM to avoid timezone offset issues
      const dateParts = item.day.split('-');
      const date = new Date(
        parseInt(dateParts[0]), 
        parseInt(dateParts[1]) - 1, 
        parseInt(dateParts[2]), 
        8, 0, 0
      );
      
      return {
        summary: item.title,
        start: date.toISOString(),
        description: item.description || "",
      };
    });

    const upcomingEvents = events
      .filter((event: any) => {
        if (!event.start) return false;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const twoWeeksFromNow = new Date(today);
        twoWeeksFromNow.setDate(today.getDate() + 14);
        twoWeeksFromNow.setHours(23, 59, 59, 999);

        const eventDate = new Date(event.start);
        return eventDate >= today && eventDate <= twoWeeksFromNow;
      })
      .sort((a: any, b: any) => new Date(a.start).getTime() - new Date(b.start).getTime());

    return NextResponse.json(upcomingEvents);
  } catch (error: any) {
    console.error("Calendar parsing error:", error);
    return NextResponse.json({ error: "Failed to fetch online calendar" }, { status: 500 });
  }
}
