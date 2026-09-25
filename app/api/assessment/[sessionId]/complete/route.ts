import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { calculateHealthAssessment } from "@/lib/health";

const completeAssessmentSchema = z
  .object({
    gender: z.enum(["FEMALE", "MALE", "OTHER"]),
    goal: z.enum(["LOSE_WEIGHT", "MAINTAIN_WEIGHT", "GAIN_WEIGHT"]),
    age: z.number().int().min(18).max(100),
    heightCm: z.number().min(120).max(230),
    weightKg: z.number().min(35).max(300),
    targetWeightKg: z.number().min(35).max(300),
    activityLevel: z.enum([
      "SEDENTARY",
      "LIGHT",
      "MODERATE",
      "ACTIVE",
      "VERY_ACTIVE",
    ]),
  })
  .superRefine((data, ctx) => {
    if (
      data.goal === "LOSE_WEIGHT" &&
      data.targetWeightKg >= data.weightKg
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["targetWeightKg"],
        message:
          "Target weight must be lower than current weight for a weight-loss goal.",
      });
    }

    if (
      data.goal === "GAIN_WEIGHT" &&
      data.targetWeightKg <= data.weightKg
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["targetWeightKg"],
        message:
          "Target weight must be higher than current weight for a weight-gain goal.",
      });
    }

    if (
      data.goal === "MAINTAIN_WEIGHT" &&
      Math.abs(data.targetWeightKg - data.weightKg) > 2
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["targetWeightKg"],
        message:
          "Target weight must be close to current weight for a maintenance goal.",
      });
    }
  });

export async function POST(
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

    const parsed = completeAssessmentSchema.safeParse({
      gender: assessment.gender,
      goal: assessment.goal,
      age: assessment.age,
      heightCm: assessment.heightCm,
      weightKg: assessment.weightKg,
      targetWeightKg: assessment.targetWeightKg,
      activityLevel: assessment.activityLevel,
    });

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Assessment is incomplete or invalid",
          details: parsed.error.flatten(),
        },
        { status: 400 }
      );
    }

    const healthResult = calculateHealthAssessment(parsed.data);

    const completedAssessment = await prisma.assessment.update({
      where: {
        id: assessment.id,
      },
      data: {
        bmi: healthResult.bmi,
        recommendedCalories: healthResult.recommendedCalories,
        targetDate: healthResult.targetDate,
        predictionData: healthResult.predictionData,
        status: "COMPLETED",
        completedAt: new Date(),
      },
    });

    return NextResponse.json({
      sessionId,
      status: completedAssessment.status,
      bmi: completedAssessment.bmi,
      recommendedCalories: completedAssessment.recommendedCalories,
      targetDate: completedAssessment.targetDate,
    });
  } catch (error) {
    console.error("Failed to complete assessment:", error);

    return NextResponse.json(
      { error: "Failed to complete assessment" },
      { status: 500 }
    );
  }
}