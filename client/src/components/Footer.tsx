import { Link } from "wouter";
import { Mail, Phone, Globe } from "lucide-react";
import { SiFacebook, SiInstagram, SiLinkedin, SiX } from "react-icons/si";

export function Footer() {
  return (
    <footer className="bg-lys-teal text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <span className="font-marker text-3xl text-lys-yellow">L</span>
              <div className="w-5 h-7 flex flex-col justify-center mx-0.5">
                <div className="w-4 h-0.5 bg-lys-yellow rounded-full mb-0.5"></div>
                <div className="w-4 h-0.5 bg-lys-yellow rounded-full mb-0.5"></div>
                <div className="w-4 h-0.5 bg-lys-yellow rounded-full"></div>
              </div>
              <span className="font-marker text-3xl text-lys-yellow">S</span>
            </div>
            <p className="font-roboto text-white/80 text-sm leading-relaxed mb-4">
              Empowering students to discover their purpose and pursue it with passion. 
              We Be, Know, Do — Thinking Globally, Acting Locally.
            </p>
            <div className="flex items-center gap-3">
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover-elevate"
                data-testid="link-facebook"
              >
                <SiFacebook className="h-4 w-4" />
              </a>
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover-elevate"
                data-testid="link-instagram"
              >
                <SiInstagram className="h-4 w-4" />
              </a>
              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover-elevate"
                data-testid="link-linkedin"
              >
                <SiLinkedin className="h-4 w-4" />
              </a>
              <a
                href="https://x.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover-elevate"
                data-testid="link-x"
              >
                <SiX className="h-4 w-4" />
              </a>
            </div>
          </div>

          <div>
            <h3 className="font-oswald text-lg font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2 font-roboto text-sm">
              <li>
                <Link href="/" className="text-white/80 hover:text-lys-yellow transition-colors">
                  Dashboard
                </Link>
              </li>
              <li>
                <Link href="/lesson-generator" className="text-white/80 hover:text-lys-yellow transition-colors">
                  AI Lesson Generator
                </Link>
              </li>
              <li>
                <Link href="/assessments" className="text-white/80 hover:text-lys-yellow transition-colors">
                  Student Assessments
                </Link>
              </li>
              <li>
                <Link href="/careers" className="text-white/80 hover:text-lys-yellow transition-colors">
                  Career Explorer
                </Link>
              </li>
              <li>
                <Link href="/resources" className="text-white/80 hover:text-lys-yellow transition-colors">
                  Resource Library
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-oswald text-lg font-semibold mb-4">Connect With Us</h3>
            <ul className="space-y-3 font-roboto text-sm">
              <li className="flex items-center gap-3 text-white/80">
                <Phone className="h-4 w-4 text-lys-yellow flex-shrink-0" />
                <span>832-202-9086</span>
              </li>
              <li className="flex items-center gap-3 text-white/80">
                <Mail className="h-4 w-4 text-lys-yellow flex-shrink-0" />
                <span>Info@ladderingyoursuccess.com</span>
              </li>
              <li className="flex items-center gap-3 text-white/80">
                <Globe className="h-4 w-4 text-lys-yellow flex-shrink-0" />
                <span>ladderingyoursuccess.com</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-white/20 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-white/60">
          <p className="font-roboto">
            &copy; {new Date().getFullYear()} Laddering Your Success. All rights reserved.
          </p>
          <div className="flex items-center gap-6 font-roboto">
            <a href="#" className="hover:text-lys-yellow transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-lys-yellow transition-colors">Terms of Service</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
