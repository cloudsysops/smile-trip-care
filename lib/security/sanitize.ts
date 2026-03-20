const HTML_TAGS_REGEX = /<[^>]*>/g;

export function stripHtmlTags(value: string): string {
  return value.replace(HTML_TAGS_REGEX, "");
}

export function sanitizeTextInput(value: unknown, maxLength: number): unknown {
  if (typeof value !== "string") return value;
  const stripped = stripHtmlTags(value);
  const trimmed = stripped.trim();
  return trimmed.length > maxLength ? trimmed.slice(0, maxLength) : trimmed;
}

