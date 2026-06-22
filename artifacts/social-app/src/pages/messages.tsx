import { useGetConversations, getGetConversationsQueryKey } from "@workspace/api-client-react";
import { Link } from "wouter";
import { UserAvatar } from "@/components/user-avatar";
import { formatDistanceToNow } from "date-fns";
import { ar } from "date-fns/locale";
import { MessageCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";

export default function MessagesPage() {
  const { data: conversations, isLoading } = useGetConversations({
    query: { queryKey: getGetConversationsQueryKey(), refetchInterval: 5000 }
  });

  return (
    <div className="flex flex-col h-full w-full max-w-4xl mx-auto p-4 md:p-6">
      <header className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
          <MessageCircle className="w-8 h-8 text-primary" />
          الرسائل
        </h1>
      </header>

      <div className="flex-1 bg-card border border-border rounded-2xl overflow-hidden shadow-sm flex flex-col">
        {isLoading ? (
          <div className="flex flex-col divide-y divide-border">
            {Array(5).fill(0).map((_, i) => (
              <div key={i} className="p-4 flex gap-4">
                <Skeleton className="w-14 h-14 rounded-full shrink-0" />
                <div className="flex-1 space-y-2 py-2">
                  <Skeleton className="w-1/4 h-5" />
                  <Skeleton className="w-2/3 h-4" />
                </div>
              </div>
            ))}
          </div>
        ) : conversations && conversations.length > 0 ? (
          <div className="flex flex-col divide-y divide-border overflow-y-auto">
            {conversations.map((conv, i) => (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                key={conv.user.id}
              >
                <Link 
                  href={`/messages/${conv.user.id}`} 
                  className="p-4 flex items-center gap-4 hover:bg-muted/30 transition-colors cursor-pointer"
                >
                  <UserAvatar src={conv.user.avatarUrl} fallback={conv.user.displayName} size="xl" />
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline mb-1">
                      <h3 className="font-semibold text-base truncate">{conv.user.displayName}</h3>
                      <span className="text-xs text-muted-foreground whitespace-nowrap ml-2">
                        {formatDistanceToNow(new Date(conv.lastMessage.createdAt), { addSuffix: true, locale: ar })}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground truncate">
                      {conv.lastMessage.mediaUrl ? (conv.lastMessage.mediaType === 'image' ? 'صورة' : 'فيديو') : conv.lastMessage.content}
                    </p>
                  </div>
                  {conv.unreadCount > 0 && (
                    <div className="bg-primary text-primary-foreground text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center shrink-0 shadow-sm">
                      {conv.unreadCount}
                    </div>
                  )}
                </Link>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-muted-foreground">
            <MessageCircle className="w-12 h-12 mb-4 text-muted" />
            <p className="text-lg font-medium text-foreground">لا توجد محادثات</p>
            <p className="text-sm">ابدأ محادثة جديدة مع أحد أصدقائك</p>
          </div>
        )}
      </div>
    </div>
  );
}
