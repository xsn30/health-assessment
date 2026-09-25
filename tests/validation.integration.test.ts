import { describe, expect, it } from "vitest";

const BASE_URL = "http://localhost:3000";
const TEST_TIMEOUT = 15000;

async function createSession() {
  const response = await fetch(`${BASE_URL}/api/sessions`, {
    method: "POST",
  });

  expect(response.status).toBe(201);

  return response.json();
}

describe("assessment API validation", () => {
  it(
    "rejects a missing required field",
    async () => {
      const session = await createSession();

      const response = await fetch(
        `${BASE_URL}/api/assessment/${session.sessionId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            step: 1,
            version: 0,
            data: {},
          }),
        }
      );

      expect(response.status).toBe(400);

      const body = await response.json();
      expect(body.error).toBe("Invalid request data");
    },
    TEST_TIMEOUT
  );

  it(
    "rejects fields that do not belong to the current step",
    async () => {
      const session = await createSession();

      const response = await fetch(
        `${BASE_URL}/api/assessment/${session.sessionId}`,
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
              age: 25,
            },
          }),
        }
      );

      expect(response.status).toBe(400);

      const body = await response.json();
      expect(body.error).toBe("Invalid request data");
    },
    TEST_TIMEOUT
  );

  it(
    "rejects body measurements outside the allowed ranges",
    async () => {
      const session = await createSession();

      // Complete step 1
      let response = await fetch(
        `${BASE_URL}/api/assessment/${session.sessionId}`,
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

      // Complete step 2
      response = await fetch(
        `${BASE_URL}/api/assessment/${session.sessionId}`,
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

      // Step 3 contains deliberately invalid values
      response = await fetch(
        `${BASE_URL}/api/assessment/${session.sessionId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            step: 3,
            version: 2,
            data: {
              age: 10,
              heightCm: 0,
              weightKg: -5,
              targetWeightKg: 20,
            },
          }),
        }
      );

      expect(response.status).toBe(400);

      const body = await response.json();
      expect(body.error).toBe("Invalid request data");
    },
    TEST_TIMEOUT
  );

  it(
    "rejects an invalid enum value",
    async () => {
      const session = await createSession();

      const response = await fetch(
        `${BASE_URL}/api/assessment/${session.sessionId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            step: 1,
            version: 0,
            data: {
              gender: "INVALID_GENDER",
            },
          }),
        }
      );

      expect(response.status).toBe(400);

      const body = await response.json();
      expect(body.error).toBe("Invalid request data");
    },
    TEST_TIMEOUT
  );

  it(
    "rejects an inconsistent target weight when completing assessment",
    async () => {
      const session = await createSession();
      const sessionId = session.sessionId;

      // Step 1
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

      // Step 2: user says the goal is weight loss
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

      // Step 3: values are individually valid,
      // but target weight conflicts with the weight-loss goal.
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
              targetWeightKg: 70,
            },
          }),
        }
      );

      expect(response.status).toBe(200);

      // Step 4
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

      // The final business validation must reject it.
      const completeResponse = await fetch(
        `${BASE_URL}/api/assessment/${sessionId}/complete`,
        {
          method: "POST",
        }
      );

      expect(completeResponse.status).toBe(400);

      const body = await completeResponse.json();

      expect(body.error).toBe(
        "Assessment is incomplete or invalid"
      );
    },
    TEST_TIMEOUT
  );
});