# 🤖 Qrew

**Describe your idea. We build and run your company.**

[![Next.js](https://img.shields.io/badge/Next.js-15-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Database-green?style=flat-square&logo=supabase)](https://supabase.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS-38B2AC?style=flat-square&logo=tailwind-css)](https://tailwindcss.com/)
[![Framer Motion](https://img.shields.io/badge/Framer-Motion-ff69b4?style=flat-square&logo=framer)](https://www.framer.com/motion/)

---

## 🚀 One-Line Pitch

**Qrew is an AI-powered platform that transforms your startup idea into a fully functional, deployed company with code, brand identity, and business strategy—all built by 5 specialized AI agents working together.**

---

## 💡 The Problem

Solo founders face three critical challenges when building startups:

- **⏰ Time Constraint**: Building a complete product from scratch takes months of development, design, and planning—time most founders don't have
- **💰 Resource Limitation**: Hiring a full team (developer, designer, strategist, DevOps engineer) costs $50K+ before you even validate your idea
- **🎯 Expertise Gap**: Most founders excel in one area but lack the full-stack skills needed to build, brand, deploy, and scale a complete startup

---

## ✨ The Solution

Qrew solves this with **5 specialized AI agents** that work as your complete founding team:

| Agent | Role | Tool | What They Do |
|-------|------|------|--------------|
| 🧠 **Jordan** | Product Strategist | Claude 3.5 Sonnet | Analyzes your idea, asks clarifying questions, creates comprehensive business strategy and product requirements |
| 🎨 **Dodo** | Brand Designer | DALL-E 3 | Designs your complete brand identity: logo, color palette, typography, and visual guidelines |
| 💻 **Bob** | Full-Stack Developer | Claude 3.5 Sonnet | Writes production-ready code: Next.js frontend, API routes, database schema, authentication, and payments |
| 🚀 **Deploy** | DevOps Engineer | Vercel API | Handles deployment, environment configuration, domain setup, and continuous integration |
| 📊 **Analyst** | Business Intelligence | Claude 3.5 Sonnet | Generates market analysis, competitor research, growth strategies, and success metrics |

---

## 🎯 Features

### ✅ Working Features

- **🤖 AI-Powered Idea Processing**: Natural language conversation to refine your startup concept
- **📋 Interactive MCQ System**: Smart questionnaires to gather detailed requirements
- **🎨 Automated Brand Generation**: Complete brand identity with logo, colors, and design system
- **💻 Full-Stack Code Generation**: Production-ready Next.js app with TypeScript, Tailwind, and Supabase
- **🔐 Authentication System**: Supabase Auth with email/password and OAuth providers
- **💳 Payment Integration**: Razorpay payment gateway with subscription management
- **📊 Comprehensive Reports**: Detailed business strategy, market analysis, and technical documentation
- **🚀 One-Click Deployment**: Automated deployment to Vercel with environment configuration
- **📦 GitHub Integration**: Automatic repository creation and code push
- **💾 Database Setup**: Automated Supabase project creation and schema migration
- **🎨 Professional IDE**: In-browser code editor with syntax highlighting and file management
- **📱 Responsive Dashboard**: Beautiful UI to manage all your startup projects
- **💰 Credit System**: Flexible credit-based pricing for AI operations
- **📥 Code Download**: Export your complete codebase as a ZIP file

---

## 🛠️ Tech Stack

| Category | Technology | Purpose |
|----------|-----------|---------|
| **Frontend** | Next.js 15, React 19, TypeScript | Modern web framework with server components |
| **Styling** | Tailwind CSS, Framer Motion | Utility-first CSS with smooth animations |
| **Backend** | Next.js API Routes, Server Actions | Serverless API endpoints and server logic |
| **Database** | Supabase (PostgreSQL) | Real-time database with built-in auth |
| **AI/LLM** | Anthropic Claude 3.5 Sonnet, OpenAI DALL-E 3 | Advanced language models for code and design |
| **Authentication** | Supabase Auth | Secure user authentication and authorization |
| **Payments** | Razorpay | Payment processing and subscription management |
| **Deployment** | Vercel | Edge network deployment with automatic CI/CD |
| **Version Control** | GitHub API | Automated repository management |
| **Code Editor** | Monaco Editor (VS Code) | Professional in-browser code editing |
| **PDF Generation** | jsPDF | Export reports and documentation |

---

## 🔄 How It Works

### 6 Steps from Idea to Deployed Startup

1. **💭 Describe Your Idea**
   - Enter your startup concept in natural language
   - Jordan (AI Strategist) analyzes and asks clarifying questions
   - Complete interactive MCQs to refine requirements

2. **📊 Review Strategy Report**
   - Receive comprehensive business analysis
   - Market research, competitor analysis, and growth strategy
   - Technical architecture and feature roadmap

3. **🎨 Generate Brand Identity**
   - Dodo (AI Designer) creates your visual brand
   - Logo, color palette, typography, and design system
   - Professional brand guidelines document

4. **💻 Build Your Product**
   - Bob (AI Developer) writes production-ready code
   - Full-stack Next.js application with all features
   - Database schema, API routes, and authentication

5. **🔗 Connect Services**
   - Link your Supabase project for database
   - Configure GitHub for version control
   - Set up Razorpay for payments (optional)

6. **🚀 Deploy to Production**
   - One-click deployment to Vercel
   - Automatic environment configuration
   - Live URL ready to share with users

---

## 📸 Screenshots

[Screenshot: Landing Page - Hero section with AI agent showcase]

[Screenshot: Dashboard - Project management interface with startup cards]

[Screenshot: Idea Processing - Interactive chat with Jordan AI]

[Screenshot: MCQ System - Smart questionnaire for requirements gathering]

[Screenshot: Strategy Report - Comprehensive business analysis document]

[Screenshot: Brand Generation - Logo and color palette preview]

[Screenshot: Code IDE - Professional code editor with file tree]

[Screenshot: Build Progress - Real-time agent activity and status updates]

[Screenshot: Deployment - One-click deploy interface with Vercel integration]

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm
- Supabase account (free tier works)
- Anthropic API key (Claude)
- OpenAI API key (DALL-E)
- Razorpay account (optional, for payments)
- GitHub account (for deployment)
- Vercel account (for deployment)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/qrew.git
   cd qrew
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   
   Create a `.env.local` file in the root directory with the following variables:

   ```env
   # Supabase Configuration
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

   # AI API Keys
   ANTHROPIC_API_KEY=your_anthropic_api_key
   OPENAI_API_KEY=your_openai_api_key

   # GitHub Integration
   GITHUB_TOKEN=your_github_personal_access_token
   GITHUB_CLIENT_ID=your_github_oauth_app_client_id
   GITHUB_CLIENT_SECRET=your_github_oauth_app_client_secret

   # Vercel Deployment
   VERCEL_TOKEN=your_vercel_api_token

   # Payment Gateway (Optional)
   RAZORPAY_KEY_ID=your_razorpay_key_id
   RAZORPAY_KEY_SECRET=your_razorpay_key_secret
   RAZORPAY_WEBHOOK_SECRET=your_razorpay_webhook_secret

   # Application URLs
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```

4. **Set up Supabase database**
   
   Run the SQL migrations in your Supabase project:
   ```bash
   # Execute these files in Supabase SQL Editor in order:
   # 1. supabase-schema.sql
   # 2. supabase-patch-profiles.sql
   # 3. supabase-patch-credentials.sql
   # 4. supabase-patch-github.sql
   # 5. supabase-patch-dodo.sql
   # 6. supabase-patch-razorpay.sql
   # 7. supabase-patch-statuses.sql
   ```

5. **Run the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   
   Navigate to [http://localhost:3000](http://localhost:3000)

---

## 🔐 Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL | ✅ Yes |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous/public key | ✅ Yes |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (admin access) | ✅ Yes |
| `ANTHROPIC_API_KEY` | Anthropic API key for Claude AI | ✅ Yes |
| `OPENAI_API_KEY` | OpenAI API key for DALL-E image generation | ✅ Yes |
| `GITHUB_TOKEN` | GitHub personal access token for repo operations | ✅ Yes |
| `GITHUB_CLIENT_ID` | GitHub OAuth app client ID | ✅ Yes |
| `GITHUB_CLIENT_SECRET` | GitHub OAuth app client secret | ✅ Yes |
| `VERCEL_TOKEN` | Vercel API token for deployments | ✅ Yes |
| `RAZORPAY_KEY_ID` | Razorpay key ID for payment processing | ⚠️ Optional |
| `RAZORPAY_KEY_SECRET` | Razorpay key secret | ⚠️ Optional |
| `RAZORPAY_WEBHOOK_SECRET` | Razorpay webhook secret for payment verification | ⚠️ Optional |
| `NEXT_PUBLIC_APP_URL` | Your application URL (for callbacks) | ✅ Yes |

---

## 📝 License

MIT License - feel free to use this project for your own purposes.

---

## 👨‍💻 Built By

**Bhavesh Khatri**  
Student, JIET Jodhpur  
[GitHub Profile](https://github.com/bhaveshkhatri)

---

## 🙏 Acknowledgments

- Built with [Next.js](https://nextjs.org/) and [React](https://react.dev/)
- Powered by [Anthropic Claude](https://www.anthropic.com/) and [OpenAI](https://openai.com/)
- Database by [Supabase](https://supabase.com/)
- Deployed on [Vercel](https://vercel.com/)
- UI components from [shadcn/ui](https://ui.shadcn.com/)

---

<div align="center">
  <strong>🤖 Qrew - Your AI Founding Team</strong>
  <br />
  <em>From idea to deployed startup in minutes, not months.</em>
</div>
