"use client";

import { Loader2, FileAudio, Clock } from "lucide-react";
import { useGetSessionAudio } from "../hooks/useInterviews";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1";

/** mm:ss or h:mm:ss from a seconds value */
export function formatDuration(seconds) {
  const s = Math.max(0, Math.round(Number(seconds) || 0));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const mm = String(m).padStart(2, "0");
  const ss = String(sec).padStart(2, "0");
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}

/**
 * AudioPreviewPlayer — plays a session's recording through its
 * signed, time-limited playback URL (fetched from the server; the
 * URL itself is never a permanent public link).
 */
export function AudioPreviewPlayer({ sessionId, actualDuration }) {
  const { data, isLoading, isError, error } = useGetSessionAudio(sessionId);

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-xs text-muted-foreground py-2">
        <Loader2 className="size-3.5 animate-spin" />
        Generating secure playback link…
      </div>
    );
  }

  if (isError || !data?.data?.playbackPath) {
    return (
      <p className="text-xs text-destructive">
        {error?.message || "Could not load the playback link."}
      </p>
    );
  }

  const { playbackPath, expiresAt, asset } = data.data;
  const playbackUrl = `${API_BASE}${playbackPath}`;
  const expires = expiresAt
    ? new Date(expiresAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : "";

  return (
    <div className="space-y-2">
      <audio controls preload="metadata" src={playbackUrl} className="w-full" />
      <div className="flex items-center gap-3 text-[11px] text-muted-foreground flex-wrap">
        <span className="inline-flex items-center gap-1">
          <FileAudio className="size-3" />
          {asset?.fileFormat?.toUpperCase?.() || "Audio"} ·{" "}
          {asset?.fileSizeBytes ? `${(asset.fileSizeBytes / (1024 * 1024)).toFixed(1)} MB` : ""}
        </span>
        <span className="inline-flex items-center gap-1">
          <Clock className="size-3" />
          Real duration: {formatDuration(asset?.durationSeconds ?? actualDuration)}
        </span>
        {expires && <span>Secure link valid until {expires}</span>}
      </div>
    </div>
  );
}

export default AudioPreviewPlayer;
