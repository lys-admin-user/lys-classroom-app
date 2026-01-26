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

export function generateEmbedCode(type: 'lesson-generator' | 'career-explorer' | 'self-discovery' | 'pricing', options?: {
  theme?: 'light' | 'dark';
  width?: string;
  height?: string;
  locale?: string;
}): string {
  const baseUrl = process.env.REPLIT_DEV_DOMAIN 
    ? `https://${process.env.REPLIT_DEV_DOMAIN}`
    : 'https://lys.ladderingyoursuccess.com';
  
  const embedPaths: Record<string, string> = {
    'lesson-generator': '/embed/lesson-generator',
    'career-explorer': '/embed/careers',
    'self-discovery': '/embed/self-discovery',
    'pricing': '/embed/pricing',
  };
  
  const params = new URLSearchParams();
  if (options?.theme) params.set('theme', options.theme);
  if (options?.locale) params.set('locale', options.locale);
  
  const embedUrl = `${baseUrl}${embedPaths[type]}?${params.toString()}`;
  const width = options?.width || '100%';
  const height = options?.height || '600px';
  
  return `<!-- LYS ${type} Embed -->
<iframe 
  src="${embedUrl}" 
  width="${width}" 
  height="${height}" 
  frameborder="0" 
  allow="clipboard-write"
  style="border: none; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);"
  title="LYS ${type}"
></iframe>
<!-- End LYS Embed -->`;
}

export function generateShortcodeInstructions(): string {
  return `
## WordPress Shortcode Integration

Add the following shortcodes to your WordPress posts or pages:

### Lesson Generator
\`[lys_lesson_generator theme="light" height="700px"]\`

### Career Explorer  
\`[lys_career_explorer theme="light" height="800px"]\`

### Self-Discovery Assessment
\`[lys_self_discovery theme="light" height="600px"]\`

### Pricing Calculator (with CAI)
\`[lys_pricing theme="light" height="500px"]\`

## WordPress Plugin Code

Add this to your theme's functions.php or create a custom plugin:

\`\`\`php
<?php
/**
 * LYS Platform Integration for WordPress
 */

function lys_embed_shortcode($atts, $content, $tag) {
    $defaults = array(
        'theme' => 'light',
        'width' => '100%',
        'height' => '600px',
        'locale' => 'en'
    );
    
    $atts = shortcode_atts($defaults, $atts, $tag);
    
    $base_url = 'https://lys.ladderingyoursuccess.com';
    
    $embed_paths = array(
        'lys_lesson_generator' => '/embed/lesson-generator',
        'lys_career_explorer' => '/embed/careers',
        'lys_self_discovery' => '/embed/self-discovery',
        'lys_pricing' => '/embed/pricing'
    );
    
    $path = isset($embed_paths[$tag]) ? $embed_paths[$tag] : '/embed/lesson-generator';
    $url = $base_url . $path . '?theme=' . esc_attr($atts['theme']) . '&locale=' . esc_attr($atts['locale']);
    
    return sprintf(
        '<iframe src="%s" width="%s" height="%s" frameborder="0" allow="clipboard-write" style="border: none; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);" title="LYS %s"></iframe>',
        esc_url($url),
        esc_attr($atts['width']),
        esc_attr($atts['height']),
        esc_attr(str_replace('lys_', '', $tag))
    );
}

add_shortcode('lys_lesson_generator', 'lys_embed_shortcode');
add_shortcode('lys_career_explorer', 'lys_embed_shortcode');
add_shortcode('lys_self_discovery', 'lys_embed_shortcode');
add_shortcode('lys_pricing', 'lys_embed_shortcode');
\`\`\`
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
  const baseUrl = process.env.REPLIT_DEV_DOMAIN 
    ? `https://${process.env.REPLIT_DEV_DOMAIN}`
    : 'https://lys.ladderingyoursuccess.com';
    
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
