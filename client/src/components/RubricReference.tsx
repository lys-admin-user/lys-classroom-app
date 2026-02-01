import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { BookOpen, ChevronRight, Award, Target, Users, Lightbulb, ClipboardCheck, GraduationCap } from "lucide-react";
import { LESSON_RUBRIC, getRubricLevelLabel, type RubricLevel } from "@shared/lessonRubric";

const categoryIcons: Record<string, any> = {
  objectives: Target,
  essential_questions: Lightbulb,
  lys_methodology: Award,
  resources: BookOpen,
  instructional_input: Users,
  lesson_close: ClipboardCheck,
};

const levelColors: Record<RubricLevel, string> = {
  distinguished: "bg-muted text-foreground",
  accomplished: "bg-muted text-foreground",
  acceptable: "bg-muted text-foreground",
  needs_improvement: "bg-muted text-foreground",
};

export function RubricReference() {
  const [selectedLevel, setSelectedLevel] = useState<RubricLevel>("distinguished");

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2" data-testid="button-rubric-reference">
          <GraduationCap className="h-4 w-4" />
          Rubric Guide
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5" />
            LYS Lesson Plan Rubric
          </DialogTitle>
        </DialogHeader>
        <div className="flex gap-2 mb-4 flex-wrap">
          {(["distinguished", "accomplished", "acceptable", "needs_improvement"] as RubricLevel[]).map((level) => (
            <Button
              key={level}
              variant={selectedLevel === level ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedLevel(level)}
              className="capitalize"
              data-testid={`button-level-${level}`}
            >
              {getRubricLevelLabel(level)}
            </Button>
          ))}
        </div>
        <ScrollArea className="h-[60vh]">
          <Accordion type="multiple" className="w-full" defaultValue={LESSON_RUBRIC.categories.map(c => c.id)}>
            {LESSON_RUBRIC.categories.map((category) => {
              const Icon = categoryIcons[category.id] || BookOpen;
              return (
                <AccordionItem key={category.id} value={category.id}>
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4" />
                      <span className="font-semibold">{category.name}</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-4 pl-6">
                      {category.criteria.map((criterion) => (
                        <Card key={criterion.id}>
                          <CardHeader className="py-3">
                            <div className="flex items-center justify-between gap-2 flex-wrap">
                              <CardTitle className="text-sm font-medium">{criterion.name}</CardTitle>
                              <Badge variant="outline" className="text-xs">
                                Weight: {criterion.weight}%
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground">{criterion.description}</p>
                          </CardHeader>
                          <CardContent className="py-2">
                            <div className={`p-3 rounded-md ${levelColors[selectedLevel]}`}>
                              <div className="flex items-center gap-2 mb-1">
                                <Badge variant="secondary" className="text-xs capitalize">
                                  {getRubricLevelLabel(selectedLevel)}
                                </Badge>
                              </div>
                              <p className="text-sm">{criterion.levels[selectedLevel]}</p>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

export function RubricQuickTips() {
  return (
    <Card className="bg-muted/50">
      <CardHeader className="py-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Award className="h-4 w-4" />
          Quick Tips for Distinguished Lessons
        </CardTitle>
      </CardHeader>
      <CardContent className="py-2">
        <ul className="space-y-2 text-sm">
          <li className="flex items-start gap-2">
            <ChevronRight className="h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0" />
            <span><strong>Objectives:</strong> State clear, measurable goals that learners can self-assess</span>
          </li>
          <li className="flex items-start gap-2">
            <ChevronRight className="h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0" />
            <span><strong>Essential Questions:</strong> Create inquiry-based questions that require analysis and deeper thinking</span>
          </li>
          <li className="flex items-start gap-2">
            <ChevronRight className="h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0" />
            <span><strong>BE:</strong> Integrate character development and help students reflect on who they are becoming</span>
          </li>
          <li className="flex items-start gap-2">
            <ChevronRight className="h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0" />
            <span><strong>KNOW:</strong> Provide comprehensive resources with clear guidance on access and application</span>
          </li>
          <li className="flex items-start gap-2">
            <ChevronRight className="h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0" />
            <span><strong>DO:</strong> Create multiple opportunities for students to execute with excellence</span>
          </li>
          <li className="flex items-start gap-2">
            <ChevronRight className="h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0" />
            <span><strong>Lesson Close:</strong> Connect to all life dimensions - Educational, Social, Cultural, Financial, Health, Vocational, and Spiritual</span>
          </li>
        </ul>
      </CardContent>
    </Card>
  );
}
