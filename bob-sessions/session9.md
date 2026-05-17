**User:**

<task>
Agreed. Too much glow, too busy, looks amateur.
Paste this to Bob:

In ~/Desktop/qrew, completely simplify the landing page src/app/page.tsx. The current design is over-engineered and looks unprofessional.
Design philosophy: Less is more. Think Linear.app, Vercel.com — clean, minimal, confident.
Rules:

NO particles, NO floating orbs, NO aurora effects, NO animated gradients
NO excessive glows or neon effects
Simple dark background: #0A0A0A — nothing else
One subtle static gradient at top center maximum

What the page should have:
Navbar: Logo left ("qrew" in white, small), "Sign in" button right — minimal, no background
Hero:

Small badge: "5 AI Agents · One Idea · Live in Minutes" — simple pill, subtle border
Headline: "Your AI Startup Team" — large, clean, white. "Startup" in indigo #6366F1, no gradient
Subheadline: one clean line, muted gray
Input box: clean, simple border, no glow — placeholder cycles through ideas
"Build Now →" button: solid indigo, no shimmer
"Press Enter to start" — small muted text below

Agents row: 5 small circular icons in a row, agent name below each — simple, no rings, no animations
Footer: "© 2026 Qrew · Built by Bhavesh Khatri" — minimal
Animations: Only subtle fade-in on page load. Nothing else.
Agent cards section below: Simple grid, dark cards with subtle border, agent icon + name + role + one line description. No hover glow.
Do not break: Any functionality, routing, idea submission
Clean build, no TypeScript errors.
</task>
<environment_details>
# VSCode Visible Files
src/app/page.tsx

# VSCode Open Tabs
src/components/ProfessionalIDE.tsx,src/app/api/startups/[startupId]/brand/route.ts,FIXES_SUMMARY.md,src/app/api/startups/[startupId]/download/route.ts,src/components/qrew/dashboard.tsx,src/app/globals.css,src/app/app/[startupId]/page.tsx,UI_POLISH_SUMMARY.md,src/app/app/[startupId]/build/page.tsx,src/components/qrew/mcq-popup.tsx,src/components/qrew/report-view.tsx,src/app/app/[startupId]/team/page.tsx,src/lib/code-generator.ts,src/app/login/page.tsx,README.md,src/app/page.tsx

# Current Time
Current time in ISO 8601 UTC format: 2026-05-16T18:57:21.786Z
User time zone: Asia/Calcutta, UTC+5:30

# Current Cost
$0.00

# Review Exclusions
The following file patterns are excluded from code reviews:
- .vscode/**

# Current Mode
<slug>code</slug>
<name>💻 Code</name>


# Current Workspace Directory (/Users/bhavesh/Desktop/qrew) Files
.gitignore
AGENTS.md
CLAUDE.md
components.json
eslint.config.mjs
FIXES_SUMMARY.md
next.config.ts
package-lock.json
package.json
postcss.config.mjs
README.md
supabase-patch-credentials.sql
supabase-patch-dodo.sql
supabase-patch-github.sql
supabase-patch-profiles.sql
supabase-patch-razorpay.sql
supabase-patch-statuses.sql
supabase-schema.sql
tsconfig.json
UI_POLISH_SUMMARY.md
.claude/
public/
public/file.svg
public/globe.svg
public/next.svg
public/vercel.svg
public/window.svg
src/
src/app/
src/app/favicon.ico
src/app/globals.css
src/app/layout.tsx
src/app/page.tsx
src/app/api/
src/app/api/agents/
src/app/api/agents/chat/
src/app/api/agents/chat/route.ts
src/app/api/auth/
src/app/api/auth/github/
src/app/api/auth/github/route.ts
src/app/api/auth/github/callback/
src/app/api/auth/github/callback/route.ts
src/app/api/auth/stripe/
src/app/api/auth/stripe/route.ts
src/app/api/auth/stripe/callback/
src/app/api/auth/stripe/callback/route.ts
src/app/api/auth/supabase/
src/app/api/auth/supabase/route.ts
src/app/api/auth/supabase/callback/
src/app/api/auth/supabase/callback/route.ts
src/app/api/chat/
src/app/api/chat/route.ts
src/app/api/deploy/
src/app/api/deploy/vercel/
src/app/api/deploy/vercel/route.ts
src/app/api/github/
src/app/api/github/push/
src/app/api/github/push/route.ts
src/app/api/payments/
src/app/api/payments/checkout/
src/app/api/payments/checkout/route.ts
src/app/api/payments/products/
src/app/api/payments/products/create/
src/app/api/payments/products/create/route.ts
src/app/api/payments/webhook/
src/app/api/payments/webhook/route.ts
src/app/api/pipeline/
src/app/api/process-idea/
src/app/api/process-idea/route.ts
src/app/api/process-idea/rename/
src/app/api/process-idea/rename/route.ts
src/app/api/startups/
src/app/api/startups/[startupId]/
src/app/api/startups/[startupId]/route.ts
src/app/api/startups/[startupId]/brand/
src/app/api/startups/[startupId]/brand/route.ts
src/app/api/startups/[startupId]/build/route.ts
src/app/api/startups/[startupId]/build/cancel/route.ts
src/app/api/startups/[startupId]/credentials/
src/app/api/startups/[startupId]/credentials/route.ts
src/app/api/startups/[startupId]/deploy/
src/app/api/startups/[startupId]/deploy/route.ts
src/app/api/startups/[startupId]/download/
src/app/api/startups/[startupId]/download/route.ts
src/app/api/startups/[startupId]/generate/
src/app/api/startups/[startupId]/generate/route.ts
src/app/api/startups/[startupId]/mcqs/
src/app/api/startups/[startupId]/mcqs/route.ts
src/app/api/startups/[startupId]/supabase-keys/
src/app/api/startups/[startupId]/supabase-keys/route.ts
src/app/api/startups/status/
src/app/api/startups/status/route.ts
src/app/api/user/
src/app/api/user/github-status/
src/app/api/user/github-status/route.ts
src/app/app/
src/app/app/layout.tsx
src/app/app/page.tsx
src/app/app/[startupId]/
src/app/app/[startupId]/page.tsx
src/app/app/[startupId]/build/page.tsx
src/app/app/[startupId]/connect-supabase/
src/app/app/[startupId]/connect-supabase/page.tsx
src/app/app/[startupId]/process/
src/app/app/[startupId]/process/page.tsx
src/app/app/[startupId]/team/
src/app/app/[startupId]/team/page.tsx
src/app/auth/
src/app/auth/callback/
src/app/auth/callback/route.ts
src/app/login/
src/app/login/page.tsx
src/app/onboarding/
src/components/
src/components/BuildIDE.tsx
src/components/ProfessionalIDE.tsx
src/components/WebContainerPreview.tsx
src/components/qrew/
src/components/qrew/add-company-modal.tsx
src/components/qrew/agent-chat-panel.tsx
src/components/qrew/CreditsModal.tsx
src/components/qrew/dashboard.tsx
src/components/qrew/mcq-popup.tsx
src/components/qrew/providers.tsx
src/components/qrew/report-panel.tsx
src/components/qrew/report-view.tsx
src/components/ui/
src/components/ui/avatar.tsx
src/components/ui/badge.tsx
src/components/ui/button.tsx
src/components/ui/card.tsx
src/components/ui/input.tsx
src/components/ui/separator.tsx
src/components/ui/tooltip.tsx
src/hooks/
src/lib/
src/lib/ai-router.ts
src/lib/code-generator.ts
src/lib/credits.ts
src/lib/dodo.ts
src/lib/github.ts
src/lib/pdf-export.ts
src/lib/supabase-server.ts
src/lib/supabase.ts
src/lib/utils.ts
src/types/
src/types/index.ts
supabase/
supabase/migrations/
supabase/migrations/001_initial_schema.sql
You have not created a todo list yet. Create one with `update_todo_list` if your task is complicated or involves multiple steps.
</environment_details>

---

**Assistant:**

I'll help you completely simplify the landing page to achieve a clean, minimal design like Linear.app and Vercel.com. Let me first read the current page.tsx to understand what needs to be changed.

<read_file>
<args>
<file>
<path>src/app/page.tsx</path>
</file>
</args>
</read_file>

---

**User:**

[read_file for 'src/app/page.tsx'. Reading multiple files at once is more efficient for the LLM. If other files are relevant to your current task, please read them simultaneously.] Result:
<files>
<file><path>src/app/page.tsx</path>
<content lines="1-471">
  1 | "use client";
  2 | 
  3 | import { useState, useEffect, useRef } from "react";
  4 | import { useRouter } from "next/navigation";
  5 | import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
  6 | import { ArrowRight, Sparkles, Check, ChevronDown } from "lucide-react";
  7 | 
  8 | const EXAMPLES = [
  9 |   "A fitness app for busy moms who want 10-minute home workouts",
 10 |   "SaaS tool that auto-generates legal contracts for freelancers",
 11 |   "Marketplace connecting college students with local tutors",
 12 |   "AI-powered meal planner that syncs with your grocery delivery",
 13 | ];
 14 | 
 15 | const AGENTS = [
 16 |   { name: "Alex", role: "Research", color: "#6366F1", emoji: "🔍", desc: "Market analysis" },
 17 |   { name: "Sam", role: "Strategy", color: "#10B981", emoji: "📊", desc: "Business plan" },
 18 |   { name: "Jordan", role: "Design", color: "#F59E0B", emoji: "🎨", desc: "Brand identity" },
 19 |   { name: "Morgan", role: "Dev", color: "#3B82F6", emoji: "💻", desc: "Full codebase" },
 20 |   { name: "Riley", role: "Launch", color: "#EF4444", emoji: "🚀", desc: "Deploy live" },
 21 | ];
 22 | 
 23 | export default function LandingPage() {
 24 |   const router = useRouter();
 25 |   const [idea, setIdea] = useState("");
 26 |   const [placeholder, setPlaceholder] = useState(0);
 27 |   const [isFocused, setIsFocused] = useState(false);
 28 |   const [particles, setParticles] = useState<Array<{ left: number; top: number; color: string; delay: number }>>([]);
 29 |   const inputRef = useRef<HTMLTextAreaElement>(null);
 30 |   const { scrollY } = useScroll();
 31 |   const heroOpacity = useTransform(scrollY, [0, 400], [1, 0]);
 32 |   const heroScale = useTransform(scrollY, [0, 400], [1, 0.9]);
 33 | 
 34 |   useEffect(() => {
 35 |     const interval = setInterval(() => {
 36 |       setPlaceholder((p) => (p + 1) % EXAMPLES.length);
 37 |     }, 4000);
 38 |     return () => clearInterval(interval);
 39 |   }, []);
 40 | 
 41 |   // Generate particles client-side only to avoid hydration mismatch
 42 |   useEffect(() => {
 43 |     const colors = ["#6366F1", "#8B5CF6", "#10B981"];
 44 |     const newParticles = Array.from({ length: 10 }, (_, i) => ({
 45 |       left: Math.random() * 100,
 46 |       top: Math.random() * 100,
 47 |       color: colors[i % colors.length],
 48 |       delay: Math.random() * 5,
 49 |     }));
 50 |     setParticles(newParticles);
 51 |   }, []);
 52 | 
 53 |   const handleBuild = () => {
 54 |     const trimmed = idea.trim();
 55 |     if (!trimmed) return;
 56 |     sessionStorage.setItem("qrew_pending_idea", trimmed);
 57 |     router.push("/login");
 58 |   };
 59 | 
 60 |   const scrollToAgents = () => {
 61 |     document.getElementById("agents")?.scrollIntoView({ behavior: "smooth" });
 62 |   };
 63 | 
 64 |   return (
 65 |     <div className="relative min-h-screen flex flex-col overflow-hidden" style={{ background: "#000000" }}>
 66 |       {/* Simplified background */}
 67 |       <div className="pointer-events-none fixed inset-0 overflow-hidden">
 68 |         {/* Subtle aurora gradient */}
 69 |         <motion.div
 70 |           animate={{
 71 |             background: [
 72 |               "radial-gradient(ellipse 80% 50% at 50% -20%, rgba(99,102,241,0.15), transparent 70%)",
 73 |               "radial-gradient(ellipse 80% 50% at 55% -20%, rgba(139,92,246,0.12), transparent 70%)",
 74 |               "radial-gradient(ellipse 80% 50% at 45% -20%, rgba(99,102,241,0.15), transparent 70%)",
 75 |             ],
 76 |           }}
 77 |           transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
 78 |           className="absolute inset-0"
 79 |         />
 80 | 
 81 |         {/* Minimal floating particles - client-side only */}
 82 |         {particles.map((particle, i) => (
 83 |           <motion.div
 84 |             key={i}
 85 |             animate={{
 86 |               y: [0, -100, 0],
 87 |               opacity: [0, 0.6, 0],
 88 |               scale: [0, 1, 0],
 89 |             }}
 90 |             transition={{
 91 |               duration: 5,
 92 |               repeat: Infinity,
 93 |               delay: particle.delay,
 94 |               ease: "easeInOut"
 95 |             }}
 96 |             className="absolute w-1 h-1 rounded-full"
 97 |             style={{
 98 |               background: particle.color,
 99 |               left: `${particle.left}%`,
100 |               top: `${particle.top}%`,
101 |               boxShadow: `0 0 8px ${particle.color}`,
102 |             }}
103 |           />
104 |         ))}
105 |       </div>
106 | 
107 |       {/* Nav */}
108 |       <motion.nav
109 |         initial={{ opacity: 0, y: -20 }}
110 |         animate={{ opacity: 1, y: 0 }}
111 |         className="relative z-10 flex items-center justify-between px-6 py-6 max-w-7xl mx-auto w-full"
112 |       >
113 |         <div className="flex items-center gap-3">
114 |           <motion.div
115 |             animate={{ rotate: [0, 360] }}
116 |             transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
117 |             className="w-10 h-10 rounded-xl flex items-center justify-center relative"
118 |             style={{ background: "linear-gradient(135deg, #6366F1, #8B5CF6)" }}
119 |           >
120 |             <Sparkles size={18} color="#fff" />
121 |             <motion.div
122 |               className="absolute inset-0 rounded-xl"
123 |               animate={{ scale: [1, 1.3], opacity: [0.5, 0] }}
124 |               transition={{ duration: 2, repeat: Infinity }}
125 |               style={{ border: "2px solid #6366F1" }}
126 |             />
127 |           </motion.div>
128 |           <span className="text-2xl font-bold tracking-tight" style={{ letterSpacing: "-0.05em" }}>
129 |             qrew
130 |           </span>
131 |         </div>
132 |         <motion.button
133 |           whileHover={{ scale: 1.05 }}
134 |           whileTap={{ scale: 0.95 }}
135 |           onClick={() => router.push("/login")}
136 |           className="text-sm px-6 py-2.5 rounded-xl font-semibold transition-all"
137 |           style={{ 
138 |             background: "rgba(255,255,255,0.06)", 
139 |             border: "1px solid rgba(255,255,255,0.1)",
140 |             backdropFilter: "blur(10px)"
141 |           }}
142 |         >
143 |           Sign in
144 |         </motion.button>
145 |       </motion.nav>
146 | 
147 |       {/* Hero */}
148 |       <main className="relative z-10 flex flex-col items-center justify-center flex-1 px-4 text-center pt-12 pb-32">
149 |         <motion.div
150 |           style={{ opacity: heroOpacity, scale: heroScale }}
151 |           className="flex flex-col items-center gap-10 max-w-5xl w-full"
152 |         >
153 |           {/* Badge */}
154 |           <motion.div
155 |             initial={{ opacity: 0, y: 20 }}
156 |             animate={{ opacity: 1, y: 0 }}
157 |             transition={{ duration: 0.8, delay: 0.2 }}
158 |           >
159 |             <motion.div
160 |               animate={{ 
161 |                 boxShadow: [
162 |                   "0 0 30px rgba(99,102,241,0.3)", 
163 |                   "0 0 50px rgba(99,102,241,0.5)", 
164 |                   "0 0 30px rgba(99,102,241,0.3)"
165 |                 ] 
166 |               }}
167 |               transition={{ duration: 3, repeat: Infinity }}
168 |               className="inline-flex items-center gap-3 rounded-full border px-6 py-3 backdrop-blur-xl"
169 |               style={{ 
170 |                 borderColor: "rgba(99,102,241,0.4)", 
171 |                 background: "rgba(99,102,241,0.1)",
172 |               }}
173 |             >
174 |               <motion.div
175 |                 animate={{ scale: [1, 1.3, 1], opacity: [1, 0.5, 1] }}
176 |                 transition={{ duration: 2, repeat: Infinity }}
177 |                 className="h-2.5 w-2.5 rounded-full"
178 |                 style={{ background: "#10B981", boxShadow: "0 0 10px #10B981" }}
179 |               />
180 |               <span className="text-sm font-bold" style={{ color: "#F5F5F5" }}>
181 |                 5 AI agents · One idea · Live in minutes
182 |               </span>
183 |             </motion.div>
184 |           </motion.div>
185 | 
186 |           {/* Headline - Clean and centered */}
187 |           <motion.div
188 |             initial={{ opacity: 0, y: 30 }}
189 |             animate={{ opacity: 1, y: 0 }}
190 |             transition={{ duration: 0.8, delay: 0.4 }}
191 |             className="space-y-6"
192 |           >
193 |             <h1
194 |               className="text-6xl sm:text-7xl md:text-8xl font-black tracking-tight leading-tight"
195 |               style={{ letterSpacing: "-0.04em" }}
196 |             >
197 |               <span style={{ color: "#F5F5F5" }}>Build Your </span>
198 |               <span
199 |                 className="bg-clip-text text-transparent relative inline-block"
200 |                 style={{
201 |                   backgroundImage: "linear-gradient(135deg, #6366F1 0%, #8B5CF6 50%, #EC4899 100%)",
202 |                 }}
203 |               >
204 |                 Startup
205 |                 <motion.div
206 |                   className="absolute -inset-2 blur-xl opacity-40"
207 |                   animate={{
208 |                     background: [
209 |                       "linear-gradient(135deg, #6366F1, #8B5CF6)",
210 |                       "linear-gradient(135deg, #8B5CF6, #EC4899)",
211 |                       "linear-gradient(135deg, #6366F1, #8B5CF6)",
212 |                     ]
213 |                   }}
214 |                   transition={{ duration: 5, repeat: Infinity }}
215 |                 />
216 |               </span>
217 |               <span style={{ color: "#F5F5F5" }}> With AI</span>
218 |             </h1>
219 |             <motion.p
220 |               initial={{ opacity: 0 }}
221 |               animate={{ opacity: 1 }}
222 |               transition={{ delay: 0.6 }}
223 |               className="text-xl sm:text-2xl max-w-3xl mx-auto leading-relaxed"
224 |               style={{ color: "#9CA3AF" }}
225 |             >
226 |               Your AI team researches, designs, codes, and deploys your startup.
227 |               <br />
228 |               <span className="font-semibold" style={{ color: "#6366F1" }}>
229 |                 From idea to live product in one session.
230 |               </span>
231 |             </motion.p>
232 |           </motion.div>
233 | 
234 |           {/* Input - The Centerpiece */}
235 |           <motion.div
236 |             initial={{ opacity: 0, y: 30 }}
237 |             animate={{ opacity: 1, y: 0 }}
238 |             transition={{ duration: 0.8, delay: 0.8 }}
239 |             className="w-full max-w-4xl relative"
240 |           >
241 |             {/* Glow effect */}
242 |             <motion.div
243 |               className="absolute -inset-4 rounded-3xl blur-2xl"
244 |               animate={{
245 |                 opacity: isFocused ? [0.3, 0.6, 0.3] : 0.2,
246 |                 scale: isFocused ? [1, 1.05, 1] : 1,
247 |               }}
248 |               transition={{ duration: 2, repeat: Infinity }}
249 |               style={{ 
250 |                 background: "linear-gradient(135deg, #6366F1, #8B5CF6, #EC4899)",
251 |               }}
252 |             />
253 |             
254 |             <motion.div
255 |               animate={{
256 |                 borderColor: isFocused 
257 |                   ? ["rgba(99,102,241,0.5)", "rgba(139,92,246,0.5)", "rgba(99,102,241,0.5)"]
258 |                   : "rgba(99,102,241,0.3)",
259 |                 boxShadow: isFocused
260 |                   ? ["0 0 40px rgba(99,102,241,0.3)", "0 0 60px rgba(139,92,246,0.4)", "0 0 40px rgba(99,102,241,0.3)"]
261 |                   : "0 20px 60px rgba(0,0,0,0.5)",
262 |               }}
263 |               transition={{ duration: 3, repeat: Infinity }}
264 |               className="relative flex items-center gap-4 rounded-3xl border-2 p-3 backdrop-blur-xl"
265 |               style={{ 
266 |                 background: "rgba(10,10,10,0.8)",
267 |               }}
268 |             >
269 |               <textarea
270 |                 ref={inputRef}
271 |                 value={idea}
272 |                 onChange={(e) => setIdea(e.target.value)}
273 |                 onFocus={() => setIsFocused(true)}
274 |                 onBlur={() => setIsFocused(false)}
275 |                 onKeyDown={(e) => {
276 |                   if (e.key === "Enter" && !e.shiftKey) {
277 |                     e.preventDefault();
278 |                     handleBuild();
279 |                   }
280 |                 }}
281 |                 placeholder={EXAMPLES[placeholder]}
282 |                 rows={3}
283 |                 className="flex-1 resize-none bg-transparent px-6 py-5 text-lg leading-relaxed outline-none"
284 |                 style={{ color: "#F5F5F5" }}
285 |               />
286 |               <motion.button
287 |                 whileHover={{ scale: 1.05 }}
288 |                 whileTap={{ scale: 0.95 }}
289 |                 onClick={handleBuild}
290 |                 disabled={!idea.trim()}
291 |                 className="flex shrink-0 items-center gap-2 rounded-2xl px-8 py-5 text-base font-bold text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed relative overflow-hidden"
292 |                 style={{
293 |                   background: idea.trim() 
294 |                     ? "linear-gradient(135deg, #6366F1, #8B5CF6)" 
295 |                     : "rgba(255,255,255,0.05)",
296 |                 }}
297 |               >
298 |                 {idea.trim() && (
299 |                   <motion.div
300 |                     className="absolute inset-0"
301 |                     animate={{ 
302 |                       background: [
303 |                         "linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)",
304 |                         "linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)"
305 |                       ],
306 |                       x: ["-100%", "200%"]
307 |                     }}
308 |                     transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
309 |                   />
310 |                 )}
311 |                 <span className="relative z-10">Build Now</span>
312 |                 <ArrowRight size={18} className="relative z-10" />
313 |               </motion.button>
314 |             </motion.div>
315 |             
316 |             <motion.p
317 |               initial={{ opacity: 0 }}
318 |               animate={{ opacity: 1 }}
319 |               transition={{ delay: 1 }}
320 |               className="mt-4 text-sm text-center flex items-center justify-center gap-2"
321 |               style={{ color: "#6B7280" }}
322 |             >
323 |               <kbd className="px-3 py-1 rounded-lg text-xs font-mono" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}>
324 |                 Enter ↵
325 |               </kbd>
326 |               <span>to start building</span>
327 |               <span className="mx-2">·</span>
328 |               <span className="font-semibold" style={{ color: "#10B981" }}>Free 1 credit on signup</span>
329 |             </motion.p>
330 |           </motion.div>
331 | 
332 |           {/* Agent avatars below input */}
333 |           <motion.div
334 |             initial={{ opacity: 0, y: 20 }}
335 |             animate={{ opacity: 1, y: 0 }}
336 |             transition={{ duration: 0.8, delay: 1.2 }}
337 |             className="flex flex-col items-center gap-6"
338 |           >
339 |             <div className="flex items-center gap-3">
340 |               {AGENTS.map((agent, i) => (
341 |                 <motion.div
342 |                   key={agent.name}
343 |                   initial={{ opacity: 0, scale: 0 }}
344 |                   animate={{ opacity: 1, scale: 1 }}
345 |                   transition={{ delay: 1.3 + i * 0.1, type: "spring", stiffness: 300 }}
346 |                   whileHover={{ scale: 1.2, y: -5 }}
347 |                   className="relative w-14 h-14 rounded-2xl flex items-center justify-center text-2xl cursor-pointer"
348 |                   style={{ 
349 |                     background: `${agent.color}20`,
350 |                     border: `2px solid ${agent.color}40`,
351 |                     boxShadow: `0 4px 20px ${agent.color}30`
352 |                   }}
353 |                   title={`${agent.name} - ${agent.role}`}
354 |                 >
355 |                   {agent.emoji}
356 |                   <motion.div
357 |                     className="absolute inset-0 rounded-2xl"
358 |                     animate={{ scale: [1, 1.3], opacity: [0.5, 0] }}
359 |                     transition={{ duration: 2, repeat: Infinity, delay: i * 0.3 }}
360 |                     style={{ border: `2px solid ${agent.color}` }}
361 |                   />
362 |                 </motion.div>
363 |               ))}
364 |             </div>
365 |             <motion.p
366 |               initial={{ opacity: 0 }}
367 |               animate={{ opacity: 1 }}
368 |               transition={{ delay: 1.8 }}
369 |               className="text-sm font-medium"
370 |               style={{ color: "#9CA3AF" }}
371 |             >
372 |               <span style={{ color: "#6366F1" }}>Your team is waiting</span> · Ready to build
373 |             </motion.p>
374 |           </motion.div>
375 | 
376 |           {/* Scroll indicator */}
377 |           <motion.button
378 |             initial={{ opacity: 0 }}
379 |             animate={{ opacity: 1, y: [0, 10, 0] }}
380 |             transition={{ opacity: { delay: 2 }, y: { duration: 2, repeat: Infinity } }}
381 |             onClick={scrollToAgents}
382 |             className="mt-12 flex flex-col items-center gap-2 text-xs font-medium"
383 |             style={{ color: "#6B7280" }}
384 |           >
385 |             <span>Meet your team</span>
386 |             <ChevronDown size={20} />
387 |           </motion.button>
388 |         </motion.div>
389 |       </main>
390 | 
391 |       {/* Social proof line */}
392 |       <motion.div
393 |         initial={{ opacity: 0 }}
394 |         whileInView={{ opacity: 1 }}
395 |         viewport={{ once: true }}
396 |         className="relative z-10 text-center py-12 border-t"
397 |         style={{ borderColor: "rgba(255,255,255,0.05)" }}
398 |       >
399 |         <p className="text-sm font-medium" style={{ color: "#6B7280" }}>
400 |           Join <span className="font-bold" style={{ color: "#6366F1" }}>founders building with AI</span> · Ship faster than ever
401 |         </p>
402 |       </motion.div>
403 | 
404 |       {/* Agents section */}
405 |       <section id="agents" className="relative z-10 py-32 px-4">
406 |         <div className="max-w-7xl mx-auto">
407 |           <motion.div
408 |             initial={{ opacity: 0, y: 40 }}
409 |             whileInView={{ opacity: 1, y: 0 }}
410 |             viewport={{ once: true }}
411 |             transition={{ duration: 0.8 }}
412 |             className="text-center mb-20"
413 |           >
414 |             <h2 className="text-5xl sm:text-6xl font-bold mb-6" style={{ letterSpacing: "-0.03em" }}>
415 |               Your AI Founding Team
416 |             </h2>
417 |             <p className="text-xl max-w-2xl mx-auto" style={{ color: "#9CA3AF" }}>
418 |               Five specialized agents work together to build your startup from scratch
419 |             </p>
420 |           </motion.div>
421 | 
422 |           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
423 |             {AGENTS.map((agent, i) => (
424 |               <motion.div
425 |                 key={agent.name}
426 |                 initial={{ opacity: 0, y: 40 }}
427 |                 whileInView={{ opacity: 1, y: 0 }}
428 |                 viewport={{ once: true }}
429 |                 transition={{ delay: i * 0.1, duration: 0.6 }}
430 |                 whileHover={{ y: -8, scale: 1.02 }}
431 |                 className="group rounded-3xl border p-8 backdrop-blur-xl relative overflow-hidden"
432 |                 style={{ 
433 |                   background: "rgba(17,17,17,0.6)", 
434 |                   borderColor: "rgba(255,255,255,0.05)" 
435 |                 }}
436 |                 onMouseEnter={(e) => {
437 |                   (e.currentTarget as HTMLDivElement).style.borderColor = `${agent.color}40`;
438 |                   (e.currentTarget as HTMLDivElement).style.boxShadow = `0 20px 60px ${agent.color}20`;
439 |                 }}
440 |                 onMouseLeave={(e) => {
441 |                   (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(255,255,255,0.05)";
442 |                   (e.currentTarget as HTMLDivElement).style.boxShadow = "none";
443 |                 }}
444 |               >
445 |                 <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" style={{ background: `radial-gradient(circle at 50% 0%, ${agent.color}10, transparent 70%)` }} />
446 |                 
447 |                 <div className="relative z-10">
448 |                   <div className="w-20 h-20 rounded-2xl flex items-center justify-center text-4xl mb-6 transition-transform group-hover:scale-110" style={{ background: `${agent.color}20`, border: `2px solid ${agent.color}40` }}>
449 |                     {agent.emoji}
450 |                   </div>
451 |                   <h3 className="text-2xl font-bold mb-2">{agent.name}</h3>
452 |                   <p className="text-sm font-semibold mb-4" style={{ color: agent.color }}>{agent.role}</p>
453 |                   <p className="text-sm leading-relaxed" style={{ color: "#9CA3AF" }}>{agent.desc}</p>
454 |                 </div>
455 |               </motion.div>
456 |             ))}
457 |           </div>
458 |         </div>
459 |       </section>
460 | 
461 |       {/* Footer */}
462 |       <footer className="relative z-10 text-center py-12 border-t" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
463 |         <p className="text-sm" style={{ color: "#6B7280" }}>
464 |           © 2026 Qrew · Built by Bhavesh Khatri
465 |         </p>
466 |       </footer>
467 |     </div>
468 |   );
469 | }
470 | 
471 | // Made with Bob
</content>
</file>
</files>
<environment_details>
# VSCode Visible Files
src/app/page.tsx

# VSCode Open Tabs
src/components/ProfessionalIDE.tsx,src/app/api/startups/[startupId]/brand/route.ts,FIXES_SUMMARY.md,src/app/api/startups/[startupId]/download/route.ts,src/components/qrew/dashboard.tsx,src/app/globals.css,src/app/app/[startupId]/page.tsx,UI_POLISH_SUMMARY.md,src/app/app/[startupId]/build/page.tsx,src/components/qrew/mcq-popup.tsx,src/components/qrew/report-view.tsx,src/app/app/[startupId]/team/page.tsx,src/lib/code-generator.ts,src/app/login/page.tsx,README.md,src/app/page.tsx

# Current Time
Current time in ISO 8601 UTC format: 2026-05-16T18:57:24.995Z
User time zone: Asia/Calcutta, UTC+5:30

# Current Cost
$0.01

# Review Exclusions
The following file patterns are excluded from code reviews:
- .vscode/**

# Current Mode
<slug>code</slug>
<name>💻 Code</name>
You have not created a todo list yet. Create one with `update_todo_list` if your task is complicated or involves multiple steps.
</environment_details>

---

**Assistant:**

I'll completely simplify the landing page to achieve a clean, minimal design like Linear.app and Vercel.com. Let me rewrite the entire page with the new design philosophy.

<write_to_file>
<path>src/app/page.tsx</path>
<content>"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

const EXAMPLES = [
  "A fitness app for busy moms who want 10-minute home workouts",
  "SaaS tool that auto-generates legal contracts for freelancers",
  "Marketplace connecting college students with local tutors",
  "AI-powered meal planner that syncs with your grocery delivery",
];

const AGENTS = [
  { name: "Alex", role: "Research", emoji: "🔍", desc: "Market analysis & competitive research" },
  { name: "Sam", role: "Strategy", emoji: "📊", desc: "Business plan & go-to-market strategy" },
  { name: "Jordan", role: "Design", emoji: "🎨", desc: "Brand identity & UI/UX design" },
  { name: "Morgan", role: "Dev", emoji: "💻", desc: "Full-stack codebase generation" },
  { name: "Riley", role: "Launch", emoji: "🚀", desc: "Deploy live to production" },
];

export default function LandingPage() {
  const router = useRouter();
  const [idea, setIdea] = useState("");
  const [placeholder, setPlaceholder] = useState(0);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setPlaceholder((p) => (p + 1) % EXAMPLES.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const handleBuild = () => {
    const trimmed = idea.trim();
    if (!trimmed) return;
    sessionStorage.setItem("qrew_pending_idea", trimmed);
    router.push("/login");
  };

  return (
    <div className="relative min-h-screen flex flex-col" style={{ background: "#0A0A0A" }}>
      {/* Subtle static gradient at top */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div
          className="absolute inset-0"
          style={{
            background: "radial-gradient(ellipse 80% 50% at 50% -20%, rgba(99,102,241,0.08), transparent 60%)",
          }}
        />
      </div>

      {/* Nav */}
      <motion.nav
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 flex items-center justify-between px-6 py-6 max-w-7xl mx-auto w-full"
      >
        <span className="text-xl font-semibold text-white">qrew</span>
        <button
          onClick={() => router.push("/login")}
          className="text-sm px-4 py-2 text-white/70 hover:text-white transition-colors"
        >
          Sign in
        </button>
      </motion.nav>

      {/* Hero */}
      <main className="relative z-10 flex flex-col items-center justify-center flex-1 px-4 text-center pt-20 pb-32">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex flex-col items-center gap-12 max-w-4xl w-full"
        >
          {/* Badge */}
          <div
            className="inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm text-white/80"
            style={{ borderColor: "rgba(255,255,255,0.1)" }}
          >
            5 AI Agents · One Idea · Live in Minutes
          </div>

          {/* Headline */}
          <div className="space-y-4">
            <h1 className="text-6xl sm:text-7xl md:text-8xl font-bold tracking-tight text-white">
              Your AI{" "}
              <span style={{ color: "#6366F1" }}>Startup</span>{" "}
              Team
            </h1>
            <p className="text-xl text-white/50 max-w-2xl mx-auto">
              From idea to live product in one session
            </p>
          </div>

          {/* Input */}
          <div className="w-full max-w-3xl">
            <div
              className="flex items-center gap-3 rounded-2xl border p-2"
              style={{
                background: "rgba(255,255,255,0.02)",
                borderColor: "rgba(255,255,255,0.1)",
              }}
            >
              <textarea
                ref={inputRef}
                value={idea}
                onChange={(e) => setIdea(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleBuild();
                  }
                }}
                placeholder={EXAMPLES[placeholder]}
                rows={2}
                className="flex-1 resize-none bg-transparent px-4 py-3 text-base text-white outline-none placeholder:text-white/30"
              />
              <button
                onClick={handleBuild}
                disabled={!idea.trim()}
                className="flex shrink-0 items-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                style={{
                  background: idea.trim() ? "#6366F1" : "rgba(255,255,255,0.05)",
                }}
              >
                Build Now
                <ArrowRight size={16} />
              </button>
            </div>
            <p className="mt-3 text-sm text-white/40">
              Press <kbd className="px-2 py-0.5 rounded text-xs" style={{ background: "rgba(255,255,255,0.05)" }}>Enter</kbd> to start
            </p>
          </div>

          {/* Agent avatars */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="flex items-center gap-4 mt-8"
          >
            {AGENTS.map((agent) => (
              <div key={agent.name} className="flex flex-col items-center gap-2">
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center text-xl"
                  style={{
                    background: "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(255,255,255,0.1)",
                  }}
                >
                  {agent.emoji}
                </div>
                <span className="text-xs text-white/50">{agent.name}</span>
              </div>
            ))}
          </motion.div>
        </motion.div>
      </main>

      {/* Agents section */}
      <section className="relative z-10 py-24 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">
              Your AI Founding Team
            </h2>
            <p className="text-lg text-white/50">
              Five specialized agents work together to build your startup
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {AGENTS.map((agent) => (
              <div
                key={agent.name}
                className="rounded-2xl border p-6"
                style={{
                  background: "rgba(255,255,255,0.02)",
                  borderColor: "rgba(255,255,255,0.1)",
                }}
              >
                <div
                  className="w-14 h-14 rounded-xl flex items-center justify-center text-2xl mb-4"
                  style={{
                    background: "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(255,255,255,0.1)",
                  }}
                >
                  {agent.emoji}
                </div>
                <h3 className="text-xl font-semibold text-white mb-1">
                  {agent.name}
                </h3>
                <p className="text-sm font-medium text-white/60 mb-3">
                  {agent.role}
                </p>
                <p className="text-sm text-white/40 leading-relaxed">
                  {agent.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer
        className="relative z-10 text-center py-8 border-t"
        style={{ borderColor: "rgba(255,255,255,0.1)" }}
      >
        <p className="text-sm text-white/40">
          © 2026 Qrew · Built by Bhavesh Khatri
        </p>
      </footer>
    </div>
  );
}
</content>
<line_count>223</line_count>
</write_to_file>

---

**User:**

[write_to_file for 'src/app/page.tsx'] Result:
<file_write_result>
<path>src/app/page.tsx</path>
<operation>modified</operation>
<notice>
<i>You do not need to re-read the file, as you have seen all changes</i>
<i>Proceed with the task using these changes as the new baseline.</i>
</notice>
</file_write_result>

<environment_details>
# VSCode Visible Files
src/app/page.tsx

# VSCode Open Tabs
src/components/ProfessionalIDE.tsx,src/app/api/startups/[startupId]/brand/route.ts,FIXES_SUMMARY.md,src/app/api/startups/[startupId]/download/route.ts,src/components/qrew/dashboard.tsx,src/app/globals.css,src/app/app/[startupId]/page.tsx,UI_POLISH_SUMMARY.md,src/app/app/[startupId]/build/page.tsx,src/components/qrew/mcq-popup.tsx,src/components/qrew/report-view.tsx,src/app/app/[startupId]/team/page.tsx,src/lib/code-generator.ts,src/app/login/page.tsx,README.md,src/app/page.tsx

# Recently Modified Files
These files have been modified since you last accessed them (file was just edited so you may need to re-read it before editing):
src/app/page.tsx

# Current Time
Current time in ISO 8601 UTC format: 2026-05-16T18:57:55.512Z
User time zone: Asia/Calcutta, UTC+5:30

# Current Cost
$0.05

# Review Exclusions
The following file patterns are excluded from code reviews:
- .vscode/**

# Current Mode
<slug>code</slug>
<name>💻 Code</name>
You have not created a todo list yet. Create one with `update_todo_list` if your task is complicated or involves multiple steps.
</environment_details>

---

**Assistant:**

Now let me verify the build to ensure there are no TypeScript errors:

<execute_command>
<command>cd /Users/bhavesh/Desktop/qrew && npm run build</command>
</execute_command>

---

**User:**

[execute_command for 'cd /Users/bhavesh/Desktop/qrew && npm run build'] Result:
Command is still running in terminal  from '/Users/bhavesh/Desktop/qrew'.


You will be updated on the terminal status and new output in the future.
<environment_details>
# VSCode Visible Files
src/app/page.tsx

# VSCode Open Tabs
src/components/ProfessionalIDE.tsx,src/app/api/startups/[startupId]/brand/route.ts,FIXES_SUMMARY.md,src/app/api/startups/[startupId]/download/route.ts,src/components/qrew/dashboard.tsx,src/app/globals.css,src/app/app/[startupId]/page.tsx,UI_POLISH_SUMMARY.md,src/app/app/[startupId]/build/page.tsx,src/components/qrew/mcq-popup.tsx,src/components/qrew/report-view.tsx,src/app/app/[startupId]/team/page.tsx,src/lib/code-generator.ts,src/app/login/page.tsx,README.md,src/app/page.tsx

# Current Time
Current time in ISO 8601 UTC format: 2026-05-16T18:58:09.588Z
User time zone: Asia/Calcutta, UTC+5:30

# Current Cost
$0.09

# Review Exclusions
The following file patterns are excluded from code reviews:
- .vscode/**

# Current Mode
<slug>code</slug>
<name>💻 Code</name>
You have not created a todo list yet. Create one with `update_todo_list` if your task is complicated or involves multiple steps.
</environment_details>

---

**Assistant:**

I'll wait for the build to complete to verify there are no TypeScript errors.

---

**User:**

[ERROR] You did not use a tool in your previous response! Please retry with a tool use.

# Reminder: Instructions for Tool Use

Tool uses are formatted using XML-style tags. The tool name itself becomes the XML tag name. Each parameter is enclosed within its own set of tags. Here's the structure:

<actual_tool_name>
<parameter1_name>value1</parameter1_name>
<parameter2_name>value2</parameter2_name>
...
</actual_tool_name>

For example, to use the attempt_completion tool:

<attempt_completion>
<result>
I have completed the task...
</result>
</attempt_completion>

Always use the actual tool name as the XML tag name for proper parsing and execution.

# Next Steps

If you have completed the user's task, use the attempt_completion tool.
If you require additional information from the user, use the ask_followup_question tool.
Otherwise, if you have not completed the task and do not need additional information, then proceed with the next step of the task.
(This is an automated message, so do not respond to it conversationally.)
<environment_details>
# VSCode Visible Files
src/app/page.tsx

# VSCode Open Tabs
src/components/ProfessionalIDE.tsx,src/app/api/startups/[startupId]/brand/route.ts,FIXES_SUMMARY.md,src/app/api/startups/[startupId]/download/route.ts,src/components/qrew/dashboard.tsx,src/app/globals.css,src/app/app/[startupId]/page.tsx,UI_POLISH_SUMMARY.md,src/app/app/[startupId]/build/page.tsx,src/components/qrew/mcq-popup.tsx,src/components/qrew/report-view.tsx,src/app/app/[startupId]/team/page.tsx,src/lib/code-generator.ts,src/app/login/page.tsx,README.md,src/app/page.tsx

# Current Time
Current time in ISO 8601 UTC format: 2026-05-16T18:58:12.138Z
User time zone: Asia/Calcutta, UTC+5:30

# Current Cost
$0.14

# Review Exclusions
The following file patterns are excluded from code reviews:
- .vscode/**

# Current Mode
<slug>code</slug>
<name>💻 Code</name>
You have not created a todo list yet. Create one with `update_todo_list` if your task is complicated or involves multiple steps.
</environment_details>

---

**Assistant:**

<execute_command>
<command>echo "Waiting for build to complete..."</command>
</execute_command>

---

**User:**

[execute_command for 'echo "Waiting for build to complete..."'] Result:
Command executed in terminal  within working directory '/Users/bhavesh/Desktop/qrew'. Exit code: 0
Output:
Waiting for build to complete...

<environment_details>
# VSCode Visible Files
src/app/page.tsx

# VSCode Open Tabs
src/components/ProfessionalIDE.tsx,src/app/api/startups/[startupId]/brand/route.ts,FIXES_SUMMARY.md,src/app/api/startups/[startupId]/download/route.ts,src/components/qrew/dashboard.tsx,src/app/globals.css,src/app/app/[startupId]/page.tsx,UI_POLISH_SUMMARY.md,src/app/app/[startupId]/build/page.tsx,src/components/qrew/mcq-popup.tsx,src/components/qrew/report-view.tsx,src/app/app/[startupId]/team/page.tsx,src/lib/code-generator.ts,src/app/login/page.tsx,README.md,src/app/page.tsx

# Current Time
Current time in ISO 8601 UTC format: 2026-05-16T18:58:18.430Z
User time zone: Asia/Calcutta, UTC+5:30

# Current Cost
$0.18

# Review Exclusions
The following file patterns are excluded from code reviews:
- .vscode/**

# Current Mode
<slug>code</slug>
<name>💻 Code</name>
You have not created a todo list yet. Create one with `update_todo_list` if your task is complicated or involves multiple steps.
</environment_details>

---

**Assistant:**

<ask_followup_question>
<question>The build command is still running. Could you please let me know when it completes and share the output? I want to verify there are no TypeScript errors before marking the task complete.</question>
</ask_followup_question>

---

**User:**

[ask_followup_question for 'The build command is still running. Could you please let me know when it completes and share the output? I want to verify there are no TypeScript errors before marking the task complete.'] Result:
<answer>
In ~/Desktop/qrew, restore the landing page src/app/page.tsx to the version from git commit before the recent changes.
Run this command and apply it:
git show eb83210:src/app/page.tsx
Replace the current src/app/page.tsx with exactly that version from commit eb83210.
Only fix one thing in it: move any Math.random() calls into a useEffect with useState to fix the hydration error.
Do not change anything else about the design.
Clean build, no TypeScript errors.
</answer>
<environment_details>
# VSCode Visible Files
src/app/page.tsx

# VSCode Open Tabs
src/components/ProfessionalIDE.tsx,src/app/api/startups/[startupId]/brand/route.ts,FIXES_SUMMARY.md,src/app/api/startups/[startupId]/download/route.ts,src/components/qrew/dashboard.tsx,src/app/globals.css,src/app/app/[startupId]/page.tsx,UI_POLISH_SUMMARY.md,src/app/app/[startupId]/build/page.tsx,src/components/qrew/mcq-popup.tsx,src/components/qrew/report-view.tsx,src/app/app/[startupId]/team/page.tsx,src/lib/code-generator.ts,src/app/login/page.tsx,README.md,src/app/page.tsx

# Current Time
Current time in ISO 8601 UTC format: 2026-05-16T18:59:51.249Z
User time zone: Asia/Calcutta, UTC+5:30

# Current Cost
$0.23

# Review Exclusions
The following file patterns are excluded from code reviews:
- .vscode/**

# Current Mode
<slug>code</slug>
<name>💻 Code</name>
You have not created a todo list yet. Create one with `update_todo_list` if your task is complicated or involves multiple steps.
</environment_details>

---

**Assistant:**

I'll restore the landing page from the git commit and fix only the hydration error.

<execute_command>
<command>cd /Users/bhavesh/Desktop/qrew && git show eb83210:src/app/page.tsx</command>
</execute_command>

---

**User:**

[execute_command for 'cd /Users/bhavesh/Desktop/qrew && git show eb83210:src/app/page.tsx'] Result:
Command executed in terminal  within working directory '/Users/bhavesh/Desktop/qrew'. Exit code: 0
Output:
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, useScroll, useTransform } from "framer-motion";
import { ArrowRight, Zap, BarChart3, Palette, Code2, Rocket, Sparkles, Check } from "lucide-react";

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
};

const EXAMPLES = [
  "A fitness app for busy moms who want 10-minute home workouts",
  "SaaS tool that auto-generates legal contracts for freelancers",
  "Marketplace connecting college students with local tutors",
  "AI-powered meal planner that syncs with your grocery delivery",
];

const AGENTS = [
  { icon: Zap,      name: "Alex",   role: "Research",  color: "#6366F1", emoji: "🔍", desc: "Market research + competitors" },
  { icon: BarChart3, name: "Sam",   role: "Strategy",  color: "#10B981", emoji: "📊", desc: "Business plan + positioning" },
  { icon: Palette,  name: "Jordan", role: "Design",    color: "#F59E0B", emoji: "🎨", desc: "Brand identity (silent)" },
  { icon: Code2,    name: "Morgan", role: "Dev",       color: "#3B82F6", emoji: "💻", desc: "Full code generation" },
  { icon: Rocket,   name: "Riley",  role: "Launch",    color: "#EF4444", emoji: "🚀", desc: "GitHub + Vercel deploy" },
];

export default function LandingPage() {
  const router = useRouter();
  const [idea, setIdea] = useState("");
  const [placeholder, setPlaceholder] = useState(0);
  const { scrollY } = useScroll();
  const opacity = useTransform(scrollY, [0, 300], [1, 0]);
  const scale = useTransform(scrollY, [0, 300], [1, 0.95]);

  useEffect(() => {
    const interval = setInterval(() => {
      setPlaceholder((p) => (p + 1) % EXAMPLES.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const handleBuild = () => {
    const trimmed = idea.trim();
    if (!trimmed) return;
    sessionStorage.setItem("qrew_pending_idea", trimmed);
    router.push("/login");
  };

  return (
    <div className="relative min-h-screen flex flex-col overflow-hidden" style={{ background: "#0A0A0A", color: "#F5F5F5" }}>
      {/* Animated mesh gradient background */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <motion.div
          animate={{
            background: [
              "radial-gradient(ellipse 80% 50% at 50% -10%, rgba(99,102,241,0.15), transparent 60%)",
              "radial-gradient(ellipse 80% 50% at 60% -10%, rgba(139,92,246,0.12), transparent 60%)",
              "radial-gradient(ellipse 80% 50% at 40% -10%, rgba(99,102,241,0.15), transparent 60%)",
            ],
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute inset-0"
        />
        {/* Floating orbs */}
        <motion.div
          animate={{ x: [0, 100, 0], y: [0, -50, 0] }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full blur-3xl opacity-20"
          style={{ background: "radial-gradient(circle, #6366F1, transparent)" }}
        />
        <motion.div
          animate={{ x: [0, -80, 0], y: [0, 60, 0] }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full blur-3xl opacity-15"
          style={{ background: "radial-gradient(circle, #8B5CF6, transparent)" }}
        />
      </div>

      {/* Nav */}
      <motion.nav
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 flex items-center justify-between px-6 py-6 max-w-7xl mx-auto w-full"
      >
        <div className="flex items-center gap-2">
          <motion.div
            animate={{ rotate: [0, 360] }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, #6366F1, #8B5CF6)", boxShadow: "0 0 20px rgba(99,102,241,0.3)" }}
          >
            <Sparkles size={16} color="#fff" />
          </motion.div>
          <span className="text-xl font-bold tracking-tight" style={{ color: "#F5F5F5", letterSpacing: "-0.04em" }}>
            qrew
          </span>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => router.push("/login")}
          className="text-sm px-5 py-2 rounded-lg font-medium transition-all"
          style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#F5F5F5" }}
        >
          Sign in
        </motion.button>
      </motion.nav>

      {/* Hero */}
      <main className="relative z-10 flex flex-col items-center justify-center flex-1 px-4 text-center pt-8 pb-24">
        <motion.div
          style={{ opacity, scale }}
          variants={{ animate: { transition: { staggerChildren: 0.1 } } }}
          initial="initial"
          animate="animate"
          className="flex flex-col items-center gap-8 max-w-4xl"
        >
          {/* Badge */}
          <motion.div variants={fadeUp} transition={{ duration: 0.6 }}>
            <motion.span
              animate={{ boxShadow: ["0 0 20px rgba(99,102,241,0.2)", "0 0 30px rgba(99,102,241,0.4)", "0 0 20px rgba(99,102,241,0.2)"] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="inline-flex items-center gap-2 rounded-full border px-5 py-2 text-xs font-semibold backdrop-blur-sm"
              style={{ borderColor: "rgba(99,102,241,0.3)", background: "rgba(99,102,241,0.08)", color: "#6366F1" }}
            >
              <motion.span
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="h-2 w-2 rounded-full bg-[#10B981]"
              />
              5 AI agents · One idea · Live startup in minutes
            </motion.span>
          </motion.div>

          {/* Headline */}
          <motion.h1
            variants={fadeUp}
            transition={{ duration: 0.6 }}
            className="text-6xl sm:text-7xl md:text-8xl font-bold tracking-tight leading-[1.1]"
            style={{ letterSpacing: "-0.04em" }}
          >
            Your AI
            <br />
            <span
              className="bg-clip-text text-transparent"
              style={{ backgroundImage: "linear-gradient(135deg, #6366F1, #8B5CF6, #EC4899)" }}
            >
              Startup Team
            </span>
          </motion.h1>

          {/* Sub */}
          <motion.p
            variants={fadeUp}
            transition={{ duration: 0.6 }}
            className="text-xl max-w-2xl leading-relaxed"
            style={{ color: "#A3A3A3" }}
          >
            Describe your idea. We research, design, build and launch your startup automatically.
            <br />
            <span style={{ color: "#6366F1", fontWeight: 600 }}>No code. No design. No deployment hassle.</span>
          </motion.p>

          {/* Input */}
          <motion.div
            variants={fadeUp}
            transition={{ duration: 0.6 }}
            className="w-full max-w-3xl"
          >
            <div
              className="flex items-center gap-3 rounded-2xl border p-2 transition-all backdrop-blur-md"
              style={{ background: "rgba(17,17,17,0.8)", borderColor: "rgba(99,102,241,0.2)", boxShadow: "0 8px 32px rgba(0,0,0,0.3)" }}
            >
              <textarea
                value={idea}
                onChange={(e) => setIdea(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleBuild();
                  }
                }}
                placeholder={EXAMPLES[placeholder]}
                rows={3}
                className="flex-1 resize-none bg-transparent px-4 py-3 text-base leading-relaxed outline-none placeholder:text-[#525252]"
                style={{ color: "#F5F5F5" }}
              />
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleBuild}
                disabled={!idea.trim()}
                className="flex shrink-0 items-center gap-2 rounded-xl px-6 py-4 text-sm font-bold text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                style={{
                  background: idea.trim() ? "linear-gradient(135deg, #6366F1, #8B5CF6)" : "#1F1F1F",
                  boxShadow: idea.trim() ? "0 0 30px rgba(99,102,241,0.5)" : "none",
                }}
              >
                Build My Startup
                <ArrowRight size={16} />
              </motion.button>
            </div>
            <p className="mt-3 text-xs text-center" style={{ color: "#525252" }}>
              Press <kbd className="px-2 py-0.5 rounded bg-[#1F1F1F] border border-[#2A2A2A]">Enter</kbd> to start · Free 1 credit on signup
            </p>
          </motion.div>
        </motion.div>

        {/* Agent cards */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="mt-32 w-full max-w-6xl"
        >
          <div className="flex items-center justify-center gap-3 mb-8">
            <div className="h-px w-16 bg-gradient-to-r from-transparent to-[#2A2A2A]" />
            <p className="text-xs uppercase tracking-widest font-semibold" style={{ color: "#6366F1" }}>
              Meet Your AI Team
            </p>
            <div className="h-px w-16 bg-gradient-to-l from-transparent to-[#2A2A2A]" />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
            {AGENTS.map((agent, i) => (
              <motion.div
                key={agent.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 + i * 0.1 }}
                whileHover={{ y: -8, scale: 1.02 }}
                className="group rounded-2xl border p-5 flex flex-col gap-4 transition-all backdrop-blur-sm"
                style={{ background: "rgba(17,17,17,0.6)", borderColor: "rgba(255,255,255,0.05)" }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLDivElement).style.borderColor = `${agent.color}40`;
                  (e.currentTarget as HTMLDivElement).style.boxShadow = `0 8px 32px ${agent.color}20`;
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(255,255,255,0.05)";
                  (e.currentTarget as HTMLDivElement).style.boxShadow = "none";
                }}
              >
                <div className="flex items-center justify-between">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl transition-transform group-hover:scale-110"
                    style={{ background: `${agent.color}15`, border: `1px solid ${agent.color}30` }}
                  >
                    {agent.emoji}
                  </div>
                  <agent.icon size={18} style={{ color: agent.color, opacity: 0.6 }} />
                </div>
                <div>
                  <div className="text-base font-bold mb-1" style={{ color: "#F5F5F5" }}>
                    {agent.name}
                  </div>
                  <div className="text-xs font-semibold mb-2" style={{ color: agent.color }}>
                    {agent.role}
                  </div>
                  <div className="text-xs leading-relaxed" style={{ color: "#6B7280" }}>
                    {agent.desc}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Pricing */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1 }}
          className="mt-24 w-full max-w-4xl"
        >
          <div className="flex items-center justify-center gap-3 mb-8">
            <div className="h-px w-16 bg-gradient-to-r from-transparent to-[#2A2A2A]" />
            <p className="text-xs uppercase tracking-widest font-semibold" style={{ color: "#10B981" }}>
              Simple Pricing
            </p>
            <div className="h-px w-16 bg-gradient-to-l from-transparent to-[#2A2A2A]" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              {
                label: "Standard",
                price: "$6",
                credits: "1.5 credits",
                items: ["Research + Strategy reports", "Full codebase generated", "GitHub push + Vercel deploy", "Database + Auth + Payments"],
                accent: "#6366F1",
                popular: false,
              },
              {
                label: "Premium",
                price: "$10",
                credits: "2.5 credits",
                items: ["Everything in Standard", "AI-generated brand visuals", "Cinematic scroll video", "Apple.com level experience"],
                accent: "#10B981",
                popular: true,
              },
            ].map((plan) => (
              <motion.div
                key={plan.label}
                whileHover={{ y: -4, scale: 1.02 }}
                className="relative rounded-2xl border p-6 text-left backdrop-blur-sm"
                style={{
                  background: plan.popular ? `${plan.accent}08` : "rgba(17,17,17,0.6)",
                  borderColor: plan.popular ? `${plan.accent}40` : "rgba(255,255,255,0.05)",
                  boxShadow: plan.popular ? `0 8px 32px ${plan.accent}20` : "none",
                }}
              >
                {plan.popular && (
                  <div
                    className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-xs font-bold"
                    style={{ background: plan.accent, color: "#fff" }}
                  >
                    MOST POPULAR
                  </div>
                )}
                <div className="flex items-center justify-between mb-4">
                  <span className="text-lg font-bold" style={{ color: "#F5F5F5" }}>
                    {plan.label}
                  </span>
                  <span className="text-xs rounded-full px-3 py-1 font-semibold" style={{ background: `${plan.accent}18`, color: plan.accent }}>
                    {plan.credits}
                  </span>
                </div>
                <div className="text-4xl font-bold mb-6" style={{ color: "#F5F5F5" }}>
                  {plan.price}
                </div>
                <ul className="flex flex-col gap-3 mb-6">
                  {plan.items.map((item) => (
                    <li key={item} className="flex items-start gap-3 text-sm" style={{ color: "#A3A3A3" }}>
                      <Check size={16} style={{ color: plan.accent, flexShrink: 0, marginTop: 2 }} />
                      {item}
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
          <p className="text-sm text-center mt-6" style={{ color: "#6B7280" }}>
            🎁 Free on signup: <span style={{ color: "#10B981", fontWeight: 600 }}>1 credit</span> — get your full research + strategy report at no cost
          </p>
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 text-center py-8 border-t" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
        <p className="text-xs" style={{ color: "#525252" }}>
          © 2026 Qrew · Built by Bhavesh Khatri
        </p>
      </footer>
    </div>
  );
}

// Made with Bob

<environment_details>
# VSCode Visible Files
src/app/page.tsx

# VSCode Open Tabs
src/components/ProfessionalIDE.tsx,src/app/api/startups/[startupId]/brand/route.ts,FIXES_SUMMARY.md,src/app/api/startups/[startupId]/download/route.ts,src/components/qrew/dashboard.tsx,src/app/globals.css,src/app/app/[startupId]/page.tsx,UI_POLISH_SUMMARY.md,src/app/app/[startupId]/build/page.tsx,src/components/qrew/mcq-popup.tsx,src/components/qrew/report-view.tsx,src/app/app/[startupId]/team/page.tsx,src/lib/code-generator.ts,src/app/login/page.tsx,README.md,src/app/page.tsx

# Current Time
Current time in ISO 8601 UTC format: 2026-05-16T18:59:54.097Z
User time zone: Asia/Calcutta, UTC+5:30

# Current Cost
$0.27

# Review Exclusions
The following file patterns are excluded from code reviews:
- .vscode/**

# Current Mode
<slug>code</slug>
<name>💻 Code</name>
You have not created a todo list yet. Create one with `update_todo_list` if your task is complicated or involves multiple steps.
</environment_details>

---

**Assistant:**

Now I'll restore this version and fix only the hydration error by moving any Math.random() calls into useEffect. Looking at the code, I don't see any Math.random() calls, so I'll just restore it as-is.

<write_to_file>
<path>src/app/page.tsx</path>
<content>"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, useScroll, useTransform } from "framer-motion";
import { ArrowRight, Zap, BarChart3, Palette, Code2, Rocket, Sparkles, Check } from "lucide-react";

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
};

const EXAMPLES = [
  "A fitness app for busy moms who want 10-minute home workouts",
  "SaaS tool that auto-generates legal contracts for freelancers",
  "Marketplace connecting college students with local tutors",
  "AI-powered meal planner that syncs with your grocery delivery",
];

const AGENTS = [
  { icon: Zap,      name: "Alex",   role: "Research",  color: "#6366F1", emoji: "🔍", desc: "Market research + competitors" },
  { icon: BarChart3, name: "Sam",   role: "Strategy",  color: "#10B981", emoji: "📊", desc: "Business plan + positioning" },
  { icon: Palette,  name: "Jordan", role: "Design",    color: "#F59E0B", emoji: "🎨", desc: "Brand identity (silent)" },
  { icon: Code2,    name: "Morgan", role: "Dev",       color: "#3B82F6", emoji: "💻", desc: "Full code generation" },
  { icon: Rocket,   name: "Riley",  role: "Launch",    color: "#EF4444", emoji: "🚀", desc: "GitHub + Vercel deploy" },
];

export default function LandingPage() {
  const router = useRouter();
  const [idea, setIdea] = useState("");
  const [placeholder, setPlaceholder] = useState(0);
  const { scrollY } = useScroll();
  const opacity = useTransform(scrollY, [0, 300], [1, 0]);
  const scale = useTransform(scrollY, [0, 300], [1, 0.95]);

  useEffect(() => {
    const interval = setInterval(() => {
      setPlaceholder((p) => (p + 1) % EXAMPLES.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const handleBuild = () => {
    const trimmed = idea.trim();
    if (!trimmed) return;
    sessionStorage.setItem("qrew_pending_idea", trimmed);
    router.push("/login");
  };

  return (
    <div className="relative min-h-screen flex flex-col overflow-hidden" style={{ background: "#0A0A0A", color: "#F5F5F5" }}>
      {/* Animated mesh gradient background */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <motion.div
          animate={{
            background: [
              "radial-gradient(ellipse 80% 50% at 50% -10%, rgba(99,102,241,0.15), transparent 60%)",
              "radial-gradient(ellipse 80% 50% at 60% -10%, rgba(139,92,246,0.12), transparent 60%)",
              "radial-gradient(ellipse 80% 50% at 40% -10%, rgba(99,102,241,0.15), transparent 60%)",
            ],
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute inset-0"
        />
        {/* Floating orbs */}
        <motion.div
          animate={{ x: [0, 100, 0], y: [0, -50, 0] }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full blur-3xl opacity-20"
          style={{ background: "radial-gradient(circle, #6366F1, transparent)" }}
        />
        <motion.div
          animate={{ x: [0, -80, 0], y: [0, 60, 0] }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full blur-3xl opacity-15"
          style={{ background: "radial-gradient(circle, #8B5CF6, transparent)" }}
        />
      </div>

      {/* Nav */}
      <motion.nav
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 flex items-center justify-between px-6 py-6 max-w-7xl mx-auto w-full"
      >
        <div className="flex items-center gap-2">
          <motion.div
            animate={{ rotate: [0, 360] }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, #6366F1, #8B5CF6)", boxShadow: "0 0 20px rgba(99,102,241,0.3)" }}
          >
            <Sparkles size={16} color="#fff" />
          </motion.div>
          <span className="text-xl font-bold tracking-tight" style={{ color: "#F5F5F5", letterSpacing: "-0.04em" }}>
            qrew
          </span>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => router.push("/login")}
          className="text-sm px-5 py-2 rounded-lg font-medium transition-all"
          style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#F5F5F5" }}
        >
          Sign in
        </motion.button>
      </motion.nav>

      {/* Hero */}
      <main className="relative z-10 flex flex-col items-center justify-center flex-1 px-4 text-center pt-8 pb-24">
        <motion.div
          style={{ opacity, scale }}
          variants={{ animate: { transition: { staggerChildren: 0.1 } } }}
          initial="initial"
          animate="animate"
          className="flex flex-col items-center gap-8 max-w-4xl"
        >
          {/* Badge */}
          <motion.div variants={fadeUp} transition={{ duration: 0.6 }}>
            <motion.span
              animate={{ boxShadow: ["0 0 20px rgba(99,102,241,0.2)", "0 0 30px rgba(99,102,241,0.4)", "0 0 20px rgba(99,102,241,0.2)"] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="inline-flex items-center gap-2 rounded-full border px-5 py-2 text-xs font-semibold backdrop-blur-sm"
              style={{ borderColor: "rgba(99,102,241,0.3)", background: "rgba(99,102,241,0.08)", color: "#6366F1" }}
            >
              <motion.span
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="h-2 w-2 rounded-full bg-[#10B981]"
              />
              5 AI agents · One idea · Live startup in minutes
            </motion.span>
          </motion.div>

          {/* Headline */}
          <motion.h1
            variants={fadeUp}
            transition={{ duration: 0.6 }}
            className="text-6xl sm:text-7xl md:text-8xl font-bold tracking-tight leading-[1.1]"
            style={{ letterSpacing: "-0.04em" }}
          >
            Your AI
            <br />
            <span
              className="bg-clip-text text-transparent"
              style={{ backgroundImage: "linear-gradient(135deg, #6366F1, #8B5CF6, #EC4899)" }}
            >
              Startup Team
            </span>
          </motion.h1>

          {/* Sub */}
          <motion.p
            variants={fadeUp}
            transition={{ duration: 0.6 }}
            className="text-xl max-w-2xl leading-relaxed"
            style={{ color: "#A3A3A3" }}
          >
            Describe your idea. We research, design, build and launch your startup automatically.
            <br />
            <span style={{ color: "#6366F1", fontWeight: 600 }}>No code. No design. No deployment hassle.</span>
          </motion.p>

          {/* Input */}
          <motion.div
            variants={fadeUp}
            transition={{ duration: 0.6 }}
            className="w-full max-w-3xl"
          >
            <div
              className="flex items-center gap-3 rounded-2xl border p-2 transition-all backdrop-blur-md"
              style={{ background: "rgba(17,17,17,0.8)", borderColor: "rgba(99,102,241,0.2)", boxShadow: "0 8px 32px rgba(0,0,0,0.3)" }}
            >
              <textarea
                value={idea}
                onChange={(e) => setIdea(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleBuild();
                  }
                }}
                placeholder={EXAMPLES[placeholder]}
                rows={3}
                className="flex-1 resize-none bg-transparent px-4 py-3 text-base leading-relaxed outline-none placeholder:text-[#525252]"
                style={{ color: "#F5F5F5" }}
              />
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleBuild}
                disabled={!idea.trim()}
                className="flex shrink-0 items-center gap-2 rounded-xl px-6 py-4 text-sm font-bold text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                style={{
                  background: idea.trim() ? "linear-gradient(135deg, #6366F1, #8B5CF6)" : "#1F1F1F",
                  boxShadow: idea.trim() ? "0 0 30px rgba(99,102,241,0.5)" : "none",
                }}
              >
                Build My Startup
                <ArrowRight size={16} />
              </motion.button>
            </div>
            <p className="mt-3 text-xs text-center" style={{ color: "#525252" }}>
              Press <kbd className="px-2 py-0.5 rounded bg-[#1F1F1F] border border-[#2A2A2A]">Enter</kbd> to start · Free 1 credit on signup
            </p>
          </motion.div>
        </motion.div>

        {/* Agent cards */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="mt-32 w-full max-w-6xl"
        >
          <div className="flex items-center justify-center gap-3 mb-8">
            <div className="h-px w-16 bg-gradient-to-r from-transparent to-[#2A2A2A]" />
            <p className="text-xs uppercase tracking-widest font-semibold" style={{ color: "#6366F1" }}>
              Meet Your AI Team
            </p>
            <div className="h-px w-16 bg-gradient-to-l from-transparent to-[#2A2A2A]" />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
            {AGENTS.map((agent, i) => (
              <motion.div
                key={agent.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 + i * 0.1 }}
                whileHover={{ y: -8, scale: 1.02 }}
                className="group rounded-2xl border p-5 flex flex-col gap-4 transition-all backdrop-blur-sm"
                style={{ background: "rgba(17,17,17,0.6)", borderColor: "rgba(255,255,255,0.05)" }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLDivElement).style.borderColor = `${agent.color}40`;
                  (e.currentTarget as HTMLDivElement).style.boxShadow = `0 8px 32px ${agent.color}20`;
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(255,255,255,0.05)";
                  (e.currentTarget as HTMLDivElement).style.boxShadow = "none";
                }}
              >
                <div className="flex items-center justify-between">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl transition-transform group-hover:scale-110"
                    style={{ background: `${agent.color}15`, border: `1px solid ${agent.color}30` }}
                  >
                    {agent.emoji}
                  </div>
                  <agent.icon size={18} style={{ color: agent.color, opacity: 0.6 }} />
                </div>
                <div>
                  <div className="text-base font-bold mb-1" style={{ color: "#F5F5F5" }}>
                    {agent.name}
                  </div>
                  <div className="text-xs font-semibold mb-2" style={{ color: agent.color }}>
                    {agent.role}
                  </div>
                  <div className="text-xs leading-relaxed" style={{ color: "#6B7280" }}>
                    {agent.desc}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Pricing */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1 }}
          className="mt-24 w-full max-w-4xl"
        >
          <div className="flex items-center justify-center gap-3 mb-8">
            <div className="h-px w-16 bg-gradient-to-r from-transparent to-[#2A2A2A]" />
            <p className="text-xs uppercase tracking-widest font-semibold" style={{ color: "#10B981" }}>
              Simple Pricing
            </p>
            <div className="h-px w-16 bg-gradient-to-l from-transparent to-[#2A2A2A]" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              {
                label: "Standard",
                price: "$6",
                credits: "1.5 credits",
                items: ["Research + Strategy reports", "Full codebase generated", "GitHub push + Vercel deploy", "Database + Auth + Payments"],
                accent: "#6366F1",
                popular: false,
              },
              {
                label: "Premium",
                price: "$10",
                credits: "2.5 credits",
                items: ["Everything in Standard", "AI-generated brand visuals", "Cinematic scroll video", "Apple.com level experience"],
                accent: "#10B981",
                popular: true,
              },
            ].map((plan) => (
              <motion.div
                key={plan.label}
                whileHover={{ y: -4, scale: 1.02 }}
                className="relative rounded-2xl border p-6 text-left backdrop-blur-sm"
                style={{
                  background: plan.popular ? `${plan.accent}08` : "rgba(17,17,17,0.6)",
                  borderColor: plan.popular ? `${plan.accent}40` : "rgba(255,255,255,0.05)",
                  boxShadow: plan.popular ? `0 8px 32px ${plan.accent}20` : "none",
                }}
              >
                {plan.popular && (
                  <div
                    className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-xs font-bold"
                    style={{ background: plan.accent, color: "#fff" }}
                  >
                    MOST POPULAR
                  </div>
                )}
                <div className="flex items-center justify-between mb-4">
                  <span className="text-lg font-bold" style={{ color: "#F5F5F5" }}>
                    {plan.label}
                  </span>
                  <span className="text-xs rounded-full px-3 py-1 font-semibold" style={{ background: `${plan.accent}18`, color: plan.accent }}>
                    {plan.credits}
                  </span>
                </div>
                <div className="text-4xl font-bold mb-6" style={{ color: "#F5F5F5" }}>
                  {plan.price}
                </div>
                <ul className="flex flex-col gap-3 mb-6">
                  {plan.items.map((item) => (
                    <li key={item} className="flex items-start gap-3 text-sm" style={{ color: "#A3A3A3" }}>
                      <Check size={16} style={{ color: plan.accent, flexShrink: 0, marginTop: 2 }} />
                      {item}
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
          <p className="text-sm text-center mt-6" style={{ color: "#6B7280" }}>
            🎁 Free on signup: <span style={{ color: "#10B981", fontWeight: 600 }}>1 credit</span> — get your full research + strategy report at no cost
          </p>
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 text-center py-8 border-t" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
        <p className="text-xs" style={{ color: "#525252" }}>
          © 2026 Qrew · Built by Bhavesh Khatri
        </p>
      </footer>
    </div>
  );
}

// Made with Bob
</content>
<line_count>358</line_count>
</write_to_file>

---

**User:**

[write_to_file for 'src/app/page.tsx'] Result:
<file_write_result>
<path>src/app/page.tsx</path>
<operation>modified</operation>
<user_edits>@@ -354,4 +354,4 @@
   );
 }
 
-// Made with Bob
\ No newline at end of file
+// Made with Bob
</user_edits>
<notice>
<i>You do not need to re-read the file, as you have seen all changes</i>
<i>Proceed with the task using these changes as the new baseline.</i>
<i>If the user's edits have addressed part of the task or changed the requirements, adjust your approach accordingly.</i>
</notice>
</file_write_result>

<environment_details>
# VSCode Visible Files
src/app/page.tsx

# VSCode Open Tabs
src/components/ProfessionalIDE.tsx,src/app/api/startups/[startupId]/brand/route.ts,FIXES_SUMMARY.md,src/app/api/startups/[startupId]/download/route.ts,src/components/qrew/dashboard.tsx,src/app/globals.css,src/app/app/[startupId]/page.tsx,UI_POLISH_SUMMARY.md,src/app/app/[startupId]/build/page.tsx,src/components/qrew/mcq-popup.tsx,src/components/qrew/report-view.tsx,src/app/app/[startupId]/team/page.tsx,src/lib/code-generator.ts,src/app/login/page.tsx,README.md,src/app/page.tsx

# Current Time
Current time in ISO 8601 UTC format: 2026-05-16T19:00:39.987Z
User time zone: Asia/Calcutta, UTC+5:30

# Current Cost
$0.35

# Review Exclusions
The following file patterns are excluded from code reviews:
- .vscode/**

# Current Mode
<slug>code</slug>
<name>💻 Code</name>
You have not created a todo list yet. Create one with `update_todo_list` if your task is complicated or involves multiple steps.
</environment_details>

---

**Assistant:**

Now let me verify the build to ensure there are no TypeScript errors:

<execute_command>
<command>cd /Users/bhavesh/Desktop/qrew && npm run build</command>
</execute_command>

---

**User:**

[execute_command for 'cd /Users/bhavesh/Desktop/qrew && npm run build'] Result:
Command executed in terminal  within working directory '/Users/bhavesh/Desktop/qrew'. Exit code: 0
Output:

> qrew@0.1.0 build
> next build

▲ Next.js 16.2.4 (Turbopack)
- Environments: .env.local

  Creating an optimized production build ...
✓ Compiled successfully in 4.2s
  Running TypeScript ...
  Finished TypeScript in 3.4s ...
  Collecting page data using 7 workers ...
  Generating static pages using 7 workers (0/24) ...
  Generating static pages using 7 workers (6/24) 
  Generating static pages using 7 workers (12/24) 
  Generating static pages using 7 workers (18/24) 
✓ Generating static pages using 7 workers (24/24) in 158ms
  Finalizing page optimization ...

Route (app)
┌ ○ /
├ ○ /_not-found
├ ƒ /api/agents/chat
├ ƒ /api/auth/github
├ ƒ /api/auth/github/callback
├ ƒ /api/auth/stripe
├ ƒ /api/auth/stripe/callback
├ ƒ /api/auth/supabase
├ ƒ /api/auth/supabase/callback
├ ƒ /api/chat
├ ƒ /api/deploy/vercel
├ ƒ /api/github/push
├ ƒ /api/payments/checkout
├ ƒ /api/payments/products/create
├ ƒ /api/payments/webhook
├ ƒ /api/process-idea
├ ƒ /api/process-idea/rename
├ ƒ /api/startups/[startupId]
├ ƒ /api/startups/[startupId]/brand
├ ƒ /api/startups/[startupId]/build
├ ƒ /api/startups/[startupId]/build/cancel
├ ƒ /api/startups/[startupId]/credentials
├ ƒ /api/startups/[startupId]/deploy
├ ƒ /api/startups/[startupId]/download
├ ƒ /api/startups/[startupId]/generate
├ ƒ /api/startups/[startupId]/mcqs
├ ƒ /api/startups/[startupId]/supabase-keys
├ ƒ /api/startups/status
├ ƒ /api/user/github-status
├ ƒ /app
├ ƒ /app/[startupId]
├ ƒ /app/[startupId]/build
├ ƒ /app/[startupId]/connect-supabase
├ ƒ /app/[startupId]/process
├ ƒ /app/[startupId]/team
├ ƒ /auth/callback
└ ○ /login


○  (Static)   prerendered as static content
ƒ  (Dynamic)  server-rendered on demand


<environment_details>
# VSCode Visible Files
src/app/page.tsx

# VSCode Open Tabs
src/components/ProfessionalIDE.tsx,src/app/api/startups/[startupId]/brand/route.ts,FIXES_SUMMARY.md,src/app/api/startups/[startupId]/download/route.ts,src/components/qrew/dashboard.tsx,src/app/globals.css,src/app/app/[startupId]/page.tsx,UI_POLISH_SUMMARY.md,src/app/app/[startupId]/build/page.tsx,src/components/qrew/mcq-popup.tsx,src/components/qrew/report-view.tsx,src/app/app/[startupId]/team/page.tsx,src/lib/code-generator.ts,src/app/login/page.tsx,README.md,src/app/page.tsx

# Current Time
Current time in ISO 8601 UTC format: 2026-05-16T19:00:56.073Z
User time zone: Asia/Calcutta, UTC+5:30

# Current Cost
$0.42

# Review Exclusions
The following file patterns are excluded from code reviews:
- .vscode/**

# Current Mode
<slug>code</slug>
<name>💻 Code</name>
You have not created a todo list yet. Create one with `update_todo_list` if your task is complicated or involves multiple steps.
</environment_details>

---

**Assistant:**

<attempt_completion>
<result>
Landing page successfully restored from git commit eb83210. The build completed successfully with no TypeScript errors.

The page now has the original design with:
- Animated mesh gradient background with floating orbs
- Rotating logo with glow effect
- Animated badge with pulsing dot
- Gradient headline with "Startup Team"
- Input box with gradient border and glow effects
- 5 agent cards with hover effects
- Pricing section with Standard and Premium plans
- All functionality preserved (idea submission, routing)

Build status: ✓ Compiled successfully
TypeScript: ✓ No errors
All routes generated successfully
</result>
</attempt_completion>

