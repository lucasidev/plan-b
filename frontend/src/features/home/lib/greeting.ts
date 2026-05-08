/**
 * Derives a personable first name from an email's local part.
 *
 * `"lucia.mansilla@gmail.com"` → `"Lucia"`. Capitalizes the chunk before the
 * first dot in the local part. If the local has no dot, capitalizes the whole
 * local. Falls back to the original email when the local is empty (defensive,
 * shouldn't happen with validated emails).
 *
 * Used by the Home v2 header until `firstName` lands in the session payload
 * (post US-012 + future StudentProfile name pipeline). Once that exists, this
 * helper is replaced by reading `session.firstName` directly.
 */
export function greetingNameFromEmail(email: string): string {
  const local = email.split('@')[0] ?? '';
  const first = local.split('.')[0] ?? local;
  if (!first) return email;
  return first.charAt(0).toUpperCase() + first.slice(1);
}
