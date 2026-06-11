import { useRef } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
  CartesianGrid,
} from "recharts";
import {
  ShieldCheck,
  Building,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Sparkles,
  Users,
  Clock,
  TrendingUp,
  BookOpen,
  Lock,
  LayoutDashboard,
  Settings2,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { demoRequestSchema, type DemoRequestInput } from "@shared/schema";

const USAGE_DATA = [
  { month: "Aug", lessons: 220 },
  { month: "Sep", lessons: 1180 },
  { month: "Oct", lessons: 1640 },
  { month: "Nov", lessons: 1910 },
  { month: "Dec", lessons: 1520 },
  { month: "Jan", lessons: 2380 },
];

const ADOPTION_DATA = [
  { school: "Lincoln HS", teachers: 92 },
  { school: "Roosevelt MS", teachers: 78 },
  { school: "Jefferson EL", teachers: 64 },
  { school: "Madison HS", teachers: 51 },
];

const KPIS = [
  { label: "Active teachers", value: "284", icon: Users, accent: "text-lys-teal" },
  { label: "Lessons this month", value: "2,380", icon: BookOpen, accent: "text-lys-red" },
  { label: "Hours saved", value: "5,940", icon: Clock, accent: "text-lys-teal" },
  { label: "Adoption rate", value: "87%", icon: TrendingUp, accent: "text-lys-red" },
];

const ROLE_OPTIONS = [
  "Principal",
  "Assistant Principal",
  "District Administrator",
  "Curriculum Director",
  "Technology Director",
  "Other",
];

const TEACHER_COUNT_OPTIONS = [
  "1–10 teachers",
  "11–50 teachers",
  "51–200 teachers",
  "200+ teachers",
];

const FEATURES = [
  {
    icon: Lock,
    title: "FERPA-safe by default",
    body: "Student data is stripped of personal details before it ever reaches the AI. Privacy controls are on for every teacher, every time — no setup required.",
  },
  {
    icon: LayoutDashboard,
    title: "Usage analytics & oversight",
    body: "See adoption by school, hours saved, and what's being taught — all in one dashboard. Spot your power users and the staff who need a nudge.",
  },
  {
    icon: Settings2,
    title: "Centralized rollout & management",
    body: "Invite staff in bulk, set district-wide standards and guardrails, and manage everyone's access from a single place. Onboard a whole building in a day.",
  },
];

export default function ForSchools() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const formRef = useRef<HTMLDivElement>(null);

  const form = useForm<DemoRequestInput>({
    resolver: zodResolver(demoRequestSchema),
    defaultValues: {
      name: "",
      email: "",
      organization: "",
      role: "",
      teacherCount: "",
      message: "",
    },
  });

  const submitDemo = useMutation({
    mutationFn: async (data: DemoRequestInput) => {
      const res = await apiRequest("POST", "/api/demo-requests", data);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Request received!",
        description: "Our team will reach out within one business day to set up your walkthrough.",
      });
      form.reset();
    },
    onError: () => {
      toast({
        title: "Something went wrong",
        description: "We couldn't submit your request. Please try again.",
        variant: "destructive",
      });
    },
  });

  const scrollToForm = () => {
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="min-h-screen bg-slate-50 font-roboto" data-testid="page-for-schools">
      {/* Header */}
      <header className="flex items-center justify-between px-6 md:px-8 py-5 max-w-7xl mx-auto w-full">
        <button
          onClick={() => setLocation("/")}
          className="flex items-center gap-2 group"
          data-testid="link-home"
        >
          <div className="h-10 w-10 bg-lys-red rounded-lg flex items-center justify-center transform -rotate-6 shadow-md shadow-lys-red/20">
            <span className="text-white font-marker text-xl">L</span>
          </div>
          <span className="font-marker text-2xl text-slate-800">LYS</span>
        </button>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setLocation("/")}
            className="hidden sm:inline-flex items-center gap-1 text-sm font-medium text-slate-600 hover:text-lys-teal transition-colors"
            data-testid="link-back"
          >
            <ArrowLeft className="w-4 h-4" /> All roles
          </button>
          <a
            href="/api/login"
            className="text-sm font-medium text-slate-600 hover:text-lys-teal transition-colors"
            data-testid="link-signin"
          >
            Sign in
          </a>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-5xl mx-auto px-6 pt-10 pb-16 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-lys-yellow/20 text-lys-red font-medium text-sm border border-lys-yellow/30 mb-6">
          <Sparkles className="w-4 h-4" />
          <span>Trusted by districts across all 50 states</span>
        </div>
        <h1 className="font-oswald text-4xl md:text-6xl font-bold text-slate-900 tracking-tight leading-tight mb-5">
          Give every teacher their time back.
        </h1>
        <p className="text-lg md:text-xl text-slate-600 max-w-2xl mx-auto mb-8">
          Roll out AI lesson planning your staff will actually use — FERPA-safe, with
          the visibility and controls your district needs.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Button
            onClick={scrollToForm}
            className="bg-lys-red hover:bg-lys-red/90 text-white text-lg h-14 px-8 rounded-full shadow-lg shadow-lys-red/20 hover:shadow-xl hover:-translate-y-0.5 transition-all group w-full sm:w-auto"
            data-testid="button-request-demo-hero"
          >
            Request a demo
            <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Button>
          <Button
            variant="outline"
            onClick={() => setLocation("/pricing")}
            className="text-lg h-14 px-8 rounded-full border-2 w-full sm:w-auto"
            data-testid="button-view-pricing"
          >
            View pricing
          </Button>
        </div>
        <p className="text-sm text-slate-500 mt-4">Personalized walkthrough — no commitment.</p>
      </section>

      {/* Admin dashboard preview */}
      <section className="max-w-6xl mx-auto px-6 pb-20">
        <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/60">
            <div className="flex items-center gap-2">
              <Building className="w-5 h-5 text-lys-teal" />
              <span className="font-oswald font-semibold text-slate-800">
                District Admin Dashboard
              </span>
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wide text-slate-400 bg-slate-100 px-2 py-1 rounded-full">
              Sample preview
            </span>
          </div>

          <div className="p-6 space-y-6">
            {/* KPI cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {KPIS.map((kpi) => (
                <div
                  key={kpi.label}
                  className="rounded-2xl border border-slate-100 bg-slate-50/50 p-5"
                  data-testid={`kpi-${kpi.label.replace(/\s+/g, "-").toLowerCase()}`}
                >
                  <kpi.icon className={`w-6 h-6 mb-3 ${kpi.accent}`} />
                  <div className="font-oswald text-3xl font-bold text-slate-900">
                    {kpi.value}
                  </div>
                  <div className="text-sm text-slate-500 mt-1">{kpi.label}</div>
                </div>
              ))}
            </div>

            {/* Charts */}
            <div className="grid lg:grid-cols-5 gap-4">
              <div className="lg:col-span-3 rounded-2xl border border-slate-100 p-5">
                <h3 className="font-oswald font-semibold text-slate-800 mb-1">
                  Lessons generated
                </h3>
                <p className="text-sm text-slate-500 mb-4">Last 6 months</p>
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={USAGE_DATA} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                      <defs>
                        <linearGradient id="lessonsFill" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--lys-teal))" stopOpacity={0.35} />
                          <stop offset="95%" stopColor="hsl(var(--lys-teal))" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="month" tickLine={false} axisLine={false} fontSize={12} stroke="#94a3b8" />
                      <YAxis tickLine={false} axisLine={false} fontSize={12} stroke="#94a3b8" width={40} />
                      <Tooltip
                        contentStyle={{
                          borderRadius: "0.75rem",
                          border: "1px solid #e2e8f0",
                          fontSize: "0.8rem",
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="lessons"
                        stroke="hsl(var(--lys-teal))"
                        strokeWidth={2.5}
                        fill="url(#lessonsFill)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="lg:col-span-2 rounded-2xl border border-slate-100 p-5">
                <h3 className="font-oswald font-semibold text-slate-800 mb-1">
                  Adoption by school
                </h3>
                <p className="text-sm text-slate-500 mb-4">% of staff active</p>
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={ADOPTION_DATA}
                      layout="vertical"
                      margin={{ top: 5, right: 10, left: 10, bottom: 0 }}
                    >
                      <XAxis type="number" hide domain={[0, 100]} />
                      <YAxis
                        type="category"
                        dataKey="school"
                        tickLine={false}
                        axisLine={false}
                        fontSize={11}
                        width={80}
                        stroke="#64748b"
                      />
                      <Tooltip
                        cursor={{ fill: "#f8fafc" }}
                        contentStyle={{
                          borderRadius: "0.75rem",
                          border: "1px solid #e2e8f0",
                          fontSize: "0.8rem",
                        }}
                      />
                      <Bar dataKey="teachers" fill="hsl(var(--lys-red))" radius={[0, 6, 6, 0]} barSize={18} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-6 pb-20">
        <div className="text-center mb-12">
          <h2 className="font-oswald text-3xl md:text-4xl font-bold text-slate-900 mb-3">
            Everything your district needs to roll out AI — safely
          </h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Built for the people responsible for privacy, budgets, and outcomes.
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="bg-white rounded-2xl p-7 border border-slate-100 shadow-sm hover:shadow-md transition-shadow"
              data-testid={`feature-${f.title.replace(/\s+/g, "-").toLowerCase()}`}
            >
              <div className="w-12 h-12 rounded-xl bg-lys-teal/10 flex items-center justify-center mb-5">
                <f.icon className="w-6 h-6 text-lys-teal" />
              </div>
              <h3 className="font-oswald text-xl font-semibold text-slate-900 mb-2">
                {f.title}
              </h3>
              <p className="text-slate-600 leading-relaxed">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Proof band */}
      <section className="max-w-5xl mx-auto px-6 pb-20">
        <div className="bg-slate-900 rounded-3xl px-8 py-12 text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-1/3 h-full bg-lys-yellow/10 -skew-x-12" />
          <div className="relative z-10">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 mb-10">
              <div>
                <div className="font-oswald text-4xl font-bold text-lys-yellow">6 hrs</div>
                <div className="text-slate-300 mt-1 text-sm">saved per teacher each week</div>
              </div>
              <div>
                <div className="font-oswald text-4xl font-bold text-lys-yellow">50,000+</div>
                <div className="text-slate-300 mt-1 text-sm">educators already on LYS</div>
              </div>
              <div>
                <div className="font-oswald text-4xl font-bold text-lys-yellow">87%</div>
                <div className="text-slate-300 mt-1 text-sm">average staff adoption</div>
              </div>
            </div>
            <p className="text-xl text-white font-roboto max-w-2xl mx-auto leading-relaxed">
              "LYS gave our teachers hours back every week — and gave me the visibility
              to prove it to the board."
            </p>
            <p className="text-slate-400 mt-4 text-sm">
              — Assistant Superintendent, K-12 District
            </p>
          </div>
        </div>
      </section>

      {/* Request a demo form */}
      <section ref={formRef} className="max-w-3xl mx-auto px-6 pb-24 scroll-mt-8">
        <div className="bg-white rounded-3xl shadow-xl border border-slate-100 p-8 md:p-10">
          <div className="text-center mb-8">
            <h2 className="font-oswald text-3xl font-bold text-slate-900 mb-2">
              See it for your school
            </h2>
            <p className="text-slate-600">
              Tell us a bit about your school or district and we'll set up a
              personalized walkthrough.
            </p>
          </div>

          <Form {...form}>
            <form
              onSubmit={form.handleSubmit((data) => submitDemo.mutate(data))}
              className="space-y-5"
            >
              <div className="grid sm:grid-cols-2 gap-5">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full name</FormLabel>
                      <FormControl>
                        <Input placeholder="Jane Smith" {...field} data-testid="input-name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Work email</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="jane@district.org"
                          {...field}
                          data-testid="input-email"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="organization"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>School or district</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Lincoln Unified School District"
                        {...field}
                        data-testid="input-organization"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid sm:grid-cols-2 gap-5">
                <FormField
                  control={form.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Your role</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-role">
                            <SelectValue placeholder="Select your role" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {ROLE_OPTIONS.map((r) => (
                            <SelectItem key={r} value={r}>
                              {r}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="teacherCount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Number of teachers</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-teacher-count">
                            <SelectValue placeholder="Select a range" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {TEACHER_COUNT_OPTIONS.map((c) => (
                            <SelectItem key={c} value={c}>
                              {c}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="message"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Anything we should know? (optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Goals, timeline, current tools…"
                        className="resize-none"
                        rows={3}
                        {...field}
                        data-testid="input-message"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                disabled={submitDemo.isPending}
                className="w-full bg-lys-red hover:bg-lys-red/90 text-white text-lg h-14 rounded-full shadow-lg shadow-lys-red/20 transition-all"
                data-testid="button-submit-demo"
              >
                {submitDemo.isPending ? (
                  <>
                    <Loader2 className="mr-2 w-5 h-5 animate-spin" /> Sending…
                  </>
                ) : (
                  <>Request my demo</>
                )}
              </Button>

              <div className="flex items-center justify-center gap-2 text-sm text-slate-500 pt-1">
                <ShieldCheck className="w-4 h-4 text-lys-teal" />
                <span>We'll only use this to set up your walkthrough.</span>
              </div>
            </form>
          </Form>
        </div>

        <ul className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 mt-8 text-sm text-slate-500">
          <li className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-lys-teal" /> No commitment
          </li>
          <li className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-lys-teal" /> FERPA-safe
          </li>
          <li className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-lys-teal" /> Set up in days, not months
          </li>
        </ul>
      </section>
    </div>
  );
}
