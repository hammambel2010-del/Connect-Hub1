import { useGetFriends, useGetFriendRequests, useAcceptFriendRequest, useRejectFriendRequest, useCancelFriendRequest } from "@workspace/api-client-react";
import { Link } from "wouter";
import { useState } from "react";
import { Users, UserPlus, Check, X, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserAvatar } from "@/components/user-avatar";
import { useQueryClient } from "@tanstack/react-query";
import { getGetFriendsQueryKey, getGetFriendRequestsQueryKey, getSearchUsersQueryKey } from "@workspace/api-client-react";
import { toast } from "sonner";

export default function FriendsPage() {
  const { data: friends, isLoading: isLoadingFriends } = useGetFriends();
  const { data: requests, isLoading: isLoadingRequests } = useGetFriendRequests();
  
  const acceptMutation = useAcceptFriendRequest();
  const rejectMutation = useRejectFriendRequest();
  const cancelMutation = useCancelFriendRequest();
  const queryClient = useQueryClient();

  const handleAccept = async (requestId: number) => {
    try {
      await acceptMutation.mutateAsync({ requestId });
      queryClient.invalidateQueries({ queryKey: getGetFriendsQueryKey() });
      queryClient.invalidateQueries({ queryKey: getGetFriendRequestsQueryKey() });
      toast.success("تم قبول طلب الصداقة");
    } catch (e) {
      toast.error("حدث خطأ");
    }
  };

  const handleReject = async (requestId: number) => {
    try {
      await rejectMutation.mutateAsync({ requestId });
      queryClient.invalidateQueries({ queryKey: getGetFriendRequestsQueryKey() });
    } catch (e) {
      toast.error("حدث خطأ");
    }
  };

  const handleUnfriend = async (userId: number) => {
    try {
      await cancelMutation.mutateAsync({ userId: userId.toString() });
      queryClient.invalidateQueries({ queryKey: getGetFriendsQueryKey() });
      toast.success("تم إلغاء الصداقة");
    } catch (e) {
      toast.error("حدث خطأ");
    }
  };

  return (
    <div className="flex flex-col gap-6 p-4 md:p-8 max-w-4xl mx-auto w-full">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
            <Users className="w-8 h-8 text-primary" />
            الأصدقاء
          </h1>
        </div>
        <Link href="/search">
          <Button className="w-full sm:w-auto gap-2">
            <Search className="w-5 h-5" />
            البحث عن أصدقاء
          </Button>
        </Link>
      </header>

      <Tabs defaultValue="friends" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2 h-12">
          <TabsTrigger value="friends" className="text-base h-10">
            أصدقائي
            {friends && friends.length > 0 && <span className="mr-2 bg-muted-foreground/20 px-2 py-0.5 rounded-full text-xs">{friends.length}</span>}
          </TabsTrigger>
          <TabsTrigger value="requests" className="text-base h-10 relative">
            الطلبات
            {requests && requests.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground w-5 h-5 flex items-center justify-center rounded-full text-xs font-bold animate-in zoom-in">
                {requests.length}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="friends" className="mt-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {isLoadingFriends ? (
              Array(4).fill(0).map((_, i) => (
                <div key={i} className="flex items-center p-4 rounded-xl border border-border bg-card shadow-sm gap-4">
                  <Skeleton className="w-14 h-14 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="w-1/2 h-5" />
                    <Skeleton className="w-1/3 h-4" />
                  </div>
                </div>
              ))
            ) : friends && friends.length > 0 ? (
              friends.map(friend => (
                <div key={friend.id} className="flex items-center p-4 rounded-xl border border-border bg-card shadow-sm gap-4 hover:border-primary/30 transition-colors group">
                  <Link href={`/profile/${friend.id}`} className="cursor-pointer shrink-0">
                    <UserAvatar src={friend.avatarUrl} fallback={friend.displayName} size="xl" className="group-hover:ring-2 ring-primary/50 transition-all" />
                  </Link>
                  <div className="flex-1 min-w-0">
                    <Link href={`/profile/${friend.id}`}>
                      <h3 className="font-bold text-base truncate hover:text-primary cursor-pointer transition-colors">{friend.displayName}</h3>
                    </Link>
                    <p className="text-xs text-muted-foreground truncate">@{friend.username}</p>
                    
                    <div className="flex gap-2 mt-3">
                      <Link href={`/messages/${friend.id}`} className="flex-1">
                        <Button size="sm" className="w-full h-8 text-xs bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground border-none">
                          مراسلة
                        </Button>
                      </Link>
                      <Button size="sm" variant="outline" className="h-8 px-2 text-muted-foreground hover:text-destructive border-dashed" onClick={() => handleUnfriend(friend.id)}>
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full py-16 text-center text-muted-foreground flex flex-col items-center gap-4 bg-muted/10 rounded-2xl border border-dashed border-border">
                <Users className="w-16 h-16 text-muted" />
                <h3 className="text-xl font-medium text-foreground">لا يوجد أصدقاء</h3>
                <p>قم بالبحث عن أشخاص تعرفهم وأضفهم لقائمة أصدقائك</p>
                <Link href="/search">
                  <Button variant="outline" className="mt-2">ابحث الآن</Button>
                </Link>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="requests" className="mt-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {isLoadingRequests ? (
              Array(2).fill(0).map((_, i) => (
                <div key={i} className="flex items-center p-4 rounded-xl border border-border bg-card shadow-sm gap-4">
                  <Skeleton className="w-14 h-14 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="w-1/2 h-5" />
                    <Skeleton className="w-1/3 h-4" />
                  </div>
                </div>
              ))
            ) : requests && requests.length > 0 ? (
              requests.map(req => {
                const user = req.fromUser;
                if (!user) return null;
                return (
                  <div key={req.id} className="flex items-center p-4 rounded-xl border border-primary/20 bg-primary/5 shadow-sm gap-4">
                    <Link href={`/profile/${user.id}`} className="cursor-pointer shrink-0">
                      <UserAvatar src={user.avatarUrl} fallback={user.displayName} size="xl" />
                    </Link>
                    <div className="flex-1 min-w-0">
                      <Link href={`/profile/${user.id}`}>
                        <h3 className="font-bold text-base truncate hover:text-primary cursor-pointer">{user.displayName}</h3>
                      </Link>
                      <p className="text-xs text-muted-foreground truncate mb-3">أرسل لك طلب صداقة</p>
                      
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          className="flex-1 h-9 bg-primary text-primary-foreground hover:bg-primary/90" 
                          onClick={() => handleAccept(req.id)}
                          disabled={acceptMutation.isPending}
                        >
                          <Check className="w-4 h-4 ml-1" />
                          قبول
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="flex-1 h-9 hover:bg-destructive/10 hover:text-destructive border-border" 
                          onClick={() => handleReject(req.id)}
                          disabled={rejectMutation.isPending}
                        >
                          <X className="w-4 h-4 ml-1" />
                          رفض
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="col-span-full py-16 text-center text-muted-foreground flex flex-col items-center gap-4 bg-muted/10 rounded-2xl border border-dashed border-border">
                <UserPlus className="w-16 h-16 text-muted" />
                <p className="text-lg">لا توجد طلبات صداقة معلقة</p>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
