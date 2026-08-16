"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Loader2, UploadCloud } from "lucide-react";
import { useUploadSessionAudio } from "../hooks/useInterviews";

const ACCEPTED = ".mp3,.wav,.m4a,.aac";
const ACCEPTED_LABEL = "MP3, WAV, M4A, AAC";
const MAX_MB = 200;

/**
 * AudioUploadWidget — drag-drop / file-picker upload of a recorded
 * session. Shows accepted formats + size limit, and a real progress
 * bar (a 45-minute recording can be a large file).
 */
export function AudioUploadWidget({ sessionId, replace = false }) {
  const inputRef = useRef(null);
  const [dragOver, setDragOver] = useState(false);
  const [progress, setProgress] = useState(null); // null | 0..100

  const uploadMutation = useUploadSessionAudio();

  const pick = (file) => {
    if (!file) return;
    uploadMutation.mutate(
      { sessionId, file, onProgress: setProgress },
      {
        onSuccess: () => {
          setProgress(null);
          toast.success(replace ? "Recording replaced." : "Recording uploaded.");
        },
        onError: (err) => {
          setProgress(null);
          toast.error(err?.message || "Failed to upload recording.");
        },
      }
    );
  };

  return (
    <div className="space-y-3">
      <div
        role="button"
        tabIndex={0}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => e.key === "Enter" && inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          const file = e.dataTransfer?.files?.[0];
          if (file) pick(file);
        }}
        className={`cursor-pointer rounded-xl border-2 border-dashed p-6 text-center transition-colors ${
          dragOver
            ? "border-primary bg-primary/5"
            : "border-border bg-muted/20 hover:border-primary/40 hover:bg-muted/30"
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED}
          className="hidden"
          onChange={(e) => {
            pick(e.target.files?.[0]);
            e.target.value = "";
          }}
        />
        {uploadMutation.isPending && progress !== null ? (
          <div className="space-y-2">
            <Loader2 className="size-5 animate-spin text-primary mx-auto" />
            <p className="text-xs font-medium text-foreground">
              Uploading… {progress}%
            </p>
            <div className="h-1.5 w-full max-w-xs mx-auto rounded-full bg-muted overflow-hidden">
              <div
                className="h-full bg-primary transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        ) : (
          <div className="space-y-1.5">
            <UploadCloud className="size-5 text-muted-foreground mx-auto" />
            <p className="text-sm font-medium text-foreground">
              {replace ? "Replace recording" : "Upload session recording"}
            </p>
            <p className="text-xs text-muted-foreground">
              Drag &amp; drop here or click to browse
            </p>
            <p className="text-[11px] text-muted-foreground/80">
              Accepted: {ACCEPTED_LABEL} · Max {MAX_MB}MB
            </p>
          </div>
        )}
      </div>

      {uploadMutation.isPending && (
        <p className="text-[11px] text-muted-foreground">
          Uploading a large file can take a while — keep this page open.
        </p>
      )}

      <Button
        variant="outline"
        size="sm"
        className="text-xs"
        onClick={() => inputRef.current?.click()}
        disabled={uploadMutation.isPending}
      >
        Browse files…
      </Button>
    </div>
  );
}

export default AudioUploadWidget;
