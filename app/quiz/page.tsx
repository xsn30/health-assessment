"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Gender = "FEMALE" | "MALE" | "OTHER";
type Goal = "LOSE_WEIGHT" | "MAINTAIN_WEIGHT" | "GAIN_WEIGHT";
type ActivityLevel =
    | "SEDENTARY"
    | "LIGHT"
    | "MODERATE"
    | "ACTIVE"
    | "VERY_ACTIVE";

type Answers = {
    gender?: Gender;
    goal?: Goal;
    age?: number;
    heightCm?: number;
    weightKg?: number;
    targetWeightKg?: number;
    activityLevel?: ActivityLevel;
};

export default function QuizPage() {
    const router = useRouter();
    const [sessionId, setSessionId] = useState<string | null>(null);
    const [step, setStep] = useState(1);
    const [version, setVersion] = useState(0);
    const [answers, setAnswers] = useState<Answers>({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        async function initializeSession() {
            try {
                const savedSessionId = localStorage.getItem(
                    "healthAssessmentSessionId"
                );

                // Existing user: restore progress from backend.
                if (savedSessionId) {
                    const response = await fetch(
                        `/api/assessment/${savedSessionId}`
                    );

                    if (response.ok) {
                        const assessment = await response.json();

                        // Assessment already finished:
                        // send the user back to their existing result.
                        const params = new URLSearchParams(window.location.search);
                        const isEditing = params.get("edit") === "true";

                        if (assessment.status === "COMPLETED" && !isEditing) {
                            router.push(`/result?sessionId=${savedSessionId}`);
                            return;
                        }

                        setSessionId(savedSessionId);
                        setVersion(assessment.version);

                        setAnswers({
                            gender: assessment.gender ?? undefined,
                            goal: assessment.goal ?? undefined,
                            age: assessment.age ?? undefined,
                            heightCm: assessment.heightCm ?? undefined,
                            weightKg: assessment.weightKg ?? undefined,
                            targetWeightKg:
                                assessment.targetWeightKg ?? undefined,
                            activityLevel:
                                assessment.activityLevel ?? undefined,
                        });

                        setStep(

                            assessment.status === "COMPLETED" && isEditing

                                ? 4

                                : Math.min(assessment.currentStep + 1, 4)

                        );

                        setLoading(false);
                        return;
                    }

                    // Stored session no longer exists.
                    localStorage.removeItem(
                        "healthAssessmentSessionId"
                    );
                }

                // New user: create a session.
                const response = await fetch("/api/sessions", {
                    method: "POST",
                });

                if (!response.ok) {
                    throw new Error(
                        "Could not create assessment session."
                    );
                }

                const session = await response.json();

                localStorage.setItem(
                    "healthAssessmentSessionId",
                    session.sessionId
                );

                setSessionId(session.sessionId);
                setVersion(session.version);
                setStep(1);
            } catch (err) {
                console.error(err);
                setError(
                    "We couldn't start your assessment. Please try again."
                );
            } finally {
                setLoading(false);
            }
        }

        initializeSession();
    }, [router]);

    async function saveStep(
        stepNumber: number,
        data: Record<string, unknown>
    ) {
        if (!sessionId) return;

        try {
            setError("");

            const response = await fetch(
                `/api/assessment/${sessionId}`,
                {
                    method: "PATCH",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        step: stepNumber,
                        version,
                        data,
                    }),
                }
            );

            if (response.status === 409) {
                // Our local version is stale.
                // Reload the latest assessment state from the server.
                const recoveryResponse = await fetch(
                    `/api/assessment/${sessionId}`
                );

                if (!recoveryResponse.ok) {
                    throw new Error("Failed to recover assessment state.");
                }

                const latestAssessment = await recoveryResponse.json();

                setVersion(latestAssessment.version);
                setStep(
                    Math.min(latestAssessment.currentStep + 1, 4)
                );

                setAnswers({
                    gender: latestAssessment.gender ?? undefined,
                    goal: latestAssessment.goal ?? undefined,
                    age: latestAssessment.age ?? undefined,
                    heightCm: latestAssessment.heightCm ?? undefined,
                    weightKg: latestAssessment.weightKg ?? undefined,
                    targetWeightKg:
                        latestAssessment.targetWeightKg ?? undefined,
                    activityLevel:
                        latestAssessment.activityLevel ?? undefined,
                });

                return;
            }

            if (!response.ok) {
                throw new Error("Failed to save assessment step.");
            }

            const updatedAssessment = await response.json();

            setVersion(updatedAssessment.version);

            if (stepNumber === 4) {
                const completeResponse = await fetch(
                    `/api/assessment/${sessionId}/complete`,
                    {
                        method: "POST",
                    }
                );

                if (!completeResponse.ok) {
                    const errorData = await completeResponse.json();

                    throw new Error(
                        errorData.message ||
                        errorData.error ||
                        "Failed to complete assessment."
                    );
                }

                router.push(`/result?sessionId=${sessionId}`);
                return;
            }

            setStep(stepNumber + 1);
        } catch (err) {
            console.error(err);
            setError(

                err instanceof Error

                    ? err.message

                    : "We couldn't save your answer. Please try again."

            );
        }
    }

    if (loading) {
        return (
            <main>
                <p>Preparing your assessment...</p>
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-[#f7f8f4] px-6 py-10">
            <div className="mx-auto max-w-xl">
                <div className="mb-10">
                    <div className="mb-3 flex items-center justify-between text-sm text-gray-500">
                        <span>Health assessment</span>
                        <span>{step} of 4</span>
                    </div>

                    <div className="h-2 overflow-hidden rounded-full bg-gray-200">
                        <div
                            className="h-full rounded-full bg-gray-900 transition-all"
                            style={{ width: `${(step / 4) * 100}%` }}
                        />
                    </div>
                </div>
                {step > 1 && (
                    <button
                        type="button"
                        onClick={() => {
                            setError("");
                            setStep((previous) => Math.max(1, previous - 1));
                        }}
                        className="mb-6 text-sm font-medium text-gray-500 transition hover:text-gray-900"
                    >
                        ← Back
                    </button>
                )}
                {error && (

                    <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">

                        {error}

                    </div>

                )}
                {step === 1 && (
                    <section>
                        <p className="mb-2 text-sm font-medium text-gray-500">
                            LET&apos;S GET TO KNOW YOU
                        </p>

                        <h1 className="mb-3 text-3xl font-semibold tracking-tight text-gray-900">
                            What&apos;s your gender?
                        </h1>

                        <p className="mb-8 text-gray-600">
                            We use this information to personalize your health
                            assessment.
                        </p>

                        <div className="space-y-3">
                            {[
                                { label: "Female", value: "FEMALE" },
                                { label: "Male", value: "MALE" },
                                { label: "Other", value: "OTHER" },
                            ].map((option) => (
                                <button
                                    key={option.value}
                                    type="button"
                                    onClick={() => {
                                        const gender = option.value as Gender;

                                        setAnswers((previous) => ({
                                            ...previous,
                                            gender,
                                        }));

                                        saveStep(1, {
                                            gender,
                                        });
                                    }}
                                    className="w-full rounded-2xl border border-gray-200 bg-white px-5 py-4 text-left font-medium text-gray-900 shadow-sm transition hover:border-gray-400 hover:shadow"
                                >
                                    {option.label}
                                </button>
                            ))}
                        </div>
                    </section>
                )}
                {step === 2 && (
                    <section>
                        <p className="mb-2 text-sm font-medium text-gray-500">
                            YOUR GOAL
                        </p>

                        <h1 className="mb-3 text-3xl font-semibold tracking-tight text-gray-900">
                            What&apos;s your main goal?
                        </h1>

                        <p className="mb-8 text-gray-600">
                            We&apos;ll use your goal to personalize your daily recommendations.
                        </p>

                        <div className="space-y-3">
                            {[
                                {
                                    label: "Lose weight",
                                    description: "Build a sustainable weight-loss plan",
                                    value: "LOSE_WEIGHT",
                                },
                                {
                                    label: "Maintain weight",
                                    description: "Stay healthy and maintain your current weight",
                                    value: "MAINTAIN_WEIGHT",
                                },
                                {
                                    label: "Gain weight",
                                    description: "Work toward healthy weight gain",
                                    value: "GAIN_WEIGHT",
                                },
                            ].map((option) => (
                                <button
                                    key={option.value}
                                    type="button"
                                    onClick={() => {
                                        const goal = option.value as Goal;

                                        setAnswers((previous) => ({
                                            ...previous,
                                            goal,
                                        }));

                                        saveStep(2, {
                                            goal,
                                        });
                                    }}
                                    className="w-full rounded-2xl border border-gray-200 bg-white px-5 py-4 text-left shadow-sm transition hover:border-gray-400 hover:shadow"
                                >
                                    <div className="font-medium text-gray-900">
                                        {option.label}
                                    </div>

                                    <div className="mt-1 text-sm text-gray-500">
                                        {option.description}
                                    </div>
                                </button>
                            ))}
                        </div>
                    </section>
                )}
                {step === 3 && (
                    <section>
                        <p className="mb-2 text-sm font-medium text-gray-500">
                            YOUR BODY PROFILE
                        </p>

                        <h1 className="mb-3 text-3xl font-semibold tracking-tight text-gray-900">
                            Tell us about your body
                        </h1>

                        <p className="mb-8 text-gray-600">
                            These details help us calculate your personalized health assessment.
                        </p>

                        <div className="space-y-4">
                            {/* Age */}
                            <label className="block">
                                <span className="mb-2 block text-sm font-medium text-gray-700">
                                    Age
                                </span>

                                <input
                                    type="number"
                                    min="18"
                                    max="100"
                                    value={answers.age ?? ""}
                                    onChange={(event) => {
                                        const value = event.target.value;

                                        setAnswers((previous) => ({
                                            ...previous,
                                            age: value === "" ? undefined : Number(value),
                                        }));
                                    }}
                                    onWheel={(event) => event.currentTarget.blur()}
                                    placeholder="25"
                                    className="w-full rounded-2xl border border-gray-200 bg-white px-5 py-4 outline-none transition focus:border-gray-500"
                                />
                            </label>

                            {/* Height */}
                            <label className="block">
                                <span className="mb-2 block text-sm font-medium text-gray-700">
                                    Height (cm)
                                </span>

                                <input
                                    type="number"
                                    min="120"
                                    max="230"
                                    value={answers.heightCm ?? ""}
                                    onChange={(event) => {
                                        const value = event.target.value;

                                        setAnswers((previous) => ({
                                            ...previous,
                                            heightCm: value === "" ? undefined : Number(value),
                                        }));
                                    }}
                                    onWheel={(event) => event.currentTarget.blur()}
                                    placeholder="165"
                                    className="w-full rounded-2xl border border-gray-200 bg-white px-5 py-4 outline-none transition focus:border-gray-500"
                                />
                            </label>

                            {/* Current weight */}
                            <label className="block">
                                <span className="mb-2 block text-sm font-medium text-gray-700">
                                    Current weight (kg)
                                </span>

                                <input
                                    type="number"
                                    min="35"
                                    max="300"
                                    step="0.1"
                                    value={answers.weightKg ?? ""}
                                    onChange={(event) => {
                                        const value = event.target.value;

                                        setAnswers((previous) => ({
                                            ...previous,
                                            weightKg: value === "" ? undefined : Number(value),
                                        }));
                                    }}
                                    onWheel={(event) => event.currentTarget.blur()}
                                    placeholder="65"
                                    className="w-full rounded-2xl border border-gray-200 bg-white px-5 py-4 outline-none transition focus:border-gray-500"
                                />
                            </label>

                            {/* Target weight */}
                            <label className="block">
                                <span className="mb-2 block text-sm font-medium text-gray-700">
                                    Target weight (kg)
                                </span>

                                <input
                                    type="number"
                                    min="35"
                                    max="300"
                                    step="0.1"
                                    value={answers.targetWeightKg ?? ""}
                                    onChange={(event) => {
                                        const value = event.target.value;

                                        setAnswers((previous) => ({
                                            ...previous,
                                            targetWeightKg:
                                                value === "" ? undefined : Number(value),
                                        }));
                                    }}
                                    onWheel={(event) => event.currentTarget.blur()}
                                    placeholder="58"
                                    className="w-full rounded-2xl border border-gray-200 bg-white px-5 py-4 outline-none transition focus:border-gray-500"
                                />
                            </label>

                            <button
                                type="button"
                                onClick={() => {
                                    if (
                                        answers.age === undefined ||
                                        answers.heightCm === undefined ||
                                        answers.weightKg === undefined ||
                                        answers.targetWeightKg === undefined
                                    ) {
                                        setError("Please complete all fields before continuing.");
                                        return;
                                    }

                                    if (
                                        answers.goal === "LOSE_WEIGHT" &&
                                        answers.targetWeightKg >= answers.weightKg
                                    ) {
                                        setError(
                                            "Your target weight must be lower than your current weight when your goal is weight loss."
                                        );
                                        return;
                                    }

                                    if (
                                        answers.goal === "GAIN_WEIGHT" &&
                                        answers.targetWeightKg <= answers.weightKg
                                    ) {
                                        setError(
                                            "Your target weight must be higher than your current weight when your goal is weight gain."
                                        );
                                        return;
                                    }

                                    if (
                                        answers.goal === "MAINTAIN_WEIGHT" &&
                                        Math.abs(answers.targetWeightKg - answers.weightKg) > 2
                                    ) {
                                        setError(
                                            "Your target weight should stay close to your current weight when your goal is maintenance."
                                        );
                                        return;
                                    }

                                    setError("");

                                    saveStep(3, {
                                        age: answers.age,
                                        heightCm: answers.heightCm,
                                        weightKg: answers.weightKg,
                                        targetWeightKg: answers.targetWeightKg,
                                    });
                                }}
                                className="mt-3 w-full rounded-2xl bg-gray-900 px-5 py-4 font-semibold text-white transition hover:bg-gray-800"
                            >
                                Continue
                            </button>
                        </div>
                    </section>
                )}
                {step === 4 && (
                    <section>
                        <p className="mb-2 text-sm font-medium text-gray-500">
                            YOUR ACTIVITY
                        </p>

                        <h1 className="mb-3 text-3xl font-semibold tracking-tight text-gray-900">
                            How active are you?
                        </h1>

                        <p className="mb-8 text-gray-600">
                            Choose the option that best describes your typical week.
                        </p>

                        <div className="space-y-3">
                            {[
                                {
                                    label: "Mostly sedentary",
                                    description: "Little or no regular exercise",
                                    value: "SEDENTARY",
                                },
                                {
                                    label: "Lightly active",
                                    description: "Exercise 1–3 days per week",
                                    value: "LIGHT",
                                },
                                {
                                    label: "Moderately active",
                                    description: "Exercise 3–5 days per week",
                                    value: "MODERATE",
                                },
                                {
                                    label: "Very active",
                                    description: "Exercise 6–7 days per week",
                                    value: "ACTIVE",
                                },
                                {
                                    label: "Extremely active",
                                    description: "Hard training or a highly active lifestyle",
                                    value: "VERY_ACTIVE",
                                },
                            ].map((option) => (
                                <button
                                    key={option.value}
                                    type="button"
                                    onClick={() => {
                                        const activityLevel =
                                            option.value as ActivityLevel;

                                        setAnswers((previous) => ({
                                            ...previous,
                                            activityLevel,
                                        }));

                                        saveStep(4, {
                                            activityLevel,
                                        });
                                    }}
                                    className="w-full rounded-2xl border border-gray-200 bg-white px-5 py-4 text-left shadow-sm transition hover:border-gray-400 hover:shadow"
                                >
                                    <div className="font-medium text-gray-900">
                                        {option.label}
                                    </div>

                                    <div className="mt-1 text-sm text-gray-500">
                                        {option.description}
                                    </div>
                                </button>
                            ))}
                        </div>
                    </section>
                )}
            </div>
        </main>
    );
}