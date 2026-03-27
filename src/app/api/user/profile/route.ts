import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth/config";
import { prisma } from "@/lib/db";

const schema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
});

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const data = schema.parse(await req.json());
    const updated = await prisma.user.update({
      where: { id: session.user.id },
      data,
    });
    return NextResponse.json({ success: true });
  } catch (err) {
    if (err instanceof z.ZodError) return NextResponse.json({ error: err.issues[0].message }, { status: 400 });
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
  }
}
