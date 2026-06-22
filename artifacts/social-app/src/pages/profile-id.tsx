import { useGetUserById, useSendFriendRequest, useCancelFriendRequest, useGetFriends, useGetFriendRequests, getGetUserByIdQueryKey, getGetFriendsQueryKey, getGetFriendRequestsQueryKey } from "@workspace/api-client-react";
import { useParams, useLocation } from "wouter";
import { User, MessageCircle, UserPlus, UserMinus, Clock, Loader2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { UserAvatar } from "@/components/user-avatar";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useUser } from "@clerk/react";

export default function UserProfilePage() {
  const params = useParams();
  const userId = params.userId;
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { user: currentUser } = useUser();

  const { data: profile, isLoading } = useGetUserById(userId || "", {
    query: { queryKey: getGetUserByIdQueryKey(userId || ""), enabled: !!userId }
  });

  const { data: friends } = useGetFriends();
  const { data: requests } = useGetFriendRequests();

  const sendRequestMutation = useSendFriendRequest();
  const cancelRequestMutation = useCancelFriendRequest();

  if (!userId) return null;

  // Redirect to own profile if clicking own id
  if (profile && currentUser && profile.clerkId === currentUser.id) {
    setLocation("/profile");
    return null;
  }

  const isFriend = friends?.some(f => f.id.toString() === userId);
  const pendingReceived = requests?.some(r => r.fromUser?.id.toString() === userId);
  const pendingSent = false; // We don't have an endpoint for sent requests, but we might guess based on error or just let it fail gracefully. Actually let's just rely on the API returning an error if already sent. Or we assume not sent until clicked.

  const handleSendRequest = async () => {
    try {
      await sendRequestMutation.mutateAsync({ userId: userId! });
      toast.success("تم إرسال طلب الصداقة");
      queryClient.invalidateQueries({ queryKey: getGetUserByIdQueryKey(userId) });
    } catch (e) {
      toast.error("حدث خطأ أو ربما قمت بإرسال طلب مسبقاً");
    }
  };

  const handleUnfriend = async () => {
    try {
      await cancelRequestMutation.mutateAsync({ userId: userId! });
      toast.success("تم الإلغاء");
      queryClient.invalidateQueries({ queryKey: getGetFriendsQueryKey() });
      queryClient.invalidateQueries({ queryKey: getGetUserByIdQueryKey(userId) });
    } catch (e) {
      toast.error("حدث خطأ");
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6 p-4 md:p-8 max-w-3xl mx-auto w-full">
        <Skeleton className="w-full h-48 rounded-2xl" />
        <div className="flex flex-col items-center -mt-16 gap-4">
          <Skeleton className="w-32 h-32 rounded-full border-4 border-background" />
          <Skeleton className="w-48 h-8" />
          <Skeleton className="w-32 h-4" />
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center text-muted-foreground">
        <User className="w-16 h-16 mb-4 text-muted" />
        <h2 className="text-xl font-bold text-foreground">المستخدم غير موجود</h2>
        <p className="mb-6">عذراً، لم نتمكن من العثور على هذا الحساب.</p>
        <Button onClick={() => setLocation("/search")}>العودة للبحث</Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col pb-20 max-w-3xl mx-auto w-full h-full overflow-y-auto">
      {/* Header Back Button */}
      <div className="absolute top-4 right-4 z-10 bg-background/50 backdrop-blur-md rounded-full p-1 border border-border/50">
        <Button variant="ghost" size="icon" className="rounded-full h-8 w-8" onClick={() => window.history.back()}>
          <ArrowRight className="h-5 w-5" />
        </Button>
      </div>

      {/* Cover Photo */}
      <div className="relative w-full h-48 md:h-64 bg-muted shrink-0">
        {profile.coverUrl ? (
          <img src={`/api/storage${profile.coverUrl}`} alt="Cover" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-r from-primary/20 to-primary/5" />
        )}
      </div>

      <div className="px-4 md:px-8 -mt-16 flex flex-col">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4 mb-4">
          <UserAvatar 
            src={profile.avatarUrl ? `/api/storage${profile.avatarUrl}` : undefined} 
            fallback={profile.displayName} 
            size="2xl" 
            className="border-4 border-background bg-card" 
          />

          <div className="flex gap-2">
            <Button 
              className="gap-2 rounded-full h-10 px-6 bg-primary text-primary-foreground hover:bg-primary/90"
              onClick={() => setLocation(`/messages/${profile.id}`)}
            >
              <MessageCircle className="w-4 h-4" />
              مراسلة
            </Button>
            
            {isFriend ? (
              <Button variant="outline" className="gap-2 rounded-full h-10 px-6 hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30" onClick={handleUnfriend} disabled={cancelRequestMutation.isPending}>
                <UserMinus className="w-4 h-4" />
                إلغاء الصداقة
              </Button>
            ) : pendingReceived ? (
              <Button variant="secondary" className="gap-2 rounded-full h-10 px-6" onClick={() => setLocation("/friends")}>
                <Clock className="w-4 h-4" />
                لديك طلب منه
              </Button>
            ) : (
              <Button variant="outline" className="gap-2 rounded-full h-10 px-6 border-primary/20 text-primary hover:bg-primary/10" onClick={handleSendRequest} disabled={sendRequestMutation.isPending}>
                {sendRequestMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                إضافة صديق
              </Button>
            )}
          </div>
        </div>

        <div className="mt-2 space-y-6">
          <div>
            <h1 className="text-2xl font-bold">{profile.displayName}</h1>
            <p className="text-muted-foreground">@{profile.username}</p>
          </div>

          <div className="flex gap-6 py-4 border-y border-border">
            <div className="flex flex-col">
              <span className="font-bold text-lg">{profile.friendCount || 0}</span>
              <span className="text-muted-foreground text-sm">أصدقاء</span>
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-lg">{profile.groupCount || 0}</span>
              <span className="text-muted-foreground text-sm">مجموعات</span>
            </div>
          </div>

          {profile.bio && (
            <div>
              <h3 className="font-semibold mb-2">نبذة</h3>
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{profile.bio}</p>
            </div>
          )}
          
          {profile.age && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/30 w-fit px-3 py-1.5 rounded-lg border border-border/50">
              <User className="w-4 h-4" />
              <span>{profile.age} سنة</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
