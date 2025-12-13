// app/api/sessions/[id]/tracker/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getSessionAvailability } from '@/lib/drizzle/schema';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const sessionId = parseInt(params.id);
    const availability = await getSessionAvailability(sessionId);
    
    return NextResponse.json(availability);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch session availability' },
      { status: 500 }
    );
  }
}