# Qrew — AI Founder OS

## What We're Building
Qrew is a virtual company OS for solo founders. Users create AI employees (Research, Strategy, Launch) that share company context and work together. Think Linear meets Notion meets an AI team.

## Design System — NON NEGOTIABLE
- **Aesthetic**: Dark, premium, bold. Like Vercel + Linear + Framer had a baby.
- **Background**: #0A0A0A (near black, not pure black)
- **Surface**: #111111 (cards, panels)
- **Border**: #1F1F1F (subtle borders everywhere)
- **Primary accent**: #6366F1 (indigo — buttons, highlights, active states)
- **Secondary accent**: #10B981 (emerald — success, online status, positive)
- **Text primary**: #F5F5F5
- **Text secondary**: #A3A3A3
- **Text tertiary**: #525252
- **Font display**: Clash Display or Cal Sans for headings
- **Font body**: Inter for body text
- **Border radius**: 12px for cards, 8px for inputs, 6px for badges
- **Shadows**: Use glow effects with accent color, not grey box shadows

## Animation Rules
- Use Framer Motion for ALL animations
- Page transitions: fade + slight upward movement (y: 20 to 0, opacity 0 to 1)
- Stagger children animations with 0.05s delay between items
- Hover states: subtle scale (1.02) + border color change
- Loading states: skeleton shimmer, never spinners
- Employee "thinking": animated dots, streaming text character by character

## Component Conventions
- Never use plain divs for cards — always use the Card component with custom styling
- All buttons use our Button component with custom variants
- Icons: Lucide React only
- Every interactive element must have a hover state
- Every page must have a subtle gradient or texture in background

## Project Structure
- src/app/ — Next.js App Router pages
- src/components/ui/ — shadcn base components (don't edit these)
- src/components/qrew/ — our custom Qrew components (build here)
- src/lib/ — utilities, helpers, constants
- src/types/ — TypeScript types

## Key Pages to Build
1. / — Landing page (marketing, not app)
2. /app — Main workspace (split view: sidebar + chat + output)
3. /onboarding — 3 question company setup flow
4. /login — Google OAuth sign in

## Split View Workspace Layout
- Left sidebar (240px): Logo, company name, employee list, settings
- Center panel (flex-1): Chat interface with streaming messages
- Right panel (380px): Output renderer (reports, roadmaps, copy)
- Mobile: Stack vertically, sidebar becomes bottom nav

## Employee System
Each employee has:
- name: string (e.g. "Alex")
- role: "research" | "strategy" | "launch"
- avatar: emoji or generated avatar
- status: "idle" | "thinking" | "done"
- color: unique accent per employee

## Output Types per Employee
- Research: Structured report with sections, competitor table, PDF export button
- Strategy: Visual roadmap with phases, task cards, timeline
- Launch: Copy blocks (PH, X posts, Reddit, email) with copy buttons

## Code Rules
- TypeScript strict mode always
- No any types ever
- All API calls go through src/lib/api.ts
- All Claude API calls stream responses
- Environment variables in .env.local — never hardcode keys
- Every component must be mobile responsive

## Commands
- npm run dev — start on localhost:3000
- npm run build — production build
- npm run lint — ESLint check
