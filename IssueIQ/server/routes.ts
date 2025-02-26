import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import multer from "multer";
import { storage } from "./storage";
import { insertTicketSchema } from "@shared/schema";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
});

export async function registerRoutes(app: Express): Promise<Server> {
  setupAuth(app);

  // Tickets
  app.post("/api/tickets", upload.array("attachments", 5), async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    const files = req.files as Express.Multer.File[];
    const attachments = files?.map(f => ({
      name: f.originalname,
      data: f.buffer.toString("base64"),
      type: f.mimetype,
    })) || [];

    const ticket = await storage.createTicket({
      ...req.body,
      userId: req.user!.id,
      attachments,
    });
    res.json(ticket);
  });

  app.get("/api/tickets", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const tickets = await storage.getTickets(
      req.user!.role === "admin" ? undefined : req.user!.id
    );
    res.json(tickets);
  });

  app.patch("/api/tickets/:id/status", async (req, res) => {
    if (!req.isAuthenticated() || req.user!.role !== "admin") {
      return res.sendStatus(401);
    }
    await storage.updateTicketStatus(parseInt(req.params.id), req.body.status);
    res.sendStatus(200);
  });

  app.get("/api/tickets/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const ticket = await storage.getTicket(parseInt(req.params.id));
    if (!ticket) return res.sendStatus(404);
    if (req.user!.role !== "admin" && ticket.userId !== req.user!.id) {
      return res.sendStatus(403);
    }
    res.json(ticket);
  });

  app.post("/api/tickets/:id/notes", async (req, res) => {
    if (!req.isAuthenticated() || req.user!.role !== "admin") {
      return res.sendStatus(401);
    }
    const note = {
      text: req.body.text,
      createdAt: new Date(),
      createdBy: req.user!.username,
    };
    await storage.addTicketNote(parseInt(req.params.id), note);
    res.sendStatus(200);
  });

  // Knowledge Base
  app.get("/api/knowledge-base", async (_req, res) => {
    const articles = await storage.getKnowledgeBase();
    res.json(articles);
  });

  const httpServer = createServer(app);
  return httpServer;
}
