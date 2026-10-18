const INTERNAL_DOMAIN = "stokku.local";

export function resolveLoginIdentifier(input: string): string {
  const trimmed = input.trim();
  if (trimmed.includes("@")) return trimmed;
  return `${trimmed.toLowerCase()}@${INTERNAL_DOMAIN}`;
}
