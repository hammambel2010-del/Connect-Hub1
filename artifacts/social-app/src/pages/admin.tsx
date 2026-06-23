import { useState } from "react";
import { useGetMe, useVerifyAdmin, useGetAdminUsers, useSetUserRank, useBanUser, useUnbanUser, getGetMeQueryKey, getGetAdminUsersQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Crown, Shield, Users, Ban, RefreshCw, ChevronDown, Lock, LogIn, Loader2, UserCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { UserAvatar } from "@/components/user-avatar";
import { RankBadge, type Rank } from "@/components/rank-badge";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

const RANKS: { value: Rank; label: string }[] = [
  { value: "user", label: "مستخدم عادي" },
  { value: "content_creator", label: "صانع محتوى" },
  { value: "hollywood", label: "ممثل هوليوود" },
  { value: "important", label: "ذو أهمية" },
  { value: "well_connected", label: "متصل جيداً" },
  { value: "advisor", label: "المستشار" },
  { value: "co_admin", label: "شريك المدير" },
  { value: "admin", label: "المدير" },
];

export default function AdminPage() {
  const queryClient = useQueryClient();
  const { data: me } = useGetMe({ query: { queryKey: getGetMeQueryKey() } });
  const isPrivileged = me?.rank === "admin" || me?.rank === "co_admin";

  const [password, setPassword] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);

  const verifyMutation = useVerifyAdmin();
  const setRankMutation = useSetUserRank();
  const banMutation = useBanUser();
  const unbanMutation = useUnbanUser();

  const { data: users, isLoading: isLoadingUsers } = useGetAdminUsers({
    query: { queryKey: getGetAdminUsersQueryKey(), enabled: isPrivileged },
  });

  const [banDialog, setBanDialog] = useState<{ userId: number; displayName: string } | null>(null);
  const [banReason, setBanReason] = useState("");
  const [banHours, setBanHours] = useState("");

  const handleVerify = async () => {
    setIsVerifying(true);
    try {
      await verifyMutation.mutateAsync({ data: { password } });
      queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
      toast.success("مرحباً يا مدير! 👑 تم تفعيل صلاحيات المدير.");
      setPassword("");
    } catch {
      toast.error("كلمة السر غير صحيحة.");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleSetRank = async (userId: number, rank: string) => {
    try {
      await setRankMutation.mutateAsync({ userId, data: { rank: rank as Rank } });
      queryClient.invalidateQueries({ queryKey: getGetAdminUsersQueryKey() });
      toast.success("تم تحديث الرتبة.");
    } catch {
      toast.error("فشل تحديث الرتبة.");
    }
  };

  const handleBan = async () => {
    if (!banDialog) return;
    try {
      await banMutation.mutateAsync({
        userId: banDialog.userId,
        data: {
          reason: banReason || undefined,
          durationHours: banHours ? parseInt(banHours) : null,
        },
      });
      queryClient.invalidateQueries({ queryKey: getGetAdminUsersQueryKey() });
      toast.success(`تم حظر ${banDialog.displayName}.`);
      setBanDialog(null);
      setBanReason("");
      setBanHours("");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "فشل الحظر.";
      toast.error(msg);
    }
  };

  const handleUnban = async (userId: number, displayName: string) => {
    try {
      await unbanMutation.mutateAsync({ userId });
      queryClient.invalidateQueries({ queryKey: getGetAdminUsersQueryKey() });
      toast.success(`تم رفع الحظر عن ${displayName}.`);
    } catch {
      toast.error("فشل رفع الحظر.");
    }
  };

  if (!me) return null;

  return (
    <div className="flex flex-col h-full overflow-y-auto pb-20">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border px-4 py-3 flex items-center gap-3">
        <div className="p-2 rounded-xl bg-yellow-400/10 border border-yellow-400/30">
          <Crown className="w-5 h-5 text-yellow-500" />
        </div>
        <div>
          <h1 className="font-bold text-lg">لوحة المدير</h1>
          <p className="text-xs text-muted-foreground">إدارة المستخدمين والرتب والحظر</p>
        </div>
        {me.rank && me.rank !== "user" && (
          <div className="mr-auto">
            <RankBadge rank={me.rank} size="sm" />
          </div>
        )}
      </div>

      <div className="flex flex-col gap-6 p-4 max-w-3xl mx-auto w-full">
        {/* Password entry — shown when not yet privileged */}
        {!isPrivileged && (
          <div className="bg-card border border-border rounded-2xl p-6 flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-primary/10">
                <Lock className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="font-bold">الدخول لوضع المدير</h2>
                <p className="text-sm text-muted-foreground">أدخل كلمة السر لتفعيل الصلاحيات</p>
              </div>
            </div>
            <Input
              type="password"
              placeholder="كلمة السر"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleVerify()}
              dir="ltr"
              className="text-right"
            />
            <Button onClick={handleVerify} disabled={isVerifying || !password} className="gap-2">
              {isVerifying ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogIn className="w-4 h-4" />}
              دخول
            </Button>
          </div>
        )}

        {/* Admin panel — shown when privileged */}
        {isPrivileged && (
          <>
            {/* Stats */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-card border border-border rounded-2xl p-4 flex items-center gap-3">
                <div className="p-2 rounded-xl bg-blue-500/10">
                  <Users className="w-5 h-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{users?.length ?? "—"}</p>
                  <p className="text-xs text-muted-foreground">إجمالي المستخدمين</p>
                </div>
              </div>
              <div className="bg-card border border-border rounded-2xl p-4 flex items-center gap-3">
                <div className="p-2 rounded-xl bg-red-500/10">
                  <Ban className="w-5 h-5 text-red-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{users?.filter(u => u.isBanned).length ?? "—"}</p>
                  <p className="text-xs text-muted-foreground">محظورون</p>
                </div>
              </div>
            </div>

            {/* User list */}
            <div className="bg-card border border-border rounded-2xl overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                <h2 className="font-bold flex items-center gap-2">
                  <Shield className="w-4 h-4 text-primary" />
                  المستخدمون
                </h2>
                <Button variant="ghost" size="icon" onClick={() => queryClient.invalidateQueries({ queryKey: getGetAdminUsersQueryKey() })}>
                  <RefreshCw className="w-4 h-4" />
                </Button>
              </div>

              {isLoadingUsers ? (
                <div className="flex items-center justify-center p-8">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {users?.map((user) => (
                    <div key={user.id} className={`flex items-center gap-3 px-4 py-3 ${user.isBanned ? "bg-red-500/5" : ""}`}>
                      <UserAvatar
                        src={user.avatarUrl ? `/api/storage${user.avatarUrl}` : undefined}
                        fallback={user.displayName}
                        size="md"
                      />

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-sm truncate">{user.displayName}</span>
                          {user.rank !== "user" && <RankBadge rank={user.rank} size="sm" animate={false} />}
                          {user.isBanned && (
                            <span className="text-[10px] bg-red-500/15 text-red-400 border border-red-500/30 px-1.5 py-0.5 rounded-full font-medium">
                              محظور
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">@{user.username}</p>
                        {user.isBanned && user.banReason && (
                          <p className="text-xs text-red-400 mt-0.5">السبب: {user.banReason}</p>
                        )}
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {/* Rank selector — admin can set any rank; co_admin can set up to advisor */}
                        {user.rank !== "admin" && (
                          <Select
                            value={user.rank}
                            onValueChange={(v) => handleSetRank(user.id, v)}
                            disabled={setRankMutation.isPending}
                          >
                            <SelectTrigger className="h-8 w-36 text-xs">
                              <SelectValue />
                              <ChevronDown className="w-3 h-3 opacity-50 mr-1" />
                            </SelectTrigger>
                            <SelectContent>
                              {RANKS.filter(r => {
                                if (me.rank === "admin") return true;
                                return r.value !== "admin" && r.value !== "co_admin";
                              }).map(r => (
                                <SelectItem key={r.value} value={r.value} className="text-xs">
                                  {r.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}

                        {/* Ban / Unban */}
                        {user.rank !== "admin" && user.id !== me.id && (
                          user.isBanned ? (
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 text-xs gap-1 text-green-500 border-green-500/30 hover:bg-green-500/10"
                              onClick={() => handleUnban(user.id, user.displayName)}
                              disabled={unbanMutation.isPending}
                            >
                              <UserCheck className="w-3 h-3" />
                              رفع الحظر
                            </Button>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 text-xs gap-1 text-red-500 border-red-500/30 hover:bg-red-500/10"
                              onClick={() => setBanDialog({ userId: user.id, displayName: user.displayName })}
                            >
                              <Ban className="w-3 h-3" />
                              حظر
                            </Button>
                          )
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Ban dialog */}
      <Dialog open={!!banDialog} onOpenChange={() => setBanDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>حظر {banDialog?.displayName}</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-2">
            <div>
              <label className="text-sm font-medium mb-1.5 block">سبب الحظر (اختياري)</label>
              <Input
                placeholder="أدخل السبب..."
                value={banReason}
                onChange={(e) => setBanReason(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">مدة الحظر بالساعات (اتركها فارغة للحظر الدائم)</label>
              <Input
                type="number"
                placeholder="مثال: 24 للحظر يوم واحد"
                value={banHours}
                onChange={(e) => setBanHours(e.target.value)}
                dir="ltr"
                className="text-right"
              />
            </div>
          </div>
          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={() => setBanDialog(null)}>إلغاء</Button>
            <Button
              variant="destructive"
              onClick={handleBan}
              disabled={banMutation.isPending}
              className="gap-2"
            >
              {banMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Ban className="w-4 h-4" />}
              تأكيد الحظر
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
