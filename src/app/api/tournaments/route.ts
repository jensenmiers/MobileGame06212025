import { NextResponse } from 'next/server';
import { tournaments } from '@/types/tournament';

export async function GET() {
  return NextResponse.json({ tournaments });
}
