import { ReactNode, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { LogOut, Menu, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import logoHeader from "@/assets/logo-header.svg";

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface DashboardLayoutProps {
  children: ReactNode;
  navItems: NavItem[];
  role: "candidate" | "recruiter";
}

const DashboardLayout = ({ children, navItems, role }: DashboardLayoutProps) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-sidebar text-sidebar-foreground transform transition-transform duration-200 lg:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between h-16 px-6 border-b border-sidebar-border">
            <Link to="/" className="flex items-center gap-2">
              <img src={logoHeader} alt="cvZen — Intelligent Hiring OS" className="h-8 w-auto max-w-[180px]" />
            </Link>
            <button className="lg:hidden text-sidebar-foreground" onClick={() => setSidebarOpen(false)}>
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="px-3 py-2">
            <span className="px-3 text-[10px] font-semibold uppercase tracking-widest text-sidebar-foreground/50">
              {role}
            </span>
          </div>

          <nav className="flex-1 px-3 space-y-1">
            {navItems.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-sidebar-accent text-sidebar-primary"
                      : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  }`}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="p-3 border-t border-sidebar-border">
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-sidebar-foreground hover:bg-sidebar-accent w-full transition-colors"
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </button>
          </div>
        </div>
      </aside>

      {/* Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-foreground/20 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Main */}
      <div className="flex-1 lg:ml-64">
        <header className="sticky top-0 z-30 h-16 border-b border-border flex items-center px-4 sm:px-6 lg:bg-background/80 lg:backdrop-blur-md"
          style={{ background: 'hsl(240 55% 16%)' }}
        >
          <button className="lg:hidden mr-3 text-white/80 hover:text-white" onClick={() => setSidebarOpen(true)} aria-label="Open menu">
            <Menu className="h-5 w-5" />
          </button>
          <div className="lg:hidden flex-1 flex items-center">
            <Link to="/">
              <img src={logoHeader} alt="cvZen" className="h-7 w-auto" />
            </Link>
          </div>
          <div className="hidden lg:block flex-1" />
        </header>
        <main className="p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
};

export default DashboardLayout;
