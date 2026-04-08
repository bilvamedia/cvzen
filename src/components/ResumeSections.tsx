import { Briefcase, GraduationCap, Award, Code, Globe, Heart, BookOpen, Star, Tag, MapPin, Calendar, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface SectionItem {
  title?: string;
  subtitle?: string;
  date_range?: string;
  location?: string;
  description?: string;
  details?: string[];
  tags?: string[];
  url?: string;
  level?: string;
  [key: string]: any;
}

interface ResumeSection {
  id: string;
  section_type: string;
  section_title: string;
  content: { items: SectionItem[] };
  display_order: number;
}

interface Props {
  sections: ResumeSection[];
}

// Dynamic icon mapping — falls back gracefully
const getIconForType = (type: string) => {
  const lower = type.toLowerCase();
  if (lower.includes("experience") || lower.includes("work") || lower.includes("employment")) return Briefcase;
  if (lower.includes("education") || lower.includes("academic")) return GraduationCap;
  if (lower.includes("skill") || lower.includes("technical") || lower.includes("competenc")) return Code;
  if (lower.includes("project")) return Code;
  if (lower.includes("certif") || lower.includes("award") || lower.includes("honor") || lower.includes("achievement")) return Award;
  if (lower.includes("language")) return Globe;
  if (lower.includes("volunteer") || lower.includes("community")) return Heart;
  if (lower.includes("publication") || lower.includes("research") || lower.includes("paper")) return BookOpen;
  if (lower.includes("interest") || lower.includes("hobby")) return Star;
  return Tag;
};

const ResumeSections = ({ sections }: Props) => {
  return (
    <div className="space-y-4">
      {sections.map((section) => {
        const Icon = getIconForType(section.section_type);
        const items = section.content?.items || [];

        return (
          <div key={section.id} className="bg-card rounded-xl shadow-card border border-border overflow-hidden">
            {/* Section header */}
            <div className="flex items-center gap-3 px-5 py-4 border-b border-border bg-muted/30">
              <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <Icon className="h-4 w-4 text-primary" />
              </div>
              <h3 className="font-semibold text-foreground">{section.section_title}</h3>
              <span className="ml-auto text-xs text-muted-foreground">{items.length} item{items.length !== 1 ? "s" : ""}</span>
            </div>

            {/* Section items */}
            <div className="divide-y divide-border">
              {items.map((item, idx) => (
                <div key={idx} className="px-5 py-4">
                  <div className="flex flex-wrap items-start justify-between gap-2 mb-1">
                    <div className="flex-1 min-w-0">
                      {item.title && (
                        <h4 className="font-medium text-foreground">
                          {item.url ? (
                            <a href={item.url} target="_blank" rel="noopener noreferrer" className="hover:text-primary inline-flex items-center gap-1">
                              {item.title} <ExternalLink className="h-3 w-3" />
                            </a>
                          ) : item.title}
                        </h4>
                      )}
                      {item.subtitle && (
                        <p className="text-sm text-muted-foreground">{item.subtitle}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground shrink-0">
                      {item.date_range && (
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" /> {item.date_range}
                        </span>
                      )}
                      {item.location && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" /> {item.location}
                        </span>
                      )}
                    </div>
                  </div>

                  {item.description && (
                    <p className="text-sm text-muted-foreground mt-2">{item.description}</p>
                  )}

                  {item.level && (
                    <p className="text-xs text-muted-foreground mt-1">Level: {item.level}</p>
                  )}

                  {item.details && item.details.length > 0 && (
                    <ul className="mt-2 space-y-1">
                      {item.details.map((detail, dIdx) => (
                        <li key={dIdx} className="text-sm text-muted-foreground flex gap-2">
                          <span className="text-primary mt-1.5 shrink-0">•</span>
                          <span>{detail}</span>
                        </li>
                      ))}
                    </ul>
                  )}

                  {item.tags && item.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {item.tags.map((tag, tIdx) => (
                        <Badge key={tIdx} variant="secondary" className="text-xs font-normal">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              ))}

              {items.length === 0 && (
                <div className="px-5 py-4 text-sm text-muted-foreground">No items in this section.</div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ResumeSections;
