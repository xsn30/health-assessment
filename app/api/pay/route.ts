import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const paySchema = z.object({
  sessionId: z.string().min(1),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const parsed = paySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Invalid request data",
          details: parsed.error.flatten(),
        },
        { status: 400 }
      );
    }

    const { sessionId } = parsed.data;

    const user = await prisma.user.findUnique({
      where: {
        id: sessionId,
      },
      include: {
        subscription: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Session not found" },
        { status: 404 }
      );
    }

    const subscription = await prisma.subscription.upsert({
      where: {
        userId: sessionId,
      },
      update: {
        status: "ACTIVE",
        startedAt: new Date(),
      },
      create: {
        userId: sessionId,
        status: "ACTIVE",
        startedAt: new Date(),
      },
    });

    return NextResponse.json({
      sessionId,
      subscriptionStatus: subscription.status,
      message: "Mock payment completed successfully.",
    });
  } catch (error) {
    console.error("Failed to process payment:", error);

    return NextResponse.json(
      { error: "Failed to process payment" },
      { status: 500 }
    );
  }
}