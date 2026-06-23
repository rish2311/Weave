# Weave: Architecture & Implementation Blueprint

## Executive Summary
**Weave** is positioned as an "AI-native Visual Application IDE that generates production-grade React/Next.js applications with full code ownership." It transcends traditional drag-and-drop website builders by providing a unified internal schema (JSON AST) that powers a visual canvas, code generation, AI manipulation, and real-time collaboration.

This document outlines the end-to-end phased implementation plan to build Weave as a senior-level, enterprise-grade application.

**Tech Stack Highlights:**
- **Framework:** Next.js (App Router), React 19
- **Architecture:** Turborepo Monorepo
- **Language:** TypeScript (Strict)
- **Styling:** Tailwind CSS, Shadcn UI, Custom Design System Engine
- **State Management:** Zustand, Yjs (for CRDT/Collaboration)
- **Backend:** Node.js, Express/NestJS, PostgreSQL (Prisma/Drizzle)
- **Deployment:** Vercel/AWS

---

## System Architecture (Monorepo Structure)

```text
weave/
├── apps/
│   ├── web/                # Main Next.js application (Editor + Dashboard)
│   ├── api/                # Backend services (Auth, Project Mgmt, DB Connections)
│   ├── ai-service/         # Dedicated AI processing & prompt engineering layer
│   └── worker/             # Background jobs (Code export, heavy compilation)
├── packages/
│   ├── editor-core/        # Canvas engine, drag-and-drop logic, state
│   ├── ast-schema/         # The central JSON AST definition (Unified Schema)
│   ├── component-registry/ # Built-in components and metadata
│   ├── code-generator/     # AST to React/Next.js compiler
│   ├── design-system/      # The UI components used BY the builder itself
│   └── shared-types/       # Global TS interfaces
```

---

## Phase 1: Core Foundation & The Canvas Engine (MVP 1)
**Goal:** Establish the fundamental architecture and a working visual editor that manipulates a JSON Abstract Syntax Tree (AST).

**1.1 Repository & Infrastructure Setup**
- Initialize Turborepo monorepo.
- Configure ESLint, Prettier, Husky, and GitHub Actions for CI/CD.
- Define `packages/ast-schema`. This is the most critical step: creating the rigorous JSON structure that represents the entire application state (Unified Internal Schema).

**1.2 State Management & Editor Core**
- Implement Zustand store for localized, high-performance editor state.
- Build `packages/editor-core`:
  - Canvas wrapper to handle scaling and infinite panning.
  - Drag-and-drop system (using `dnd-kit` or native HTML5 DnD).
  - Component selection, hovering, and nesting logic.

**1.3 Component Registry & Properties Panel**
- Create `packages/component-registry` defining base primitives (Box, Text, Button, Container, Image).
- Implement the Properties Panel in `apps/web`:
  - Connect the selected node in the AST to dynamic form inputs (sizing, colors, typography, flexbox controls).
  - Build a two-way data binding system: Panel updates AST -> Canvas re-renders instantly.

**1.4 Persistence & Projects**
- Set up the basic backend (`apps/api`) with PostgreSQL.
- Build endpoints to Create, Read, Update, Delete projects (persisting the JSON AST payload).

---

## Phase 2: Production Readiness & Code Export (MVP 2)
**Goal:** Make the designs usable outside the editor by outputting clean, developer-friendly, production-grade code.

**2.1 Responsive Design Engine**
- Enhance the AST schema to support breakpoint-specific properties.
- Implement canvas resizing tools (Desktop, Tablet, Mobile viewports).
- Update the UI engine to output responsive Tailwind classes based on breakpoints.

**2.2 The Code Generator Pipeline**
- Build the `packages/code-generator` engine:
  - AST Parser that recursively traverses the JSON tree.
  - AST-to-React compiler node converter.
  - AST-to-Tailwind utility class mapper.
  - Dependency analyzer to detect and inject required imports (e.g., Lucide icons, specific Shadcn components).

**2.3 Export & Publish Mechanisms**
- **Code Export:** Implement a "Download Code" feature that generates a zipped Next.js boilerplate containing the fully translated React code.
- **Publishing:** Implement a lightweight publish mechanism that dynamically renders the JSON AST via a public Next.js catch-all route (e.g., `[project].weave.app`).

---

## Phase 3: AI-Native Integration (MVP 3)
**Goal:** Transform Weave from a manual builder to an AI-accelerated IDE where AI acts as infrastructure, not an afterthought.

**3.1 AI Service Architecture**
- Setup `apps/ai-service` interfacing with OpenAI (GPT-4o) or Anthropic (Claude 3.5 Sonnet) APIs.
- Define strict structured output schemas (leveraging JSON mode or function calling) so the LLM outputs exactly map to the `packages/ast-schema`.

**3.2 AI Component & Section Generation**
- Implement "Prompt to Component/Section" functionality in the editor UI.
- Workflow: User types "Pricing section with 3 tiers". AI returns a partial AST snippet. The editor seamlessly injects this generated AST node into the canvas.

**3.3 Refactor & Template Engine**
- Build an AI refactoring tool: Upload an image or old HTML, and use multi-modal AI to convert it into the Weave AST.
- Pre-build high-quality templates (stored as pre-compiled AST JSON files) and allow users to instantiate projects from them.

---

## Phase 4: Multiplayer Collaboration & Versioning (MVP 4)
**Goal:** Introduce enterprise-grade team workflows, matching the collaboration standards of modern tools like Figma.

**4.1 CRDT & Real-time Collaboration**
- Integrate `Yjs` into the editor state architecture.
- Setup a WebSocket server (via `apps/api` or a dedicated worker) to synchronize Yjs updates across clients.
- Implement live cursors, selection highlights, and presence indicators.

**4.2 Git-Like Versioning ("Time Machine")**
- Transition from destructive saves to an append-only event sourcing model or granular diffing for the AST.
- Build the "Time Machine" UI: Replay project history, "Restore to previous state", "Branching", and visual diff comparisons.

**4.3 Marketplace Architecture**
- Expand the database schema to support public/published blocks, templates, and design systems.
- Create an ecosystem interface where users can browse, share, or sell custom AST components.

---

## Phase 5: The Ultimate Moat - Visual Backend Builder (MVP 5)
**Goal:** Elevate Weave to a full Visual Application Operating System capable of building SaaS products, not just landing pages.

**5.1 Visual Database Schema Designer**
- Build a node-based UI to define database Tables, Columns, and Relations.
- Implement a backend engine to generate Prisma/Drizzle schemas and execute migrations dynamically on isolated managed databases.

**5.2 Visual API & Workflow Builder**
- Create an interface to visually define API endpoints (GET, POST, DELETE).
- Map endpoints to database queries, authentication checks, or third-party webhooks.

**5.3 Full-Stack Code Export**
- Upgrade `packages/code-generator` to output a complete full-stack application repository (Next.js frontend + API routes + ORM configuration).
- Integrate with Vercel or AWS APIs to enable one-click deployment pipelines for the entire stack directly from the Weave interface.
