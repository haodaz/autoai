// ============================================
// Role-Based Access Control
// ============================================

export type UserRole = 'admin' | 'user';

export interface SessionUser {
  id: string;
  username: string;
  role: UserRole;
  displayName: string;
  avatarUrl?: string;
}

/** Which tabs each role can see */
export const TAB_PERMISSIONS: Record<string, UserRole[]> = {
  office:    ['admin', 'user'],
  employees: ['admin', 'user'],
  history:   ['admin', 'user'],
  kb:        ['admin', 'user'],
  settings:  ['admin'],
  toolbox:   ['admin'],
  skills:    ['admin'],
  logic:     ['admin'],
  users:     ['admin'],
};

export function canAccessTab(tabId: string, role: UserRole): boolean {
  return TAB_PERMISSIONS[tabId]?.includes(role) ?? false;
}
