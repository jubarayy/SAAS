import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth/config";

const schema = z.object({
  content: z.string().min(1).max(5000),
  clientName: z.string().optional().nullable(),
  clientEmail: z.string().email().optional().nullable(),
  isInternal: z.boolean().optional(),
});

export async function POST(req: NextRequest, { params }: { params: Promise<{ feedbackId: string }> }) {
  const session = await auth();
  const { feedbackId } = await params;

  const feedback = await prisma.feedbackItem.findUnique({ where: { id: feedbackId } });
  if (!feedback) return NextResponse.json({ error: "Not found" }, { status: 404 });

  try {
    const data = schema.parse(await req.json());
    const comment = await prisma.feedbackComment.create({
      data: {
        feedbackItemId: feedbackId,
        content: data.content,
        userId: session?.user?.id || null,
        clientName: data.clientName,
        clientEmail: data.clientEmail,
        isInternal: data.isInternal || false,
      },
      include: {
        user: { select: { id: true, name: true, avatarUrl: true } },
      },
    });
    return NextResponse.json(comment, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) return NextResponse.json({ error: err.issues[0].message }, { status: 400 });
    return NextResponse.json({ error: "Failed to add comment" }, { status: 500 });
  }
}
