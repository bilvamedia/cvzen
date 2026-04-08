import { useCallback, useEffect, useRef, useState } from "react";

const FLOATING_QUERIES = [
  "machine learning engineer",
  "react typescript",
  "product manager",
  "data pipeline",
  "cloud architecture",
  "UX research",
  "full-stack developer",
  "agile methodology",
  "CI/CD pipeline",
  "kubernetes",
  "natural language processing",
  "system design",
  "cross-functional teams",
  "stakeholder management",
  "python automation",
  "microservices",
  "A/B testing",
  "data visualization",
  "API integration",
  "DevOps",
  "talent acquisition",
  "business intelligence",
  "deep learning",
  "product strategy",
  "technical leadership",
];

const CURSOR_QUERIES = [
  "semantic match: 94%",
  "vector similarity",
  "skill embedding",
  "context-aware search",
  "resume parsed ✓",
  "ATS score: 87",
  "profile indexed",
  "talent matched",
  "keywords extracted",
  "section analyzed",
  "embedding generated",
  "smart ranking",
];

interface FloatingTag {
  id: number;
  text: string;
  x: number;
  y: number;
  speed: number;
  opacity: number;
  size: number;
  delay: number;
}

interface CursorTag {
  id: number;
  text: string;
  x: number;
  y: number;
  life: number;
}

export const SemanticHeroBackground = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [floatingTags, setFloatingTags] = useState<FloatingTag[]>([]);
  const [cursorTags, setCursorTags] = useState<CursorTag[]>([]);
  const lastSpawn = useRef(0);
  const cursorId = useRef(0);
  const animFrame = useRef<number>();

  // Initialize floating tags
  useEffect(() => {
    const tags: FloatingTag[] = FLOATING_QUERIES.map((text, i) => ({
      id: i,
      text,
      x: Math.random() * 100,
      y: Math.random() * 100,
      speed: 0.15 + Math.random() * 0.25,
      opacity: 0.06 + Math.random() * 0.08,
      size: 11 + Math.random() * 4,
      delay: Math.random() * 20,
    }));
    setFloatingTags(tags);
  }, []);

  // Animate floating tags
  useEffect(() => {
    let start: number | null = null;
    const animate = (ts: number) => {
      if (!start) start = ts;
      const elapsed = (ts - start) / 1000;

      setFloatingTags((prev) =>
        prev.map((tag) => {
          const t = elapsed + tag.delay;
          return {
            ...tag,
            x: ((tag.x + Math.sin(t * tag.speed * 0.5) * 0.03 + 100) % 100),
            y: ((tag.y - tag.speed * 0.02 + 100) % 100),
          };
        })
      );

      // Fade out old cursor tags
      setCursorTags((prev) =>
        prev
          .map((t) => ({ ...t, life: t.life - 0.016 }))
          .filter((t) => t.life > 0)
      );

      animFrame.current = requestAnimationFrame(animate);
    };
    animFrame.current = requestAnimationFrame(animate);
    return () => {
      if (animFrame.current) cancelAnimationFrame(animFrame.current);
    };
  }, []);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const now = Date.now();
      if (now - lastSpawn.current < 320) return; // throttle
      lastSpawn.current = now;

      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;

      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;

      const text = CURSOR_QUERIES[cursorId.current % CURSOR_QUERIES.length];
      cursorId.current++;

      // Offset slightly so it doesn't sit right under cursor
      const offsetX = (Math.random() - 0.5) * 12;
      const offsetY = (Math.random() - 0.5) * 8;

      setCursorTags((prev) => [
        ...prev.slice(-12), // keep max 12
        { id: cursorId.current, text, x: x + offsetX, y: y + offsetY, life: 1.8 },
      ]);
    },
    []
  );

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 overflow-hidden pointer-events-auto"
      onMouseMove={handleMouseMove}
      aria-hidden="true"
    >
      {/* Floating background queries */}
      {floatingTags.map((tag) => (
        <span
          key={tag.id}
          className="absolute whitespace-nowrap font-mono select-none transition-none will-change-transform"
          style={{
            left: `${tag.x}%`,
            top: `${tag.y}%`,
            fontSize: `${tag.size}px`,
            opacity: tag.opacity,
            color: "hsl(240 55% 13%)",
            transform: "translate(-50%, -50%)",
            letterSpacing: "0.02em",
          }}
        >
          {tag.text}
        </span>
      ))}

      {/* Cursor-following queries */}
      {cursorTags.map((tag) => (
        <span
          key={tag.id}
          className="absolute whitespace-nowrap font-semibold select-none pointer-events-none"
          style={{
            left: `${tag.x}%`,
            top: `${tag.y}%`,
            fontSize: "13px",
            opacity: Math.min(tag.life, 1) * 0.85,
            color: "hsl(203 80% 48%)",
            transform: `translate(-50%, -50%) scale(${0.8 + Math.min(tag.life, 1) * 0.2})`,
            transition: "opacity 0.3s ease-out, transform 0.3s ease-out",
            textShadow: "0 0 12px hsl(203 80% 48% / 0.3)",
            letterSpacing: "0.03em",
          }}
        >
          {tag.text}
        </span>
      ))}
    </div>
  );
};
