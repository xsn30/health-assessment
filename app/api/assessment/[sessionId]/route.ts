import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const updateAssessmentSchema = z.discriminatedUnion("step", [
  z.object({
    step: z.literal(1),
    version: z.number().int().min(0),
    data: z
      .object({
        gender: z.enum(["FEMALE", "MALE", "OTHER"]),
      })
      .strict(),
  }),

  z.object({
    step: z.literal(2),
    version: z.number().int().min(0),
    data: z
      .object({
        goal: z.enum([
          "LOSE_WEIGHT",
          "MAINTAIN_WEIGHT",
          "GAIN_WEIGHT",
        ]),
      })
      .strict(),
  }),

  z.object({
    step: z.literal(3),
    version: z.number().int().min(0),
    data: z
      .object({
        age: z.number().int().min(18).max(100),
        heightCm: z.number().min(120).max(230),
        weightKg: z.number().min(35).max(300),
        targetWeightKg: z.number().min(35).max(300),
      })
      .strict(),
  }),

  z.object({
    step: z.literal(4),
    version: z.number().int().min(0),
    data: z
      .object({
        activityLevel: z.enum([
          "SEDENTARY",
          "LIGHT",
          "MODERATE",
          "ACTIVE",
          "VERY_ACTIVE",
        ]),
      })
      .strict(),
  }),
]);
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params;

    const body = await request.json();

    const parsed = updateAssessmentSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Invalid request data",
          details: parsed.error.flatten(),
        },
        { status: 400 }
      );
    }

    const { step, version, data } = parsed.data;

    const assessment = await prisma.assessment.findFirst({
      where: {
        userId: sessionId,
      },
    });

    if (!assessment) {
      return NextResponse.json(
        { error: "Session not found" },
        { status: 404 }
      );
    }
    // Allow users to revisit completed steps,
    // but do not allow skipping unfinished steps.
    if (step > assessment.currentStep + 1) {
        return NextResponse.json(
            {
                error: "Invalid step order",
                message: `Cannot submit step ${step} before completing step ${
                    assessment.currentStep + 1
                }.`,
            },
            { status: 409 }
        );
    }

    const result = await prisma.assessment.updateMany({
      where: {
        id: assessment.id,
        version: version,
      },
      data: {
        ...data,
        currentStep: Math.max(assessment.currentStep, step),
        version: {
          increment: 1,
        },
      },
    });

    if (result.count === 0) {
      return NextResponse.json(
        {
          error: "Version conflict",
          message: "Assessment was updated by another request.",
        },
        { status: 409 }
      );
    }

    const updatedAssessment = await prisma.assessment.findUnique({
      where: {
        id: assessment.id,
      },
    });

    return NextResponse.json(updatedAssessment);
  } catch (error) {
    console.error("Failed to update assessment:", error);

    return NextResponse.json(
      { error: "Failed to update assessment" },
      { status: 500 }
    );
  }
}
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params;

    const assessment = await prisma.assessment.findFirst({
      where: {
        userId: sessionId,
      },
    });

    if (!assessment) {
      return NextResponse.json(
        { error: "Session not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(assessment);
  } catch (error) {
    console.error("Failed to get assessment:", error);

    return NextResponse.json(
      { error: "Failed to get assessment" },
      { status: 500 }
    );
  }
}