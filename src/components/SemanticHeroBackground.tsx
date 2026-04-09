import { useCallback, useEffect, useRef, useState } from "react";

const FLOATING_QUERIES = [
  "developer microservices 5+ yrs",
  "data engineer spark kafka",
  "product manager B2B SaaS",
  "DevOps kubernetes AWS",
  "UX designer fintech",
  "ML engineer NLP",
  "full-stack React Node",
  "cloud architect Azure",
  "frontend developer roles",
  "product owner remote",
  "data scientist healthcare",
  "backend Java fintech",
  "project manager agile",
  "iOS Swift SwiftUI",
];

const CURSOR_QUERIES = [
  "hiring React developer 3+ years",
  "need DevOps engineer AWS certified",
  "looking for product manager SaaS",
  "senior backend engineer Go microservices",
  "searching data analyst SQL Python",
  "want UX researcher user interviews",
  "seeking cloud architect Azure",
  "find me Java developers fintech",
  "remote frontend developer TypeScript",
  "junior graphic designer Adobe Suite",
  "project manager PMP agile scrum",
  "full-stack engineer Node.js MongoDB",
  "marketing lead growth B2B startups",
  "iOS developer Swift SwiftUI 4 years",
];

interface FloatingTag {
  id: number;
  text: string;
  x: number;
  y: number;
  speed: number;
  baseOpacity: number;
  size: number;
  delay: number;
  autoHighlight: number; // 0-1 intensity of auto-highlight
}

interface CursorTag {
  id: number;
  text: string;
  x: number;
  y: number;
  life: number;
}

// Distribute tags across edges and corners — avoid center text
const placeOnEdge = (index: number, total: number): { x: number; y: number } => {
  const zone = index % 4;
  const rand = () => Math.random();
  switch (zone) {
    case 0: return { x: 5 + rand() * 90, y: 2 + rand() * 8 };
    case 1: return { x: 5 + rand() * 90, y: 82 + rand() * 16 };
    case 2: return { x: 1 + rand() * 8, y: 15 + rand() * 60 };
    case 3: return { x: 91 + rand() * 8, y: 15 + rand() * 60 };
    default: return { x: rand() * 100, y: rand() * 100 };
  }
};

export const SemanticHeroBackground = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [floatingTags, setFloatingTags] = useState<FloatingTag[]>([]);
  const [cursorTags, setCursorTags] = useState<CursorTag[]>([]);
  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null);
  const lastSpawn = useRef(0);
  const cursorId = useRef(0);
  const animFrame = useRef<number>();

  // Auto-highlight state
  const autoHighlightRef = useRef<number[]>([]);
  const highlightIndexRef = useRef(0);

  useEffect(() => {
    const tags: FloatingTag[] = FLOATING_QUERIES.map((text, i) => {
      const pos = placeOnEdge(i, FLOATING_QUERIES.length);
      return {
        id: i,
        text,
        x: pos.x,
        y: pos.y,
        speed: 0.08 + Math.random() * 0.12,
        baseOpacity: 0.12 + Math.random() * 0.08,
        size: 11 + Math.random() * 3,
        delay: Math.random() * 30,
        autoHighlight: 0,
      };
    });
    setFloatingTags(tags);
    autoHighlightRef.current = new Array(tags.length).fill(0);
  }, []);

  useEffect(() => {
    let start: number | null = null;
    const animate = (ts: number) => {
      if (!start) start = ts;
      const elapsed = (ts - start) / 1000;

      setFloatingTags((prev) =>
        prev.map((tag) => {
          const t = elapsed + tag.delay;
          const newX = ((tag.x + Math.sin(t * tag.speed * 0.3) * 0.015 + 100) % 100);
          const newY = ((tag.y - tag.speed * 0.008 + 100) % 100);
          return { ...tag, x: newX, y: newY };
        })
      );

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
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;

      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      setMousePos({ x, y });

      const now = Date.now();
      if (now - lastSpawn.current < 400) return;
      lastSpawn.current = now;

      const inCenter = x > 15 && x < 85 && y > 12 && y < 78;
      if (inCenter) return;

      const text = CURSOR_QUERIES[cursorId.current % CURSOR_QUERIES.length];
      cursorId.current++;

      const offsetX = (Math.random() - 0.5) * 8;
      const offsetY = (Math.random() - 0.5) * 5;

      setCursorTags((prev) => [
        ...prev.slice(-8),
        { id: cursorId.current, text, x: x + offsetX, y: y + offsetY, life: 2.5 },
      ]);
    },
    []
  );

  const handleMouseLeave = useCallback(() => {
    setMousePos(null);
  }, []);

  // Calculate proximity-based opacity & scale for floating tags
  const getTagStyle = (tag: FloatingTag): { opacity: number; scale: number } => {
    if (!mousePos) return { opacity: tag.baseOpacity, scale: 1 };
    const dx = tag.x - mousePos.x;
    const dy = tag.y - mousePos.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    // Within ~30% radius, boost opacity and scale
    const proximity = Math.max(0, 1 - dist / 30);
    return {
      opacity: tag.baseOpacity + proximity * 0.55,
      scale: 1 + proximity * 0.35, // zoom in effect on hover proximity
    };
  };

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 overflow-hidden pointer-events-auto"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      aria-hidden="true"
    >
      {/* Floating background queries — visible, zoom & brighten near cursor */}
      {floatingTags.map((tag) => {
        const { opacity, scale } = getTagStyle(tag);
        const isNearMouse = opacity > tag.baseOpacity + 0.1;
        return (
          <span
            key={tag.id}
            className="absolute whitespace-nowrap font-mono select-none"
            style={{
              left: `${tag.x}%`,
              top: `${tag.y}%`,
              fontSize: `${tag.size}px`,
              opacity,
              color: isNearMouse ? "hsl(203 80% 48%)" : "hsl(240 15% 55%)",
              transform: `translate(-50%, -50%) scale(${scale})`,
              letterSpacing: "0.02em",
              fontWeight: isNearMouse ? 600 : 400,
              transition: "opacity 0.4s ease, color 0.4s ease, transform 0.4s ease, font-weight 0.4s ease",
              textShadow: isNearMouse ? "0 0 12px hsl(203 80% 48% / 0.3)" : "none",
            }}
          >
            {tag.text}
          </span>
        );
      })}

      {/* Cursor-following queries — sky blue, vivid */}
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
            transform: `translate(-50%, -50%) scale(${0.85 + Math.min(tag.life, 1) * 0.15})`,
            transition: "opacity 0.3s ease-out, transform 0.3s ease-out",
            textShadow: "0 0 10px hsl(203 80% 48% / 0.25)",
            letterSpacing: "0.03em",
          }}
        >
          {tag.text}
        </span>
      ))}
    </div>
  );
};
