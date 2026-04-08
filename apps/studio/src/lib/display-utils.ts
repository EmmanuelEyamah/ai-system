/**
 * Strips reference context from a user message for display.
 * The context is sent to Claude but shouldn't show in the chat UI.
 * Reference context starts with "[Context from folder:" or "[Referenced from"
 */
export function cleanMessageForDisplay(content: string): string {
  // Remove everything before the user's actual text
  // Reference blocks are separated by \n\n from the user text
  let cleaned = content;

  // Remove folder context blocks
  cleaned = cleaned.replace(/\[Context from folder:[^\]]*\][\s\S]*?(?=\n\n(?![[\-\*]))/g, "");

  // Remove session reference blocks
  cleaned = cleaned.replace(/\[Referenced from (?:Research|Chat|Critique|Trends):[^\]]*\][\s\S]*?(?=\n\n(?![[\-\*]))/g, "");

  // Remove --- separators between references
  cleaned = cleaned.replace(/\n---\n/g, "\n");

  // Trim leading whitespace/newlines
  cleaned = cleaned.replace(/^\s+/, "");

  // If nothing remains after cleaning, return original (safety)
  return cleaned.trim() || content.trim();
}
