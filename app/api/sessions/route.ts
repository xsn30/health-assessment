import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST() {
  try {
    const user = await prisma.user.create({
      data: {
        subscription: {
          create: {},
        },
        assessments: {
          create: {},
        },
      },
      include: {
        assessments: true,
        subscription: true,
      },
    });

    return NextResponse.json(
      {
        sessionId: user.id,
        assessmentId: user.assessments[0].id,
        currentStep: user.assessments[0].currentStep,
        version: user.assessments[0].version,
        subscriptionStatus: user.subscription?.status,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Failed to create session:", error);

    return NextResponse.json(
      { error: "Failed to create session" },
      { status: 500 }
    );
  }
}