import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params;

    const user = await prisma.user.findUnique({
      where: {
        id: sessionId,
      },
      include: {
        subscription: true,
        assessments: {
          where: {
            status: "COMPLETED",
          },
          orderBy: {
            completedAt: "desc",
          },
          take: 1,
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Session not found" },
        { status: 404 }
      );
    }

    const assessment = user.assessments[0];

    if (!assessment) {
      return NextResponse.json(
        { error: "Completed assessment not found" },
        { status: 404 }
      );
    }

    const isSubscribed = user.subscription?.status === "ACTIVE";

    // Free user: explicitly return only public fields.
    // Protected fields are never serialized into the response.
    if (!isSubscribed) {
      return NextResponse.json({
        sessionId,
        subscriptionStatus: "INACTIVE",
        locked: true,
        result: {
          bmi: assessment.bmi,
        },
        paywall: {
          message: "Subscribe to unlock your full health assessment.",
          protectedFields: [
            "recommendedCalories",
            "targetDate",
            "predictionData",
          ],
        },
      });
    }

    // Paid user: return the complete assessment result.
    return NextResponse.json({
      sessionId,
      subscriptionStatus: "ACTIVE",
      locked: false,
      result: {
        bmi: assessment.bmi,
        recommendedCalories: assessment.recommendedCalories,
        targetDate: assessment.targetDate,
        predictionData: assessment.predictionData,
      },
    });
  } catch (error) {
    console.error("Failed to get results:", error);

    return NextResponse.json(
      { error: "Failed to get results" },
      { status: 500 }
    );
  }
}