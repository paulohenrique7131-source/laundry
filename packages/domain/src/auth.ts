export const USER_MAP = {
  manager: 'manager@lavanderia.local',
  gov: 'gov@lavanderia.local',
} as const;

export const ROLE_LABELS: Record<string, string> = {
  manager: 'Gerência',
  gov: 'Governança',
};

export function resolveAuthEmail(userId: string): string | undefined {
  return USER_MAP[userId.trim().toLowerCase() as keyof typeof USER_MAP];
}

export function formatRoleLabel(role: string | null | undefined): string {
  if (!role) return 'Sistema';
  return ROLE_LABELS[role] ?? role;
}

export function resolveAuthorLabel(role: string | null | undefined): string {
  if (role === 'manager') return 'Gerência';
  if (role === 'gov') return 'Governança';
  return 'Sistema';
}
