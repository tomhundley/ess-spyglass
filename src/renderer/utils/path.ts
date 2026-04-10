export interface BreadcrumbSegment {
  name: string;
  path: string;
}

function isWindowsDrivePath(p: string): boolean {
  return /^[A-Za-z]:[\\/]/.test(p);
}

function isUncPath(p: string): boolean {
  return p.startsWith('\\\\') || p.startsWith('//');
}

function preferredSeparator(p: string): '\\' | '/' {
  return p.includes('\\') ? '\\' : '/';
}

export function basename(p: string): string {
  // Trim trailing separators, but keep root-like inputs intact.
  const trimmed = p.replace(/[\\/]+$/, '');
  if (!trimmed) return p;

  const parts = trimmed.split(/[\\/]+/).filter(Boolean);
  if (parts.length === 0) return p;
  return parts[parts.length - 1];
}

export function abbreviatePathForDisplay(p: string): string {
  // Common home folder patterns without requiring os.homedir() in the renderer.
  // macOS: /Users/<user>/...
  // Linux: /home/<user>/...
  // Windows: C:\Users\<user>\... or C:/Users/<user>/...
  return p
    .replace(/^\/Users\/[^/]+/, '~')
    .replace(/^\/home\/[^/]+/, '~')
    .replace(/^[A-Za-z]:[\\/]+Users[\\/]+[^\\/]+/i, '~');
}

export function buildBreadcrumbSegments(p: string): BreadcrumbSegment[] {
  if (!p) return [];

  // UNC root needs special handling (\\server\share\...)
  if (isUncPath(p)) {
    const sep = preferredSeparator(p);
    const withoutPrefix = p.slice(2);
    const parts = withoutPrefix.split(/[\\/]+/).filter(Boolean);
    if (parts.length === 0) return [];

    const host = parts[0];
    const share = parts.length >= 2 ? parts[1] : '';
    const root = share ? `${sep}${sep}${host}${sep}${share}` : `${sep}${sep}${host}`;
    const segments: BreadcrumbSegment[] = [];

    if (share) {
      segments.push({ name: `${host}${sep}${share}`, path: root });
    } else {
      segments.push({ name: host, path: root });
    }

    let current = root;
    for (const part of parts.slice(2)) {
      current = current.endsWith(sep) ? `${current}${part}` : `${current}${sep}${part}`;
      segments.push({ name: part, path: current });
    }
    return segments;
  }

  // Windows drive: C:\...
  if (isWindowsDrivePath(p)) {
    const sep = preferredSeparator(p);
    const parts = p.split(/[\\/]+/).filter(Boolean);
    if (parts.length === 0) return [];

    const drive = parts[0]; // e.g. "C:"
    const segments: BreadcrumbSegment[] = [];
    let current = `${drive}${sep}`;
    segments.push({ name: drive, path: current });

    for (const part of parts.slice(1)) {
      current = current.endsWith(sep) ? `${current}${part}` : `${current}${sep}${part}`;
      segments.push({ name: part, path: current });
    }
    return segments;
  }

  // POSIX absolute: /...
  if (p.startsWith('/')) {
    const parts = p.split('/').filter(Boolean);
    const segments: BreadcrumbSegment[] = [];
    let current = '';
    for (const part of parts) {
      current += `/${part}`;
      segments.push({ name: part, path: current });
    }
    return segments;
  }

  // Relative or unknown: best-effort split.
  const sep = preferredSeparator(p);
  const parts = p.split(/[\\/]+/).filter(Boolean);
  const segments: BreadcrumbSegment[] = [];
  let current = '';
  for (const part of parts) {
    current = current ? `${current}${sep}${part}` : part;
    segments.push({ name: part, path: current });
  }
  return segments;
}

export function lastPathParts(p: string, count: number): string {
  const parts = p.split(/[\\/]+/).filter(Boolean);
  return parts.slice(-count).join('/');
}
