import { useState, useMemo } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Search,
  AlertTriangle,
  Shield,
  Key,
  BookOpen,
  Users,
  Sparkles,
  Settings,
  HelpCircle,
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  XCircle,
  Info,
  Loader2,
  ExternalLink,
  ArrowLeft,
  GraduationCap,
  Lock,
  FileText,
  Globe,
  Wifi,
  Clock,
  RefreshCw,
} from "lucide-react";

interface HelpArticle {
  id: string;
  title: string;
  category: string;
  tags: string[];
  severity: "info" | "warning" | "error";
  symptom: string;
  explanation: string;
  steps: string[];
  relatedArticles?: string[];
}

const helpArticles: HelpArticle[] = [
  {
    id: "auth-login-fail",
    title: "Unable to Log In",
    category: "authentication",
    tags: ["login", "sign in", "access", "account", "password"],
    severity: "error",
    symptom: "You see an \"Unauthorized\" message or get redirected to the login page repeatedly.",
    explanation: "This usually happens when your session has expired, or there's a temporary connection issue with the authentication service. Your data is safe and this is typically easy to resolve.",
    steps: [
      "Refresh the page using the browser refresh button",
      "Clear your browser cookies for this site",
      "Try logging in with a different browser or incognito/private window",
      "If the issue persists, wait a few minutes and try again",
      "Contact your campus administrator if you still cannot access your account",
    ],
  },
  {
    id: "auth-session-expired",
    title: "Session Expired",
    category: "authentication",
    tags: ["session", "timeout", "logged out", "expired", "kicked out"],
    severity: "warning",
    symptom: "You're suddenly logged out while using the platform, or see a \"Session Expired\" message.",
    explanation: "For security, your session automatically expires after a period of inactivity. This protects your account from unauthorized access, especially on shared computers.",
    steps: [
      "Log in again using your regular credentials",
      "If you were working on something, don't worry \u2014 your saved work should still be there",
      "Check if you have the platform open in multiple tabs, as this can sometimes cause session conflicts",
    ],
  },
  {
    id: "auth-role-denied",
    title: "Access Denied \u2014 Insufficient Permissions",
    category: "authentication",
    tags: ["forbidden", "403", "permission", "role", "access denied", "not authorized"],
    severity: "error",
    symptom: "You see a \"403 Forbidden\" or \"Access Denied\" message when trying to use a feature.",
    explanation: "Different features are available to different user roles (student, educator, campus admin, etc.). This message means your current role doesn't have access to the feature you're trying to use.",
    steps: [
      "Check your current role in the Settings page",
      "If you believe you should have access, contact your campus or district administrator",
      "Administrators can upgrade your role through the People management section",
      "Some features are only available with certain subscription plans",
    ],
  },
  {
    id: "ai-lesson-fail",
    title: "AI Lesson Generation Failed",
    category: "ai-features",
    tags: ["lesson", "AI", "generate", "error", "openai", "timeout", "lesson plan"],
    severity: "error",
    symptom: "The AI lesson generator shows an error message or the loading spinner never stops.",
    explanation: "The AI lesson generator relies on an external AI service. Failures can happen due to high demand, network issues, or if the input is too complex. Your previous lessons are not affected.",
    steps: [
      "Try generating the lesson again \u2014 temporary issues often resolve on their own",
      "Simplify your prompt or reduce the number of standards/objectives selected",
      "Check if other AI features are working \u2014 if not, the AI service may be temporarily down",
      "If the issue continues, try again in 15\u201330 minutes",
      "Contact your administrator if the problem persists across multiple attempts",
    ],
  },
  {
    id: "ai-content-blocked",
    title: "Content Blocked by Safety Filter",
    category: "ai-features",
    tags: ["blocked", "filter", "content", "moderation", "flagged", "keyword", "safety"],
    severity: "warning",
    symptom: "Your message or content was blocked with a message about safety or content filtering.",
    explanation: "LYS has built-in content safety filters that protect all users, especially students. These filters check for inappropriate language, personal information, and other safety concerns. This is part of our commitment to keeping the platform safe for everyone.",
    steps: [
      "Review your content for any language that might trigger safety filters",
      "Remove any personal information (phone numbers, addresses, SSN) from your input",
      "Rephrase your content using educational, age-appropriate language",
      "If you believe your content was blocked incorrectly, contact your administrator to review",
    ],
  },
  {
    id: "ai-pii-stripped",
    title: "Personal Information Removed from AI Request",
    category: "ai-features",
    tags: ["PII", "personal", "information", "privacy", "data", "stripped", "removed"],
    severity: "info",
    symptom: "You see a notice that personal information was removed before sending to the AI service.",
    explanation: "To protect your privacy, LYS automatically detects and removes personal information (like names, emails, phone numbers) before sending content to external AI services. This is a safety feature, not an error. The AI will still generate useful content without the personal details.",
    steps: [
      "This is expected behavior \u2014 no action needed",
      "Your personal information is kept safe and never sent to external services",
      "The AI-generated content will use placeholder names instead",
      "You can add specific names back into the generated content afterward",
    ],
  },
  {
    id: "coppa-consent-required",
    title: "Parental Consent Required",
    category: "safety",
    tags: ["COPPA", "parental", "consent", "under 13", "child", "minor", "parent"],
    severity: "warning",
    symptom: "You see a message asking for parental consent, or certain features are restricted.",
    explanation: "LYS complies with COPPA (Children's Online Privacy Protection Act) which requires parental consent for users under 13. Until consent is provided, some features may be limited to ensure your safety.",
    steps: [
      "Ask your parent or guardian to provide consent through the platform",
      "Go to Settings and look for the \"Parental Consent\" section",
      "Enter your parent/guardian's email address to send them a consent request",
      "Once they approve, you'll have full access to age-appropriate features",
      "Your campus administrator can also help with the consent process",
    ],
  },
  {
    id: "coppa-features-limited",
    title: "Some Features Are Limited (Under-13 User)",
    category: "safety",
    tags: ["restricted", "limited", "features", "young", "student", "under 13", "K-7"],
    severity: "info",
    symptom: "Certain features appear grayed out or unavailable on your account.",
    explanation: "For users under 13, some features are intentionally limited to comply with child safety laws. This includes restrictions on messaging, certain AI features, and data sharing. These restrictions exist to keep younger users safe.",
    steps: [
      "This is normal for accounts identified as under-13 users",
      "Ask your teacher or parent if you need help with a restricted feature",
      "Once parental consent is obtained, additional features may become available",
      "Ad-free experience is provided for K-7 students automatically",
    ],
  },
  {
    id: "scope-sequence-save",
    title: "Scope & Sequence Changes Not Saving",
    category: "lesson-planning",
    tags: ["scope", "sequence", "save", "lost", "changes", "pacing"],
    severity: "error",
    symptom: "Changes to your scope and sequence don't appear to save, or you see an error when trying to save.",
    explanation: "This can happen if you've been editing for a long time and your session expired, or if there's a network interruption. Your most recent auto-saved version should still be available.",
    steps: [
      "Check your internet connection",
      "Try refreshing the page \u2014 your last auto-saved version should load",
      "If you're editing a shared scope, another user may be editing at the same time",
      "Try saving smaller sections at a time instead of making many changes at once",
      "Export your current work as a backup before making large changes",
    ],
  },
  {
    id: "rubric-low-score",
    title: "Understanding Low Lesson Plan Quality Scores",
    category: "lesson-planning",
    tags: ["rubric", "score", "quality", "low", "lesson", "rating", "improve"],
    severity: "info",
    symptom: "Your lesson plan received a lower quality score than expected.",
    explanation: "Lesson plan quality is measured across 6 categories: objectives alignment, student engagement, differentiation, assessment integration, BKD methodology, and real-world connections. A lower score in any category suggests room for improvement in that area.",
    steps: [
      "Review the detailed score breakdown to see which categories need improvement",
      "Focus on the lowest-scoring category first for the biggest improvement",
      "Add clear, measurable learning objectives aligned to standards",
      "Include differentiation strategies for diverse learners",
      "Connect lesson content to Be-Know-Do methodology",
      "Add real-world examples and career connections to boost relevance",
    ],
  },
  {
    id: "org-membership-issue",
    title: "Not Seeing My Organization or Campus",
    category: "organization",
    tags: ["organization", "campus", "school", "missing", "not showing", "join", "enrollment"],
    severity: "warning",
    symptom: "Your school or campus doesn't appear in your account, or you can't access campus-specific resources.",
    explanation: "You need to be added to an organization by an administrator to see its content and resources. If you recently joined, it may take a moment for your membership to be processed.",
    steps: [
      "Check with your campus administrator to confirm you've been added",
      "Ask your admin to send you an organization invitation",
      "If you received an invitation, check your email and accept it",
      "Try logging out and logging back in to refresh your memberships",
      "If you're a new user, complete the onboarding process first",
    ],
  },
  {
    id: "transfer-pending",
    title: "Student Transfer Not Processing",
    category: "organization",
    tags: ["transfer", "student", "pending", "approval", "move", "campus"],
    severity: "warning",
    symptom: "A student transfer request appears to be stuck in pending status.",
    explanation: "Student transfers require a triple confirmation: the sending campus admin, the receiving campus admin, and a district-level confirmation. The transfer won't complete until all three parties approve.",
    steps: [
      "Check the Transfer Approvals page to see the current status",
      "Contact the other campus admin to confirm they've approved their part",
      "District admins can check district-level approval status",
      "Each approval step has a notification sent \u2014 check email for pending requests",
      "Transfers can be cancelled and resubmitted if there's an issue",
    ],
  },
  {
    id: "gradebook-calculation",
    title: "Grade Calculations Seem Incorrect",
    category: "grades",
    tags: ["grade", "calculation", "wrong", "percentage", "letter", "gradebook", "GPA"],
    severity: "warning",
    symptom: "The calculated grade percentage or letter grade doesn't match what you expected.",
    explanation: "Grades are calculated based on the weighted categories configured for each class. If assignment weights or categories aren't set up correctly, calculations may appear off. Also, ungraded assignments can affect the calculation depending on settings.",
    steps: [
      "Check the grade category weights in your class settings",
      "Verify that all assignments have been graded (ungraded ones may count as zero)",
      "Look for any extra credit or dropped lowest grade settings",
      "Compare the individual assignment scores to confirm data entry is correct",
      "If using SIS integration, check if grades synced correctly from the external system",
    ],
  },
  {
    id: "sis-sync-fail",
    title: "SIS Integration Not Syncing",
    category: "integration",
    tags: ["SIS", "sync", "Clever", "PowerSchool", "Canvas", "integration", "import", "connection"],
    severity: "error",
    symptom: "Student or course data from your SIS (Clever, PowerSchool, Canvas, etc.) isn't updating.",
    explanation: "SIS integrations rely on external connections that can temporarily lose connectivity. Common causes include expired API tokens, changes to the SIS configuration, or scheduled maintenance windows.",
    steps: [
      "Check the SIS Integration page for connection status",
      "Verify the API credentials haven't expired in your SIS provider",
      "Try manually triggering a sync from the SIS Integration page",
      "If using Clever, check their status page for any outages",
      "Contact your IT department to verify firewall rules aren't blocking the connection",
      "Re-authorize the connection if the status shows \"Disconnected\"",
    ],
  },
  {
    id: "collaboration-join-fail",
    title: "Can't Join a Collaboration Session",
    category: "collaboration",
    tags: ["collaboration", "invite", "join", "code", "session", "real-time", "co-create"],
    severity: "warning",
    symptom: "You enter an invite code but can't join a collaboration session, or the session appears empty.",
    explanation: "Collaboration sessions use real-time connections that require both users to be online. Issues can arise from expired invite codes, network restrictions, or if the session creator has ended the session.",
    steps: [
      "Verify the invite code is correct and hasn't expired",
      "Make sure the session creator is still online and has the session active",
      "Try refreshing the page and entering the code again",
      "Check if your school network blocks WebSocket connections (ask IT if unsure)",
      "Create a new invite code if the current one isn't working",
    ],
  },
  {
    id: "portfolio-share-broken",
    title: "Shared Portfolio Link Not Working",
    category: "portfolio",
    tags: ["portfolio", "share", "link", "public", "broken", "access", "view"],
    severity: "warning",
    symptom: "Someone can't view your portfolio using the shared link you sent them.",
    explanation: "Portfolio sharing has privacy controls that determine who can see your portfolio. If the link isn't working, the privacy settings may need adjustment, or the link may have been regenerated.",
    steps: [
      "Open your Portfolio and check the sharing/privacy settings",
      "Make sure the portfolio is set to \"Public\" or \"Anyone with link\"",
      "Generate a fresh share link and send the new one",
      "Check if specific sections of the portfolio have their own privacy restrictions",
      "The viewer doesn't need a LYS account to view a public portfolio",
    ],
  },
  {
    id: "page-loading-slow",
    title: "Pages Loading Slowly",
    category: "performance",
    tags: ["slow", "loading", "performance", "spinner", "stuck", "frozen", "lag"],
    severity: "info",
    symptom: "Pages take a long time to load or the loading spinner keeps spinning.",
    explanation: "Slow loading can be caused by your internet connection, browser cache issues, or heavy data on certain pages. The dashboard and analytics pages load more data and may take longer on slower connections.",
    steps: [
      "Check your internet connection speed",
      "Try clearing your browser cache and cookies",
      "Close other browser tabs that might be using bandwidth",
      "Try using a different browser (Chrome, Firefox, Edge)",
      "If on mobile, switch from cellular data to WiFi if available",
      "Large data views like analytics may load faster if you narrow the date range",
    ],
  },
  {
    id: "data-not-showing",
    title: "Dashboard Shows No Data",
    category: "performance",
    tags: ["empty", "no data", "blank", "dashboard", "missing", "nothing"],
    severity: "info",
    symptom: "Your dashboard or analytics page appears empty with no data displayed.",
    explanation: "If you're new to the platform or recently joined an organization, your dashboard will start empty and populate as you use features. For educators, student data appears after students are enrolled and begin activities.",
    steps: [
      "If you're a new user, start by completing some activities (self-discovery, career exploration, etc.)",
      "Educators: verify that students are enrolled in your class",
      "Check that you're looking at the correct date range or time period",
      "Try the refresh button if available on the page",
      "Your progress will appear as you complete activities and milestones",
    ],
  },
  {
    id: "fraud-strike-warning",
    title: "Account Flagged for Suspicious Activity",
    category: "safety",
    tags: ["fraud", "suspicious", "strike", "flagged", "warning", "VPN", "blocked"],
    severity: "error",
    symptom: "You received a warning about suspicious activity on your account, or your access has been restricted.",
    explanation: "LYS uses a 3-strike fraud protection system. Suspicious activity (like using VPN/proxy services, rapid account switching, or unusual login patterns) can trigger warnings. After 3 strikes, account access may be temporarily limited.",
    steps: [
      "Disconnect any VPN or proxy services before accessing the platform",
      "Use only your own account \u2014 sharing accounts can trigger fraud detection",
      "If you're on a school network, ask IT if they use a proxy that might cause this",
      "Contact your campus administrator to review and potentially clear the warning",
      "System administrators can review fraud strikes in the Safety & Security panel",
    ],
  },
  {
    id: "success-mark-edit",
    title: "Can't Edit a Success Mark",
    category: "grades",
    tags: ["success", "mark", "edit", "locked", "finalized", "immutable", "24 hours"],
    severity: "info",
    symptom: "You're unable to edit a success mark that was previously editable.",
    explanation: "Success marks become permanent (finalized) 24 hours after they are created. This is part of the platform's data integrity system to ensure student achievements are protected from accidental or unauthorized changes.",
    steps: [
      "Check if the mark was created more than 24 hours ago \u2014 if so, it's now finalized",
      "To correct a finalized mark, contact your campus or district administrator",
      "Administrators can view finalized marks in the Safety & Security governance panel",
      "New success marks can still be added at any time",
      "The 24-hour edit window is designed to protect student achievement records",
    ],
  },
  {
    id: "standards-not-loading",
    title: "Educational Standards Not Appearing",
    category: "lesson-planning",
    tags: ["standards", "TEKS", "Common Core", "loading", "missing", "curriculum"],
    severity: "warning",
    symptom: "Educational standards aren't showing up when creating or editing lesson plans.",
    explanation: "Standards are loaded from external databases and may take time to import for your state or jurisdiction. If your school hasn't configured standards yet, they need to be imported by an administrator first.",
    steps: [
      "Check with your campus admin to confirm standards have been imported for your state",
      "Go to Settings and verify your state/jurisdiction preferences are set correctly",
      "If standards are being imported, wait for the import to complete (this can take a few minutes)",
      "Try searching for standards by keyword instead of browsing categories",
      "System administrators can import new standards from the Standards Admin page",
    ],
  },
];

const categories = [
  { id: "all", label: "All Topics", icon: HelpCircle },
  { id: "authentication", label: "Login & Access", icon: Key },
  { id: "ai-features", label: "AI Features", icon: Sparkles },
  { id: "safety", label: "Safety & Privacy", icon: Shield },
  { id: "lesson-planning", label: "Lesson Planning", icon: BookOpen },
  { id: "organization", label: "Organizations", icon: Users },
  { id: "grades", label: "Grades & Marks", icon: GraduationCap },
  { id: "integration", label: "Integrations", icon: Globe },
  { id: "collaboration", label: "Collaboration", icon: Users },
  { id: "portfolio", label: "Portfolios", icon: FileText },
  { id: "performance", label: "Performance", icon: Clock },
];

const quickLinks = [
  { label: "Login issues?", articleId: "auth-login-fail", icon: Key },
  { label: "AI lesson failed?", articleId: "ai-lesson-fail", icon: Sparkles },
  { label: "Content blocked?", articleId: "ai-content-blocked", icon: Shield },
  { label: "COPPA consent", articleId: "coppa-consent-required", icon: Lock },
  { label: "Grades look wrong?", articleId: "gradebook-calculation", icon: GraduationCap },
  { label: "Page loading slowly?", articleId: "page-loading-slow", icon: Loader2 },
];

export default function HelpDesk() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [expandedArticle, setExpandedArticle] = useState<string | null>(null);
  const [selectedArticle, setSelectedArticle] = useState<HelpArticle | null>(null);

  const filteredArticles = useMemo(() => {
    let articles = helpArticles;

    if (selectedCategory !== "all") {
      articles = articles.filter(a => a.category === selectedCategory);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      articles = articles.filter(a =>
        a.title.toLowerCase().includes(query) ||
        a.symptom.toLowerCase().includes(query) ||
        a.explanation.toLowerCase().includes(query) ||
        a.tags.some(t => t.toLowerCase().includes(query))
      );
    }

    return articles;
  }, [searchQuery, selectedCategory]);

  const severityConfig = {
    error: { color: "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/30", icon: XCircle, label: "Error" },
    warning: { color: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30", icon: AlertTriangle, label: "Warning" },
    info: { color: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/30", icon: Info, label: "Info" },
  };

  if (selectedArticle) {
    const config = severityConfig[selectedArticle.severity];
    const SeverityIcon = config.icon;

    return (
      <div className="min-h-screen p-6 max-w-4xl mx-auto">
        <Button
          variant="ghost"
          className="mb-4"
          onClick={() => setSelectedArticle(null)}
          data-testid="button-back-to-help"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Help Desk
        </Button>

        <Card>
          <CardHeader>
            <div className="flex items-start gap-3">
              <SeverityIcon className={`h-6 w-6 mt-1 ${
                selectedArticle.severity === "error" ? "text-red-600" :
                selectedArticle.severity === "warning" ? "text-amber-600" : "text-blue-600"
              }`} />
              <div className="flex-1">
                <CardTitle className="font-oswald text-2xl" data-testid="text-article-title">{selectedArticle.title}</CardTitle>
                <div className="flex gap-2 mt-2">
                  <Badge className={config.color}>{config.label}</Badge>
                  <Badge variant="outline">{categories.find(c => c.id === selectedArticle.category)?.label}</Badge>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="font-oswald text-lg mb-2">What You're Seeing</h3>
              <p className="text-muted-foreground font-roboto" data-testid="text-article-symptom">{selectedArticle.symptom}</p>
            </div>

            <div>
              <h3 className="font-oswald text-lg mb-2">Why This Happens</h3>
              <p className="text-muted-foreground font-roboto" data-testid="text-article-explanation">{selectedArticle.explanation}</p>
            </div>

            <div>
              <h3 className="font-oswald text-lg mb-3">How to Fix It</h3>
              <div className="space-y-3">
                {selectedArticle.steps.map((step, i) => (
                  <div key={i} className="flex items-start gap-3" data-testid={`step-${i}`}>
                    <div className="flex items-center justify-center w-7 h-7 rounded-full bg-lys-teal/10 text-lys-teal font-bold text-sm shrink-0 mt-0.5">
                      {i + 1}
                    </div>
                    <p className="font-roboto text-sm pt-1">{step}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap gap-2 pt-4 border-t">
              {selectedArticle.tags.map(tag => (
                <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 max-w-6xl mx-auto space-y-6">
      <div className="text-center space-y-2">
        <h1 className="font-marker text-4xl text-lys-red" data-testid="text-help-title">Help Desk</h1>
        <p className="text-muted-foreground font-roboto text-lg max-w-2xl mx-auto">
          Find answers to common questions and troubleshoot issues quickly
        </p>
      </div>

      <div className="relative max-w-2xl mx-auto">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <Input
          placeholder="Search for help... (e.g., 'login', 'AI lesson', 'grades')"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 h-12 text-lg"
          data-testid="input-help-search"
        />
      </div>

      {!searchQuery && selectedCategory === "all" && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {quickLinks.map(link => {
            const article = helpArticles.find(a => a.id === link.articleId);
            const Icon = link.icon;
            return (
              <Card
                key={link.articleId}
                className="cursor-pointer hover:border-lys-teal/50 transition-colors"
                onClick={() => article && setSelectedArticle(article)}
                data-testid={`quick-link-${link.articleId}`}
              >
                <CardContent className="p-3 text-center">
                  <Icon className="h-6 w-6 mx-auto mb-2 text-lys-teal" />
                  <p className="text-xs font-roboto font-medium">{link.label}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <div className="flex flex-wrap gap-2 justify-center">
        {categories.map(cat => {
          const Icon = cat.icon;
          return (
            <Button
              key={cat.id}
              variant={selectedCategory === cat.id ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(cat.id)}
              className={selectedCategory === cat.id ? "bg-lys-teal hover:bg-lys-teal/90" : ""}
              data-testid={`filter-category-${cat.id}`}
            >
              <Icon className="h-4 w-4 mr-1" />
              {cat.label}
            </Button>
          );
        })}
      </div>

      <div className="space-y-3">
        {filteredArticles.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <HelpCircle className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p className="font-roboto text-muted-foreground">No help articles match your search.</p>
              <p className="text-sm text-muted-foreground mt-1">Try different keywords or browse by category.</p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => { setSearchQuery(""); setSelectedCategory("all"); }}
                data-testid="button-clear-search"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Clear Search
              </Button>
            </CardContent>
          </Card>
        ) : (
          filteredArticles.map(article => {
            const config = severityConfig[article.severity];
            const SeverityIcon = config.icon;
            const isExpanded = expandedArticle === article.id;
            const categoryInfo = categories.find(c => c.id === article.category);

            return (
              <Card
                key={article.id}
                className="cursor-pointer hover:shadow-md transition-shadow"
                data-testid={`help-article-${article.id}`}
              >
                <CardContent className="p-4">
                  <div
                    className="flex items-start gap-3 cursor-pointer"
                    onClick={() => setExpandedArticle(isExpanded ? null : article.id)}
                    data-testid={`button-expand-${article.id}`}
                  >
                    <SeverityIcon className={`h-5 w-5 mt-0.5 shrink-0 ${
                      article.severity === "error" ? "text-red-600" :
                      article.severity === "warning" ? "text-amber-600" : "text-blue-600"
                    }`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-oswald text-base font-medium">{article.title}</h3>
                        <Badge className={`text-xs ${config.color}`}>{config.label}</Badge>
                        {categoryInfo && <Badge variant="outline" className="text-xs">{categoryInfo.label}</Badge>}
                      </div>
                      <p className="text-sm text-muted-foreground font-roboto line-clamp-2">{article.symptom}</p>
                    </div>
                    <div className="shrink-0 mt-1">
                      {isExpanded ? (
                        <ChevronDown className="h-5 w-5 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="h-5 w-5 text-muted-foreground" />
                      )}
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="mt-4 pt-4 border-t space-y-4 ml-8">
                      <div>
                        <h4 className="font-oswald text-sm font-medium mb-1">Why This Happens</h4>
                        <p className="text-sm text-muted-foreground font-roboto">{article.explanation}</p>
                      </div>
                      <div>
                        <h4 className="font-oswald text-sm font-medium mb-2">Steps to Resolve</h4>
                        <ol className="space-y-1.5">
                          {article.steps.map((step, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm font-roboto">
                              <span className="text-lys-teal font-bold shrink-0">{i + 1}.</span>
                              <span>{step}</span>
                            </li>
                          ))}
                        </ol>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => { e.stopPropagation(); setSelectedArticle(article); }}
                        data-testid={`button-view-full-${article.id}`}
                      >
                        View Full Article
                        <ExternalLink className="h-3 w-3 ml-1" />
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {filteredArticles.length > 0 && (
        <p className="text-center text-sm text-muted-foreground font-roboto">
          Showing {filteredArticles.length} of {helpArticles.length} help articles
        </p>
      )}

      <Card className="bg-lys-teal/5 border-lys-teal/20">
        <CardContent className="py-6 text-center">
          <HelpCircle className="h-8 w-8 mx-auto mb-2 text-lys-teal" />
          <h3 className="font-oswald text-lg mb-1">Still Need Help?</h3>
          <p className="text-sm text-muted-foreground font-roboto max-w-md mx-auto">
            If you can't find the answer you're looking for, reach out to your campus administrator or contact your district support team for further assistance.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
