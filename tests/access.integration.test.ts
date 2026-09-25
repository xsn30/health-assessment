import { describe, expect, it } from "vitest";

const BASE_URL = "http://localhost:3000";
const TEST_TIMEOUT = 30000;

describe("subscription access and payment flow", () => {
  it(
    "changes results from protected to full after payment",
    async () => {
      // 1. Create a fresh session
      const sessionResponse = await fetch(`${BASE_URL}/api/sessions`, {
        method: "POST",
      });

      expect(sessionResponse.status).toBe(201);

      const session = await sessionResponse.json();
      const sessionId = session.sessionId;

      // 2. Complete step 1
      let response = await fetch(
        `${BASE_URL}/api/assessment/${sessionId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            step: 1,
            version: 0,
            data: {
              gender: "FEMALE",
            },
          }),
        }
      );

      expect(response.status).toBe(200);

      // 3. Complete step 2
      response = await fetch(
        `${BASE_URL}/api/assessment/${sessionId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            step: 2,
            version: 1,
            data: {
              goal: "LOSE_WEIGHT",
            },
          }),
        }
      );

      expect(response.status).toBe(200);

      // 4. Complete step 3
      response = await fetch(
        `${BASE_URL}/api/assessment/${sessionId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            step: 3,
            version: 2,
            data: {
              age: 25,
              heightCm: 165,
              weightKg: 65,
              targetWeightKg: 58,
            },
          }),
        }
      );

      expect(response.status).toBe(200);

      // 5. Complete step 4
      response = await fetch(
        `${BASE_URL}/api/assessment/${sessionId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            step: 4,
            version: 3,
            data: {
              activityLevel: "MODERATE",
            },
          }),
        }
      );

      expect(response.status).toBe(200);

      // 6. Trigger server-side health calculation
      const completeResponse = await fetch(
        `${BASE_URL}/api/assessment/${sessionId}/complete`,
        {
          method: "POST",
        }
      );

      expect(completeResponse.status).toBe(200);

      // 7. Free user must receive only public data
      const freeResponse = await fetch(
        `${BASE_URL}/api/results/${sessionId}`
      );

      expect(freeResponse.status).toBe(200);

      const freeResult = await freeResponse.json();

      expect(freeResult.subscriptionStatus).toBe("INACTIVE");
      expect(freeResult.locked).toBe(true);
      expect(freeResult.result.bmi).toBe(23.9);

      expect(freeResult.result).not.toHaveProperty(
        "recommendedCalories"
      );
      expect(freeResult.result).not.toHaveProperty("targetDate");
      expect(freeResult.result).not.toHaveProperty("predictionData");

      // 8. Mock payment
      const payResponse = await fetch(`${BASE_URL}/api/pay`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sessionId,
        }),
      });

      expect(payResponse.status).toBe(200);

      const payment = await payResponse.json();

      expect(payment.subscriptionStatus).toBe("ACTIVE");

      // 9. Paid user receives full protected result
      const paidResponse = await fetch(
        `${BASE_URL}/api/results/${sessionId}`
      );

      expect(paidResponse.status).toBe(200);

      const paidResult = await paidResponse.json();

      expect(paidResult.subscriptionStatus).toBe("ACTIVE");
      expect(paidResult.locked).toBe(false);

      expect(paidResult.result.bmi).toBe(23.9);
      expect(paidResult.result).toHaveProperty(
        "recommendedCalories"
      );
      expect(paidResult.result).toHaveProperty("targetDate");
      expect(paidResult.result).toHaveProperty("predictionData");

      expect(
        paidResult.result.predictionData.estimatedWeeks
      ).toBe(14);
    },
    TEST_TIMEOUT
  );
});