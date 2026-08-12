import { NextResponse } from 'next/server';
import { getRedis } from '@/lib/redis';

export async function GET() {
  try {
    const redis = getRedis();
    if (redis) {
      const data = await redis.get('tkg_mock_data');
      if (data) {
        return NextResponse.json({ success: true, data: JSON.parse(data) });
      }
    }
    return NextResponse.json({ success: true, data: [] });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
