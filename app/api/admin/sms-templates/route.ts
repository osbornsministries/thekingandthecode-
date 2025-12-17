// app/api/admin/sms-templates/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/db';
import { smsTemplates } from '@/lib/drizzle/schema';
import { eq, desc, and, like } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const category = searchParams.get('category');
    const search = searchParams.get('search');

    let query = db.select().from(smsTemplates);

    if (category && category !== 'all') {
      query = query.where(eq(smsTemplates.category, category));
    }

    if (search) {
      query = query.where(
        or(
          like(smsTemplates.name, `%${search}%`),
          like(smsTemplates.description, `%${search}%`),
          like(smsTemplates.content, `%${search}%`)
        )
      );
    }

    query = query.orderBy(desc(smsTemplates.createdAt));

    const templates = await query;

    return NextResponse.json(templates);
  } catch (error: any) {
    console.error('Error fetching templates:', error);
    return NextResponse.json(
      { error: 'Failed to fetch templates' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const [template] = await db.insert(smsTemplates).values({
      name: body.name,
      description: body.description,
      content: body.content,
      variables: body.variables || [],
      category: body.category || 'GENERAL',
      isActive: body.isActive ?? true,
    }).returning();

    return NextResponse.json(template);
  } catch (error: any) {
    console.error('Error creating template:', error);
    return NextResponse.json(
      { error: 'Failed to create template' },
      { status: 500 }
    );
  }
}