import { useEffect } from "react";
import { NeedsAnalyzer } from "@/components/NeedsAnalyzer";
import { markAnalyzerSeen } from "@/lib/needsAnalyzer";

export default function NeedsAnalyzerPage() {
  useEffect(() => {
    document.title = "Find your fit — LYS";
    markAnalyzerSeen();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-4 py-10 sm:py-16">
        <div className="text-center mb-8">
          <h1 className="font-oswald text-3xl sm:text-4xl mb-3" data-testid="text-page-title">
            Find your fit in 60 seconds
          </h1>
          <p className="text-muted-foreground font-roboto max-w-lg mx-auto">
            LYS gives students, families, and educators a proven pathway from potential to purpose &mdash; so that no young person has to figure out their future alone. Answer four short questions and we'll point you to the right place.
          </p>
        </div>
        <NeedsAnalyzer />
      </div>
    </div>
  );
}
