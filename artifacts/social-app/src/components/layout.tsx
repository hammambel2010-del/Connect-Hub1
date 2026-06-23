import { Link, useLocation } from "wouter";
import { useAuth, useUser, useClerk } from "@clerk/react";
import { Home, MessageCircle, Users, Search, User, LogOut, PlusCircle, Menu, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/user-avatar";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
function NavLinks({ closeSheet }: { closeSheet?: () => void }) {
  const [location] = useLocation();
  const links = [
    { href: "/", label: "الرئيسية", icon: Home },
    { href: "/messages", label: "الرسائل", icon: MessageCircle },
    { href: "/friends", label: "الأصدقاء", icon: Users },
    { href: "/groups", label: "المجموعات", icon: PlusCircle },
    { href: "/search", label: "البحث", icon: Search },
    { href: "/profile", label: "الملف الشخصي", icon: User },
    { href: "/admin", label: "لوحة المدير", icon: Crown },
  ];

  return (
    <div className="flex flex-col gap-2 w-full">
      {links.map((link) => {
        const isActive = location === link.href || (link.href !== "/" && location.startsWith(link.href));
        return (
          <Link key={link.href} href={link.href} onClick={closeSheet}>
            <Button
              variant={isActive ? "secondary" : "ghost"}
              className={`w-full justify-start gap-3 h-12 text-base ${isActive ? "font-bold text-primary" : "text-muted-foreground hover:text-primary"}`}
            >
              <link.icon className={`h-5 w-5 ${isActive ? "text-primary" : ""}`} />
              <span>{link.label}</span>
            </Button>
          </Link>
        );
      })}
    </div>
  );
}

export function AppLayout({ children }: { children: React.ReactNode }) {
  const { signOut } = useClerk();
  const { user } = useUser();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [location] = useLocation();

  return (
    <div className="flex min-h-screen bg-background text-foreground" dir="rtl">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-72 flex-col border-l border-border bg-card shadow-sm z-10 sticky top-0 h-screen">
        <div className="p-6">
          <Link href="/">
            <h1 className="text-2xl font-extrabold text-primary tracking-tight cursor-pointer">
              Social Connect
            </h1>
          </Link>
        </div>
        
        <div className="flex-1 px-4 py-2 overflow-y-auto">
          <NavLinks />
        </div>

        <div className="p-4 border-t border-border bg-card">
          <div className="flex items-center justify-between">
            <Link href="/profile" className="flex items-center gap-3 cursor-pointer group">
              <UserAvatar src={user?.imageUrl} fallback={user?.firstName || "U"} size="sm" />
              <div className="flex flex-col">
                <span className="text-sm font-semibold group-hover:text-primary transition-colors">{user?.firstName} {user?.lastName}</span>
                <span className="text-xs text-muted-foreground truncate max-w-[120px]">@{user?.username}</span>
              </div>
            </Link>
            <Button variant="ghost" size="icon" onClick={() => signOut()} className="text-muted-foreground hover:text-destructive">
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 border-b border-border bg-card/80 backdrop-blur-md z-50 flex items-center justify-between px-4">
        <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon">
              <Menu className="h-6 w-6" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-[80vw] sm:w-80 p-0 flex flex-col" dir="rtl">
            <div className="p-6 border-b border-border">
              <h1 className="text-2xl font-extrabold text-primary tracking-tight">
                Social Connect
              </h1>
            </div>
            <div className="flex-1 px-4 py-6 overflow-y-auto">
              <NavLinks closeSheet={() => setIsMobileMenuOpen(false)} />
            </div>
            <div className="p-4 border-t border-border bg-muted/20">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <UserAvatar src={user?.imageUrl} fallback={user?.firstName || "U"} size="sm" />
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold">{user?.firstName}</span>
                    <span className="text-xs text-muted-foreground truncate max-w-[120px]">@{user?.username}</span>
                  </div>
                </div>
                <Button variant="ghost" size="icon" onClick={() => signOut()} className="text-muted-foreground hover:text-destructive">
                  <LogOut className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </SheetContent>
        </Sheet>
        <h1 className="text-lg font-bold text-primary">
          Social Connect
        </h1>
        <Link href="/search">
          <Button variant="ghost" size="icon">
            <Search className="h-5 w-5 text-muted-foreground" />
          </Button>
        </Link>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col w-full md:w-[calc(100%-18rem)] pt-16 md:pt-0 overflow-hidden relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={location}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="flex-1 w-full h-full flex flex-col overflow-y-auto"
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}
