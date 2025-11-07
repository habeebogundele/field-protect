# FieldShare Agricultural Platform - Design Guidelines

## Design Approach

**Selected Framework:** Design System Approach with influences from Linear (clean typography, clear hierarchy) and modern mapping applications (Google Maps, Mapbox-style interfaces). Agricultural theme demands professional, trustworthy aesthetics with emphasis on clarity and efficiency for field workers and farm managers.

**Core Principles:**
- Map-first interface: Interactive map is the primary navigation and data entry tool
- Information clarity: Dense agricultural data presented with strong hierarchy
- Touch-friendly: Large targets for field use on tablets/mobile devices
- Professional agricultural aesthetic: Earthy, grounded, trustworthy

---

## Typography System

**Font Families:**
- Primary: Inter (via Google Fonts CDN) - Clean, highly legible for data-heavy interfaces
- Monospace: JetBrains Mono - For coordinates, measurements, field IDs

**Hierarchy:**
- H1 (Page Titles): 2xl, font-semibold
- H2 (Section Headers): xl, font-semibold  
- H3 (Card/Panel Titles): lg, font-medium
- Body Text: base, font-normal
- Labels/Metadata: sm, font-medium
- Supporting Text: sm, font-normal
- Data Values: base, font-mono

---

## Layout System

**Spacing Primitives:** Use Tailwind units of 2, 4, 6, 8, and 12 consistently throughout.
- Component padding: p-4 to p-6
- Section spacing: gap-6 to gap-8
- Generous touch targets: min-h-12 for buttons/inputs
- Card spacing: p-6 interior, gap-4 between cards

**Grid Structure:**
- Main application: Sidebar (280px fixed) + Map canvas (flex-1)
- Form layouts: Single column on mobile, 2-column on md breakpoints
- Field listings: Grid-cols-1 md:grid-cols-2 lg:grid-cols-3

---

## Core Layout Structure

### Application Shell
**Header Bar:** Fixed top, h-16
- Logo and platform name (left)
- Search bar (center, max-w-md)
- User profile and notifications (right)
- Subtle bottom border for separation

**Sidebar Navigation:** Fixed left, w-72
- Dashboard, Fields, Analytics, Settings sections
- Active state: Subtle background shift, left border accent
- Icons from Heroicons (outline style)
- Collapsible on mobile (hamburger menu)

**Map Canvas:** Primary content area
- Full remaining viewport height
- Floating controls (zoom, layers, satellite toggle) in top-right corner
- Attribution in bottom-right corner
- Field boundary drawing tools in top-left floating toolbar

---

## "Add New Field" Dialog Design

### Dialog Structure
**Container:** Modal overlay with centered dialog, max-w-4xl, max-h-[90vh] with scroll

**Section 1: Interactive Map (Top Priority)**
- Height: h-96 on desktop, h-64 on mobile
- Full-width within dialog
- Drawing tools overlay at top: "Draw Polygon", "Edit", "Clear" buttons
- Auto-zoom indicator: Small badge showing "Zoomed to [Zipcode]"
- Field boundary preview in real-time as farmer draws
- Coordinate display in bottom-left corner (lat/long)

**Section 2: Field Information Form (Below Map)**
Two-column layout on desktop, stacked on mobile:

**Left Column:**
- Field Name (text input, required)
- Crop Type (searchable dropdown with common crops)
- Field Size (auto-calculated from polygon, read-only, displayed with acres/hectares)
- Soil Type (dropdown)

**Right Column:**
- Irrigation System (dropdown)
- Planting Date (date picker)
- Expected Harvest (date picker)  
- Notes (textarea, 3 rows)

**Section 3: Location Details**
Single column:
- Zipcode (text input, triggers map auto-zoom)
- Address (auto-filled from map, editable)
- County/Region (auto-detected)

**Dialog Actions:** Fixed bottom bar
- Cancel (secondary button, left)
- Save Field (primary button, right, disabled until required fields complete)
- Spacing: p-6, gap-4

---

## Component Library

### Buttons
- Height: h-12 (touch-friendly)
- Padding: px-6
- Border radius: rounded-lg
- Typography: font-medium
- Primary: Elevated appearance
- Secondary: Outlined style
- Icon buttons (map tools): h-10 w-10, rounded-md

### Form Inputs
- Height: h-12
- Padding: px-4
- Border radius: rounded-lg
- Focus state: Ring effect (ring-2)
- Labels: Above input, font-medium, mb-2
- Helper text: Below input, text-sm
- Error states: Bottom border accent, error message below

### Cards (Field Listings)
- Padding: p-6
- Border radius: rounded-xl
- Subtle border: border
- Hover state: Slight elevation shift
- Header: Field name + crop type icon
- Body: Key metrics in 2-column grid
- Footer: Action buttons (Edit, View Details)

### Map Controls
- Floating panels: backdrop-blur effect
- Border radius: rounded-lg
- Padding: p-2 to p-3
- Icon buttons with tooltips
- Layer switcher: Dropdown menu from button

### Data Tables (Analytics/Field History)
- Striped rows for scannability
- Sticky header on scroll
- Sort indicators in column headers
- Row height: h-14 (adequate touch target)
- Pagination controls at bottom

---

## Images

### Hero Section (Dashboard Landing)
**Large Hero Image:** Yes - Full-width, h-80
- Image Description: Aerial drone view of organized agricultural fields showing geometric crop patterns in various growth stages, creating natural patchwork. Golden hour lighting, professional agricultural photography.
- Placement: Top of dashboard, with search bar and "Add New Field" CTA overlaid
- CTA Button Treatment: Blurred background (backdrop-blur-sm), white/translucent button with clear text

### Supporting Images
**Field Card Thumbnails:** Small aerial preview images
- Size: h-32 w-full, rounded-t-lg
- Description: Recent satellite or drone imagery of specific field
- Placement: Top of each field card in listings

**Empty States:**
- Simple illustrated graphics (farm, tractor, field icons)
- Use inline SVG from icon library, scaled large (h-24 w-24)

---

## Navigation Patterns

**Primary Navigation:** Sidebar with clear sections
**Breadcrumbs:** Below header for deep navigation (Fields > Field Name > Edit)
**Context Menus:** Right-click on map fields for quick actions
**Quick Actions:** Floating action button (bottom-right) for "Add New Field" on mobile

---

## Accessibility

- Minimum touch targets: 44x44px
- Form labels always visible (no placeholder-only)
- Sufficient contrast for outdoor use on tablets
- Keyboard navigation for all map interactions
- ARIA labels for all icon-only buttons
- Focus indicators clearly visible