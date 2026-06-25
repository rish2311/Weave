/**
 * astCompiler.ts
 *
 * Phase 2 core: Recursively traverses the WeaveProject AST and emits
 * production-grade React/Next.js + Tailwind CSS component code.
 *
 * Strategy:
 *  - Each WeavePage becomes a Next.js page component file.
 *  - Each WeaveNode is recursively compiled into JSX.
 *  - Styles are emitted as inline style objects (predictable, zero-config).
 *  - A dependency analyzer collects required imports per file.
 */

import type {
  WeaveProject,
  WeavePage,
  WeaveNode,
  TextNode,
  ButtonNode,
  ImageNode,
  InputNode,
  LinkNode,
} from "@weave/ast-schema";
import { styleToCSS } from "./styleConverter";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface GeneratedFile {
  /** Relative path from the project root, e.g. "app/page.tsx" */
  path: string;
  content: string;
}

export interface CompileResult {
  files: GeneratedFile[];
  /** Any non-fatal warnings from the compiler */
  warnings: string[];
}

// ---------------------------------------------------------------------------
// Dependency tracker
// ---------------------------------------------------------------------------

class DependencySet {
  private namedImports = new Map<string, Set<string>>();
  private defaultImports = new Map<string, string>();

  addNamed(pkg: string, ...names: string[]) {
    if (!this.namedImports.has(pkg)) this.namedImports.set(pkg, new Set());
    names.forEach((n) => this.namedImports.get(pkg)!.add(n));
  }

  addDefault(pkg: string, name: string) {
    this.defaultImports.set(pkg, name);
  }

  toImportStatements(): string {
    const lines: string[] = [];
    this.defaultImports.forEach((name, pkg) => {
      lines.push(`import ${name} from "${pkg}";`);
    });
    this.namedImports.forEach((names, pkg) => {
      lines.push(`import { ${[...names].sort().join(", ")} } from "${pkg}";`);
    });
    return lines.join("\n");
  }
}

// ---------------------------------------------------------------------------
// Node compiler
// ---------------------------------------------------------------------------

function indent(level: number) {
  return "  ".repeat(level);
}

// Numeric CSS properties that must NOT be stringified (they take bare numbers in React)
const NUMERIC_CSS_PROPS = new Set([
  "zIndex", "opacity", "flex", "flexGrow", "flexShrink", "order", "columnCount",
  "fontWeight",
]);

function styleAttr(node: WeaveNode): string {
  const css = styleToCSS(node.styles);
  const entries = Object.entries(css).filter(([, v]) => v !== undefined);
  if (!entries.length) return "";
  const inner = entries
    .map(([k, v]) => {
      // Emit numeric CSS props as JSX numbers, not quoted strings
      if (typeof v === "number" || NUMERIC_CSS_PROPS.has(k)) {
        return `${k}: ${v}`;
      }
      return `${k}: "${v}"`;
    })
    .join(", ");
  return ` style={{ ${inner} }}`;
}

/** Escape special HTML characters so text content is safe inside JSX */
function escapeJSXText(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function compileNode(
  node: WeaveNode,
  nodes: Record<string, WeaveNode>,
  deps: DependencySet,
  level: number,
  warnings: string[]
): string {
  const pad = indent(level);
  const childPad = indent(level + 1);
  const style = styleAttr(node);

  const compileChildren = (): string => {
    if (!node.childIds.length) return "";
    return (
      "\n" +
      node.childIds
        .map((cid) => {
          const child = nodes[cid];
          if (!child) {
            warnings.push(`Node "${cid}" referenced as child but not found in nodes map.`);
            return "";
          }
          return compileNode(child, nodes, deps, level + 1, warnings);
        })
        .join("\n") +
      "\n" +
      pad
    );
  };

  if (node.hidden) {
    return `${pad}{/* hidden: ${node.name} */}`;
  }

  switch (node.type) {
    case "BOX":
    case "CONTAINER": {
      const tag = node.tag ?? "div";
      const children = compileChildren();
      return `${pad}<${tag}${style}>${children}</${tag}>`;
    }

    case "TEXT": {
      const textNode = node as TextNode;
      const tag = node.tag ?? "p";
      // Escape content to prevent JSX compilation errors from user text containing < or &
      const content = escapeJSXText(String(textNode.props.content ?? ""));
      return `${pad}<${tag}${style}>${content}</${tag}>`;
    }

    case "BUTTON": {
      const btn = node as ButtonNode;
      const label = btn.props.label ?? "Button";
      if (btn.props.href) {
        deps.addDefault("next/link", "Link");
        return `${pad}<Link href="${btn.props.href}"${style}>${label}</Link>`;
      }
      return `${pad}<button type="button"${style}>${label}</button>`;
    }

    case "IMAGE": {
      const img = node as ImageNode;
      deps.addDefault("next/image", "Image");
      const src = img.props.src || "/placeholder.png";
      const alt = img.props.alt || "Image";
      const css = styleToCSS(node.styles);
      const w = node.styles.width?.value ?? 300;
      const h = node.styles.height?.value ?? 200;
      // Emit style object minus width/height (Next/Image handles those)
      const filteredCss = Object.fromEntries(
        Object.entries(css).filter(([k]) => k !== "width" && k !== "height")
      );
      const filteredStyle = Object.entries(filteredCss).filter(([, v]) => v !== undefined);
      const styleStr = filteredStyle.length
        ? ` style={{ ${filteredStyle.map(([k, v]) => `${k}: "${v}"`).join(", ")} }}`
        : "";
      return `${pad}<Image src="${src}" alt="${alt}" width={${w}} height={${h}} style={{ objectFit: "${img.props.objectFit ?? "cover"}" }}${styleStr} />`;
    }

    case "INPUT": {
      const inp = node as InputNode;
      const type = inp.props.type ?? "text";
      const placeholder = inp.props.placeholder ?? "";
      return `${pad}<input type="${type}" placeholder="${placeholder}"${style} />`;
    }

    case "LINK": {
      const lnk = node as LinkNode;
      deps.addDefault("next/link", "Link");
      const children = compileChildren();
      return `${pad}<Link href="${lnk.props.href}"${lnk.props.target ? ` target="${lnk.props.target}"` : ""}${style}>${children}</Link>`;
    }

    case "DIVIDER": {
      return `${pad}<hr${style} />`;
    }

    default: {
      warnings.push(`Unknown node type "${(node as WeaveNode).type}" — emitted as <div>.`);
      return `${pad}<div${style}>${compileChildren()}</div>`;
    }
  }
}

// ---------------------------------------------------------------------------
// Page compiler
// ---------------------------------------------------------------------------

function compilePage(
  page: WeavePage,
  project: WeaveProject,
  warnings: string[]
): GeneratedFile {
  const deps = new DependencySet();
  const nodes = project.nodes;

  const body = page.rootNodeIds
    .map((id) => {
      const node = nodes[id];
      if (!node) {
        warnings.push(`Root node "${id}" on page "${page.name}" not found.`);
        return "";
      }
      return compileNode(node, nodes, deps, 2, warnings);
    })
    .filter(Boolean)
    .join("\n");

  const componentName = page.name
    .replace(/[^a-zA-Z0-9 ]/g, "")
    .split(" ")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join("") + "Page";

  // Determine the Next.js App Router path
  const isHome = page.slug === "home" || page.slug === "/";
  const filePath = isHome ? "app/page.tsx" : `app/${page.slug}/page.tsx`;

  const imports = deps.toImportStatements();
  const importBlock = imports ? `${imports}\n\n` : "";

  const content = `${importBlock}export default function ${componentName}() {
  return (
    <main>
${body || "      {/* Empty page */}"}
    </main>
  );
}
`;

  return { path: filePath, content };
}

// ---------------------------------------------------------------------------
// Layout file
// ---------------------------------------------------------------------------

function compileRootLayout(project: WeaveProject): GeneratedFile {
  const { designTokens } = project;
  const { colors, typography } = designTokens;

  const content = `import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "${project.name}",
  description: "Built with Weave — Visual Application OS",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: "${typography.fontFamilyBody}", backgroundColor: "${colors.background}", color: "${colors.text}" }}>
        {children}
      </body>
    </html>
  );
}
`;
  return { path: "app/layout.tsx", content };
}

// ---------------------------------------------------------------------------
// Global CSS file
// ---------------------------------------------------------------------------

function compileGlobalCSS(project: WeaveProject): GeneratedFile {
  const t = project.designTokens;
  const content = `/* Generated by Weave — do not edit manually */
@import url("https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap");

*, *::before, *::after {
  box-sizing: border-box;
}

:root {
  --color-primary: ${t.colors.primary};
  --color-secondary: ${t.colors.secondary};
  --color-accent: ${t.colors.accent};
  --color-background: ${t.colors.background};
  --color-surface: ${t.colors.surface};
  --color-text: ${t.colors.text};
  --color-text-muted: ${t.colors.textMuted};
  --color-border: ${t.colors.border};
  --color-error: ${t.colors.error};
  --color-success: ${t.colors.success};
  --color-warning: ${t.colors.warning};
  --radius-sm: ${t.borderRadius.sm}px;
  --radius-md: ${t.borderRadius.md}px;
  --radius-lg: ${t.borderRadius.lg}px;
  --radius-xl: ${t.borderRadius.xl}px;
}

html, body {
  margin: 0;
  padding: 0;
  font-family: var(--font-family-body, "Inter", sans-serif);
  background-color: var(--color-background);
  color: var(--color-text);
}

img {
  max-width: 100%;
  height: auto;
}
`;
  return { path: "app/globals.css", content };
}

// ---------------------------------------------------------------------------
// Next.js config
// ---------------------------------------------------------------------------

function compileNextConfig(): GeneratedFile {
  const content = `/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [{ protocol: "https", hostname: "**" }],
  },
};

export default nextConfig;
`;
  return { path: "next.config.mjs", content };
}

// ---------------------------------------------------------------------------
// package.json
// ---------------------------------------------------------------------------

function compilePackageJson(projectName: string): GeneratedFile {
  const slug = projectName.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  const content = JSON.stringify(
    {
      name: slug,
      version: "0.1.0",
      private: true,
      scripts: {
        dev: "next dev",
        build: "next build",
        start: "next start",
        lint: "next lint",
      },
      dependencies: {
        next: "15.0.0",
        react: "^19.0.0",
        "react-dom": "^19.0.0",
      },
      devDependencies: {
        typescript: "^5.0.0",
        "@types/node": "^22.0.0",
        "@types/react": "^19.0.0",
        "@types/react-dom": "^19.0.0",
      },
    },
    null,
    2
  );
  return { path: "package.json", content };
}

// ---------------------------------------------------------------------------
// Root tsconfig
// ---------------------------------------------------------------------------

function compileTsConfig(): GeneratedFile {
  const content = JSON.stringify(
    {
      compilerOptions: {
        target: "ES2017",
        lib: ["dom", "dom.iterable", "esnext"],
        allowJs: true,
        skipLibCheck: true,
        strict: true,
        noEmit: true,
        esModuleInterop: true,
        module: "esnext",
        moduleResolution: "bundler",
        resolveJsonModule: true,
        isolatedModules: true,
        jsx: "preserve",
        incremental: true,
        plugins: [{ name: "next" }],
        paths: { "@/*": ["./*"] },
      },
      include: ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
      exclude: ["node_modules"],
    },
    null,
    2
  );
  return { path: "tsconfig.json", content };
}

// ---------------------------------------------------------------------------
// README
// ---------------------------------------------------------------------------

function compileReadme(project: WeaveProject): GeneratedFile {
  const content = `# ${project.name}

> Built with [Weave](https://github.com/weave-app/weave) — Visual Application OS

## Getting Started

\`\`\`bash
npm install
npm run dev
\`\`\`

Open [http://localhost:3000](http://localhost:3000) to view the app.

## Stack

- **Next.js 15** (App Router)
- **React 19**
- **TypeScript** (strict)
`;
  return { path: "README.md", content };
}

// ---------------------------------------------------------------------------
// Main compile function
// ---------------------------------------------------------------------------

/**
 * Compiles a full WeaveProject into a set of Next.js source files
 * suitable for bundling into a ZIP archive.
 */
export function compileProject(project: WeaveProject): CompileResult {
  const warnings: string[] = [];
  const files: GeneratedFile[] = [];

  // Boilerplate files
  files.push(compileRootLayout(project));
  files.push(compileGlobalCSS(project));
  files.push(compileNextConfig());
  files.push(compilePackageJson(project.name));
  files.push(compileTsConfig());
  files.push(compileReadme(project));

  // Page files
  for (const page of project.pages) {
    files.push(compilePage(page, project, warnings));
  }

  return { files, warnings };
}
