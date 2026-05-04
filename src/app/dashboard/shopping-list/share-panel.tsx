"use client";

import { useState, useTransition } from "react";
import {
  shareShoppingList,
  unshareShoppingList,
  leaveSharedList,
} from "./actions";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Share2, UserPlus, X, LogOut } from "lucide-react";
import type { SharedListInfo } from "./page";

interface SharePanelProps {
  myShares: { shareId: string; userId: string; displayName: string }[];
  sharedWithMe: SharedListInfo[];
}

export default function SharePanel({ myShares, sharedWithMe }: SharePanelProps) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleShare() {
    if (!email.trim()) return;
    setError(null);
    setSuccess(false);
    startTransition(async () => {
      const result = await shareShoppingList(email);
      if (result.error) {
        setError(result.error);
      } else {
        setSuccess(true);
        setEmail("");
        setTimeout(() => setSuccess(false), 3000);
      }
    });
  }

  function handleUnshare(shareId: string) {
    startTransition(async () => {
      await unshareShoppingList(shareId);
    });
  }

  function handleLeave(shareId: string) {
    startTransition(async () => {
      await leaveSharedList(shareId);
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Share2 className="h-4 w-4" />
          Sharing
        </CardTitle>
        <CardDescription>
          Share your shopping list so others can view and edit it too.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Invite form */}
        <div className="flex gap-2">
          <Input
            placeholder="Enter email address"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setError(null);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleShare();
              }
            }}
            className="flex-1"
          />
          <Button size="sm" onClick={handleShare} disabled={isPending || !email.trim()}>
            <UserPlus className="mr-1 h-4 w-4" />
            Share
          </Button>
        </div>
        {error && (
          <p className="text-sm text-destructive">{error}</p>
        )}
        {success && (
          <p className="text-sm text-green-600">List shared successfully!</p>
        )}

        {/* People I've shared with */}
        {myShares.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Shared with
            </p>
            {myShares.map((share) => (
              <div
                key={share.shareId}
                className="flex items-center justify-between rounded-md border px-3 py-2 text-sm"
              >
                <span>{share.displayName}</span>
                <button
                  onClick={() => handleUnshare(share.shareId)}
                  disabled={isPending}
                  className="rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                  title="Remove access"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Lists shared with me */}
        {sharedWithMe.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Shared with you
            </p>
            {sharedWithMe.map((share) => (
              <div
                key={share.shareId}
                className="flex items-center justify-between rounded-md border px-3 py-2 text-sm"
              >
                <span>{share.ownerName}&apos;s list</span>
                <button
                  onClick={() => handleLeave(share.shareId)}
                  disabled={isPending}
                  className="rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                  title="Leave shared list"
                >
                  <LogOut className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
