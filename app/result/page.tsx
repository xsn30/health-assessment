"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

type PredictionData = {
    currentWeightKg: number;
    targetWeightKg: number;
    estimatedWeeks: number;
};

type ResultData = {
    bmi: number;
    recommendedCalories?: number;
    targetDate?: string;
    predictionData?: PredictionData;
};

type ResultResponse = {
    sessionId: string;
    subscriptionStatus: "INACTIVE" | "ACTIVE";
    locked: boolean;
    result: ResultData;
    paywall?: {
        message: string;
        protectedFields: string[];
    };
};

function ResultContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const sessionId = searchParams.get("sessionId");

    const [data, setData] = useState<ResultResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [paying, setPaying] = useState(false);
    const [showCheckout, setShowCheckout] = useState(false);
    const [error, setError] = useState("");

    const loadResult = useCallback(async () => {
        if (!sessionId) {
            setError("Assessment session was not found.");
            setLoading(false);
            return;
        }

        try {
            const response = await fetch(`/api/results/${sessionId}`, {
                cache: "no-store",
            });

            if (!response.ok) {
                throw new Error("Failed to load assessment result.");
            }

            const result: ResultResponse = await response.json();

            setData(result);
            setError("");
        } catch (err) {
            console.error(err);
            setError("We couldn't load your results. Please try again.");
        } finally {
            setLoading(false);
        }
    }, [sessionId]);

    useEffect(() => {
        const timer = window.setTimeout(() => {
            void loadResult();
        }, 0);

        return () => {
            window.clearTimeout(timer);
        };
    }, [loadResult]);

    async function handlePayment() {
        if (!sessionId) return;

        try {
            setPaying(true);
            setError("");

            const response = await fetch("/api/pay", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    sessionId,
                }),
            });

            if (!response.ok) {
                throw new Error("Payment failed.");
            }

            await loadResult();
            setShowCheckout(false);
        } catch (err) {
            console.error(err);
            setError("We couldn't unlock your plan. Please try again.");
        } finally {
            setPaying(false);
        }
    }

    if (loading) {
        return (
            <main className="flex min-h-screen items-center justify-center bg-[#f7f8f4] px-6">
                <p className="text-gray-600">
                    Preparing your personalized results...
                </p>
            </main>
        );
    }

    if (error && !data) {
        return (
            <main className="flex min-h-screen items-center justify-center bg-[#f7f8f4] px-6">
                <p className="text-gray-700">{error}</p>
            </main>
        );
    }

    if (!data) return null;

    return (
        <main className="min-h-screen bg-[#f7f8f4] px-6 py-12">
            <div className="mx-auto max-w-2xl">
                <button
                    type="button"
                    onClick={() => router.push("/quiz?edit=true")}
                    className="mb-6 text-sm font-medium text-gray-500 transition hover:text-gray-900"
                >
                    ← Back to assessment
                </button>

                <div className="mb-10 text-center">
                    <p className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-500">
                        Your personalized assessment
                    </p>

                    <h1 className="text-4xl font-semibold tracking-tight text-gray-900">
                        Your results are ready
                    </h1>

                    <p className="mt-4 text-gray-600">
                        Based on the information you shared with us.
                    </p>
                </div>

                <div className="mb-5 rounded-3xl bg-white p-7 shadow-sm">
                    <p className="text-sm font-medium text-gray-500">
                        Your BMI
                    </p>

                    <p className="mt-2 text-5xl font-semibold text-gray-900">
                        {data.result.bmi}
                    </p>

                    <p className="mt-3 text-sm text-gray-500">
                        Calculated from your current height and weight.
                    </p>
                </div>

                {data.locked ? (
                    <div className="rounded-3xl bg-gray-900 p-7 text-white shadow-sm">
                        <div className="mb-5 text-3xl">🔒</div>

                        <h2 className="text-2xl font-semibold">
                            Unlock your complete health plan
                        </h2>

                        <p className="mt-3 leading-7 text-gray-300">
                            See your personalized daily calorie recommendation,
                            estimated target date, and weight progress forecast.
                        </p>

                        <div className="my-7 space-y-3">
                            <div className="rounded-2xl bg-white/10 px-5 py-4">
                                Personalized calorie target
                            </div>

                            <div className="rounded-2xl bg-white/10 px-5 py-4">
                                Estimated goal date
                            </div>

                            <div className="rounded-2xl bg-white/10 px-5 py-4">
                                Weight progress prediction
                            </div>
                        </div>

                        {!showCheckout ? (
                            <button
                                type="button"
                                onClick={() => setShowCheckout(true)}
                                className="w-full rounded-2xl bg-white px-5 py-4 font-semibold text-gray-900 transition hover:bg-gray-100"
                            >
                                Unlock my full plan
                            </button>
                        ) : (
                            <div className="rounded-2xl bg-white p-5 text-gray-900">
                                <div className="flex items-start justify-between gap-4">
                                    <div>
                                        <p className="text-sm font-medium text-gray-500">
                                            Demo subscription
                                        </p>

                                        <p className="mt-1 text-2xl font-semibold">
                                            €9.99
                                        </p>
                                    </div>

                                    <button
                                        type="button"
                                        disabled={paying}
                                        onClick={() => setShowCheckout(false)}
                                        className="text-sm font-medium text-gray-500 hover:text-gray-900 disabled:opacity-50"
                                    >
                                        Cancel
                                    </button>
                                </div>

                                <div className="my-5 border-t border-gray-200" />

                                <p className="text-sm leading-6 text-gray-600">
                                    Unlock your personalized calorie
                                    recommendation, estimated target date, and
                                    weight progress forecast.
                                </p>

                                <button
                                    type="button"
                                    disabled={paying}
                                    onClick={handlePayment}
                                    className="mt-5 w-full rounded-2xl bg-gray-900 px-5 py-4 font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    {paying
                                        ? "Processing payment..."
                                        : "Complete mock payment"}
                                </button>

                                <p className="mt-3 text-center text-xs text-gray-500">
                                    Demo only — no real payment will be
                                    processed.
                                </p>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div className="rounded-3xl bg-white p-7 shadow-sm">
                            <p className="text-sm font-medium text-gray-500">
                                Recommended daily intake
                            </p>

                            <p className="mt-2 text-4xl font-semibold text-gray-900">
                                {data.result.recommendedCalories} kcal
                            </p>
                        </div>

                        <div className="rounded-3xl bg-white p-7 shadow-sm">
                            <p className="text-sm font-medium text-gray-500">
                                Estimated target date
                            </p>

                            <p className="mt-2 text-3xl font-semibold text-gray-900">
                                {data.result.targetDate
                                    ? new Date(
                                          data.result.targetDate
                                      ).toLocaleDateString("en-US", {
                                          year: "numeric",
                                          month: "long",
                                          day: "numeric",
                                      })
                                    : "—"}
                            </p>
                        </div>

                        <div className="rounded-3xl bg-white p-7 shadow-sm">
                            <p className="text-sm font-medium text-gray-500">
                                Your progress forecast
                            </p>

                            <div className="mt-5 grid grid-cols-3 gap-3 text-center">
                                <div className="rounded-2xl bg-gray-50 p-4">
                                    <p className="text-xl font-semibold text-gray-900">
                                        {
                                            data.result.predictionData
                                                ?.currentWeightKg
                                        }
                                    </p>
                                    <p className="mt-1 text-xs text-gray-500">
                                        Current kg
                                    </p>
                                </div>

                                <div className="rounded-2xl bg-gray-50 p-4">
                                    <p className="text-xl font-semibold text-gray-900">
                                        {
                                            data.result.predictionData
                                                ?.targetWeightKg
                                        }
                                    </p>
                                    <p className="mt-1 text-xs text-gray-500">
                                        Target kg
                                    </p>
                                </div>

                                <div className="rounded-2xl bg-gray-50 p-4">
                                    <p className="text-xl font-semibold text-gray-900">
                                        {
                                            data.result.predictionData
                                                ?.estimatedWeeks
                                        }
                                    </p>
                                    <p className="mt-1 text-xs text-gray-500">
                                        Est. weeks
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="rounded-2xl border border-gray-200 px-5 py-4 text-center text-sm text-gray-500">
                            Full assessment unlocked
                        </div>
                    </div>
                )}

                {error && data && (
                    <p className="mt-5 text-center text-sm text-red-600">
                        {error}
                    </p>
                )}

                <button
                    type="button"
                    onClick={() => {
                        localStorage.removeItem(
                            "healthAssessmentSessionId"
                        );
                        router.push("/quiz");
                    }}
                    className="mt-6 w-full rounded-2xl border border-gray-200 bg-white px-5 py-4 font-medium text-gray-700 transition hover:bg-gray-50"
                >
                    Start a new assessment
                </button>

                <p className="mt-8 text-center text-xs leading-5 text-gray-400">
                    This assessment provides general wellness estimates for
                    demonstration purposes and is not medical advice.
                </p>
            </div>
        </main>
    );
}

export default function ResultPage() {
    return (
        <Suspense
            fallback={
                <main className="flex min-h-screen items-center justify-center bg-[#f7f8f4]">
                    <p className="text-gray-600">Loading results...</p>
                </main>
            }
        >
            <ResultContent />
        </Suspense>
    );
}