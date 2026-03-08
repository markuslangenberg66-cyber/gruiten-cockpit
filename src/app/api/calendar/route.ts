import { NextResponse } from "next/server";
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const filePath = path.join(process.cwd(), 'public', 'abfall.ics');
    if (!fs.existsSync(filePath)) {
       return NextResponse.json([]);
    }
    const icsContent = fs.readFileSync(filePath, 'utf-8');
    
    // Very simple standalone parser
    const events: any[] = [];
    const lines = icsContent.split('\n');
    let currentEvent: any = null;

    for (const line of lines) {
       const trimmed = line.trim();
       if (trimmed === 'BEGIN:VEVENT') {
           currentEvent = {};
       } else if (trimmed === 'END:VEVENT') {
           if (currentEvent) {
               events.push(currentEvent);
               currentEvent = null;
           }
       } else if (currentEvent) {
           if (trimmed.startsWith('SUMMARY:')) {
               currentEvent.summary = trimmed.substring(8);
           } else if (trimmed.startsWith('DTSTART')) {
               const val = trimmed.split(':')[1];
               if (val) {
                   // Parse 20260309T080000Z or similar
                   const year = parseInt(val.substring(0,4));
                   const month = parseInt(val.substring(4,6)) - 1;
                   const day = parseInt(val.substring(6,8));
                   currentEvent.start = new Date(year, month, day);
               }
           }
       }
    }

    const upcomingEvents = events
      .filter((event: any) => {
        if (!event.start) return false;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return new Date(event.start) >= today;
      })
      .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())
      .slice(0, 3);

    return NextResponse.json(upcomingEvents);
  } catch (error: any) {
    console.error("Calendar parsing error:", error);
    return NextResponse.json({ error: "Failed to parse local calendar" }, { status: 500 });
  }
}
