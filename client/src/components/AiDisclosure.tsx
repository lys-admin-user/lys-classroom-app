import { Sparkles, Bot } from "lucide-react";
import { cn } from "@/lib/utils";

// Inline label marking a block of content as AI-generated. Place near the top of
// any rendered AI output (lessons, practice sets, assignments, plans).
export function AiGeneratedLabel({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary",
        className,
      )}
      data-testid="badge-ai-generated"
    >
      <Sparkles className="h-3.5 w-3.5" />
      AI-generated — please review before use
    </span>
  );
}

// Notice shown on surfaces where the user is interacting with an automated AI
// agent (chat/assistant style features), per our Responsible AI Policy.
export function AiAgentNotice({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-md border bg-muted/50 px-3 py-2 text-xs text-muted-foreground",
        className,
      )}
      data-testid="notice-ai-agent"
    >
      <Bot className="h-4 w-4 shrink-0 text-primary" />
      <span>
        You're interacting with an AI agent, not a human. Responses are
        automatically generated and may contain errors.
      </span>
    </div>
  );
}
