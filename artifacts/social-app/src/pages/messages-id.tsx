import { useGetDirectMessages, useSendDirectMessage, useGetUserById, getGetUserByIdQueryKey, getGetDirectMessagesQueryKey, getGetConversationsQueryKey } from "@workspace/api-client-react";
import { useParams, useLocation } from "wouter";
import { useRef, useEffect } from "react";
import { UserAvatar } from "@/components/user-avatar";
import { MessageBubble } from "@/components/message-bubble";
import { MessageInput } from "@/components/message-input";
import { ChevronLeft, ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useQueryClient } from "@tanstack/react-query";

export default function DirectMessagePage() {
  const params = useParams();
  const userId = params.userId;
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: user, isLoading: isLoadingUser } = useGetUserById(userId || "", {
    query: { queryKey: getGetUserByIdQueryKey(userId || ""), enabled: !!userId }
  });

  const { data: messages, isLoading: isLoadingMessages } = useGetDirectMessages(userId || "", {}, {
    query: { queryKey: getGetDirectMessagesQueryKey(userId || ""), enabled: !!userId, refetchInterval: 2000 }
  });

  const sendMutation = useSendDirectMessage();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (content: string, mediaUrl?: string, mediaType?: "image" | "video") => {
    if (!userId) return;
    try {
      await sendMutation.mutateAsync({
        userId,
        data: {
          content,
          mediaUrl,
          mediaType
        }
      });
      queryClient.invalidateQueries({ queryKey: getGetDirectMessagesQueryKey(userId) });
      queryClient.invalidateQueries({ queryKey: getGetConversationsQueryKey() });
    } catch (e) {
      console.error(e);
    }
  };

  if (!userId) return null;

  return (
    <div className="flex flex-col h-full w-full bg-background relative max-w-4xl mx-auto border-x border-border shadow-sm">
      <header className="flex items-center gap-3 p-4 border-b border-border bg-card/90 backdrop-blur-sm sticky top-0 z-10 shrink-0 h-16">
        <Button variant="ghost" size="icon" onClick={() => setLocation("/messages")} className="shrink-0 -mr-2">
          <ArrowRight className="h-5 w-5" />
        </Button>
        {isLoadingUser ? (
          <div className="flex items-center gap-3 flex-1">
            <Skeleton className="w-10 h-10 rounded-full" />
            <Skeleton className="w-32 h-5" />
          </div>
        ) : user ? (
          <div className="flex items-center gap-3 flex-1 cursor-pointer" onClick={() => setLocation(`/profile/${user.id}`)}>
            <UserAvatar src={user.avatarUrl} fallback={user.displayName} size="md" />
            <div className="flex flex-col min-w-0">
              <span className="font-semibold text-sm truncate">{user.displayName}</span>
              <span className="text-xs text-muted-foreground truncate">@{user.username}</span>
            </div>
          </div>
        ) : null}
      </header>

      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2">
        {isLoadingMessages ? (
          <div className="flex flex-col gap-4 w-full justify-center items-center h-full text-muted-foreground">
            <Loader2 className="w-8 h-8 animate-spin" />
            <span>جاري تحميل الرسائل...</span>
          </div>
        ) : messages && messages.length > 0 ? (
          <>
            {messages.slice().reverse().map(msg => (
              <MessageBubble 
                key={msg.id} 
                message={msg} 
                isOwn={msg.senderId !== parseInt(userId)} 
              />
            ))}
            <div ref={messagesEndRef} />
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground">
            <p className="text-sm">لا توجد رسائل بعد. ابدأ المحادثة!</p>
          </div>
        )}
      </div>

      <div className="shrink-0">
        <MessageInput onSend={handleSend} isLoading={sendMutation.isPending} />
      </div>
    </div>
  );
}
