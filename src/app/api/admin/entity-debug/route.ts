import { NextRequest, NextResponse } from 'next/server';
import { getToken } from '@/lib/auth';

export const dynamic = 'force-dynamic';

async function gqlFetch(token: string, query: string) {
  const gql = process.env.FLORA_GQL_ENDPOINT!;
  const r = await fetch(gql, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify({ query }),
  });
  return r.json();
}

export async function GET(req: NextRequest) {
  const token = await getToken(req) ?? '';
  if (!token) return NextResponse.json({ error: '未登录' });

  // 1. 用正确 condition 格式（空串）看能拿到几条
  const countRes = await gqlFetch(token, `{ dash { generic { search(model: "CRMInstitute", condition: "", fields: ["id","name","description"], limit: 3, offset: 0) { items { __typename } } } } }`);
  const items = countRes?.data?.dash?.generic?.search?.items ?? [];

  // 2. 试 name 包含 中国海洋 的搜索
  const nameRes = await gqlFetch(token, `{ dash { generic { search(model: "CRMInstitute", condition: "name like \\"中国海洋\\"", fields: ["id","name"], limit: 5, offset: 0) { items { __typename } } } } }`);
  const nameItems = nameRes?.data?.dash?.generic?.search?.items ?? [];

  // 3. 试 getByFloraExternalId
  const byIdRes = await gqlFetch(token, `{ dash { generic { getByFloraExternalId(model: "CRMInstitute", floraExternalId: "cn.ouc", fields: ["id","name","description"]) { __typename } } } }`);

  // 4. 试直接的 get 查询
  const getRes = await gqlFetch(token, `{ dash { generic { get(model: "CRMInstitute", floraExternalID: "cn.ouc", fields: ["id","name","description"]) { __typename } } } }`);

  return NextResponse.json({
    tokenPrefix: token.slice(0, 25) + '...',
    emptyCondition_count: items.length,
    nameSearch_count: nameItems.length,
    nameSearch_sample: nameRes?.data ?? nameRes?.errors?.[0]?.message,
    getByFloraExternalId: byIdRes?.data ?? byIdRes?.errors?.[0]?.message,
    genericGet: getRes?.data ?? getRes?.errors?.[0]?.message,
  });
}
