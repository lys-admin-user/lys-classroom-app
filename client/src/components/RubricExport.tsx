import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Download, FileText, Printer, Copy, CheckCircle, Eye } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";

interface RubricCriteria {
  name: string;
  weight: number;
  levels: {
    level: string;
    score: number;
    description: string;
  }[];
}

interface RubricExportProps {
  assignmentTitle: string;
  assignmentType: string;
  totalPoints: number;
  criteria: RubricCriteria[];
  objectives?: string[];
  bkdFocus?: string;
}

export function RubricExport({
  assignmentTitle,
  assignmentType,
  totalPoints,
  criteria,
  objectives = [],
  bkdFocus,
}: RubricExportProps) {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  
  // Only system admins can export rubrics
  const canExport = user?.role === "system_admin" || user?.role === "site_admin";
  // Campus and district admins can view but not export
  const canView = canExport || user?.role === "campus_admin" || user?.role === "district_admin";

  const generatePrintableHTML = () => {
    return `
<!DOCTYPE html>
<html>
<head>
  <title>Rubric: ${assignmentTitle}</title>
  <style>
    body { font-family: Arial, sans-serif; padding: 20px; max-width: 900px; margin: 0 auto; }
    h1 { font-size: 24px; margin-bottom: 8px; }
    .meta { color: #666; margin-bottom: 20px; }
    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
    th, td { border: 1px solid #ddd; padding: 12px; text-align: left; vertical-align: top; }
    th { background: #f5f5f5; font-weight: bold; }
    .level-4 { background: #dcfce7; }
    .level-3 { background: #fef9c3; }
    .level-2 { background: #fed7aa; }
    .level-1 { background: #fee2e2; }
    .objectives { margin-top: 20px; padding: 15px; background: #f8fafc; border-radius: 8px; }
    .objectives h3 { margin: 0 0 10px 0; font-size: 16px; }
    .objectives ul { margin: 0; padding-left: 20px; }
    .total-points { font-size: 18px; font-weight: bold; margin-top: 20px; text-align: right; }
    @media print { body { padding: 0; } }
  </style>
</head>
<body>
  <h1>${assignmentTitle}</h1>
  <div class="meta">
    <strong>Type:</strong> ${assignmentType} | 
    <strong>Total Points:</strong> ${totalPoints}
    ${bkdFocus ? ` | <strong>Focus:</strong> ${bkdFocus.toUpperCase()}` : ''}
  </div>
  
  ${objectives.length > 0 ? `
  <div class="objectives">
    <h3>Learning Objectives</h3>
    <ul>
      ${objectives.map(obj => `<li>${obj}</li>`).join('')}
    </ul>
  </div>
  ` : ''}
  
  <table>
    <thead>
      <tr>
        <th style="width: 20%">Criteria</th>
        <th class="level-4">Distinguished (4)</th>
        <th class="level-3">Accomplished (3)</th>
        <th class="level-2">Acceptable (2)</th>
        <th class="level-1">Needs Improvement (1)</th>
      </tr>
    </thead>
    <tbody>
      ${criteria.map(c => `
      <tr>
        <td><strong>${c.name}</strong><br/><small>${c.weight} points</small></td>
        ${c.levels.map((l, i) => `
        <td class="level-${4-i}">${l.description}</td>
        `).join('')}
      </tr>
      `).join('')}
    </tbody>
  </table>
  
  <div class="total-points">Total Points: ${totalPoints}</div>
</body>
</html>`;
  };

  const handlePrint = () => {
    const html = generatePrintableHTML();
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(html);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const handleDownload = () => {
    const html = generatePrintableHTML();
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rubric-${assignmentTitle.toLowerCase().replace(/\s+/g, '-')}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Downloaded",
      description: "Rubric has been downloaded as HTML file",
    });
  };

  const handleCopy = async () => {
    const text = criteria.map(c => 
      `${c.name} (${c.weight} pts):\n${c.levels.map(l => `  ${l.level}: ${l.description}`).join('\n')}`
    ).join('\n\n');
    
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    
    toast({
      title: "Copied",
      description: "Rubric text copied to clipboard",
    });
  };

  // Don't render if user cannot view rubrics
  if (!canView) {
    return null;
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" data-testid="button-view-rubric">
          {canExport ? (
            <>
              <FileText className="h-4 w-4 mr-2" />
              Export Rubric
            </>
          ) : (
            <>
              <Eye className="h-4 w-4 mr-2" />
              View Rubric
            </>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-auto">
        <DialogHeader>
          <DialogTitle>{canExport ? "Export Scoring Rubric" : "View Scoring Rubric"}</DialogTitle>
          <DialogDescription>
            {canExport 
              ? `Download or print the scoring rubric for ${assignmentTitle}`
              : `Scoring rubric for ${assignmentTitle} (view only)`
            }
          </DialogDescription>
        </DialogHeader>
        
        {canExport && (
          <div className="flex items-center gap-2 mb-4">
            <Button onClick={handlePrint} variant="outline" size="sm" data-testid="button-print-rubric">
              <Printer className="h-4 w-4 mr-2" />
              Print
            </Button>
            <Button onClick={handleDownload} variant="outline" size="sm" data-testid="button-download-rubric">
              <Download className="h-4 w-4 mr-2" />
              Download HTML
            </Button>
            <Button onClick={handleCopy} variant="outline" size="sm" data-testid="button-copy-rubric">
              {copied ? <CheckCircle className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
              {copied ? "Copied!" : "Copy Text"}
            </Button>
          </div>
        )}
        
        <Tabs defaultValue="preview">
          <TabsList>
            <TabsTrigger value="preview" data-testid="tab-rubric-preview">Preview</TabsTrigger>
            <TabsTrigger value="criteria" data-testid="tab-rubric-criteria">Criteria Details</TabsTrigger>
          </TabsList>
          
          <TabsContent value="preview" className="space-y-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">{assignmentTitle}</CardTitle>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Badge variant="outline">{assignmentType}</Badge>
                  <span>Total: {totalPoints} points</span>
                  {bkdFocus && (
                    <Badge variant="secondary" className="uppercase">{bkdFocus}</Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2 font-medium">Criteria</th>
                        <th className="text-left p-2 font-medium bg-green-50 dark:bg-green-950">Distinguished</th>
                        <th className="text-left p-2 font-medium bg-yellow-50 dark:bg-yellow-950">Accomplished</th>
                        <th className="text-left p-2 font-medium bg-amber-50 dark:bg-amber-950">Acceptable</th>
                        <th className="text-left p-2 font-medium bg-red-50 dark:bg-red-950">Needs Improvement</th>
                      </tr>
                    </thead>
                    <tbody>
                      {criteria.map((c, idx) => (
                        <tr key={idx} className="border-b">
                          <td className="p-2 font-medium">
                            {c.name}
                            <br />
                            <span className="text-muted-foreground text-xs">{c.weight} pts</span>
                          </td>
                          {c.levels.map((l, i) => (
                            <td key={i} className={`p-2 text-xs ${
                              i === 0 ? 'bg-green-50 dark:bg-green-950' :
                              i === 1 ? 'bg-yellow-50 dark:bg-yellow-950' :
                              i === 2 ? 'bg-amber-50 dark:bg-amber-950' :
                              'bg-red-50 dark:bg-red-950'
                            }`}>
                              {l.description}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="criteria" className="space-y-4">
            {criteria.map((c, idx) => (
              <Card key={idx}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center justify-between">
                    {c.name}
                    <Badge variant="secondary">{c.weight} points</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {c.levels.map((l, i) => (
                    <div key={i} className={`p-2 rounded text-sm ${
                      i === 0 ? 'bg-green-50 dark:bg-green-950 border-l-4 border-green-500' :
                      i === 1 ? 'bg-yellow-50 dark:bg-yellow-950 border-l-4 border-yellow-500' :
                      i === 2 ? 'bg-amber-50 dark:bg-amber-950 border-l-4 border-amber-500' :
                      'bg-red-50 dark:bg-red-950 border-l-4 border-red-500'
                    }`}>
                      <div className="font-medium">{l.level} ({l.score} pts)</div>
                      <div className="text-muted-foreground">{l.description}</div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            ))}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

export function generateDefaultRubric(assignmentType: string, objectives: string[]): RubricCriteria[] {
  const baseCriteria: RubricCriteria[] = [
    {
      name: "Content Accuracy",
      weight: 25,
      levels: [
        { level: "Distinguished", score: 4, description: "All information is accurate with exceptional depth of understanding" },
        { level: "Accomplished", score: 3, description: "Information is accurate with good understanding demonstrated" },
        { level: "Acceptable", score: 2, description: "Most information is accurate with basic understanding" },
        { level: "Needs Improvement", score: 1, description: "Contains significant inaccuracies or misconceptions" },
      ],
    },
    {
      name: "Critical Thinking",
      weight: 25,
      levels: [
        { level: "Distinguished", score: 4, description: "Exceptional analysis with original insights and connections" },
        { level: "Accomplished", score: 3, description: "Good analysis with clear reasoning and some connections" },
        { level: "Acceptable", score: 2, description: "Basic analysis with limited depth" },
        { level: "Needs Improvement", score: 1, description: "Little to no analysis or reasoning demonstrated" },
      ],
    },
    {
      name: "Application to Life",
      weight: 25,
      levels: [
        { level: "Distinguished", score: 4, description: "Meaningful connections to personal growth and real-world application" },
        { level: "Accomplished", score: 3, description: "Clear connections to personal relevance" },
        { level: "Acceptable", score: 2, description: "Some attempt to connect to personal context" },
        { level: "Needs Improvement", score: 1, description: "No personal connection or application demonstrated" },
      ],
    },
    {
      name: "Communication",
      weight: 25,
      levels: [
        { level: "Distinguished", score: 4, description: "Ideas expressed with exceptional clarity and organization" },
        { level: "Accomplished", score: 3, description: "Ideas are clear and well-organized" },
        { level: "Acceptable", score: 2, description: "Ideas are understandable but could be clearer" },
        { level: "Needs Improvement", score: 1, description: "Ideas are unclear or disorganized" },
      ],
    },
  ];

  if (assignmentType === "project") {
    baseCriteria.push({
      name: "Creativity & Innovation",
      weight: 20,
      levels: [
        { level: "Distinguished", score: 4, description: "Highly creative approach with innovative solutions" },
        { level: "Accomplished", score: 3, description: "Shows creativity with some original elements" },
        { level: "Acceptable", score: 2, description: "Follows basic requirements with minimal creativity" },
        { level: "Needs Improvement", score: 1, description: "No creativity or innovation demonstrated" },
      ],
    });
  }

  return baseCriteria;
}
