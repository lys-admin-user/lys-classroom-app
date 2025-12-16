# LYS Educational Platform - Design Guidelines

## Design Approach
**Reference-Based + Brand-First Hybrid**: Drawing inspiration from Notion (organization), Linear (clean interface), and Xello (education focus) while strictly honoring LYS's established brand identity and warm, encouraging personality.

## Core Design Principles
1. **Encouragement Over Efficiency**: Copy and visuals should feel supportive, not robotic
2. **Visual Organization**: Clean, colorful, Pinterest-worthy layouts that appeal to visual learners
3. **Approachable Innovation**: Cutting-edge AI tools presented in warm, human-centric ways
4. **Purposeful Hierarchy**: Be-Know-Do framework visually reinforced throughout

## Brand Colors (Provided)
- **Primary Red**: #EE4E23 (passion, CTAs, emphasis)
- **Warm Yellow**: #F8D842 (hope, highlights, success states)
- **Dark Teal**: #016371 (strength, backgrounds, grounding elements)
- **Neutrals**: White backgrounds, light gray (#F7F7F7) for sections, dark gray (#333333) for body text

## Typography (Brand-Mandated)
- **Headers**: Permanent Marker (playful, handwritten energy)
- **Subheaders/CTAs**: Oswald Bold or Klein Condensed Bold (modern, strong)
- **Body Text**: Roboto Regular/Medium (clean, readable)

**Hierarchy:**
- H1: Permanent Marker, 3xl-4xl (48-56px)
- H2: Oswald Bold, 2xl-3xl (32-40px)
- H3: Klein Condensed Bold, xl-2xl (24-32px)
- Body: Roboto Regular, base-lg (16-18px)
- Captions: Roboto Medium, sm (14px)

## Layout System
**Spacing**: Use Tailwind units 4, 6, 8, 12, 16, 20 for consistent rhythm
- Section padding: py-16 to py-24
- Component spacing: gap-6 to gap-8
- Container max-width: max-w-7xl with px-6

## Component Library

### Navigation
- Sticky top bar with transparent-to-solid transition on scroll
- Logo (LYS ladder icon + wordmark) left-aligned
- Main nav links center (Dashboard, Resources, AI Tools, Community)
- "Get Started Free" CTA button right-aligned (red background, yellow text)

### Hero Section (Educator Dashboard Landing)
- Full-width background: Gradient from warm yellow to light teal
- Hero image: Diverse educators collaborating with students in modern classroom (positioned right, 50% width on desktop)
- Headline (left, 50% width): "Your Students' Success Starts Here" - Permanent Marker
- Subheadline: "AI-powered tools that handle the busywork so you can focus on what matters: inspiring young minds" - Oswald
- Dual CTAs: "Try AI Lesson Planner" (red button) + "Watch 2min Demo" (outlined yellow)
- Trust indicator below: "Join 10,000+ educators transforming student futures" with small avatars

### Dashboard Cards (Educator Home)
Three large feature cards in grid (grid-cols-1 md:grid-cols-3):
1. **BE Card**: Identity discovery tools - Yellow accent border
2. **KNOW Card**: Career pathways - Red accent border  
3. **DO Card**: Action planning - Teal accent border

Each card: White background, colorful icon top-left, title (Oswald), description (Roboto), "Launch Tool" link bottom-right

### AI Lesson Generator Interface
- Split layout: Form inputs left (40%), Live preview right (60%)
- Input section: Clean white card with teal accent header "Tell me what you need..."
- Fields: Topic, Grade level, Be-Know-Do focus (toggle buttons), Standards alignment
- "Generate Lesson ✨" button: Large, red, with subtle glow animation
- Preview pane: Soft gray background, real-time lesson content appears with smooth fade-in
- Encouraging microcopy throughout: "Great choice!", "This will save you 30 minutes!"

### Resource Library
- Filterable card grid (scholarships, guides, videos)
- Cards: Image top, category badge (yellow tag), title, short description
- Hover: Subtle lift effect (shadow increase)
- Filter sidebar: Checkboxes with yellow accent when selected

### Student Progress Dashboard (for educators)
- Table view with avatar column, student name, pathway selected, progress bars (gradient yellow-to-red)
- Quick action buttons per row: View plan, Send message, Export report

### Footer
- Three columns: About LYS, Quick Links, Connect With Us
- Newsletter signup: "Get weekly success stories" with yellow input field accent
- Social icons: Teal circle backgrounds
- Bottom bar: Copyright, Privacy, Terms

## Animations
- **Page transitions**: Gentle 200ms fade
- **Card hovers**: 150ms lift (translateY -2px + shadow)
- **Button interactions**: Scale 0.98 on press
- **AI generation**: Pulsing dots while loading, smooth fade-in for results
- **Avoid**: Excessive scroll-triggered animations

## Images
1. **Hero Image**: Wide shot of engaged educator using tablet with diverse student group, bright modern classroom, natural lighting, authentic (not stock-feeling)
2. **Be-Know-Do Icons**: Custom illustrated icons with hand-drawn feel (ladder motif)
3. **Resource Cards**: Authentic student success photos, scholarship award images, career pathway infographics
4. **Testimonials**: Real educator headshots with genuine smiles

## Voice & Microcopy
- Warm, encouraging, never corporate
- Examples:
  - Success: "🎉 You just saved yourself 30 minutes!"
  - Error: "Oops! Let's try that again"
  - Empty state: "Your first amazing lesson is just a click away"
  - Loading: "Crafting your personalized lesson plan..."

## Accessibility
- Color contrast ratio 4.5:1 minimum
- Focus states: Yellow outline (2px solid #F8D842)
- Keyboard navigation throughout
- ARIA labels on all interactive elements
- Screen reader-friendly form labels

## Responsive Behavior
- Mobile: Stack all multi-column layouts, full-width CTAs, hamburger menu
- Tablet: 2-column grids, simplified hero (text over image)
- Desktop: Full multi-column layouts, side-by-side content

This design system creates a vibrant, educator-friendly platform that honors LYS's brand identity while delivering modern functionality with warmth and purpose.