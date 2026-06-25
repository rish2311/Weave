import { Router, Request, Response, NextFunction } from "express";
import { z } from "zod";
import { validateProject } from "@weave/ast-schema";
import { nanoid } from "nanoid";
import { prisma } from "../lib/prisma";

export const projectRouter = Router();

// ---------------------------------------------------------------------------
// Validation schemas
// ---------------------------------------------------------------------------
const CreateProjectSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  ast: z.record(z.unknown()).optional(),
  // In a real auth setup, ownerId comes from JWT. For now: from body.
  ownerId: z.string().min(1),
});

const UpdateProjectSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  ast: z.record(z.unknown()).optional(),
  published: z.boolean().optional(),
});

const SaveSnapshotSchema = z.object({
  description: z.string().min(1).max(200),
  ast: z.record(z.unknown()),
});

// ---------------------------------------------------------------------------
// Helper: generate unique slug
// ---------------------------------------------------------------------------
async function generateSlug(name: string): Promise<string> {
  const base = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  let slug = `${base}-${nanoid(6)}`;
  // Ensure uniqueness
  while (await prisma.project.findUnique({ where: { slug } })) {
    slug = `${base}-${nanoid(6)}`;
  }
  return slug;
}

// ---------------------------------------------------------------------------
// GET /api/v1/projects
// List all projects for a user (query: ?ownerId=xxx)
// ---------------------------------------------------------------------------
projectRouter.get("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { ownerId, page = "1", limit = "20" } = req.query;

    const pageNum = Math.max(1, parseInt(page as string, 10));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit as string, 10)));
    const skip = (pageNum - 1) * limitNum;

    const where = ownerId ? { ownerId: ownerId as string } : {};

    const [projects, total] = await Promise.all([
      prisma.project.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { updatedAt: "desc" },
        select: {
          id: true,
          name: true,
          description: true,
          slug: true,
          published: true,
          publishedAt: true,
          createdAt: true,
          updatedAt: true,
          owner: { select: { id: true, name: true, email: true } },
        },
      }),
      prisma.project.count({ where }),
    ]);

    res.json({
      data: projects,
      pagination: { page: pageNum, limit: limitNum, total, pages: Math.ceil(total / limitNum) },
    });
  } catch (err) {
    next(err);
  }
});

// ---------------------------------------------------------------------------
// POST /api/v1/projects
// Create a new project
// ---------------------------------------------------------------------------
projectRouter.post("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = CreateProjectSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Validation failed", details: parsed.error.flatten() });
      return;
    }

    const { name, description, ast, ownerId } = parsed.data;

    // Ensure user exists (upsert for simplicity without full auth in Phase 1)
    await prisma.user.upsert({
      where: { id: ownerId },
      update: {},
      create: { id: ownerId, email: `${ownerId}@weave.local` },
    });

    const slug = await generateSlug(name);

    const project = await prisma.project.create({
      data: {
        name,
        description,
        slug,
        ast: (ast ?? {}) as object,
        ownerId,
      },
      include: { owner: { select: { id: true, name: true, email: true } } },
    });

    res.status(201).json({ data: project });
  } catch (err) {
    next(err);
  }
});

// ---------------------------------------------------------------------------
// GET /api/v1/projects/:id
// Get a single project with its full AST
// ---------------------------------------------------------------------------
projectRouter.get("/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const project = await prisma.project.findUnique({
      where: { id: req.params["id"] },
      include: {
        owner: { select: { id: true, name: true, email: true } },
        snapshots: {
          orderBy: { createdAt: "desc" },
          take: 10,
          select: { id: true, description: true, createdAt: true },
        },
      },
    });

    if (!project) {
      res.status(404).json({ error: "Project not found" });
      return;
    }

    res.json({ data: project });
  } catch (err) {
    next(err);
  }
});

// ---------------------------------------------------------------------------
// PUT /api/v1/projects/:id
// Update a project (name, description, ast, published status)
// ---------------------------------------------------------------------------
projectRouter.put("/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = UpdateProjectSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Validation failed", details: parsed.error.flatten() });
      return;
    }

    const { name, description, ast, published } = parsed.data;

    // Validate AST if provided
    if (ast && !validateProject(ast)) {
      res.status(400).json({ error: "Invalid AST schema" });
      return;
    }

    const existing = await prisma.project.findUnique({ where: { id: req.params["id"] } });
    if (!existing) {
      res.status(404).json({ error: "Project not found" });
      return;
    }

    const project = await prisma.project.update({
      where: { id: req.params["id"] },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(ast && { ast: ast as object }),
        ...(published !== undefined && {
          published,
          publishedAt: published ? new Date() : null,
        }),
      },
      include: { owner: { select: { id: true, name: true, email: true } } },
    });

    res.json({ data: project });
  } catch (err) {
    next(err);
  }
});

// ---------------------------------------------------------------------------
// DELETE /api/v1/projects/:id
// Delete a project
// ---------------------------------------------------------------------------
projectRouter.delete("/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const existing = await prisma.project.findUnique({ where: { id: req.params["id"] } });
    if (!existing) {
      res.status(404).json({ error: "Project not found" });
      return;
    }

    await prisma.project.delete({ where: { id: req.params["id"] } });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

// ---------------------------------------------------------------------------
// POST /api/v1/projects/:id/snapshots
// Save a snapshot (time machine entry)
// ---------------------------------------------------------------------------
projectRouter.post("/:id/snapshots", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = SaveSnapshotSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Validation failed", details: parsed.error.flatten() });
      return;
    }

    const { description, ast } = parsed.data;

    const existing = await prisma.project.findUnique({ where: { id: req.params["id"] } });
    if (!existing) {
      res.status(404).json({ error: "Project not found" });
      return;
    }

    const snapshot = await prisma.snapshot.create({
      data: {
        description,
        ast: ast as object,
        projectId: req.params["id"],
      },
    });

    res.status(201).json({ data: snapshot });
  } catch (err) {
    next(err);
  }
});

// ---------------------------------------------------------------------------
// GET /api/v1/projects/:id/snapshots
// Get all snapshots for a project
// ---------------------------------------------------------------------------
projectRouter.get("/:id/snapshots", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const existing = await prisma.project.findUnique({ where: { id: req.params["id"] } });
    if (!existing) {
      res.status(404).json({ error: "Project not found" });
      return;
    }

    const snapshots = await prisma.snapshot.findMany({
      where: { projectId: req.params["id"] },
      orderBy: { createdAt: "desc" },
    });

    res.json({ data: snapshots });
  } catch (err) {
    next(err);
  }
});
