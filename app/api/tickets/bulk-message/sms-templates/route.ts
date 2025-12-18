// app/api/sms-templates/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/db';
import { smsTemplates } from '@/lib/drizzle/schema';
import { desc, eq, and } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const activeOnly = searchParams.get('active') === 'true';
    
    // Build where conditions
    const whereConditions = [];
    if (activeOnly) {
      whereConditions.push(eq(smsTemplates.isActive, true));
    }
    
    // Fetch templates
    const templates = await db
      .select()
      .from(smsTemplates)
      .where(whereConditions.length > 0 ? and(...whereConditions) : undefined)
      .orderBy(desc(smsTemplates.updatedAt));
    
    return NextResponse.json({
      success: true,
      templates,
      count: templates.length
    });
    
  } catch (error) {
    console.error('Failed to fetch SMS templates:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch templates',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}