import { NextResponse } from 'next/server';
import { mcpClient } from '@/lib/mcp/client';

export const dynamic = 'force-dynamic';

export async function GET() {
  const res = await mcpClient.callTool('dash_generic_get_model_list', {
    bearerToken: process.env.FLORA_AUTH_BEARER
  });
  return NextResponse.json(res);
}
