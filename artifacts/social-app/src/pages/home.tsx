import { useGetConversations, useGetMyGroups, useGetFriends, getGetConversationsQueryKey } from "@workspace/api-client-react";
import { Link } from "wouter";
import { formatDistanceToNow } from "date-fns";
import { ar } from "date-fns/locale";
import { UserAvatar } from "@/components/user-avatar";
import { MessageCircle, Users, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export default function HomePage() {
  const { data: conversations, isLoading: isLoadingConversations } = useGetConversations({
    query: { queryKey: getGetConversationsQueryKey(), refetchInterval: 5000 }
  });
  const { data: groups, isLoading: isLoadingGroups } = useGetMyGroups();
  const { data: friends, isLoading: isLoadingFriends } = useGetFriends();

  return (
    <div className="flex flex-col gap-6 p-4 md:p-8 max-w-4xl mx-auto w-full">
      <header className="flex flex-col gap-2 mb-4">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">الرئيسية</h1>
        <p className="text-muted-foreground">مرحباً بك في Social Connect. تواصل مع أصدقائك ومجموعاتك.</p>
      </header>

      {/* Quick Friends */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            الأصدقاء
          </h2>
          <Link href="/friends">
            <Button variant="link" className="text-primary h-auto p-0">عرض الكل</Button>
          </Link>
        </div>
        
        <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
          {isLoadingFriends ? (
            Array(5).fill(0).map((_, i) => (
              <div key={i} className="flex flex-col items-center gap-2 shrink-0">
                <Skeleton className="w-16 h-16 rounded-full" />
                <Skeleton className="w-12 h-3" />
              </div>
            ))
          ) : friends && friends.length > 0 ? (
            friends.slice(0, 8).map(friend => (
              <Link key={friend.id} href={`/profile/${friend.id}`} className="flex flex-col items-center gap-2 shrink-0 group">
                <UserAvatar src={friend.avatarUrl} fallback={friend.displayName} size="xl" className="ring-2 ring-transparent group-hover:ring-primary transition-all" />
                <span className="text-sm font-medium text-center truncate w-16">{friend.displayName.split(' ')[0]}</span>
              </Link>
            ))
          ) : (
            <div className="text-sm text-muted-foreground w-full text-center py-4 bg-muted/30 rounded-lg">
              لا يوجد أصدقاء بعد. <Link href="/search" className="text-primary hover:underline">ابحث عن أصدقاء</Link>
            </div>
          )}
        </div>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Recent Conversations */}
        <section className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
          <div className="p-4 border-b border-border flex justify-between items-center bg-muted/10">
            <h2 className="font-bold flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-primary" />
              أحدث المحادثات
            </h2>
            <Link href="/messages">
              <Button variant="ghost" size="sm" className="h-8 gap-1">الكل <ChevronLeft className="w-4 h-4" /></Button>
            </Link>
          </div>
          
          <div className="flex flex-col divide-y divide-border">
            {isLoadingConversations ? (
              Array(3).fill(0).map((_, i) => (
                <div key={i} className="p-4 flex gap-3">
                  <Skeleton className="w-12 h-12 rounded-full shrink-0" />
                  <div className="flex-1 space-y-2 py-1">
                    <Skeleton className="w-1/3 h-4" />
                    <Skeleton className="w-2/3 h-3" />
                  </div>
                </div>
              ))
            ) : conversations && conversations.length > 0 ? (
              conversations.slice(0, 5).map(conv => (
                <Link key={conv.user.id} href={`/messages/${conv.user.id}`} className="p-4 flex items-center gap-3 hover:bg-muted/30 transition-colors">
                  <UserAvatar src={conv.user.avatarUrl} fallback={conv.user.displayName} size="lg" />
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline mb-1">
                      <h3 className="font-semibold text-sm truncate">{conv.user.displayName}</h3>
                      <span className="text-[10px] text-muted-foreground whitespace-nowrap ml-2">
                        {formatDistanceToNow(new Date(conv.lastMessage.createdAt), { addSuffix: true, locale: ar })}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground truncate">
                      {conv.lastMessage.mediaUrl ? (conv.lastMessage.mediaType === 'image' ? 'صورة' : 'فيديو') : conv.lastMessage.content}
                    </p>
                  </div>
                  {conv.unreadCount > 0 && (
                    <div className="bg-primary text-primary-foreground text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center shrink-0">
                      {conv.unreadCount}
                    </div>
                  )}
                </Link>
              ))
            ) : (
              <div className="p-8 text-center text-muted-foreground text-sm">
                لا توجد محادثات.
              </div>
            )}
          </div>
        </section>

        {/* Groups */}
        <section className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
          <div className="p-4 border-b border-border flex justify-between items-center bg-muted/10">
            <h2 className="font-bold flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              مجموعاتي
            </h2>
            <Link href="/groups">
              <Button variant="ghost" size="sm" className="h-8 gap-1">الكل <ChevronLeft className="w-4 h-4" /></Button>
            </Link>
          </div>
          
          <div className="flex flex-col divide-y divide-border">
            {isLoadingGroups ? (
              Array(3).fill(0).map((_, i) => (
                <div key={i} className="p-4 flex gap-3">
                  <Skeleton className="w-12 h-12 rounded-lg shrink-0" />
                  <div className="flex-1 space-y-2 py-1">
                    <Skeleton className="w-1/3 h-4" />
                    <Skeleton className="w-1/4 h-3" />
                  </div>
                </div>
              ))
            ) : groups && groups.length > 0 ? (
              groups.slice(0, 5).map(group => (
                <Link key={group.id} href={`/groups/${group.id}`} className="p-4 flex items-center gap-3 hover:bg-muted/30 transition-colors">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold shrink-0 overflow-hidden">
                    {group.avatarUrl ? <img src={group.avatarUrl} alt="" className="w-full h-full object-cover" /> : group.name.substring(0, 2)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm truncate">{group.name}</h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      {group.memberCount} أعضاء
                    </p>
                  </div>
                </Link>
              ))
            ) : (
              <div className="p-8 text-center text-muted-foreground text-sm flex flex-col items-center gap-3">
                <span>لا توجد مجموعات.</span>
                <Link href="/groups/new">
                  <Button size="sm" variant="outline">إنشاء مجموعة</Button>
                </Link>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
