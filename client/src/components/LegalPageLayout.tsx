import { Link } from "wouter";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, FileText } from "lucide-react";
import { COMPANY, POLICY_LIST } from "@shared/legal";

interface LegalPageLayoutProps {
  title: string;
  shortTitle: string;
  version: string;
  effectiveDate: string;
  activePath: string;
  children: React.ReactNode;
}

export default function LegalPageLayout({
  title,
  shortTitle,
  version,
  effectiveDate,
  activePath,
  children,
}: LegalPageLayoutProps) {
  const effective = new Date(effectiveDate).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
        <Link href="/">
          <span className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground cursor-pointer font-roboto" data-testid="link-legal-home">
            <ChevronLeft className="h-4 w-4" /> Back to {COMPANY.platformName}
          </span>
        </Link>

        <div className="mt-6 mb-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-11 h-11 rounded-md bg-muted flex items-center justify-center">
              <FileText className="h-5 w-5 text-foreground" />
            </div>
            <div>
              <h1 className="font-oswald font-semibold tracking-tight text-2xl sm:text-3xl text-foreground" data-testid="text-legal-title">
                {title}
              </h1>
              <p className="font-roboto text-sm text-muted-foreground">
                {COMPANY.legalName}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary" data-testid="badge-policy-version">Version {version}</Badge>
            <Badge variant="outline">Effective {effective}</Badge>
          </div>
        </div>

        <nav className="flex flex-wrap gap-2 mb-8" aria-label="Policy navigation">
          {POLICY_LIST.map((p) => (
            <Link key={p.path} href={p.path}>
              <span
                className={`text-xs px-3 py-1.5 rounded-full border cursor-pointer font-roboto ${
                  p.path === activePath
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-background text-muted-foreground hover:text-foreground"
                }`}
                data-testid={`link-policy-${p.type}`}
              >
                {p.shortTitle}
              </span>
            </Link>
          ))}
        </nav>

        <div className="rounded-md border bg-muted/40 p-4 mb-8">
          <p className="text-xs text-muted-foreground font-roboto leading-relaxed">
            This {shortTitle} is provided for transparency. It is a structured template
            reflecting current consumer-protection and AI-transparency expectations and is
            pending final review by {COMPANY.legalName}'s legal counsel. Questions?
            Contact us at{" "}
            <a href={`mailto:${COMPANY.contactEmail}`} className="underline" data-testid="link-legal-contact">
              {COMPANY.contactEmail}
            </a>
            .
          </p>
        </div>

        <article className="space-y-6 font-roboto text-sm leading-relaxed text-foreground [&_h2]:font-oswald [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-foreground [&_h2]:mt-8 [&_h2]:mb-2 [&_h3]:font-oswald [&_h3]:text-base [&_h3]:font-semibold [&_h3]:mt-4 [&_h3]:mb-1 [&_p]:text-muted-foreground [&_li]:text-muted-foreground [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1 [&_a]:underline">
          {children}
        </article>

        <footer className="mt-12 pt-6 border-t">
          <p className="text-xs text-muted-foreground font-roboto">
            © {new Date().getFullYear()} {COMPANY.legalName}. Governing law: {COMPANY.governingState}, USA.
            Contact:{" "}
            <a href={`mailto:${COMPANY.contactEmail}`} className="underline">
              {COMPANY.contactEmail}
            </a>
          </p>
        </footer>
      </div>
    </div>
  );
}
