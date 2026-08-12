let _orcidTokenCache: { token: string; expiresAt: number } | null = null;

export async function getOrcidToken(): Promise<string | null> {
  // 检查缓存（Token 有效期 ~20 年，基本永不过期）
  if (_orcidTokenCache && Date.now() < _orcidTokenCache.expiresAt) {
    return _orcidTokenCache.token;
  }

  const clientId = process.env.ORCID_CLIENT_ID;
  const clientSecret = process.env.ORCID_CLIENT_SECRET;
  if (!clientId || !clientSecret) return null;

  try {
    const res = await fetch('https://orcid.org/oauth/token', {
      method: 'POST',
      headers: { 'Accept': 'application/json', 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `client_id=${clientId}&client_secret=${clientSecret}&grant_type=client_credentials&scope=/read-public`,
    });
    if (!res.ok) return null;
    const data = await res.json();
    _orcidTokenCache = {
      token: data.access_token,
      expiresAt: Date.now() + (data.expires_in || 600000) * 1000,
    };
    return data.access_token;
  } catch {
    return null;
  }
}

/**
 * ORCID 三步降级搜索：精准 → 去机构 → 全文
 * 每步正序 + 反序都搜一遍，取合集去重
 */
export async function orcidSearch(
  token: string,
  givenNames: string,
  familyName: string,
  institution?: string
): Promise<Array<{ path: string }>> {
  const BASE = 'https://pub.orcid.org/v3.0/search/';
  const headers = { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' };

  const doSearch = async (q: string): Promise<Array<{ path: string }>> => {
    try {
      const res = await fetch(`${BASE}?q=${encodeURIComponent(q)}&rows=5`, { headers });
      if (!res.ok) return [];
      const data = await res.json();
      return (data.result || []).map((r: any) => ({ path: r['orcid-identifier']?.path })).filter((r: any) => r.path);
    } catch { return []; }
  };

  const dedupe = (arr: Array<{ path: string }>): Array<{ path: string }> => {
    const seen = new Set<string>();
    return arr.filter(r => { if (seen.has(r.path)) return false; seen.add(r.path); return true; });
  };

  // Step 1: 精准搜（正序 + 反序 + 机构）
  if (institution) {
    const q1 = `given-names:${givenNames} AND family-name:${familyName} AND affiliation-org-name:${institution}`;
    const q2 = `given-names:${familyName} AND family-name:${givenNames} AND affiliation-org-name:${institution}`;
    const [r1, r2] = await Promise.all([doSearch(q1), doSearch(q2)]);
    const results = dedupe([...r1, ...r2]);
    if (results.length > 0) return results;
  }

  // Step 2: 去掉机构（正序 + 反序）
  const q3 = `given-names:${givenNames} AND family-name:${familyName}`;
  const q4 = `given-names:${familyName} AND family-name:${givenNames}`;
  const [r3, r4] = await Promise.all([doSearch(q3), doSearch(q4)]);
  const step2 = dedupe([...r3, ...r4]);
  if (step2.length > 0 && step2.length <= 20) return step2.slice(0, 5);

  // Step 3: 全文搜索（杀手锏）
  const fullName = `${givenNames} ${familyName}`;
  const q5 = institution
    ? `text:"${fullName}" AND text:${institution}`
    : `text:"${fullName}"`;
  const r5 = await doSearch(q5);
  if (r5.length > 0) return r5;

  // Step 2 结果太多但 Step 3 没结果，返回 Step 2 前 5 个
  return step2.slice(0, 5);
}

/**
 * 从 ORCID 拉取学者的 employments，用于消歧
 */
export async function orcidGetEmployments(token: string, orcidId: string): Promise<Array<{ org: string; role: string; dept: string }>> {
  try {
    const res = await fetch(`https://pub.orcid.org/v3.0/${orcidId}/employments`, {
      headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' },
    });
    if (!res.ok) return [];
    const data = await res.json();
    return (data['affiliation-group'] || []).map((g: any) => {
      const s = g.summaries?.[0]?.['employment-summary'] || {};
      return {
        org: s.organization?.name || '',
        role: s['role-title'] || '',
        dept: s['department-name'] || '',
      };
    });
  } catch { return []; }
}

/**
 * 从 ORCID 拉取教育经历
 */
export async function orcidGetEducations(token: string, orcidId: string): Promise<Array<{ org: string; role: string; dept: string }>> {
  try {
    const res = await fetch(`https://pub.orcid.org/v3.0/${orcidId}/educations`, {
      headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' },
    });
    if (!res.ok) return [];
    const data = await res.json();
    return (data['affiliation-group'] || []).map((g: any) => {
      const s = g.summaries?.[0]?.['education-summary'] || {};
      return {
        org: s.organization?.name || '',
        role: s['role-title'] || '',
        dept: s['department-name'] || '',
      };
    });
  } catch { return []; }
}

/**
 * 从 ORCID 拉取论文（前 N 篇）
 */
export async function orcidGetWorks(token: string, orcidId: string, limit = 10): Promise<Array<{ title: string; type: string }>> {
  try {
    const res = await fetch(`https://pub.orcid.org/v3.0/${orcidId}/works`, {
      headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' },
    });
    if (!res.ok) return [];
    const data = await res.json();
    return (data.group || []).slice(0, limit).map((g: any) => {
      const s = g['work-summary']?.[0] || {};
      return {
        title: s.title?.title?.value || 'N/A',
        type: s.type || '',
      };
    });
  } catch { return []; }
}
