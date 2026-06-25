# Weave: Visual Application Operating System

> **Design. Build. Ship.**
> An AI-native Visual Application IDE that generates production-grade React/Next.js applications with full code ownership.

## 📖 Overview

**Weave** is not just another website builder. It is a comprehensive **Visual Application Operating System** that bridges the gap between design (Figma), development (React/Next.js), and deployment (Vercel). 

By leveraging a unified internal schema (JSON AST), Weave powers a visual canvas, enables AI-driven component manipulation, supports real-time collaboration, and outputs raw, production-grade, un-opinionated code. Weave ensures **zero vendor lock-in** by giving you complete ownership of your React components and Tailwind CSS styles.

---

## 🚀 Key Pillars

1. **The Visual Canvas**: A highly responsive, scalable drag-and-drop editor to build complex layouts, nest components, and adjust properties visually.
2. **Absolute Code Ownership**: Weave doesn't trap you in its ecosystem. It exports clean, production-ready Next.js, React, Tailwind CSS, and Shadcn UI code.
3. **AI as Infrastructure**: AI isn't bolted on; it's native. Generate sections, full pages, or entire SaaS templates via prompts, which directly map to the core JSON AST.
4. **Unified Internal Schema**: Every page, component, style, and workflow is represented as a single source of truth—the Abstract Syntax Tree (AST)—allowing seamless rendering, code generation, and AI integration.
5. **Real-time Collaboration**: Built with `Yjs`, Weave offers real-time multiplayer editing, live cursors, and state synchronization, matching the standards of modern design tools.
6. **Visual Backend Builder**: Design your PostgreSQL databases visually, build API endpoints, and orchestrate auth flows without writing backend boilerplate.

---

## 🛠️ Technology Stack

- **Framework**: [Next.js (App Router)](https://nextjs.org/) & React 19
- **Architecture**: [Turborepo](https://turbo.build/) Monorepo
- **Language**: TypeScript (Strict)
- **Styling**: Tailwind CSS, Shadcn UI, Custom Design System Engine
- **State Management**: [Zustand](https://github.com/pmndrs/zustand), [Yjs](https://yjs.dev/) (for CRDT/Collaboration)
- **Backend**: Node.js, Express/NestJS, PostgreSQL ([Prisma](https://www.prisma.io/)/[Drizzle](https://orm.drizzle.team/))
- **Deployment**: Vercel / AWS

---

## 🏗️ Architecture

Weave uses a highly modular monorepo structure built with Turborepo to ensure distinct separation of concerns and scalable performance.

```text
weave/
├── apps/
│   ├── web/                # Main Next.js application (Editor UI + Dashboard)
│   ├── api/                # Backend services (Auth, Projects, DB)
│   ├── ai-service/         # Dedicated AI processing & AST manipulation
│   └── docs/               # Documentation
├── packages/
│   ├── ast-schema/         # The central JSON AST definition (Unified Schema)
│   ├── editor-core/        # Canvas engine, drag-and-drop logic, local state
│   ├── component-registry/ # Built-in components and metadata mappings
│   ├── code-generator/     # AST to React/Next.js compiler engine
│   ├── shared-types/       # Global TS interfaces
│   └── ui/                 # Reusable UI library (Design System)
```

---

## 🤝 Contributing
Contributions are welcome! As we build the future of visual development, we are looking for help spanning frontend performance, backend architecture, AI prompt engineering, and CRDT integrations. Please check our issues page to get started.

## 📄 License
[MIT License](LICENSE)
