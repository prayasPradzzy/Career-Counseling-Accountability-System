"use client";

import { Button } from "@/components/ui/button";
import { User, Briefcase } from "lucide-react";

// Parent sessions are not currently available — only candidate and
// professional sessions can be created.
const SESSION_TYPES = [
  {
    value: "candidate",
    label: "Candidate Session",
    description: "The student themselves",
    duration: "45 min",
    icon: User,
  },
  {
    value: "professional_self",
    label: "Professional Session",
    description: "Professional self-assessment",
    duration: "45 min",
    icon: Briefcase,
  },
];

/**
 * SessionTypeSelector — lets the counselor choose which interview
 * session to build (Candidate / Professional).
 */
export function SessionTypeSelector({ value, onChange }) {
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {SESSION_TYPES.map((type) => {
        const Icon = type.icon;
        const active = value === type.value;
        return (
          <button
            key={type.value}
            type="button"
            onClick={() => onChange(type.value)}
            className={`text-left rounded-xl border p-3.5 transition-colors ${
              active
                ? "border-primary bg-primary/5 ring-1 ring-primary/30"
                : "border-border bg-card hover:bg-muted/40"
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <Icon className={`size-4 ${active ? "text-primary" : "text-muted-foreground"}`} />
              <span className="text-[10px] font-mono text-muted-foreground">{type.duration}</span>
            </div>
            <p className={`mt-2 text-sm font-semibold ${active ? "text-primary" : "text-foreground"}`}>
              {type.label}
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5">{type.description}</p>
          </button>
        );
      })}
    </div>
  );
}

export default SessionTypeSelector;
