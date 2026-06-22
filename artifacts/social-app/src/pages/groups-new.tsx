import { useCreateGroup } from "@workspace/api-client-react";
import { useLocation } from "wouter";
import { useState } from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { ArrowRight, Loader2, Users } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { getGetMyGroupsQueryKey } from "@workspace/api-client-react";

const formSchema = z.object({
  name: z.string().min(2, "الاسم يجب أن يكون أكثر من حرفين"),
  description: z.string().optional(),
  isPublic: z.boolean().default(true),
});

export default function NewGroupPage() {
  const [, setLocation] = useLocation();
  const createGroup = useCreateGroup();
  const queryClient = useQueryClient();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      isPublic: true,
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      const group = await createGroup.mutateAsync({
        data: values
      });
      queryClient.invalidateQueries({ queryKey: getGetMyGroupsQueryKey() });
      setLocation(`/groups/${group.id}`);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="flex flex-col gap-6 p-4 md:p-8 max-w-2xl mx-auto w-full">
      <header className="flex items-center gap-4 mb-2">
        <Button variant="ghost" size="icon" onClick={() => setLocation("/groups")} className="-mr-2">
          <ArrowRight className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">إنشاء مجموعة جديدة</h1>
        </div>
      </header>

      <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
        <div className="w-20 h-20 bg-primary/10 rounded-2xl flex items-center justify-center mb-8 mx-auto">
          <Users className="w-10 h-10 text-primary" />
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-base">اسم المجموعة</FormLabel>
                  <FormControl>
                    <Input placeholder="مثال: مطوري الويب" className="h-12 bg-muted/30" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-base">الوصف (اختياري)</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="عن ماذا تتحدث هذه المجموعة؟" 
                      className="resize-none h-24 bg-muted/30" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="isPublic"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-xl border border-border p-4 bg-muted/10">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">مجموعة عامة</FormLabel>
                    <FormDescription>
                      يمكن لأي شخص البحث عن المجموعة والانضمام إليها
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full h-12 text-lg mt-8" disabled={createGroup.isPending}>
              {createGroup.isPending ? <Loader2 className="w-5 h-5 animate-spin ml-2" /> : null}
              إنشاء
            </Button>
          </form>
        </Form>
      </div>
    </div>
  );
}
