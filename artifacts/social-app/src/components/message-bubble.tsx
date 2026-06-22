import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { Message } from "@workspace/api-client-react";
import { UserAvatar } from "./user-avatar";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface MessageBubbleProps {
  message: Message;
  isOwn: boolean;
  showAvatar?: boolean;
}

export function MessageBubble({ message, isOwn, showAvatar = true }: MessageBubbleProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "flex w-full max-w-[85%] sm:max-w-[75%] gap-2 mb-4",
        isOwn ? "mr-auto flex-row-reverse" : "ml-auto"
      )}
    >
      {!isOwn && showAvatar && (
        <UserAvatar
          src={message.sender?.avatarUrl}
          fallback={message.sender?.displayName || "U"}
          size="sm"
          className="mt-auto flex-shrink-0"
        />
      )}
      
      {!isOwn && !showAvatar && <div className="w-8 flex-shrink-0" />}

      <div
        className={cn(
          "flex flex-col gap-1 rounded-2xl px-4 py-2",
          isOwn
            ? "bg-primary text-primary-foreground rounded-br-sm"
            : "bg-muted text-foreground rounded-bl-sm"
        )}
      >
        {message.mediaUrl && message.mediaType === "image" && (
          <img
            src={`/api/storage${message.mediaUrl}`}
            alt="صورة"
            className="rounded-lg max-h-64 object-cover mt-1"
          />
        )}
        
        {message.mediaUrl && message.mediaType === "video" && (
          <video
            src={`/api/storage${message.mediaUrl}`}
            controls
            className="rounded-lg max-h-64 mt-1"
          />
        )}

        <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
        
        <span
          className={cn(
            "text-[10px] self-end mt-1",
            isOwn ? "text-primary-foreground/70" : "text-muted-foreground"
          )}
        >
          {format(new Date(message.createdAt), "h:mm a", { locale: ar })}
        </span>
      </div>
    </motion.div>
  );
}
