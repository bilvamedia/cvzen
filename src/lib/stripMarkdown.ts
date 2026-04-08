/**
 * Strip common markdown / special characters from AI-generated text.
 * Removes: **bold**, *italic*, __underline__, # headings, bullet prefixes (- , * ),
 * and other formatting artifacts while preserving meaningful content.
 */
export function stripMarkdown(text: string | null | undefined): string {
  if (!text) return "";
  return text
    // Remove bold/italic markers: **text** → text, *text* → text, __text__ → text
    .replace(/\*{1,3}(.*?)\*{1,3}/g, "$1")
    .replace(/_{1,3}(.*?)_{1,3}/g, "$1")
    // Remove heading markers: ### Title → Title
    .replace(/^#{1,6}\s+/gm, "")
    // Remove bullet prefixes at start of line: - item, * item
    .replace(/^[\s]*[-*+]\s+/gm, "")
    // Remove inline code backticks: `code` → code
    .replace(/`([^`]+)`/g, "$1")
    // Remove link syntax: [text](url) → text
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    // Remove remaining stray asterisks and underscores used as formatting
    .replace(/(?<!\w)\*(?!\w)/g, "")
    .replace(/(?<!\w)_(?!\w)/g, "")
    // Collapse multiple spaces/newlines
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
