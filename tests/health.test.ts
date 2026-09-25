import { describe, expect, it } from "vitest";
import { calculateHealthAssessment } from "../lib/health";

describe("calculateHealthAssessment", () => {
  it("calculates BMI, calories and target date for weight loss", () => {
    const result = calculateHealthAssessment(
      {
        gender: "FEMALE",
        goal: "LOSE_WEIGHT",
        age: 25,
        heightCm: 165,
        weightKg: 65,
        targetWeightKg: 58,
        activityLevel: "MODERATE",
      },
      new Date("2026-09-24T00:00:00Z")
    );

    expect(result.bmi).toBe(23.9);
    expect(result.recommendedCalories).toBe(1663);
    expect(result.predictionData.estimatedWeeks).toBe(14);
    expect(result.predictionData.currentWeightKg).toBe(65);
    expect(result.predictionData.targetWeightKg).toBe(58);

    expect(result.targetDate.toISOString()).toBe(
      "2026-12-31T00:00:00.000Z"
    );
  });

  it("does not apply a calorie deficit for maintenance", () => {
    const result = calculateHealthAssessment(
      {
        gender: "MALE",
        goal: "MAINTAIN_WEIGHT",
        age: 30,
        heightCm: 180,
        weightKg: 75,
        targetWeightKg: 75,
        activityLevel: "SEDENTARY",
      },
      new Date("2026-01-01T00:00:00Z")
    );

    expect(result.bmi).toBe(23.1);
    expect(result.predictionData.estimatedWeeks).toBe(0);
    expect(result.targetDate.toISOString()).toBe(
      "2026-01-01T00:00:00.000Z"
    );
  });

  it("applies a calorie surplus for weight gain", () => {
    const result = calculateHealthAssessment(
      {
        gender: "MALE",
        goal: "GAIN_WEIGHT",
        age: 25,
        heightCm: 180,
        weightKg: 70,
        targetWeightKg: 75,
        activityLevel: "MODERATE",
      },
      new Date("2026-01-01T00:00:00Z")
    );

    expect(result.recommendedCalories).toBeGreaterThan(0);
    expect(result.predictionData.estimatedWeeks).toBe(10);
    expect(result.targetDate.toISOString()).toBe(
      "2026-03-12T00:00:00.000Z"
    );
  });
    it("accepts valid boundary values", () => {
    const result = calculateHealthAssessment({
      gender: "FEMALE",
      goal: "LOSE_WEIGHT",
      age: 18,
      heightCm: 120,
      weightKg: 36,
      targetWeightKg: 35,
      activityLevel: "SEDENTARY",
    });

    expect(result.bmi).toBeGreaterThan(0);
  });

  it("rejects an age below the allowed range", () => {
    expect(() =>
      calculateHealthAssessment({
        gender: "FEMALE",
        goal: "LOSE_WEIGHT",
        age: 17,
        heightCm: 165,
        weightKg: 65,
        targetWeightKg: 58,
        activityLevel: "MODERATE",
      })
    ).toThrow("Age must be an integer between 18 and 100.");
  });

  it("rejects an age above the allowed range", () => {
    expect(() =>
      calculateHealthAssessment({
        gender: "FEMALE",
        goal: "LOSE_WEIGHT",
        age: 101,
        heightCm: 165,
        weightKg: 65,
        targetWeightKg: 58,
        activityLevel: "MODERATE",
      })
    ).toThrow("Age must be an integer between 18 and 100.");
  });

  it("rejects an invalid height", () => {
    expect(() =>
      calculateHealthAssessment({
        gender: "FEMALE",
        goal: "LOSE_WEIGHT",
        age: 25,
        heightCm: 0,
        weightKg: 65,
        targetWeightKg: 58,
        activityLevel: "MODERATE",
      })
    ).toThrow("Height must be between 120 and 230 cm.");
  });

  it("rejects an invalid weight", () => {
    expect(() =>
      calculateHealthAssessment({
        gender: "FEMALE",
        goal: "LOSE_WEIGHT",
        age: 25,
        heightCm: 165,
        weightKg: -10,
        targetWeightKg: 58,
        activityLevel: "MODERATE",
      })
    ).toThrow("Weight must be between 35 and 300 kg.");
  });

  it("rejects a non-finite height", () => {
    expect(() =>
      calculateHealthAssessment({
        gender: "FEMALE",
        goal: "LOSE_WEIGHT",
        age: 25,
        heightCm: Infinity,
        weightKg: 65,
        targetWeightKg: 58,
        activityLevel: "MODERATE",
      })
    ).toThrow("Height must be between 120 and 230 cm.");
  });

  it("rejects a weight-loss target that is not lower than current weight", () => {
    expect(() =>
      calculateHealthAssessment({
        gender: "FEMALE",
        goal: "LOSE_WEIGHT",
        age: 25,
        heightCm: 165,
        weightKg: 65,
        targetWeightKg: 70,
        activityLevel: "MODERATE",
      })
    ).toThrow(
      "Target weight must be lower than current weight for weight loss."
    );
  });

  it("rejects a weight-gain target that is not higher than current weight", () => {
    expect(() =>
      calculateHealthAssessment({
        gender: "MALE",
        goal: "GAIN_WEIGHT",
        age: 25,
        heightCm: 180,
        weightKg: 70,
        targetWeightKg: 65,
        activityLevel: "MODERATE",
      })
    ).toThrow(
      "Target weight must be higher than current weight for weight gain."
    );
  });

  it("rejects an unreasonable maintenance target", () => {
    expect(() =>
      calculateHealthAssessment({
        gender: "FEMALE",
        goal: "MAINTAIN_WEIGHT",
        age: 25,
        heightCm: 165,
        weightKg: 65,
        targetWeightKg: 70,
        activityLevel: "MODERATE",
      })
    ).toThrow(
      "Target weight must be close to current weight for maintenance."
    );
  });
});