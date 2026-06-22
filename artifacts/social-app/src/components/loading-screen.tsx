import { Loader2 } from "lucide-react";

export function LoadingScreen() {
  return (
    <div className="flex h-[100dvh] w-full items-center justify-center bg-background" dir="rtl">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-sm font-medium text-muted-foreground animate-pulse">
          جاري التحميل...
        </p>
      </div>
    </div>
  );
}
