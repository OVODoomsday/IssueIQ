import { users, tickets, knowledgeBase } from "@shared/schema";
import type { User, InsertUser, Ticket, KnowledgeBase } from "@shared/schema";
import session from "express-session";
import { db } from "./db";
import { eq } from "drizzle-orm";
import connectPg from "connect-pg-simple";
import { pool } from "./db";

const PostgresSessionStore = connectPg(session);

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  createTicket(ticket: Partial<Ticket>): Promise<Ticket>;
  getTickets(userId?: number): Promise<Ticket[]>;
  updateTicketStatus(id: number, status: string): Promise<void>;
  getKnowledgeBase(): Promise<KnowledgeBase[]>;
  sessionStore: session.Store;
}

export class DatabaseStorage implements IStorage {
  public sessionStore: session.Store;

  constructor() {
    this.sessionStore = new PostgresSessionStore({
      pool,
      createTableIfMissing: true,
    });
  }

  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.username, username));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values({
        ...insertUser,
        role: insertUser.email === 'lakergunna@gmail.com' ? 'admin' : 'user',
      })
      .returning();
    return user;
  }

  async createTicket(ticketData: Partial<Ticket>): Promise<Ticket> {
    const [ticket] = await db
      .insert(tickets)
      .values({
        ...ticketData,
        status: "new",
      })
      .returning();
    return ticket;
  }

  async getTickets(userId?: number): Promise<Ticket[]> {
    if (userId) {
      return db.select().from(tickets).where(eq(tickets.userId, userId));
    }
    return db.select().from(tickets);
  }

  async updateTicketStatus(id: number, status: string): Promise<void> {
    await db
      .update(tickets)
      .set({ status })
      .where(eq(tickets.id, id));
  }

  async getTicket(id: number): Promise<Ticket | undefined> {
    const [ticket] = await db
      .select()
      .from(tickets)
      .where(eq(tickets.id, id));
    return ticket;
  }

  async addTicketNote(id: number, note: any): Promise<void> {
    const ticket = await this.getTicket(id);
    if (!ticket) return;
    const notes = [...(ticket.notes || []), note];
    await db
      .update(tickets)
      .set({ notes })
      .where(eq(tickets.id, id));
  }

  async getKnowledgeBase(): Promise<KnowledgeBase[]> {
    return db.select().from(knowledgeBase);
  }
}

export const storage = new DatabaseStorage();