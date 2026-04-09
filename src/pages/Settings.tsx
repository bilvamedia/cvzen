import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Eye, EyeOff, Save, User, Lock, LayoutDashboard, FileText, Search, Target, Calendar, CreditCard, PlusCircle, Inbox, Settings as SettingsIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { candidateNavItems, recruiterNavItems } from "@/lib/navItems";

interface SettingsProps {
  role: "candidate" | "recruiter";
}

const Settings = ({ role }: SettingsProps) => {
  const [profile, setProfile] = useState({
    full_name: "", email: "", phone: "", headline: "", bio: "",
    linkedin_url: "", website_url: "", address: "",
  });
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();

  const navItems = role === "candidate" ? candidateNavItems : recruiterNavItems;

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate("/login"); return; }
      const { data } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
      if (data) {
        setProfile({
          full_name: data.full_name || "",
          email: data.email || user.email || "",
          phone: data.phone || "",
          headline: data.headline || "",
          bio: data.bio || "",
          linkedin_url: data.linkedin_url || "",
          website_url: data.website_url || "",
          address: data.address || "",
        });
      }
      setLoading(false);
    };
    load();
  }, [navigate]);

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { error } = await supabase.from("profiles").update({
        full_name: profile.full_name,
        phone: profile.phone,
        headline: profile.headline,
        bio: profile.bio,
        linkedin_url: profile.linkedin_url,
        website_url: profile.website_url,
        address: profile.address,
      }).eq("id", user.id);
      if (error) throw error;
      toast({ title: "Profile updated" });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      toast({ title: "Passwords don't match", variant: "destructive" });
      return;
    }
    if (newPassword.length < 6) {
      toast({ title: "Password must be at least 6 characters", variant: "destructive" });
      return;
    }
    setChangingPassword(true);
    try {
      // Verify current password by re-signing in
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.email) throw new Error("No email found");
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email, password: currentPassword,
      });
      if (signInError) throw new Error("Current password is incorrect");
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      toast({ title: "Password changed successfully" });
      setCurrentPassword(""); setNewPassword(""); setConfirmPassword("");
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setChangingPassword(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout navItems={navItems} role={role}>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout navItems={navItems} role={role}>
      <div className="max-w-2xl space-y-8">
        {/* Profile Section */}
        <div className="bg-card border border-border rounded-xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <User className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">Profile Information</h2>
              <p className="text-sm text-muted-foreground">Update your personal details</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Full name</Label>
              <Input value={profile.full_name} onChange={(e) => setProfile({ ...profile, full_name: e.target.value })} className="h-10 bg-background enterprise-border" />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Email</Label>
              <Input value={profile.email} disabled className="h-10 bg-muted enterprise-border" />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Phone</Label>
              <Input value={profile.phone} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} placeholder="+1 234 567 890" className="h-10 bg-background enterprise-border" />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Headline</Label>
              <Input value={profile.headline} onChange={(e) => setProfile({ ...profile, headline: e.target.value })} placeholder="Senior Developer" className="h-10 bg-background enterprise-border" />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label className="text-sm font-medium">Bio</Label>
              <Textarea value={profile.bio} onChange={(e) => setProfile({ ...profile, bio: e.target.value })} placeholder="A short bio about yourself" rows={3} className="bg-background enterprise-border" />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">LinkedIn URL</Label>
              <Input value={profile.linkedin_url} onChange={(e) => setProfile({ ...profile, linkedin_url: e.target.value })} placeholder="https://linkedin.com/in/..." className="h-10 bg-background enterprise-border" />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Website</Label>
              <Input value={profile.website_url} onChange={(e) => setProfile({ ...profile, website_url: e.target.value })} placeholder="https://..." className="h-10 bg-background enterprise-border" />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label className="text-sm font-medium">Address</Label>
              <Input value={profile.address} onChange={(e) => setProfile({ ...profile, address: e.target.value })} placeholder="City, Country" className="h-10 bg-background enterprise-border" />
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <Button variant="hero" onClick={handleSaveProfile} disabled={saving} className="h-10">
              <Save className="h-4 w-4 mr-2" /> {saving ? "Saving..." : "Save changes"}
            </Button>
          </div>
        </div>

        <Separator />

        {/* Change Password Section */}
        <div className="bg-card border border-border rounded-xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Lock className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">Change Password</h2>
              <p className="text-sm text-muted-foreground">Update your account password</p>
            </div>
          </div>

          <div className="space-y-4 max-w-sm">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Current password</Label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="••••••••" className="h-10 bg-background enterprise-border pr-10"
                />
                <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">New password</Label>
              <Input
                type={showPassword ? "text" : "password"}
                value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Min 6 characters" className="h-10 bg-background enterprise-border"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Confirm new password</Label>
              <Input
                type={showPassword ? "text" : "password"}
                value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repeat new password" className="h-10 bg-background enterprise-border"
              />
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <Button variant="hero" onClick={handleChangePassword} disabled={changingPassword || !currentPassword || !newPassword} className="h-10">
              <Lock className="h-4 w-4 mr-2" /> {changingPassword ? "Changing..." : "Change password"}
            </Button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Settings;
