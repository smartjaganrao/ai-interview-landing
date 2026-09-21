import { NextRequest, NextResponse } from 'next/server';
import { fetchJobs } from '@/lib/jobs';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get('q') ?? '';
  const location = searchParams.get('location') ?? '';

  const result = await fetchJobs(query, location);
  return NextResponse.json(result);
}
