"use client";

export function CompletenessBar({ percentage }) {
  const safePercent = Math.min(100, Math.max(0, Number(percentage) || 0));

  return (
    <div className="pt-2 max-w-md space-y-1.5">
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>Intake Progress</span>
        <span className="font-semibold text-foreground">{safePercent}%</span>
      </div>
      <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
        <div
          className="h-full bg-primary rounded-full transition-all duration-500"
          style={{ width: `${safePercent}%` }}
        />
      </div>
    </div>
  );
}

export default CompletenessBar;
