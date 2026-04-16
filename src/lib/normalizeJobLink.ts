/**
 * Normalize an Upwork job link so cache lookups and scrape invocations
 * always use the same string representation.
 *
 * - trims whitespace
 * - lowercases the host
 * - strips trailing slashes
 * - removes tracking query params
 * - drops the URL fragment
 */
const TRACKING_PARAMS = new Set([
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_term',
  'utm_content',
  'ref',
  'referrer',
  'source',
]);

export const normalizeJobLink = (input: string | null | undefined): string | null => {
  if (!input) return null;
  const trimmed = input.trim();
  if (!trimmed) return null;

  try {
    const url = new URL(trimmed);
    url.hostname = url.hostname.toLowerCase();
    url.hash = '';

    const keep: [string, string][] = [];
    url.searchParams.forEach((value, key) => {
      if (!TRACKING_PARAMS.has(key.toLowerCase())) {
        keep.push([key, value]);
      }
    });
    // Rebuild search params deterministically
    const params = new URLSearchParams();
    keep
      .sort(([a], [b]) => a.localeCompare(b))
      .forEach(([k, v]) => params.append(k, v));
    url.search = params.toString();

    let result = url.toString();
    // Strip trailing slash on path (but keep root "/")
    if (url.pathname.length > 1 && result.endsWith('/')) {
      result = result.slice(0, -1);
    }
    return result;
  } catch {
    // Not a valid URL — fall back to a basic trim
    return trimmed.replace(/\/+$/, '');
  }
};
