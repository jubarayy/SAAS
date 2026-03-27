import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getWorkspaceForRequest } from "@/lib/workspace";
import { prisma } from "@/lib/db";
import { createAuditLog } from "@/lib/audit";

const createSchema = z.object({
  name: z.string().min(1).max(200),
  email: z.string().email().optional().nullable(),
  company: z.string().optional().nullable(),
  website: z.string().url().optional().nullable().or(z.literal("")),
  phone: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  // For onboarding: create a project at the same time
  projectName: z.string().min(1).optional(),
});

export async function GET(req: NextRequest) {
  const { workspace, userId, error, status } = await getWorkspaceForRequest();
  if (error) return NextResponse.json({ error }, { status });

  const { searchParams } = req.nextUrl;
  const search = searchParams.get("search") || "";
  const archived = searchParams.get("archived") === "true";

  const clients = await prisma.client.findMany({
    where: {
      workspaceId: workspace!.id,
      isArchived: archived,
      ...(search && {
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          { email: { contains: search, mode: "insensitive" } },
          { company: { contains: search, mode: "insensitive" } },
        ],
      }),
    },
    include: {
      _count: { select: { projects: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(clients);
}

export async function POST(req: NextRequest) {
  const { workspace, userId, error, status } = await getWorkspaceForRequest();
  if (error) return NextResponse.json({ error }, { status });

  try {
    const body = await req.json();
    const data = createSchema.parse(body);

    const client = await prisma.client.create({
      data: {
        workspaceId: workspace!.id,
        name: data.name,
        email: data.email || null,
        company: data.company || null,
        website: data.website || null,
        phone: data.phone || null,
        notes: data.notes || null,
      },
    });

    // Optionally create first project
    if (data.projectName) {
      await prisma.project.create({
        data: {
          workspaceId: workspace!.id,
          clientId: client.id,
          name: data.projectName,
          status: "active",
          members: { create: { userId: userId! } },
        },
      });
    }

    await createAuditLog({
      workspaceId: workspace!.id,
      userId: userId!,
      action: "create",
      entity: "client",
      entityId: client.id,
      metadata: { name: client.name },
    });

    return NextResponse.json(client, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues[0].message }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to create client" }, { status: 500 });
  }
}
