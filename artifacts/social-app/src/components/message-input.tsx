import { useState, useRef } from "react";
import { Send, Image as ImageIcon, Video, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMediaUpload } from "@/hooks/use-media-upload";

interface MessageInputProps {
  onSend: (content: string, mediaUrl?: string, mediaType?: "image" | "video") => void;
  isLoading?: boolean;
}

export function MessageInput({ onSend, isLoading }: MessageInputProps) {
  const [content, setContent] = useState("");
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { uploadFile, isUploading } = useMediaUpload();

  const handleSend = async () => {
    if (!content.trim() && !mediaFile) return;

    let finalMediaUrl: string | undefined;
    let finalMediaType: "image" | "video" | undefined;

    if (mediaFile) {
      const url = await uploadFile(mediaFile);
      if (url) {
        finalMediaUrl = url;
        finalMediaType = mediaFile.type.startsWith("image/") ? "image" : "video";
      } else {
        return; // Upload failed
      }
    }

    onSend(content.trim() || (mediaFile ? (mediaFile.type.startsWith("image/") ? "صورة" : "فيديو") : ""), finalMediaUrl, finalMediaType);
    setContent("");
    setMediaFile(null);
  };

  return (
    <div className="flex flex-col w-full gap-2 p-4 border-t border-border bg-card">
      {mediaFile && (
        <div className="flex items-center gap-3 p-2 rounded-lg bg-muted/50 w-fit">
          <div className="w-12 h-12 rounded bg-muted flex items-center justify-center overflow-hidden">
            {mediaFile.type.startsWith("image/") ? (
              <img src={URL.createObjectURL(mediaFile)} alt="Preview" className="w-full h-full object-cover" />
            ) : (
              <Video className="h-5 w-5 text-muted-foreground" />
            )}
          </div>
          <div className="flex flex-col text-sm max-w-[150px]">
            <span className="truncate font-medium">{mediaFile.name}</span>
            <span className="text-xs text-muted-foreground">
              {(mediaFile.size / 1024 / 1024).toFixed(2)} MB
            </span>
          </div>
          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={() => setMediaFile(null)}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      <div className="flex items-end gap-2 w-full">
        <input
          type="file"
          accept="image/*,video/*"
          className="hidden"
          ref={fileInputRef}
          onChange={(e) => {
            if (e.target.files?.[0]) setMediaFile(e.target.files[0]);
          }}
        />
        <Button
          variant="ghost"
          size="icon"
          className="h-12 w-12 shrink-0 text-muted-foreground hover:text-primary rounded-full"
          onClick={() => fileInputRef.current?.click()}
          disabled={isLoading || isUploading}
        >
          <ImageIcon className="h-6 w-6" />
        </Button>

        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          placeholder="اكتب رسالة..."
          className="flex-1 min-h-[48px] max-h-[120px] bg-muted/50 rounded-2xl px-4 py-3 resize-none focus:outline-none focus:ring-1 focus:ring-primary/50 text-base leading-relaxed"
          disabled={isLoading || isUploading}
        />

        <Button
          onClick={handleSend}
          disabled={(!content.trim() && !mediaFile) || isLoading || isUploading}
          size="icon"
          className="h-12 w-12 shrink-0 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-transform active:scale-95"
        >
          {isUploading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Send className="h-5 w-5 rtl:-scale-x-100" />
          )}
        </Button>
      </div>
    </div>
  );
}
