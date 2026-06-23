import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import dotenv from "dotenv";
import { projectRouter } from "./routes/projects";
import { errorHandler } from "./middleware/errorHandler";
import { notFound } from "./middleware/notFound";

dotenv.config();

const app = express();
const PORT = process.env.PORT ?? 4000;

// ---------------------------------------------------------------------------
// Middleware
// ---------------------------------------------------------------------------
app.use(helmet());
app.use(
  cors({
    origin: process.env.FRONTEND_URL ?? "http://localhost:3000",
    credentials: true,
  })
);
app.use(express.json({ limit: "10mb" })); // AST payloads can be large
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------
app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.use("/api/v1/projects", projectRouter);

// ---------------------------------------------------------------------------
// Error handling
// ---------------------------------------------------------------------------
app.use(notFound);
app.use(errorHandler);

// ---------------------------------------------------------------------------
// Start
// ---------------------------------------------------------------------------
app.listen(PORT, () => {
  console.log(`🚀 Weave API running on http://localhost:${PORT}`);
});

export default app;
