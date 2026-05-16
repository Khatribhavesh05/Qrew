# Output Quality Fixes — Jordan & Morgan Agents

## Summary
Fixed all output quality issues in the Next.js 14 project to ensure unique, brand-specific generated sites.

## Problems Fixed

### ✅ Fix 1: Jordan Generates Unique Brand Colors
**Problem:** All sites had the same purple colors (#0A0A0A + #6366F1)

**Solution:** 
- Created industry-specific color palettes in `src/app/api/startups/[startupId]/brand/route.ts`
- Added 18+ industry mappings (fintech, health, fashion, SaaS, food, education, etc.)
- Each industry gets 5 unique colors: background, primary, secondary, accent, text
- Examples:
  - Fintech: Deep navy (#0A1628) + gold (#D4AF37)
  - Health: Soft green (#10B981) + white
  - Fashion: Black + rose pink (#FFB6C1)
  - SaaS: Dark + electric blue (#0EA5E9)
  - Food: Warm orange (#FF6B35) + cream
  - Education: Indigo (#4F46E5) + yellow accents

**Files Changed:**
- `src/app/api/startups/[startupId]/brand/route.ts` (lines 1-75)

---

### ✅ Fix 2: Morgan Uses Flux Background Image
**Problem:** Flux BG saved by Jordan was never used in hero sections

**Solution:**
- Completely rewrote Morgan's v0 prompt in `src/lib/code-generator.ts`
- Added explicit instructions to use `flux_bg_url` as hero background
- Included exact JSX code snippet with backgroundImage style
- Added dark overlay (rgba(0,0,0,0.6)) for text readability
- Prompt now forces the URL to appear literally in generated code
- Added console logs to verify Flux URL is present

**Files Changed:**
- `src/lib/code-generator.ts` (lines 56-283)

---

### ✅ Fix 3: Unique Fonts Per Brand
**Problem:** No unique fonts, always generic Inter

**Solution:**
- Jordan now generates font pairings based on brand_vibe:
  - Professional/SaaS: Inter + JetBrains Mono
  - Creative/Fashion: Playfair Display + Lato
  - Friendly/Consumer: Nunito + Open Sans
  - Bold/Startup: Space Grotesk + DM Sans
  - Luxury: Cormorant Garamond + Montserrat
- Fonts saved to `company_brain.fonts` field
- Morgan's prompts now import from next/font/google
- Display font used for headings, body font for paragraphs

**Files Changed:**
- `src/app/api/startups/[startupId]/brand/route.ts` (font pairings in industry palettes)
- `src/lib/code-generator.ts` (font import instructions in all prompts)

---

### ✅ Fix 4: Framer Motion Animations
**Problem:** No animations in generated sites

**Solution:**
- Added comprehensive Framer Motion instructions to all Morgan prompts
- Landing page: fadeInUp, staggerChildren for every section
- Auth page: slide up + fade in on mount
- Dashboard: stagger animation for stat cards
- Included exact animation variant code in prompts
- Required animations: fadeIn, slideUp, staggerChildren, scale, pulse

**Files Changed:**
- `src/lib/code-generator.ts` (all three page generation functions)

---

### ✅ Fix 5: Morgan's V0 Prompt Complete Rewrite
**Problem:** Generic layouts, same structure every build

**Solution:**
- Rewrote landing page prompt with detailed sections:
  - Hero with Flux background (exact URL enforcement)
  - Features (3-4 unique layouts, not uniform grid)
  - How It Works (timeline/flow diagram)
  - Testimonials (3 real-sounding, product-specific)
  - Pricing (2-3 tiers relevant to revenue model)
  - Final CTA with email form
  - Footer
- Added quality requirements section with hard bans:
  - ✗ No purple gradients
  - ✗ No Inter-only fonts
  - ✗ No placeholder names
  - ✗ No generic copy
  - ✗ No repetitive layouts
- Added brand identity section with exact colors and fonts
- Added Framer Motion animation requirements
- Made prompts startup-specific (uses actual name, idea, audience)

**Files Changed:**
- `src/lib/code-generator.ts` (generateLandingPage, generateAuthPage, generateDashboardPage)

---

## Technical Details

### Jordan's Brand Generation Flow
1. Reads `industry` and `brand_vibe` from company_brain
2. Calls `generateBrandPalette(industry, vibe)` function
3. Priority matching: exact industry → partial industry → vibe → fallback
4. Generates 5 colors array: [bg, primary, secondary, accent, text]
5. Generates 2 fonts array: [displayFont, bodyFont]
6. Generates Flux images via Fal.ai
7. Uploads to Supabase Storage (brand-assets bucket)
8. Saves colors, fonts, flux_bg_url, flux_texture_url to company_brain
9. Logs all generated values for debugging

### Morgan's Code Generation Flow
1. Reads company_brain with all brand data
2. Extracts colors (5 values), fonts (2 values), flux_bg_url
3. Builds detailed v0 prompt with:
   - Startup identity section
   - Brand colors section (CSS variables)
   - Typography section (Google Fonts imports)
   - Hero background section (exact Flux URL)
   - Required sections list
   - Framer Motion animations
   - Quality requirements
4. Calls v0 SDK with enhanced prompt
5. Returns generated code

### Data Flow
```
User submits idea
  ↓
Alex researches (unchanged)
  ↓
Sam strategizes (unchanged)
  ↓
Jordan generates brand:
  - Reads industry + vibe
  - Generates unique colors (5)
  - Generates unique fonts (2)
  - Generates Flux BG image
  - Saves to company_brain
  ↓
Morgan generates code:
  - Reads company_brain
  - Uses exact colors in prompts
  - Uses exact fonts in prompts
  - Forces Flux BG URL in hero
  - Adds Framer Motion animations
  - Generates 3 pages (landing, auth, dashboard)
  ↓
Build complete with unique brand
```

---

## Files Modified

1. **src/app/api/startups/[startupId]/brand/route.ts**
   - Added INDUSTRY_PALETTES (18+ industries)
   - Added VIBE_MODIFIERS (7 vibes)
   - Replaced getPalette() with generateBrandPalette()
   - Added console logging for debugging
   - Colors saved as array of 5 values
   - Fonts saved as JSON string

2. **src/lib/code-generator.ts**
   - Rewrote generateLandingPage() prompt (lines 56-283)
   - Rewrote generateAuthPage() prompt (lines 286-378)
   - Rewrote generateDashboardPage() prompt (lines 381-470)
   - All prompts now use 5-color system
   - All prompts include Google Fonts imports
   - All prompts include Framer Motion animations
   - Landing page prompt enforces Flux BG URL usage

3. **src/app/api/startups/[startupId]/build/route.ts**
   - No changes needed (already reads colors and fonts from company_brain)

---

## Testing Checklist

- [ ] Build completes without TypeScript errors
- [ ] Jordan generates different colors for different industries
- [ ] Jordan saves 5 colors to company_brain.colors[]
- [ ] Jordan saves fonts to company_brain.fonts
- [ ] Jordan saves Flux BG URL to company_brain.flux_bg_url
- [ ] Morgan's landing page uses exact brand colors
- [ ] Morgan's landing page uses exact Google Fonts
- [ ] Morgan's landing page includes Flux BG as hero background
- [ ] Morgan's landing page has Framer Motion animations
- [ ] Generated sites look unique per startup
- [ ] No purple gradients in non-purple brands
- [ ] No generic "Acme Corp" placeholders

---

## Breaking Changes

None. All changes are backward compatible. Existing startups will use fallback values if colors/fonts are missing.

---

## Next Steps

1. Test with multiple startups in different industries
2. Verify Flux background images appear in generated sites
3. Confirm Framer Motion animations work in production
4. Monitor v0 API responses for quality
5. Adjust industry palettes based on user feedback