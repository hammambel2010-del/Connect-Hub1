import { useGetMyGroups, useSearchGroups, getSearchGroupsQueryKey } from "@workspace/api-client-react";
import { Link } from "wouter";
import { useState } from "react";
import { PlusCircle, Search, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function GroupsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const { data: myGroups, isLoading: isLoadingMyGroups } = useGetMyGroups();
  const { data: searchResults, isLoading: isSearching } = useSearchGroups(
    { q: searchQuery },
    { query: { queryKey: getSearchGroupsQueryKey({ q: searchQuery }), enabled: searchQuery.length > 0 } }
  );

  return (
    <div className="flex flex-col gap-6 p-4 md:p-8 max-w-4xl mx-auto w-full">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
            <Users className="w-8 h-8 text-primary" />
            المجموعات
          </h1>
          <p className="text-muted-foreground mt-1">تصفح وانضم إلى المجموعات</p>
        </div>
        <Link href="/groups/new">
          <Button className="w-full sm:w-auto gap-2">
            <PlusCircle className="w-5 h-5" />
            إنشاء مجموعة
          </Button>
        </Link>
      </header>

      <Tabs defaultValue="my-groups" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="my-groups">مجموعاتي</TabsTrigger>
          <TabsTrigger value="discover">اكتشف المجموعات</TabsTrigger>
        </TabsList>

        <TabsContent value="my-groups" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {isLoadingMyGroups ? (
              Array(4).fill(0).map((_, i) => (
                <div key={i} className="flex p-4 rounded-xl border border-border bg-card shadow-sm gap-4">
                  <Skeleton className="w-16 h-16 rounded-xl" />
                  <div className="flex-1 space-y-2 py-2">
                    <Skeleton className="w-2/3 h-5" />
                    <Skeleton className="w-1/3 h-4" />
                  </div>
                </div>
              ))
            ) : myGroups && myGroups.length > 0 ? (
              myGroups.map(group => (
                <Link key={group.id} href={`/groups/${group.id}`}>
                  <div className="flex p-4 rounded-xl border border-border bg-card shadow-sm hover:shadow-md hover:border-primary/50 transition-all cursor-pointer gap-4 group">
                    <div className="w-16 h-16 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold shrink-0 overflow-hidden text-xl group-hover:bg-primary/20 transition-colors">
                      {group.avatarUrl ? <img src={group.avatarUrl} alt="" className="w-full h-full object-cover" /> : group.name.substring(0, 2)}
                    </div>
                    <div className="flex-1 min-w-0 flex flex-col justify-center">
                      <h3 className="font-semibold text-base truncate">{group.name}</h3>
                      <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1">
                        <Users className="w-3 h-3" /> {group.memberCount} أعضاء
                      </p>
                    </div>
                  </div>
                </Link>
              ))
            ) : (
              <div className="col-span-full py-12 text-center text-muted-foreground flex flex-col items-center gap-4 border border-dashed rounded-xl bg-muted/20">
                <Users className="w-12 h-12 text-muted" />
                <p>لست منضماً لأي مجموعة حالياً</p>
                <Link href="/groups/new">
                  <Button variant="outline">إنشاء مجموعة جديدة</Button>
                </Link>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="discover" className="mt-6 space-y-6">
          <div className="relative max-w-md">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground h-5 w-5" />
            <Input 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ابحث عن مجموعات عامة..."
              className="pl-4 pr-10 h-12 bg-card border-border rounded-xl"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {searchQuery.length === 0 ? (
              <div className="col-span-full py-12 text-center text-muted-foreground">
                اكتب للبحث عن المجموعات العامة
              </div>
            ) : isSearching ? (
              Array(4).fill(0).map((_, i) => (
                <div key={i} className="flex p-4 rounded-xl border border-border bg-card shadow-sm gap-4">
                  <Skeleton className="w-16 h-16 rounded-xl" />
                  <div className="flex-1 space-y-2 py-2">
                    <Skeleton className="w-2/3 h-5" />
                    <Skeleton className="w-1/3 h-4" />
                  </div>
                </div>
              ))
            ) : searchResults && searchResults.length > 0 ? (
              searchResults.map(group => (
                <Link key={group.id} href={`/groups/${group.id}`}>
                  <div className="flex p-4 rounded-xl border border-border bg-card shadow-sm hover:shadow-md hover:border-primary/50 transition-all cursor-pointer gap-4 group">
                    <div className="w-16 h-16 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold shrink-0 overflow-hidden text-xl group-hover:bg-primary/20 transition-colors">
                      {group.avatarUrl ? <img src={group.avatarUrl} alt="" className="w-full h-full object-cover" /> : group.name.substring(0, 2)}
                    </div>
                    <div className="flex-1 min-w-0 flex flex-col justify-center">
                      <h3 className="font-semibold text-base truncate">{group.name}</h3>
                      <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1">
                        <Users className="w-3 h-3" /> {group.memberCount} أعضاء
                      </p>
                    </div>
                  </div>
                </Link>
              ))
            ) : (
              <div className="col-span-full py-12 text-center text-muted-foreground">
                لا توجد نتائج بحث تطابق "{searchQuery}"
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
