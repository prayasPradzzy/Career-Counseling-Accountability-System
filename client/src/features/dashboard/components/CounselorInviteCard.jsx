"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { profileService } from "@/services/profile.service";
import { SectionCard } from "@/components/common/SectionCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Copy, RefreshCw, Check, KeyRound, Loader2, Users, ExternalLink } from "lucide-react";
import { toast } from "sonner";

export function CounselorInviteCard() {
  const queryClient = useQueryClient();
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [isConfirmRegenOpen, setIsConfirmRegenOpen] = useState(false);

  const { data: inviteRes, isLoading } = useQuery({
    queryKey: ["counselor-invite-code"],
    queryFn: () => profileService.getCounselorInviteCode(),
    staleTime: 30000,
  });

  const regenMutation = useMutation({
    mutationFn: () => profileService.regenerateCounselorInviteCode(),
    onSuccess: (res) => {
      toast.success(res?.message || "New invite code generated successfully!");
      queryClient.invalidateQueries({ queryKey: ["counselor-invite-code"] });
      setIsConfirmRegenOpen(false);
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || "Failed to regenerate invite code.");
    },
  });

  const inviteData = inviteRes?.data || {};
  const code = inviteData.code || "LOADING...";
  const link = inviteData.link || (typeof window !== "undefined" ? `${window.location.origin}/signup?code=${code}` : "");
  const usedCount = inviteData.usedCount ?? 0;

  const handleCopyCode = () => {
    if (!code) return;
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    toast.success("Invite code copied to clipboard!");
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleCopyLink = () => {
    if (!link) return;
    navigator.clipboard.writeText(link);
    setCopiedLink(true);
    toast.success("Shareable signup link copied!");
    setTimeout(() => setCopiedLink(false), 2000);
  };

  if (isLoading) {
    return (
      <SectionCard title="Student Signup Code" subtitle="Your standing classroom registration code" iconName="KeyRound">
        <div className="flex items-center justify-center p-6 space-x-2">
          <Loader2 className="size-5 animate-spin text-primary" />
          <span className="text-xs text-muted-foreground">Loading standing code...</span>
        </div>
      </SectionCard>
    );
  }

  return (
    <>
      <SectionCard
        title="Standing Student Signup Code"
        subtitle="Share this permanent code with your students for instant account linking upon signup"
        iconName="KeyRound"
      >
        <div className="space-y-4 pt-1">
          {/* Main Code Box */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-primary/10 via-card to-card border border-primary/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Your Active Standing Code
              </span>
              <div className="flex items-center gap-3">
                <span className="text-2xl font-black font-mono tracking-widest text-primary">
                  {code}
                </span>
                <Badge variant="outline" className="text-[10px] bg-emerald-500/10 text-emerald-600 border-emerald-500/30">
                  Active Code
                </Badge>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 flex-wrap">
              <Button size="sm" variant="outline" className="gap-1.5 text-xs font-semibold" onClick={handleCopyCode}>
                {copiedCode ? <Check className="size-3.5 text-emerald-600" /> : <Copy className="size-3.5" />}
                {copiedCode ? "Copied" : "Copy Code"}
              </Button>

              <Button size="sm" className="gap-1.5 text-xs font-semibold shadow" onClick={handleCopyLink}>
                {copiedLink ? <Check className="size-3.5" /> : <ExternalLink className="size-3.5" />}
                {copiedLink ? "Link Copied" : "Copy Link"}
              </Button>
            </div>
          </div>

          {/* Details Row: Used Count & Regenerate Action */}
          <div className="flex items-center justify-between text-xs pt-1 border-t border-border/50">
            <div className="flex items-center gap-1.5 text-muted-foreground font-medium">
              <Users className="size-3.5 text-primary" />
              <span>{usedCount} {usedCount === 1 ? "student has" : "students have"} registered with this code</span>
            </div>

            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-muted-foreground hover:text-destructive gap-1.5 h-7 px-2"
              onClick={() => setIsConfirmRegenOpen(true)}
            >
              <RefreshCw className="size-3" />
              Regenerate Code
            </Button>
          </div>
        </div>
      </SectionCard>

      {/* Regeneration Confirmation Modal */}
      <Dialog open={isConfirmRegenOpen} onOpenChange={setIsConfirmRegenOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <RefreshCw className="size-4 text-amber-500" /> Regenerate Invite Code?
            </DialogTitle>
            <DialogDescription className="text-xs leading-relaxed pt-2">
              Your existing code <strong>{code}</strong> will stop working for future signups immediately. Existing students who have already registered are unaffected.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="pt-3">
            <Button variant="outline" size="sm" onClick={() => setIsConfirmRegenOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              disabled={regenMutation.isPending}
              onClick={() => regenMutation.mutate()}
            >
              {regenMutation.isPending ? (
                <>
                  <Loader2 className="mr-1.5 size-3.5 animate-spin" /> Regenerating...
                </>
              ) : (
                "Confirm & Regenerate"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default CounselorInviteCard;
