"use client";

/**
 * Renders Gemini's free-text output (which often contains light markdown —
 * **bold**, "* " bullets) as real React elements instead of showing raw
 * asterisks. Deliberately minimal: no HTML injection, just bold + bullets +
 * line breaks, which covers everything the prompts actually produce.
 */

function renderInline(text: string, keyPrefix: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    const m = part.match(/^\*\*([^*]+)\*\*$/);
    if (m) return <strong key={`${keyPrefix}-${i}`}>{m[1]}</strong>;
    return <span key={`${keyPrefix}-${i}`}>{part}</span>;
  });
}

export default function AiText({ text, className }: { text: string; className?: string }) {
  const lines = text.split("\n");
  return (
    <span className={className}>
      {lines.map((line, i) => {
        const bullet = line.match(/^\s*[*-]\s+(.*)$/);
        const content = bullet ? bullet[1] : line;
        return (
          <span key={i} className="block">
            {bullet && <span className="mr-1.5 opacity-70">•</span>}
            {renderInline(content, String(i))}
          </span>
        );
      })}
    </span>
  );
}
