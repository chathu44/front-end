export function unwrapApiList(response: any): any[] {
  const candidates = [
    response?.data?.dataList,
    response?.dataList,
    response?.data?.content,
    response?.content,
    response?.data?.data,
    response?.data,
    response,
  ];

  return candidates.find((candidate) => Array.isArray(candidate)) ?? [];
}

export function normalizeLookupName(value: any): string {
  return String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/[\\s_-]+/g, '');
}

export function filterStatusOptions(
  statuses: any[],
  allowedNames: string[],
): any[] {
  const allowed = new Set(allowedNames.map(normalizeLookupName));
  return (statuses ?? []).filter((status: any) => {
    const label = status?.name ?? status?.statusName ?? status?.label ?? '';
    return allowed.has(normalizeLookupName(label));
  });
}

export function findStatusById(statuses: any[], id: any): any | undefined {
  if (id == null || id === '') {
    return undefined;
  }

  return (statuses ?? []).find(
    (status: any) => String(status?.id) === String(id),
  );
}

export function normalizeSriLankanPhone(value: any): string | null {
  const raw = String(value ?? '').trim();
  if (!raw) return null;

  const compact = raw.replace(/[\s().-]/g, '');
  if (/^0[1-9]\d{8}$/.test(compact)) {
    return `+94${compact.slice(1)}`;
  }
  if (/^\+94[1-9]\d{8}$/.test(compact)) {
    return compact;
  }
  if (/^94[1-9]\d{8}$/.test(compact)) {
    return `+${compact}`;
  }
  return null;
}

export function isValidPersonName(value: any, maxLength = 150): boolean {
  const name = String(value ?? '').trim();
  if (name.length < 2 || name.length > maxLength) return false;
  return /^[\p{L}\p{M}][\p{L}\p{M}\s.'’\-]*$/u.test(name);
}

export function isValidEmailAddress(value: any, maxLength = 100): boolean {
  const email = String(value ?? '').trim();
  if (!email) return true;
  if (email.length > maxLength || email.length > 254) return false;
  const parts = email.split('@');
  if (parts.length !== 2) return false;
  const [local, domain] = parts;
  if (
    !local ||
    local.length > 64 ||
    local.startsWith('.') ||
    local.endsWith('.') ||
    local.includes('..')
  )
    return false;
  if (
    !domain ||
    domain.length > 253 ||
    domain.startsWith('.') ||
    domain.endsWith('.') ||
    domain.includes('..')
  )
    return false;
  return /^[A-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Z0-9](?:[A-Z0-9-]{0,61}[A-Z0-9])?(?:\.[A-Z0-9](?:[A-Z0-9-]{0,61}[A-Z0-9])?)+$/i.test(
    email,
  );
}

export function scrollPageToTop(): void {
  if (typeof window !== 'undefined') {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}
