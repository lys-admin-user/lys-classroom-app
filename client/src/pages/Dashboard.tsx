import { BKDCard } from "@/components/BKDCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Sparkles, 
  Heart, 
  Compass, 
  Target,
  BookOpen,
  Users,
  TrendingUp,
  ArrowRight,
  Clock,
  Star
} from "lucide-react";
import { Link } from "wouter";

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-background">
      <section className="relative overflow-hidden bg-gradient-to-br from-lys-yellow/20 via-background to-lys-teal/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 lg:py-20">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            <div>
              <Badge className="bg-lys-red/10 text-lys-red border-lys-red/20 mb-4 font-roboto">
                For Educators Who Inspire
              </Badge>
              <h1 className="font-marker text-4xl sm:text-5xl lg:text-6xl text-foreground mb-4 leading-tight">
                Your Students' Success Starts Here
              </h1>
              <p className="font-oswald text-lg sm:text-xl text-muted-foreground mb-6">
                AI-powered tools that handle the busywork so you can focus on what matters: inspiring young minds.
              </p>
              <div className="flex flex-wrap items-center gap-4 mb-8">
                <Link href="/lesson-generator">
                  <Button 
                    size="lg" 
                    className="bg-lys-red hover:bg-lys-red/90 text-white font-oswald gap-2"
                    data-testid="button-try-ai-lesson"
                  >
                    <Sparkles className="h-5 w-5" />
                    Try AI Lesson Planner
                  </Button>
                </Link>
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="font-oswald gap-2 border-lys-yellow text-lys-yellow hover:bg-lys-yellow/10"
                  data-testid="button-watch-demo"
                >
                  Watch 2min Demo
                </Button>
              </div>
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <div className="flex -space-x-2">
                  {[1, 2, 3, 4].map((i) => (
                    <div 
                      key={i} 
                      className="w-8 h-8 rounded-full bg-gradient-to-br from-lys-yellow to-lys-red flex items-center justify-center text-white text-xs font-bold border-2 border-background"
                    >
                      {String.fromCharCode(64 + i)}
                    </div>
                  ))}
                </div>
                <span className="font-roboto">Join <strong>10,000+</strong> educators transforming student futures</span>
              </div>
            </div>
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-lys-yellow/30 to-lys-teal/30 rounded-2xl blur-3xl"></div>
              <div className="relative bg-card rounded-2xl border shadow-lg p-6 space-y-4">
                <div className="flex items-center gap-3 pb-4 border-b">
                  <div className="w-10 h-10 rounded-full bg-lys-red/10 flex items-center justify-center">
                    <Sparkles className="h-5 w-5 text-lys-red" />
                  </div>
                  <div>
                    <p className="font-oswald font-semibold">AI Lesson Generated</p>
                    <p className="text-xs text-muted-foreground font-roboto">Just now</p>
                  </div>
                  <Badge className="ml-auto bg-green-500/10 text-green-600 border-green-500/20">
                    <Star className="h-3 w-3 mr-1" />
                    Saved 45 min
                  </Badge>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground font-roboto">Growth Mindset for 9th Grade</span>
                    <Badge variant="secondary" className="text-xs">BE Focus</Badge>
                  </div>
                  <Progress value={100} className="h-2" />
                  <p className="text-xs text-muted-foreground font-roboto italic">
                    "Great job! This lesson aligns with SEL standards and your BE-KNOW-DO framework."
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-12 lg:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-10">
            <h2 className="font-marker text-3xl sm:text-4xl text-foreground mb-2">
              The Be-Know-Do Method
            </h2>
            <p className="font-roboto text-muted-foreground max-w-2xl mx-auto">
              Our proven framework helps students discover their purpose, build essential knowledge, and take meaningful action.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            <BKDCard
              type="be"
              title="Identity Assessments"
              description="Help students discover their unique strengths, values, and personality traits to build unshakeable confidence."
              icon={<Heart className="h-6 w-6" />}
              href="/assessments"
              stats={{ label: "Students Assessed", value: "2,847" }}
            />
            <BKDCard
              type="know"
              title="Career Pathways"
              description="Explore 500+ careers with salary data, education requirements, and clear pathways to success."
              icon={<Compass className="h-6 w-6" />}
              href="/careers"
              stats={{ label: "Careers Explored", value: "12,394" }}
            />
            <BKDCard
              type="do"
              title="Action Planning"
              description="Transform goals into achievements with milestone tracking and progress visualization."
              icon={<Target className="h-6 w-6" />}
              href="/action-plans"
              stats={{ label: "Goals Completed", value: "8,521" }}
            />
          </div>
        </div>
      </section>

      <section className="py-12 lg:py-16 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
            <div>
              <h2 className="font-marker text-2xl sm:text-3xl text-foreground mb-1">
                Quick Actions
              </h2>
              <p className="font-roboto text-muted-foreground text-sm">
                Your most-used tools, one click away
              </p>
            </div>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link href="/lesson-generator">
              <Card className="hover-elevate cursor-pointer group">
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-md bg-lys-red/10 flex items-center justify-center text-lys-red group-hover:scale-105 transition-transform">
                    <Sparkles className="h-6 w-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-oswald font-semibold truncate">New AI Lesson</p>
                    <p className="text-xs text-muted-foreground font-roboto">Generate in seconds</p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                </CardContent>
              </Card>
            </Link>
            <Link href="/assessments">
              <Card className="hover-elevate cursor-pointer group">
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-md bg-lys-yellow/10 flex items-center justify-center text-lys-yellow group-hover:scale-105 transition-transform">
                    <Heart className="h-6 w-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-oswald font-semibold truncate">Start Assessment</p>
                    <p className="text-xs text-muted-foreground font-roboto">Discover strengths</p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                </CardContent>
              </Card>
            </Link>
            <Link href="/careers">
              <Card className="hover-elevate cursor-pointer group">
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-md bg-lys-teal/10 flex items-center justify-center text-lys-teal group-hover:scale-105 transition-transform">
                    <Compass className="h-6 w-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-oswald font-semibold truncate">Explore Careers</p>
                    <p className="text-xs text-muted-foreground font-roboto">500+ pathways</p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                </CardContent>
              </Card>
            </Link>
            <Link href="/resources">
              <Card className="hover-elevate cursor-pointer group">
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-md bg-primary/10 flex items-center justify-center text-primary group-hover:scale-105 transition-transform">
                    <BookOpen className="h-6 w-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-oswald font-semibold truncate">Resources</p>
                    <p className="text-xs text-muted-foreground font-roboto">Scholarships & more</p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                </CardContent>
              </Card>
            </Link>
          </div>
        </div>
      </section>

      <section className="py-12 lg:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2">
              <CardHeader className="flex flex-row items-center justify-between gap-4 flex-wrap">
                <div>
                  <CardTitle className="font-oswald">Recent Activity</CardTitle>
                  <p className="text-sm text-muted-foreground font-roboto">Your latest lessons and assessments</p>
                </div>
                <Button variant="ghost" size="sm" className="font-roboto gap-1">
                  View All <ArrowRight className="h-4 w-4" />
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { title: "Growth Mindset Workshop", type: "Lesson", time: "2 hours ago", badge: "BE" },
                    { title: "Career Planning 101", type: "Lesson", time: "Yesterday", badge: "KNOW" },
                    { title: "Goal Setting Activity", type: "Assessment", time: "2 days ago", badge: "DO" },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-4 p-3 rounded-md bg-muted/30 hover-elevate">
                      <div className="w-10 h-10 rounded-md bg-primary/10 flex items-center justify-center">
                        {item.type === "Lesson" ? (
                          <BookOpen className="h-5 w-5 text-primary" />
                        ) : (
                          <Users className="h-5 w-5 text-primary" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-oswald font-medium truncate">{item.title}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground font-roboto">
                          <Clock className="h-3 w-3" />
                          <span>{item.time}</span>
                        </div>
                      </div>
                      <Badge 
                        variant="secondary" 
                        className={`text-xs ${
                          item.badge === "BE" ? "bg-lys-yellow/20 text-lys-yellow" :
                          item.badge === "KNOW" ? "bg-lys-red/20 text-lys-red" :
                          "bg-lys-teal/20 text-lys-teal"
                        }`}
                      >
                        {item.badge}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="font-oswald flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-lys-red" />
                  Your Impact
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center py-4">
                  <p className="font-marker text-4xl text-lys-red mb-1">147</p>
                  <p className="text-sm text-muted-foreground font-roboto">Students Reached</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-lys-yellow/10 rounded-md">
                    <p className="font-oswald text-xl font-semibold text-lys-yellow">23</p>
                    <p className="text-xs text-muted-foreground font-roboto">Lessons Created</p>
                  </div>
                  <div className="text-center p-3 bg-lys-teal/10 rounded-md">
                    <p className="font-oswald text-xl font-semibold text-lys-teal">89</p>
                    <p className="text-xs text-muted-foreground font-roboto">Goals Set</p>
                  </div>
                </div>
                <div className="pt-4 border-t">
                  <p className="text-xs text-muted-foreground font-roboto text-center italic">
                    "Every student you guide is a future transformed."
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
}
