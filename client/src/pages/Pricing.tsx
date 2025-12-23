import { Link } from "wouter";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, X, Sparkles, Building2, GraduationCap } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

const tiers = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    description: "Perfect for students exploring career paths and self-discovery",
    icon: GraduationCap,
    features: [
      { name: "Self-Discovery Assessments", included: true },
      { name: "Career Exploration", included: true },
      { name: "Action Plans (3 max)", included: true },
      { name: "Resource Library", included: true },
      { name: "AI Lesson Generator (5/month)", included: true },
      { name: "Scope & Sequence Builder", included: false },
      { name: "Standards Database Access", included: false },
      { name: "Analytics Dashboard", included: false },
      { name: "Educator Influence Program", included: false },
      { name: "Priority Support", included: false },
    ],
    cta: "Get Started Free",
    popular: false,
  },
  {
    name: "Pro",
    price: "$19",
    period: "/month",
    description: "For educators who want unlimited lesson planning and curriculum tools",
    icon: Sparkles,
    features: [
      { name: "Self-Discovery Assessments", included: true },
      { name: "Career Exploration", included: true },
      { name: "Unlimited Action Plans", included: true },
      { name: "Resource Library", included: true },
      { name: "Unlimited AI Lessons", included: true },
      { name: "Scope & Sequence Builder", included: true },
      { name: "Full Standards Database", included: true },
      { name: "Analytics Dashboard", included: true },
      { name: "Educator Influence Program", included: true },
      { name: "Priority Support", included: false },
    ],
    cta: "Start Pro Trial",
    popular: true,
  },
  {
    name: "Campus",
    price: "$99",
    period: "/month",
    description: "For schools and districts with multiple educators and admin tools",
    icon: Building2,
    features: [
      { name: "Everything in Pro", included: true },
      { name: "Unlimited Educators", included: true },
      { name: "Campus Admin Dashboard", included: true },
      { name: "Scope Change Approval Workflow", included: true },
      { name: "Team Analytics & Reports", included: true },
      { name: "Custom Standards Import", included: true },
      { name: "SSO Integration", included: true },
      { name: "Dedicated Account Manager", included: true },
      { name: "Priority Support", included: true },
      { name: "Custom Branding", included: true },
    ],
    cta: "Contact Sales",
    popular: false,
  },
];

export default function Pricing() {
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-marker text-foreground mb-4">
            Choose Your Path to Success
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Whether you're a student discovering your future or an educator shaping the next generation, 
            LYS has the tools you need to succeed.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mb-12">
          {tiers.map((tier) => (
            <Card 
              key={tier.name}
              className={`relative ${tier.popular ? "border-lys-red border-2" : ""}`}
              data-testid={`card-pricing-${tier.name.toLowerCase()}`}
            >
              {tier.popular && (
                <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-lys-red text-white">
                  Most Popular
                </Badge>
              )}
              <CardHeader className="text-center pb-2">
                <div className="mx-auto mb-4 p-3 rounded-full bg-muted w-fit">
                  <tier.icon className="h-6 w-6 text-foreground" />
                </div>
                <CardTitle className="font-oswald text-2xl">{tier.name}</CardTitle>
                <div className="mt-2">
                  <span className="text-4xl font-bold text-foreground">{tier.price}</span>
                  <span className="text-muted-foreground">{tier.period}</span>
                </div>
                <CardDescription className="mt-2">{tier.description}</CardDescription>
              </CardHeader>
              <CardContent className="pt-4">
                <ul className="space-y-3">
                  {tier.features.map((feature) => (
                    <li key={feature.name} className="flex items-start gap-3">
                      {feature.included ? (
                        <Check className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                      ) : (
                        <X className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                      )}
                      <span className={feature.included ? "text-foreground" : "text-muted-foreground"}>
                        {feature.name}
                      </span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                {isAuthenticated ? (
                  <Button 
                    className="w-full" 
                    variant={tier.popular ? "default" : "outline"}
                    data-testid={`button-select-${tier.name.toLowerCase()}`}
                  >
                    {tier.name === "Free" ? "Current Plan" : tier.cta}
                  </Button>
                ) : (
                  <Link href="/api/login" className="w-full">
                    <Button 
                      className="w-full" 
                      variant={tier.popular ? "default" : "outline"}
                      data-testid={`button-select-${tier.name.toLowerCase()}`}
                    >
                      {tier.cta}
                    </Button>
                  </Link>
                )}
              </CardFooter>
            </Card>
          ))}
        </div>

        <div className="text-center">
          <h2 className="text-2xl font-oswald text-foreground mb-4">
            Questions? We're here to help.
          </h2>
          <p className="text-muted-foreground mb-6">
            Contact our team for custom enterprise solutions or educational discounts.
          </p>
          <Button variant="outline" data-testid="button-contact-sales">
            Contact Sales
          </Button>
        </div>
      </div>
    </div>
  );
}
