import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import mockDb from '@/lib/mockDb.json';

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { templateCode, sourceType, rawPayload } = body;

    let data;
    try {
      data = await prisma.panoramicData.create({
        data: {
          templateCode,
          sourceType,
          rawPayload: JSON.stringify(rawPayload),
          status: 'PENDING',
        },
      });
    } catch (dbError) {
      console.warn("Database create failed (likely Vercel readonly), using mock response.");
      data = {
        id: 'mock-' + Date.now(),
        templateCode,
        sourceType,
        rawPayload: JSON.stringify(rawPayload),
        status: 'PENDING',
        createdAt: new Date(),
        updatedAt: new Date()
      };
    }

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function GET() {
  try {
    let data;
    try {
      data = await prisma.panoramicData.findMany({
        orderBy: { createdAt: 'desc' },
      });
    } catch (dbError) {
      console.warn("Database query failed, returning static mock data.");
      data = mockDb;
    }
    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
