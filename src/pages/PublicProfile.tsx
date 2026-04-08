import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Globe, Linkedin, ExternalLink, MapPin, Briefcase, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { stripMarkdown } from "@/lib/stripMarkdown";

interface PublicProfileData {
  id: string;
  full_name: string | null;
  headline: string | null;
  bio: string | null;
  avatar_url: string | null;
  address: string | null;
  linkedin_url: string | null;
  website_url: string | null;
  social_links: any;
  profile_slug: string | null;
}

const PublicProfile = () => {
  const { slug } = useParams<{ slug: string }>();
  const [profile, setProfile] = useState<PublicProfileData | null>(null);
  const [sections, setSections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (slug) loadPublicProfile(slug);
  }, [slug]);

  const loadPublicProfile = async (profileSlug: string) => {
    setLoading(true);
    try {
      // Only select non-sensitive fields — no email, phone
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, headline, bio, avatar_url, address, linkedin_url, website_url, social_links, profile_slug")
        .eq("profile_slug", profileSlug)
        .single();

      if (error || !data) {
        setNotFound(true);
        return;
      }

      setProfile(data as PublicProfileData);

      // Load resume sections via secure RPC function
      const { data: secs } = await supabase.rpc("get_public_resume_sections", {
        _profile_id: data.id,
      });
      if (secs && Array.isArray(secs)) setSections(secs);
    } catch {
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (notFound || !profile) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-4">
        <h1 className="text-2xl font-bold text-foreground">Profile Not Found</h1>
        <p className="text-muted-foreground">This profile doesn't exist or hasn't been set up yet.</p>
        <Link to="/">
          <Button variant="outline"><ArrowLeft className="w-4 h-4 mr-2" />Back to Home</Button>
        </Link>
      </div>
    );
  }

  const socialLinks = Array.isArray(profile.social_links) ? profile.social_links : [];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Header */}
      <div className="bg-gradient-to-br from-[hsl(var(--primary))] to-[hsl(var(--cvzen-navy))] text-white">
        <div className="max-w-4xl mx-auto px-6 py-12 md:py-16">
          <Link to="/" className="inline-flex items-center text-white/70 hover:text-white mb-8 text-sm transition-colors">
            <ArrowLeft className="w-4 h-4 mr-1" /> Back to CVZen
          </Link>
          <div className="flex flex-col md:flex-row items-start gap-6">
            {profile.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt={profile.full_name || "Profile"}
                className="w-24 h-24 md:w-28 md:h-28 rounded-full object-cover border-4 border-white/20 shadow-lg"
              />
            ) : (
              <div className="w-24 h-24 md:w-28 md:h-28 rounded-full bg-white/10 flex items-center justify-center text-3xl font-bold border-4 border-white/20">
                {profile.full_name?.[0]?.toUpperCase() || "?"}
              </div>
            )}
            <div className="flex-1">
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
                {profile.full_name || "Unnamed Candidate"}
              </h1>
              {profile.headline && (
                <p className="text-lg text-white/80 mt-2">{profile.headline}</p>
              )}
              <div className="flex flex-wrap items-center gap-4 mt-4 text-sm text-white/60">
                {profile.address && (
                  <span className="flex items-center gap-1"><MapPin className="w-4 h-4" />{profile.address}</span>
                )}
                {profile.linkedin_url && (
                  <a href={profile.linkedin_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-white transition-colors">
                    <Linkedin className="w-4 h-4" />LinkedIn
                  </a>
                )}
                {profile.website_url && (
                  <a href={profile.website_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-white transition-colors">
                    <Globe className="w-4 h-4" />Website
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 py-10">
        {/* Bio */}
        {profile.bio && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-primary" /> About
            </h2>
            <p className="text-muted-foreground leading-relaxed">{profile.bio}</p>
          </div>
        )}

        {/* Social Links */}
        {socialLinks.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-foreground mb-3">Links</h2>
            <div className="flex flex-wrap gap-2">
              {socialLinks.map((link: any, i: number) => (
                <a key={i} href={link.url} target="_blank" rel="noopener noreferrer">
                  <Badge variant="outline" className="gap-1 cursor-pointer hover:bg-accent transition-colors py-1.5 px-3">
                    <ExternalLink className="w-3 h-3" />
                    {link.platform || "Link"}
                  </Badge>
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Resume Sections */}
        {sections.length > 0 && (
          <>
            <Separator className="my-8" />
            {sections.map((section) => {
              const displayContent = section.improved_content || section.content;
              const items = displayContent?.items || [];
              return (
                <div key={section.id} className="mb-8">
                  <h2 className="text-lg font-semibold text-foreground mb-4 uppercase tracking-wide border-b-2 border-primary pb-2">
                    {section.section_title}
                  </h2>
                  <div className="space-y-4">
                    {items.map((item: any, idx: number) => (
                      <div key={idx} className="group">
                        <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between">
                          <div>
                            {item.title && (
                              <h3 className="font-semibold text-foreground">
                                {stripMarkdown(item.title)}
                                {item.subtitle && <span className="font-normal text-muted-foreground"> — {stripMarkdown(item.subtitle)}</span>}
                              </h3>
                            )}
                          </div>
                          {(item.date_range || item.location) && (
                            <span className="text-sm text-muted-foreground mt-0.5 sm:mt-0">
                              {[item.date_range, item.location].filter(Boolean).join(" · ")}
                            </span>
                          )}
                        </div>
                         {item.description && (
                          <p className="text-sm text-muted-foreground mt-1">{stripMarkdown(item.description)}</p>
                        )}
                        {item.details?.length > 0 && (
                          <ul className="list-disc list-inside mt-2 text-sm text-muted-foreground space-y-1 ml-1">
                            {item.details.map((d: string, di: number) => (
                              <li key={di}>{stripMarkdown(d)}</li>
                            ))}
                          </ul>
                        )}
                        {item.tags?.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mt-2">
                            {item.tags.map((tag: string, ti: number) => (
                              <Badge key={ti} variant="secondary" className="text-xs">{tag}</Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </>
        )}

        {/* Footer */}
        <Separator className="my-8" />
        <div className="text-center text-sm text-muted-foreground py-4">
          Powered by <Link to="/" className="text-primary hover:underline font-medium">CVZen.ai</Link>
        </div>
      </div>
    </div>
  );
};

export default PublicProfile;
