type ClassValue = string | false | null | undefined;

/** Gabungkan class name, abaikan nilai falsy. */
export function cx(...parts: ClassValue[]): string {
  return parts.filter(Boolean).join(" ");
}
