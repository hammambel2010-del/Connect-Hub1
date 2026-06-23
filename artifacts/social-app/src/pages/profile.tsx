import { useGetMe, useUpdateMe } from "@workspace/api-client-react";
import { useState, useEffect } from "react";
import { User, Camera, Edit2, Loader2, Save, X, Crown } from "lucide-react";
import { RankBadge } from "@/components/rank-badge";
import { useLocation } from "wouter";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { UserAvatar } from "@/components/user-avatar";
import { useMediaUpload } from "@/hooks/use-media-upload";
import { useQueryClient } from "@tanstack/react-query";
import { getGetMeQueryKey } from "@workspace/api-client-react";

export default function ProfilePage() {
  const { data: profile, isLoading } = useGetMe();
  const updateMutation = useUpdateMe();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { uploadFile, isUploading } = useMediaUpload();

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    displayName: "",
    username: "",
    bio: "",
    age: "",
  });

  useEffect(() => {
    if (profile && !isEditing) {
      setFormData({
        displayName: profile.displayName || "",
        username: profile.username || "",
        bio: profile.bio || "",
        age: profile.age?.toString() || "",
      });
    }
  }, [profile, isEditing]);

  const handleSave = async () => {
    if (!profile) return;
    try {
      await updateMutation.mutateAsync({
        data: {
          displayName: formData.displayName,
          username: formData.username,
          bio: formData.bio || undefined,
          age: formData.age ? parseInt(formData.age) : undefined,
        }
      });
      queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
      setIsEditing(false);
    } catch (e) {
      console.error(e);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const url = await uploadFile(e.target.files[0]);
      if (url) {
        await updateMutation.mutateAsync({ data: { avatarUrl: url } });
        queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
      }
    }
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const url = await uploadFile(e.target.files[0]);
      if (url) {
        await updateMutation.mutateAsync({ data: { coverUrl: url } });
        queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
      }
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

  if (!profile) return null;

  return (
    <div className="flex flex-col pb-20 max-w-3xl mx-auto w-full h-full overflow-y-auto">
      {/* Cover Photo */}
      <div className="relative w-full h-48 md:h-64 bg-muted shrink-0 group">
        {profile.coverUrl ? (
          <img src={`/api/storage${profile.coverUrl}`} alt="Cover" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-r from-primary/20 to-primary/5" />
        )}
        
        <label className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
          <input type="file" accept="image/*" className="hidden" onChange={handleCoverUpload} disabled={isUploading} />
          <div className="bg-background/80 text-foreground px-4 py-2 rounded-full font-medium flex items-center gap-2">
            <Camera className="w-4 h-4" /> تغيير الغلاف
          </div>
        </label>
      </div>

      <div className="px-4 md:px-8 -mt-16 flex flex-col">
        <div className="flex justify-between items-end mb-4">
          <div className="relative group">
            <UserAvatar 
              src={profile.avatarUrl ? `/api/storage${profile.avatarUrl}` : undefined} 
              fallback={profile.displayName} 
              size="2xl" 
              className="border-4 border-background bg-card" 
            />
            <label className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 rounded-full transition-opacity cursor-pointer">
              <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} disabled={isUploading} />
              <Camera className="w-6 h-6 text-white" />
            </label>
          </div>

          <Button 
            variant={isEditing ? "default" : "outline"} 
            className="rounded-full gap-2"
            onClick={() => isEditing ? handleSave() : setIsEditing(true)}
            disabled={updateMutation.isPending}
          >
            {isEditing ? (
              <>
                {updateMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                حفظ
              </>
            ) : (
              <>
                <Edit2 className="w-4 h-4" />
                تعديل الملف
              </>
            )}
          </Button>
        </div>

        {isEditing ? (
          <div className="space-y-4 bg-card p-6 rounded-2xl border border-border mt-4">
            <div className="flex justify-between items-center mb-2">
              <h2 className="font-bold text-lg">تعديل البيانات</h2>
              <Button variant="ghost" size="icon" onClick={() => setIsEditing(false)}>
                <X className="w-4 h-4" />
              </Button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-1 block">الاسم</label>
                <Input 
                  value={formData.displayName} 
                  onChange={(e) => setFormData({...formData, displayName: e.target.value})} 
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">اسم المستخدم</label>
                <Input 
                  value={formData.username} 
                  onChange={(e) => setFormData({...formData, username: e.target.value})} 
                  dir="ltr"
                  className="text-right"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">العمر</label>
                <Input 
                  type="number"
                  value={formData.age} 
                  onChange={(e) => setFormData({...formData, age: e.target.value})} 
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">نبذة</label>
                <Textarea 
                  value={formData.bio} 
                  onChange={(e) => setFormData({...formData, bio: e.target.value})} 
                  className="resize-none"
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="mt-2 space-y-6">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl font-bold">{profile.displayName}</h1>
                {profile.rank && profile.rank !== "user" && (
                  <RankBadge rank={profile.rank} size="md" />
                )}
              </div>
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
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <User className="w-4 h-4" />
                <span>{profile.age} سنة</span>
              </div>
            )}

            {/* Admin panel shortcut */}
            {(profile.rank === "admin" || profile.rank === "co_admin") && (
              <div className="pt-2">
                <button
                  onClick={() => setLocation("/admin")}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-yellow-400/10 border border-yellow-400/30 text-yellow-600 hover:bg-yellow-400/20 transition-colors text-sm font-medium"
                >
                  <Crown className="w-4 h-4" />
                  فتح لوحة المدير
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
