import { useState } from "react";
import { Link } from "wouter";
import { useSearchUsers, useSearchGroups, getSearchUsersQueryKey, getSearchGroupsQueryKey } from "@workspace/api-client-react";
import { Search as SearchIcon, Users, User } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { UserAvatar } from "@/components/user-avatar";

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"all" | "users" | "groups">("all");

  const { data: users, isLoading: isUsersLoading } = useSearchUsers(
    { q: query },
    { query: { queryKey: getSearchUsersQueryKey({ q: query }), enabled: query.length > 1 } }
  );

  const { data: groups, isLoading: isGroupsLoading } = useSearchGroups(
    { q: query },
    { query: { queryKey: getSearchGroupsQueryKey({ q: query }), enabled: query.length > 1 } }
  );

  const isLoading = isUsersLoading || isGroupsLoading;

  return (
    <div className="flex flex-col h-full p-4 md:p-8 max-w-4xl mx-auto w-full gap-6">
      <header className="flex flex-col gap-4 mb-2">
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
          <SearchIcon className="w-8 h-8 text-primary" />
          البحث
        </h1>
        <div className="relative">
          <SearchIcon className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground h-5 w-5" />
          <Input 
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="ابحث عن أشخاص أو مجموعات..."
            className="pl-4 pr-10 h-14 text-lg bg-card border-border rounded-2xl shadow-sm"
          />
        </div>
        <div className="flex gap-2">
          <Button 
            variant={activeTab === "all" ? "default" : "outline"} 
            onClick={() => setActiveTab("all")}
            className="rounded-full"
          >
            الكل
          </Button>
          <Button 
            variant={activeTab === "users" ? "default" : "outline"} 
            onClick={() => setActiveTab("users")}
            className="rounded-full gap-2"
          >
            <User className="w-4 h-4" />
            أشخاص
          </Button>
          <Button 
            variant={activeTab === "groups" ? "default" : "outline"} 
            onClick={() => setActiveTab("groups")}
            className="rounded-full gap-2"
          >
            <Users className="w-4 h-4" />
            مجموعات
          </Button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto">
        {query.length <= 1 ? (
          <div className="py-16 text-center text-muted-foreground flex flex-col items-center gap-4">
            <SearchIcon className="w-16 h-16 text-muted" />
            <p className="text-lg">اكتب للبحث عن أصدقاء أو مجموعات جديدة</p>
          </div>
        ) : isLoading ? (
          <div className="space-y-4">
            {Array(4).fill(0).map((_, i) => (
              <div key={i} className="flex p-4 rounded-2xl border border-border bg-card shadow-sm gap-4">
                <Skeleton className="w-14 h-14 rounded-full shrink-0" />
                <div className="flex-1 space-y-2 py-2">
                  <Skeleton className="w-1/3 h-5" />
                  <Skeleton className="w-1/4 h-4" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-8">
            {(activeTab === "all" || activeTab === "users") && users && users.length > 0 && (
              <section>
                <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <User className="w-5 h-5 text-primary" />
                  الأشخاص
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {users.map(user => (
                    <Link key={user.id} href={`/profile/${user.id}`}>
                      <div className="flex items-center p-4 rounded-2xl border border-border bg-card shadow-sm gap-4 hover:border-primary/50 transition-all cursor-pointer group">
                        <UserAvatar src={user.avatarUrl} fallback={user.displayName} size="lg" className="group-hover:ring-2 ring-primary/30 transition-all" />
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-base truncate group-hover:text-primary transition-colors">{user.displayName}</h3>
                          <p className="text-sm text-muted-foreground truncate">@{user.username}</p>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {(activeTab === "all" || activeTab === "groups") && groups && groups.length > 0 && (
              <section>
                <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <Users className="w-5 h-5 text-primary" />
                  المجموعات
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {groups.map(group => (
                    <Link key={group.id} href={`/groups/${group.id}`}>
                      <div className="flex p-4 rounded-2xl border border-border bg-card shadow-sm hover:border-primary/50 transition-all cursor-pointer gap-4 group">
                        <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold shrink-0 overflow-hidden text-xl group-hover:bg-primary/20 transition-colors">
                          {group.avatarUrl ? <img src={group.avatarUrl} alt="" className="w-full h-full object-cover" /> : group.name.substring(0, 2)}
                        </div>
                        <div className="flex-1 min-w-0 flex flex-col justify-center">
                          <h3 className="font-semibold text-base truncate group-hover:text-primary transition-colors">{group.name}</h3>
                          <p className="text-xs text-muted-foreground mt-1">{group.memberCount} أعضاء</p>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {((!users || users.length === 0) && (!groups || groups.length === 0)) && (
              <div className="py-16 text-center text-muted-foreground">
                لا توجد نتائج تطابق "{query}"
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
