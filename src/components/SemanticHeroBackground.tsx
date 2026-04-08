import { useCallback, useEffect, useRef, useState } from "react";

const FLOATING_QUERIES = [
  // Recruiter searches
  "developer with microservices 5+ years",
  "senior data engineer spark kafka",
  "product manager B2B SaaS experience",
  "DevOps engineer kubernetes AWS",
  "UX designer fintech mobile apps",
  "machine learning engineer NLP",
  "full-stack developer React Node.js",
  "sales director enterprise SaaS",
  "cloud architect multi-tenant systems",
  "QA lead automation selenium",
  "cybersecurity analyst SOC compliance",
  "marketing manager growth hacking",
  "supply chain analyst SAP",
  "civil engineer project management",
  "registered nurse ICU 3+ years",
  "financial controller IFRS reporting",
  "mechanical engineer CAD SolidWorks",
  // Candidate searches
  "looking for senior frontend developer roles",
  "product owner jobs remote friendly",
  "data scientist openings healthcare",
  "Java backend developer positions Berlin",
  "entry level graphic designer jobs",
  "VP of engineering startup series B",
  "remote project manager agile certified",
  "iOS developer Swift 4+ years",
  "HR business partner tech industry",
  "solutions architect AWS certified",
  "content strategist B2B marketing",
  "electrical engineer renewable energy",
  "teacher STEM curriculum development",
  "pharma regulatory affairs manager",
  "logistics coordinator warehouse ops",
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
