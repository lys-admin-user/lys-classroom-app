import { useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TrendingUp, TrendingDown, Minus, Calendar, Target, Heart, Compass, Camera } from "lucide-react";
import type { StudentJourneyProgressHistory } from "@shared/schema";

interface JourneyProgressChartProps {
  history: StudentJourneyProgressHistory[];
  onTakeSnapshot?: () => void;
  isLoading?: boolean;
}

const categoryConfig = {
  be: { label: "Being", icon: Heart, color: "text-yellow-500", lineColor: "#EAB308" },
  know: { label: "Knowing", icon: Compass, color: "text-teal-500", lineColor: "#14B8A6" },
  do: { label: "Doing", icon: Target, color: "text-red-500", lineColor: "#EF4444" },
  overall: { label: "Overall", icon: TrendingUp, color: "text-primary", lineColor: "#6366F1" },
};

function TrendIndicator({ current, previous }: { current: number; previous: number }) {
  const diff = current - previous;
  if (diff > 0) {
    return (
      <span className="flex items-center text-emerald-500 text-xs">
        <TrendingUp className="w-3 h-3 mr-0.5" />
        +{diff}%
      </span>
    );
  } else if (diff < 0) {
    return (
      <span className="flex items-center text-red-500 text-xs">
        <TrendingDown className="w-3 h-3 mr-0.5" />
        {diff}%
      </span>
    );
  }
  return (
    <span className="flex items-center text-muted-foreground text-xs">
      <Minus className="w-3 h-3 mr-0.5" />
      No change
    </span>
  );
}

function SimpleLineChart({ history }: { history: StudentJourneyProgressHistory[] }) {
  const sortedHistory = useMemo(() => 
    [...history].sort((a, b) => new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime()),
    [history]
  );

  if (sortedHistory.length < 2) {
    return (
      <div className="h-64 flex items-center justify-center text-muted-foreground">
        <p className="text-sm text-center">
          Complete more assessments to see your progress over time.<br/>
          At least 2 data points are needed for the chart.
        </p>
      </div>
    );
  }

  const chartWidth = 600;
  const chartHeight = 200;
  const padding = { top: 20, right: 40, bottom: 40, left: 40 };
  const width = chartWidth - padding.left - padding.right;
  const height = chartHeight - padding.top - padding.bottom;

  const xScale = (index: number) => padding.left + (index / (sortedHistory.length - 1)) * width;
  const yScale = (value: number) => padding.top + height - (value / 100) * height;

  const createPath = (values: number[]) => {
    return values.map((value, index) => {
      const x = xScale(index);
      const y = yScale(value);
      return index === 0 ? `M ${x} ${y}` : `L ${x} ${y}`;
    }).join(" ");
  };

  const beScores = sortedHistory.map(h => h.beScore);
  const knowScores = sortedHistory.map(h => h.knowScore);
  const doScores = sortedHistory.map(h => h.doScore);
  const overallScores = sortedHistory.map(h => h.overallScore);

  return (
    <div className="w-full overflow-x-auto">
      <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full min-w-[400px]">
        {[0, 25, 50, 75, 100].map(tick => (
          <g key={tick}>
            <line
              x1={padding.left}
              y1={yScale(tick)}
              x2={chartWidth - padding.right}
              y2={yScale(tick)}
              stroke="currentColor"
              strokeOpacity={0.1}
              strokeDasharray="4 4"
            />
            <text
              x={padding.left - 8}
              y={yScale(tick) + 4}
              textAnchor="end"
              fontSize={10}
              fill="currentColor"
              opacity={0.5}
            >
              {tick}%
            </text>
          </g>
        ))}

        <path d={createPath(beScores)} fill="none" stroke={categoryConfig.be.lineColor} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
        <path d={createPath(knowScores)} fill="none" stroke={categoryConfig.know.lineColor} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
        <path d={createPath(doScores)} fill="none" stroke={categoryConfig.do.lineColor} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
        <path d={createPath(overallScores)} fill="none" stroke={categoryConfig.overall.lineColor} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" strokeDasharray="6 3" />

        {sortedHistory.map((_, index) => {
          const x = xScale(index);
          return (
            <g key={index}>
              <circle cx={x} cy={yScale(beScores[index])} r={4} fill={categoryConfig.be.lineColor} />
              <circle cx={x} cy={yScale(knowScores[index])} r={4} fill={categoryConfig.know.lineColor} />
              <circle cx={x} cy={yScale(doScores[index])} r={4} fill={categoryConfig.do.lineColor} />
              <circle cx={x} cy={yScale(overallScores[index])} r={5} fill={categoryConfig.overall.lineColor} />
            </g>
          );
        })}

        {sortedHistory.map((entry, index) => {
          if (index === 0 || index === sortedHistory.length - 1 || sortedHistory.length <= 6) {
            const x = xScale(index);
            const date = new Date(entry.createdAt || new Date());
            return (
              <text
                key={`label-${index}`}
                x={x}
                y={chartHeight - 10}
                textAnchor="middle"
                fontSize={9}
                fill="currentColor"
                opacity={0.6}
              >
                {date.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
              </text>
            );
          }
          return null;
        })}
      </svg>

      <div className="flex flex-wrap justify-center gap-4 mt-4">
        {Object.entries(categoryConfig).map(([key, config]) => (
          <div key={key} className="flex items-center gap-1.5">
            <div 
              className="w-3 h-3 rounded-full" 
              style={{ backgroundColor: config.lineColor }}
            />
            <span className="text-xs text-muted-foreground">{config.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function JourneyProgressChart({ history, onTakeSnapshot, isLoading }: JourneyProgressChartProps) {
  const sortedHistory = useMemo(() => 
    [...history].sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()),
    [history]
  );

  const latestSnapshot = sortedHistory[0];
  const previousSnapshot = sortedHistory[1];

  return (
    <Card data-testid="journey-progress-chart">
      <CardHeader>
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <CardTitle className="flex items-center gap-2 font-oswald">
              <TrendingUp className="w-5 h-5 text-primary" />
              Progress Over Time
            </CardTitle>
            <CardDescription className="font-roboto">
              Track how your Be-Know-Do scores have changed
            </CardDescription>
          </div>
          {onTakeSnapshot && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onTakeSnapshot}
              disabled={isLoading}
              data-testid="button-take-snapshot"
            >
              <Camera className="w-4 h-4 mr-2" />
              Save Snapshot
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {history.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center text-muted-foreground">
            <Calendar className="w-10 h-10 mb-3" />
            <p className="text-sm text-center">No progress history yet.</p>
            <p className="text-xs text-center mt-1">Complete assessments to start tracking your growth!</p>
          </div>
        ) : (
          <>
            <SimpleLineChart history={history} />

            {latestSnapshot && previousSnapshot && (
              <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                  <div className="flex items-center gap-2 mb-1">
                    <Heart className="w-4 h-4 text-yellow-500" />
                    <span className="text-sm font-medium">Being</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xl font-bold text-yellow-500">{latestSnapshot.beScore}%</span>
                    <TrendIndicator current={latestSnapshot.beScore} previous={previousSnapshot.beScore} />
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-teal-500/10 border border-teal-500/20">
                  <div className="flex items-center gap-2 mb-1">
                    <Compass className="w-4 h-4 text-teal-500" />
                    <span className="text-sm font-medium">Knowing</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xl font-bold text-teal-500">{latestSnapshot.knowScore}%</span>
                    <TrendIndicator current={latestSnapshot.knowScore} previous={previousSnapshot.knowScore} />
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                  <div className="flex items-center gap-2 mb-1">
                    <Target className="w-4 h-4 text-red-500" />
                    <span className="text-sm font-medium">Doing</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xl font-bold text-red-500">{latestSnapshot.doScore}%</span>
                    <TrendIndicator current={latestSnapshot.doScore} previous={previousSnapshot.doScore} />
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
                  <div className="flex items-center gap-2 mb-1">
                    <TrendingUp className="w-4 h-4 text-primary" />
                    <span className="text-sm font-medium">Overall</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xl font-bold text-primary">{latestSnapshot.overallScore}%</span>
                    <TrendIndicator current={latestSnapshot.overallScore} previous={previousSnapshot.overallScore} />
                  </div>
                </div>
              </div>
            )}

            {sortedHistory.length > 0 && (
              <div className="mt-6">
                <h4 className="text-sm font-medium mb-3">Recent Snapshots</h4>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {sortedHistory.slice(0, 5).map((snapshot) => (
                    <div 
                      key={snapshot.id} 
                      className="flex items-center justify-between p-2 rounded-md bg-muted/30 text-sm"
                      data-testid={`snapshot-${snapshot.id}`}
                    >
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        <span className="text-muted-foreground">
                          {snapshot.createdAt ? new Date(snapshot.createdAt).toLocaleDateString() : "Today"}
                        </span>
                        <Badge variant="outline" className="text-xs">
                          {snapshot.snapshotType}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3 text-xs">
                        <span className="text-yellow-500">BE: {snapshot.beScore}%</span>
                        <span className="text-teal-500">KNOW: {snapshot.knowScore}%</span>
                        <span className="text-red-500">DO: {snapshot.doScore}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

export default JourneyProgressChart;
