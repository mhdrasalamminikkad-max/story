# StoryNest Design Guidelines

## Design Approach
**Reference-Based Approach**: Child-friendly storytelling platform inspired by storybook aesthetics with a magical bedtime world theme. The design prioritizes warmth, safety, and imagination for children while providing trust and control for parents.

## Core Design Elements

### A. Typography
- **Headings**: "Fredoka One" (Google Fonts) - playful, rounded, child-friendly
- **Body Text**: "Poppins" (Google Fonts) - clean, readable, modern
- **Hierarchy**: Large, welcoming headings with generous spacing for child readability

### B. Color System
**Day Mode (Sunrise Palette)**:
- Soft cream yellow, warm pink, light sky blue
- Gentle pastel gradients throughout

**Night Mode (Bedtime Palette)**:
- Deep blue backgrounds with lavender accents
- Pink mist highlights, star-white text
- Moonlight-inspired glows

**Note**: Use soft pastel gradients consistently, never solid blocks

### C. Layout System
- **Spacing**: Tailwind units of 4, 6, 8, 12, 16 for generous breathing room
- **Roundness**: All buttons and cards use `rounded-2xl` or higher
- **Mobile-first**: Stacked layouts on mobile, expanding to grids on desktop
- **Story Cards**: Grid layout (1 column mobile, 2-3 columns tablet/desktop)

### D. Component Library

**Buttons**:
- Large, rounded (`rounded-2xl`), soft shadows
- Blurred backgrounds when overlaying images
- Prominent CTAs for child interaction

**Story Cards**:
- Large rounded corners (`rounded-2xl`)
- Thumbnail image at top
- Title + short summary below
- Gentle shadow and hover lift effect

**Navigation**:
- Simple, clear parent controls
- Prominent "Child Mode" entry button
- PIN dialog modal with soft, centered overlay

**Child Mode Interface**:
- Fullscreen story display (one at a time)
- Large "Read Aloud" button with animated icon
- PIN-protected exit button
- Story navigation controls

### E. Animations & Effects
**Background Animations**:
- Floating clouds (slow drift using Framer Motion)
- Twinkling stars (subtle opacity pulse)
- Moon glow (soft radial gradient)

**Interactive Animations**:
- Gentle hover lifts on cards
- Smooth transitions between pages
- Star twinkle during story reading
- Dreamy page transitions (fade + slight scale)

**Performance**: Keep animations light and smooth for all devices

### F. Visual Elements

**Hero Section**:
- Animated night sky background (floating stars, moon)
- Tagline: "Stories that grow with your child."
- Two large rounded buttons centered below tagline
- NO static hero image - use animated SVG/CSS background instead

**Illustrations**:
- Storybook-style, friendly characters
- Soft edges, warm colors
- Age-appropriate and safe imagery
- Story thumbnails should be whimsical and inviting

**Icons**:
- Rounded, playful icon set (Heroicons with custom styling)
- Moon, stars, clouds, books as recurring motifs

**Footer**:
- Soft gradient background
- Moon + stars decorative element
- Credits: "Made with 💛 for dreamers and readers."

## Page-Specific Guidelines

**Home Page**: Animated hero with tagline, dual CTA buttons, story preview section with 3-4 story cards

**Child Lock Setup**: Centered form card on dreamy background, PIN input fields, time limit selector, fullscreen toggle

**Parent Dashboard**: Story grid layout, search/filter bar, "Add Story" and "Child Mode" prominent buttons, bookmark indicators

**Child Mode**: Fullscreen story view, large readable text, prominent "Read Aloud" button with animated icon, subtle star animations during reading, PIN-protected exit overlay

## Accessibility
- High contrast text for readability
- Large touch targets (min 44px) for children
- Focus states clearly visible
- Screen reader support for narration toggle
- Parent controls clearly separated from child interface