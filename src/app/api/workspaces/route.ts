import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth/config";
import { prisma } from "@/lib/db";
import { slugify, generateToken } from "@/lib/utils";

const schema = z.object({
  name: z.string().min(2).max(100),
});

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { name } = schema.parse(await req.json());
    const baseSlug = slugify(name);
    
    // Ensure unique slug
    let slug = baseSlug;
    let i = 1;
    while (await prisma.workspace.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${i++}`;
    }

    const workspace = await prisma.workspace.create({
      data: {
        name,
        slug,
        trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 day trial
        members: {
          create: {
            userId: session.user.id,
            role: "owner",
          },
        },
      },
    });

    return NextResponse.json({ id: workspace.id, slug: workspace.slug, name: workspace.name });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0].message }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to create workspace" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const workspaces = await prisma.workspace.findMany({
    where: { members: { some: { userId: session.user.id } } },
    include: {
      members: { where: { userId: session.user.id }, select: { role: true } },
      _count: { select: { projects: true, clients: true } },
    },
  });

  return NextResponse.json(workspaces);
}
