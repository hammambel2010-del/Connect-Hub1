import { useGetGroup, useGetGroupMembers, useGetGroupMessages, useSendGroupMessage, useJoinGroup, useLeaveGroup, getGetGroupQueryKey, getGetGroupMembersQueryKey, getGetGroupMessagesQueryKey, getGetMyGroupsQueryKey } from "@workspace/api-client-react";
import { useParams, useLocation, Link } from "wouter";
import { useRef, useEffect } from "react";
import { UserAvatar } from "@/components/user-avatar";
import { MessageBubble } from "@/components/message-bubble";
import { MessageInput } from "@/components/message-input";
import { ArrowRight, Loader2, Users, Settings, LogOut, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useQueryClient } from "@tanstack/react-query";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useUser } from "@clerk/react";

export default function GroupDetailPage() {
  const params = useParams();
  const groupId = parseInt(params.groupId || "0");
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user: currentUser } = useUser();

  const { data: group, isLoading: isLoadingGroup } = useGetGroup(groupId, {
    query: { queryKey: getGetGroupQueryKey(groupId), enabled: !!groupId }
  });

  const { data: members, isLoading: isLoadingMembers } = useGetGroupMembers(groupId, {
    query: { queryKey: getGetGroupMembersQueryKey(groupId), enabled: !!groupId && !!group?.myRole }
  });

  const { data: messages, isLoading: isLoadingMessages } = useGetGroupMessages(groupId, {}, {
    query: { queryKey: getGetGroupMessagesQueryKey(groupId), enabled: !!groupId && !!group?.myRole, refetchInterval: 2000 }
  });

  const sendMutation = useSendGroupMessage();
  const joinMutation = useJoinGroup();
  const leaveMutation = useLeaveGroup();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (content: string, mediaUrl?: string, mediaType?: "image" | "video") => {
    if (!groupId) return;
    try {
      await sendMutation.mutateAsync({
        groupId,
        data: {
          content,
          mediaUrl,
          mediaType
        }
      });
      queryClient.invalidateQueries({ queryKey: getGetGroupMessagesQueryKey(groupId) });
    } catch (e) {
      console.error(e);
    }
  };

  const handleJoin = async () => {
    if (!groupId) return;
    try {
      await joinMutation.mutateAsync({ groupId });
      queryClient.invalidateQueries({ queryKey: getGetGroupQueryKey(groupId) });
      queryClient.invalidateQueries({ queryKey: getGetMyGroupsQueryKey() });
      queryClient.invalidateQueries({ queryKey: getGetGroupMembersQueryKey(groupId) });
    } catch (e) {
      console.error(e);
    }
  };

  const handleLeave = async () => {
    if (!groupId) return;
    try {
      await leaveMutation.mutateAsync({ groupId });
      queryClient.invalidateQueries({ queryKey: getGetGroupQueryKey(groupId) });
      queryClient.invalidateQueries({ queryKey: getGetMyGroupsQueryKey() });
      setLocation("/groups");
    } catch (e) {
      console.error(e);
    }
  };

  if (!groupId) return null;

  return (
    <div className="flex flex-col h-full w-full bg-background relative max-w-6xl mx-auto border-x border-border shadow-sm md:flex-row">
      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col h-full w-full max-w-4xl border-l border-border relative">
        <header className="flex items-center justify-between gap-3 p-4 border-b border-border bg-card/90 backdrop-blur-sm sticky top-0 z-10 shrink-0 h-16">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => setLocation("/groups")} className="shrink-0 -mr-2 md:hidden">
              <ArrowRight className="h-5 w-5" />
            </Button>
            {isLoadingGroup ? (
              <div className="flex items-center gap-3">
                <Skeleton className="w-10 h-10 rounded-xl" />
                <div className="space-y-1">
                  <Skeleton className="w-32 h-5" />
                  <Skeleton className="w-16 h-3" />
                </div>
              </div>
            ) : group ? (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold shrink-0 overflow-hidden text-lg">
                  {group.avatarUrl ? <img src={group.avatarUrl} alt="" className="w-full h-full object-cover" /> : group.name.substring(0, 2)}
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="font-semibold text-sm truncate">{group.name}</span>
                  <span className="text-xs text-muted-foreground truncate">{group.memberCount} أعضاء</span>
                </div>
              </div>
            ) : null}
          </div>

          {group?.myRole ? (
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                  <Users className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[85vw] sm:w-80 p-0" dir="rtl">
                <MembersSidebar members={members} isLoading={isLoadingMembers} group={group} onLeave={handleLeave} />
              </SheetContent>
            </Sheet>
          ) : null}
        </header>

        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2">
          {!group?.myRole ? (
            <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground bg-muted/10 rounded-2xl border border-dashed border-border m-4 p-8">
              <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-6">
                <Users className="w-10 h-10" />
              </div>
              <h2 className="text-xl font-bold text-foreground mb-2">أنت لست عضواً</h2>
              <p className="text-center mb-8 max-w-sm">انضم إلى المجموعة للمشاركة في المحادثة ورؤية الرسائل السابقة.</p>
              <Button size="lg" className="w-full max-w-xs gap-2 h-12 text-base" onClick={handleJoin} disabled={joinMutation.isPending}>
                {joinMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <UserPlus className="w-5 h-5" />}
                انضمام للمجموعة
              </Button>
            </div>
          ) : isLoadingMessages ? (
            <div className="flex flex-col gap-4 w-full justify-center items-center h-full text-muted-foreground">
              <Loader2 className="w-8 h-8 animate-spin" />
              <span>جاري تحميل الرسائل...</span>
            </div>
          ) : messages && messages.length > 0 ? (
            <>
              {messages.slice().reverse().map(msg => {
                // Find if this is the current user. Since we don't have the exact user ID integer easily available,
                // we compare clerkIds if available, or just rely on the UI not breaking if we guess wrong.
                // A better approach is to get our own profile ID and compare.
                const isOwn = msg.sender?.clerkId === currentUser?.id;
                return (
                  <div key={msg.id} className="flex flex-col">
                    {!isOwn && (
                      <span className="text-xs text-muted-foreground mx-12 mb-1 mr-12">{msg.sender?.displayName}</span>
                    )}
                    <MessageBubble 
                      message={msg} 
                      isOwn={isOwn} 
                    />
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground">
              <p className="text-sm bg-muted px-4 py-2 rounded-full">ابدأ المحادثة في هذه المجموعة!</p>
            </div>
          )}
        </div>

        {group?.myRole && (
          <div className="shrink-0">
            <MessageInput onSend={handleSend} isLoading={sendMutation.isPending} />
          </div>
        )}
      </div>

      {/* Desktop Members Sidebar */}
      {group?.myRole && (
        <aside className="hidden md:flex w-80 flex-col bg-card shrink-0 h-full border-l border-border">
          <MembersSidebar members={members} isLoading={isLoadingMembers} group={group} onLeave={handleLeave} />
        </aside>
      )}
    </div>
  );
}

function MembersSidebar({ members, isLoading, group, onLeave }: any) {
  return (
    <div className="flex flex-col h-full">
      <div className="p-6 border-b border-border bg-muted/10 flex flex-col items-center justify-center gap-4">
        <div className="w-24 h-24 rounded-2xl bg-primary/10 flex items-center justify-center text-primary font-bold shrink-0 overflow-hidden text-3xl shadow-sm">
          {group?.avatarUrl ? <img src={group?.avatarUrl} alt="" className="w-full h-full object-cover" /> : group?.name?.substring(0, 2)}
        </div>
        <div className="text-center">
          <h2 className="text-xl font-bold">{group?.name}</h2>
          <p className="text-sm text-muted-foreground mt-1">{group?.description || "لا يوجد وصف"}</p>
        </div>
        
        <div className="flex gap-2 w-full mt-2">
          <Button variant="outline" className="flex-1 gap-2 text-destructive hover:bg-destructive/10 hover:text-destructive border-destructive/20" onClick={onLeave}>
            <LogOut className="w-4 h-4" />
            مغادرة
          </Button>
        </div>
      </div>

      <div className="p-4 bg-card font-semibold text-sm border-b border-border flex items-center justify-between">
        <span>الأعضاء</span>
        <span className="bg-muted px-2 py-0.5 rounded-full text-xs">{group?.memberCount}</span>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        {isLoading ? (
          Array(5).fill(0).map((_, i) => (
            <div key={i} className="flex items-center gap-3 p-2">
              <Skeleton className="w-10 h-10 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="w-24 h-4" />
                <Skeleton className="w-12 h-3" />
              </div>
            </div>
          ))
        ) : members?.map((member: any) => (
          <Link key={member.user.id} href={`/profile/${member.user.id}`} className="flex items-center gap-3 p-2 hover:bg-muted/50 rounded-lg cursor-pointer transition-colors group">
            <UserAvatar src={member.user.avatarUrl} fallback={member.user.displayName} size="sm" />
            <div className="flex flex-col min-w-0 flex-1">
              <span className="font-medium text-sm truncate group-hover:text-primary transition-colors">{member.user.displayName}</span>
              <span className="text-[10px] text-muted-foreground truncate">@{member.user.username}</span>
            </div>
            {member.role === "admin" && (
              <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium border border-primary/20">مدير</span>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}
