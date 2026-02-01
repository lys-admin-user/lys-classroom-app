import { useEffect, useState } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toaster";

interface EmbedWrapperProps {
  children: React.ReactNode;
}

export function EmbedWrapper({ children }: EmbedWrapperProps) {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const themeParam = params.get('theme');
    if (themeParam === 'dark') {
      setTheme('dark');
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    window.addEventListener('message', (event) => {
      if (event.data?.type === 'lys-theme-change') {
        const newTheme = event.data.theme;
        setTheme(newTheme);
        if (newTheme === 'dark') {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      }
    });

    if (window.parent !== window) {
      window.parent.postMessage({ type: 'lys-embed-ready', embedType: 'full' }, '*');
    }
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div className="min-h-screen bg-background" data-embed="true" data-theme={theme}>
          {children}
        </div>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export function FullSiteEmbed({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const themeParam = params.get('theme');
    const collapsedParam = params.get('collapsed');
    
    if (themeParam === 'dark') {
      setTheme('dark');
      document.documentElement.classList.add('dark');
    }
    
    if (collapsedParam === 'true') {
      setSidebarCollapsed(true);
    }

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
    
    function handleMessage(event: MessageEvent) {
      if (event.data?.type === 'lys-theme-change') {
        setTheme(event.data.theme);
        if (event.data.theme === 'dark') {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      }
      if (event.data?.type === 'lys-sidebar-toggle') {
        setSidebarCollapsed(prev => !prev);
      }
      if (event.data?.type === 'lys-navigate') {
        window.location.hash = event.data.path;
      }
    }
  }, []);

  useEffect(() => {
    if (window.parent !== window) {
      window.parent.postMessage({ 
        type: 'lys-embed-ready', 
        embedType: 'full-site',
        capabilities: ['navigation', 'theme', 'auth']
      }, '*');
    }
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div 
          className="min-h-screen bg-background" 
          data-embed="full-site" 
          data-theme={theme}
          data-sidebar-collapsed={sidebarCollapsed}
        >
          {children}
        </div>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}
