/**
 * WordPress Integration Service for LYS Platform
 * 
 * This service provides REST API endpoints that can be consumed by WordPress sites
 * and also allows LYS to integrate with WordPress installations via their REST API.
 * 
 * Integration Methods:
 * 1. WordPress Plugin/Shortcode Integration - Embed LYS widgets in WordPress
 * 2. REST API Integration - WordPress can fetch LYS data via API
 * 3. Webhook Integration - LYS can send data to WordPress endpoints
 * 4. SSO/OAuth - Single sign-on between platforms
 */

import { getPublicBaseUrl } from "../lib/hosting";

export interface WordPressConfig {
  siteUrl: string;
  apiEndpoint: string;
  username?: string;
  applicationPassword?: string;
}

export interface WordPressPost {
  title: string;
  content: string;
  status?: 'publish' | 'draft' | 'pending';
  categories?: number[];
  tags?: number[];
  meta?: Record<string, any>;
}

export interface WordPressUser {
  id: number;
  username: string;
  email: string;
  name: string;
  roles: string[];
}

export type EmbedType = 
  | 'lesson-generator' | 'career-explorer' | 'self-discovery' | 'pricing'
  | 'dashboard' | 'gradebook' | 'portfolio' | 'parent-portal' | 'my-journey'
  | 'milestones' | 'action-plans' | 'assessments' | 'resource-library'
  | 'scope-sequence' | 'classroom' | 'assignments' | 'my-lessons' | 'analytics'
  | 'educator-influence' | 'professional-development' | 'lesson-authoring' | 'admin'
  | 'full-site';

export const EMBED_PATHS: Record<EmbedType, string> = {
  'lesson-generator': '/embed/lesson-generator',
  'career-explorer': '/embed/careers',
  'self-discovery': '/embed/self-discovery',
  'pricing': '/embed/pricing',
  'dashboard': '/embed/dashboard',
  'gradebook': '/embed/gradebook',
  'portfolio': '/embed/portfolio',
  'parent-portal': '/embed/parent-portal',
  'my-journey': '/embed/my-journey',
  'milestones': '/embed/milestones',
  'action-plans': '/embed/action-plans',
  'assessments': '/embed/assessments',
  'resource-library': '/embed/resource-library',
  'scope-sequence': '/embed/scope-sequence',
  'classroom': '/embed/classroom',
  'assignments': '/embed/assignments',
  'my-lessons': '/embed/my-lessons',
  'analytics': '/embed/analytics',
  'educator-influence': '/embed/educator-influence',
  'professional-development': '/embed/professional-development',
  'lesson-authoring': '/embed/lesson-authoring',
  'admin': '/embed/admin',
  'full-site': '/embed/full',
};

export function generateEmbedCode(type: EmbedType, options?: {
  theme?: 'light' | 'dark';
  width?: string;
  height?: string;
  locale?: string;
  initialPath?: string;
}): string {
  const baseUrl = getPublicBaseUrl() || 'https://lys.ladderingyoursuccess.com';
  
  const embedPaths = EMBED_PATHS;
  
  const params = new URLSearchParams();
  if (options?.theme) params.set('theme', options.theme);
  if (options?.locale) params.set('locale', options.locale);
  
  let embedPath = embedPaths[type] || '/embed/dashboard';
  if (type === 'full-site' && options?.initialPath) {
    embedPath = `/embed/full${options.initialPath}`;
  }
  
  const embedUrl = `${baseUrl}${embedPath}?${params.toString()}`;
  const width = options?.width || '100%';
  const height = type === 'full-site' ? (options?.height || '100vh') : (options?.height || '600px');
  
  const iframeId = `lys-embed-${type}-${Date.now()}`;
  
  return `<!-- LYS ${type} Embed -->
<iframe 
  id="${iframeId}"
  src="${embedUrl}" 
  width="${width}" 
  height="${height}" 
  frameborder="0" 
  allow="clipboard-write; fullscreen"
  style="border: none; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);${type === 'full-site' ? ' min-height: 100vh;' : ''}"
  title="LYS ${type}"
></iframe>
<script>
(function() {
  var iframe = document.getElementById('${iframeId}');
  window.addEventListener('message', function(event) {
    if (event.data && event.data.type === 'lys-resize' && event.source === iframe.contentWindow) {
      iframe.style.height = event.data.height + 'px';
    }
  });
})();
</script>
<!-- End LYS Embed -->`;
}

export function generateShortcodeInstructions(): string {
  return `
## WordPress Shortcode Integration

LYS provides shortcodes for embedding individual features OR the complete platform.

### Full Platform Embed (Recommended)
\`[lys_platform theme="light" height="100vh"]\`

### Individual Feature Embeds

#### For Educators
- \`[lys_lesson_generator theme="light" height="700px"]\` - AI Lesson Generator
- \`[lys_dashboard theme="light" height="800px"]\` - Educator Dashboard
- \`[lys_gradebook theme="light" height="800px"]\` - Student Gradebook
- \`[lys_classroom theme="light" height="700px"]\` - Class Management
- \`[lys_assignments theme="light" height="700px"]\` - Assignment Manager
- \`[lys_my_lessons theme="light" height="700px"]\` - Saved Lessons
- \`[lys_scope_sequence theme="light" height="800px"]\` - Curriculum Planning
- \`[lys_resource_library theme="light" height="700px"]\` - Shared Resources
- \`[lys_analytics theme="light" height="700px"]\` - Performance Analytics
- \`[lys_professional_development theme="light" height="700px"]\` - PD Tracking
- \`[lys_educator_influence theme="light" height="600px"]\` - Referral Program

#### For Students
- \`[lys_career_explorer theme="light" height="800px"]\` - Career Exploration
- \`[lys_self_discovery theme="light" height="600px"]\` - Self-Discovery Assessment
- \`[lys_my_journey theme="light" height="700px"]\` - Be-Know-Do Journey
- \`[lys_milestones theme="light" height="600px"]\` - Goal Milestones
- \`[lys_action_plans theme="light" height="700px"]\` - Action Planning
- \`[lys_portfolio theme="light" height="800px"]\` - Digital Portfolio

#### For Parents
- \`[lys_parent_portal theme="light" height="800px"]\` - Parent Dashboard

#### For Admins
- \`[lys_admin theme="light" height="900px"]\` - Site Administration
- \`[lys_lesson_authoring theme="light" height="800px"]\` - Master Lesson Library

#### Utility
- \`[lys_pricing theme="light" height="500px"]\` - Pricing Calculator
- \`[lys_assessments theme="light" height="700px"]\` - Assessments
`;
}

export async function fetchFromWordPress(
  config: WordPressConfig,
  endpoint: string,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
  body?: any
): Promise<any> {
  if (!config.siteUrl.startsWith('https://')) {
    throw new Error('WordPress site URL must use HTTPS for security. Please provide a secure URL starting with https://');
  }
  
  const url = `${config.siteUrl}${config.apiEndpoint}${endpoint}`;
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  
  if (config.username && config.applicationPassword) {
    const auth = Buffer.from(`${config.username}:${config.applicationPassword}`).toString('base64');
    headers['Authorization'] = `Basic ${auth}`;
  }
  
  try {
    const response = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
    
    if (!response.ok) {
      throw new Error(`WordPress API error: ${response.status} ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('WordPress API error:', error);
    throw error;
  }
}

export async function getWordPressPosts(config: WordPressConfig, params?: {
  perPage?: number;
  page?: number;
  categories?: number[];
  search?: string;
}): Promise<any[]> {
  const queryParams = new URLSearchParams();
  if (params?.perPage) queryParams.set('per_page', params.perPage.toString());
  if (params?.page) queryParams.set('page', params.page.toString());
  if (params?.categories) queryParams.set('categories', params.categories.join(','));
  if (params?.search) queryParams.set('search', params.search);
  
  const endpoint = `/posts?${queryParams.toString()}`;
  return fetchFromWordPress(config, endpoint);
}

export async function createWordPressPost(config: WordPressConfig, post: WordPressPost): Promise<any> {
  return fetchFromWordPress(config, '/posts', 'POST', post);
}

export async function syncLessonPlanToWordPress(
  config: WordPressConfig,
  lessonPlan: {
    title: string;
    content: string;
    objectives: string[];
    standards: string[];
    gradeLevel: string;
  }
): Promise<any> {
  const formattedContent = `
<h2>Learning Objectives</h2>
<ul>
${lessonPlan.objectives.map(obj => `<li>${obj}</li>`).join('\n')}
</ul>

<h2>Lesson Content</h2>
${lessonPlan.content}

<h2>Standards Alignment</h2>
<ul>
${lessonPlan.standards.map(std => `<li>${std}</li>`).join('\n')}
</ul>

<p><em>Grade Level: ${lessonPlan.gradeLevel}</em></p>
<p><em>Generated by LYS Educational Platform</em></p>
`;

  return createWordPressPost(config, {
    title: lessonPlan.title,
    content: formattedContent,
    status: 'draft',
  });
}

export function getWordPressIntegrationStatus(): {
  available: boolean;
  features: string[];
  setupRequired: string[];
} {
  return {
    available: true,
    features: [
      'Embed LYS widgets in WordPress via iframe',
      'WordPress shortcode support for easy integration',
      'REST API endpoints for data exchange',
      'Lesson plan sync to WordPress posts',
      'Single sign-on support (requires OAuth setup)',
    ],
    setupRequired: [
      'Add WordPress site URL to allowed origins',
      'Install LYS WordPress plugin or add shortcode functions',
      'Configure Application Password for authenticated API access',
    ],
  };
}

export function generateOEmbedResponse(url: string, type: string): {
  version: string;
  type: string;
  provider_name: string;
  provider_url: string;
  title: string;
  html: string;
  width: number;
  height: number;
} {
  const baseUrl = getPublicBaseUrl() || 'https://lys.ladderingyoursuccess.com';
    
  return {
    version: '1.0',
    type: 'rich',
    provider_name: 'LYS Educational Platform',
    provider_url: baseUrl,
    title: `LYS ${type}`,
    html: generateEmbedCode(type as any),
    width: 800,
    height: 600,
  };
}
