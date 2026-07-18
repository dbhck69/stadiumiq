import { z } from "zod";

export const ChatBodySchema = z.object({
  message: z.string().trim().min(1, "message is required"),
  history: z
    .array(z.object({ role: z.enum(["user", "assistant"]), text: z.string() }))
    .optional(),
  language: z.string().optional(),
  simpleLanguage: z.boolean().optional(),
});

export const OpsBodySchema = z
  .object({
    action: z.enum(["pipeline", "qa"]),
    incident: z.string().trim().optional(),
    question: z.string().trim().optional(),
    liveState: z.string(),
  })
  .superRefine((body, ctx) => {
    if (body.action === "qa" && !body.question) {
      ctx.addIssue({ code: "custom", path: ["question"], message: "question is required" });
    }
    if (body.action === "pipeline" && !body.incident) {
      ctx.addIssue({ code: "custom", path: ["incident"], message: "incident is required" });
    }
  });

const SectorStateSchema = z.object({
  id: z.string(),
  occupancy: z.number(),
  capacity: z.number(),
  trend: z.number(),
});

const GateStateSchema = z.object({
  id: z.string(),
  open: z.boolean(),
  throughput: z.number(),
  queue: z.number(),
});

const IncidentSchema = z.object({
  id: z.number(),
  minute: z.number(),
  type: z.enum(["medical", "crowd-surge", "lost-child", "gate-fault", "security", "spill"]),
  sector: z.string(),
  description: z.string(),
  status: z.enum(["new", "handling", "resolved"]),
});

const SimStateSchema = z.object({
  minute: z.number(),
  phase: z.enum(["ingress", "first-half", "halftime", "second-half", "egress"]),
  sectors: z.array(SectorStateSchema),
  gates: z.array(GateStateSchema),
  incidents: z.array(IncidentSchema),
  totalInside: z.number(),
  seed: z.number(),
  nextIncidentId: z.number(),
});

export const WhatIfBodySchema = z.object({
  question: z.string().trim().min(1, "question is required"),
  state: SimStateSchema,
});

export const BroadcastBodySchema = z.object({
  situation: z.string().trim().min(1, "situation is required"),
  languageCodes: z.array(z.string()).min(1, "languageCodes must be a non-empty array"),
});

export const PlannerBodySchema = z.object({
  section: z.string().trim().min(1, "section is required"),
  arrival: z.string().trim().min(1, "arrival is required"),
  interests: z.array(z.string()).optional(),
  language: z.string().optional(),
});
