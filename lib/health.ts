export type Gender = "FEMALE" | "MALE" | "OTHER";

export type Goal =
  | "LOSE_WEIGHT"
  | "MAINTAIN_WEIGHT"
  | "GAIN_WEIGHT";

export type ActivityLevel =
  | "SEDENTARY"
  | "LIGHT"
  | "MODERATE"
  | "ACTIVE"
  | "VERY_ACTIVE";

export interface HealthInput {
  gender: Gender;
  goal: Goal;
  age: number;
  heightCm: number;
  weightKg: number;
  targetWeightKg: number;
  activityLevel: ActivityLevel;
}

export interface HealthResult {
  bmi: number;
  recommendedCalories: number;
  targetDate: Date;
  predictionData: {
    currentWeightKg: number;
    targetWeightKg: number;
    estimatedWeeks: number;
  };
}

const activityFactors: Record<ActivityLevel, number> = {
  SEDENTARY: 1.2,
  LIGHT: 1.375,
  MODERATE: 1.55,
  ACTIVE: 1.725,
  VERY_ACTIVE: 1.9,
};
export function validateHealthInput(input: HealthInput): void {
  if (!Number.isInteger(input.age) || input.age < 18 || input.age > 100) {
    throw new Error("Age must be an integer between 18 and 100.");
  }

  if (
    !Number.isFinite(input.heightCm) ||
    input.heightCm < 120 ||
    input.heightCm > 230
  ) {
    throw new Error("Height must be between 120 and 230 cm.");
  }

  if (
    !Number.isFinite(input.weightKg) ||
    input.weightKg < 35 ||
    input.weightKg > 300
  ) {
    throw new Error("Weight must be between 35 and 300 kg.");
  }

  if (
    !Number.isFinite(input.targetWeightKg) ||
    input.targetWeightKg < 35 ||
    input.targetWeightKg > 300
  ) {
    throw new Error("Target weight must be between 35 and 300 kg.");
  }

  if (
    input.goal === "LOSE_WEIGHT" &&
    input.targetWeightKg >= input.weightKg
  ) {
    throw new Error(
      "Target weight must be lower than current weight for weight loss."
    );
  }

  if (
    input.goal === "GAIN_WEIGHT" &&
    input.targetWeightKg <= input.weightKg
  ) {
    throw new Error(
      "Target weight must be higher than current weight for weight gain."
    );
  }

  if (
    input.goal === "MAINTAIN_WEIGHT" &&
    Math.abs(input.targetWeightKg - input.weightKg) > 2
  ) {
    throw new Error(
      "Target weight must be close to current weight for maintenance."
    );
  }
}

export function calculateHealthAssessment(
  input: HealthInput,
  now: Date = new Date()
): HealthResult {
    validateHealthInput(input);
  const {
    gender,
    goal,
    age,
    heightCm,
    weightKg,
    targetWeightKg,
    activityLevel,
  } = input;

  // 1. BMI
  const heightM = heightCm / 100;
  const bmi = weightKg / (heightM * heightM);

  // 2. BMR - Mifflin-St Jeor equation
  let genderAdjustment: number;

  if (gender === "MALE") {
    genderAdjustment = 5;
  } else if (gender === "FEMALE") {
    genderAdjustment = -161;
  } else {
    // Neutral midpoint for this demo system
    genderAdjustment = -78;
  }

  const bmr =
    10 * weightKg +
    6.25 * heightCm -
    5 * age +
    genderAdjustment;

  // 3. Estimate daily energy expenditure
  const tdee = bmr * activityFactors[activityLevel];

  // 4. Adjust calories according to goal
  let calorieAdjustment = 0;

  if (goal === "LOSE_WEIGHT") {
    calorieAdjustment = -500;
  } else if (goal === "GAIN_WEIGHT") {
    calorieAdjustment = 300;
  }

  const recommendedCalories = Math.round(
    Math.max(1200, tdee + calorieAdjustment)
  );

  // 5. Estimate target date
  const weightDifference = Math.abs(weightKg - targetWeightKg);

  // Demo assumption: approximately 0.5 kg change per week
  const estimatedWeeks =
    goal === "MAINTAIN_WEIGHT"
      ? 0
      : Math.ceil(weightDifference / 0.5);

  const targetDate = new Date(now);
  targetDate.setDate(targetDate.getDate() + estimatedWeeks * 7);

  return {
    bmi: Number(bmi.toFixed(1)),
    recommendedCalories,
    targetDate,
    predictionData: {
      currentWeightKg: weightKg,
      targetWeightKg,
      estimatedWeeks,
    },
  };
}