import { describe, expect, it } from "vitest";

const TEST_TIMEOUT = 15000;
const BASE_URL = "http://localhost:3000";

async function createSession() {
  const response = await fetch(`${BASE_URL}/api/sessions`, {
    method: "POST",
  });

  expect(response.status).toBe(201);

  return response.json();
}

describe("assessment persistence integration", () => {
  it("saves a step and restores progress", async () => {
    const session = await createSession();

    const updateResponse = await fetch(
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

    expect(updateResponse.status).toBe(200);

    const getResponse = await fetch(
      `${BASE_URL}/api/assessment/${session.sessionId}`
    );

    expect(getResponse.status).toBe(200);

    const assessment = await getResponse.json();

    expect(assessment.gender).toBe("FEMALE");
    expect(assessment.currentStep).toBe(1);
    expect(assessment.version).toBe(1);
  }, TEST_TIMEOUT);

  it("rejects skipping unfinished steps", async () => {
    const session = await createSession();

    const response = await fetch(
      `${BASE_URL}/api/assessment/${session.sessionId}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          step: 4,
          version: 0,
          data: {
            activityLevel: "MODERATE",
          },
        }),
      }
    );

    expect(response.status).toBe(409);

    const body = await response.json();

    expect(body.error).toBe("Invalid step order");
  });

  it("rejects a repeated submission with a stale version", async () => {
    const session = await createSession();

    const firstResponse = await fetch(
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

    expect(firstResponse.status).toBe(200);

    const repeatedResponse = await fetch(
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
            gender: "MALE",
          },
        }),
      }
    );

    expect(repeatedResponse.status).toBe(409);

    const body = await repeatedResponse.json();

    expect(body.error).toBe("Version conflict");
  });

  it("allows only one concurrent update with the same version", async () => {
    const session = await createSession();

    const makeRequest = (gender: "FEMALE" | "MALE") =>
      fetch(`${BASE_URL}/api/assessment/${session.sessionId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          step: 1,
          version: 0,
          data: {
            gender,
          },
        }),
      });

    const [responseA, responseB] = await Promise.all([
      makeRequest("FEMALE"),
      makeRequest("MALE"),
    ]);

    const statuses = [responseA.status, responseB.status].sort();

    expect(statuses).toEqual([200, 409]);

    const getResponse = await fetch(
      `${BASE_URL}/api/assessment/${session.sessionId}`
    );

    const assessment = await getResponse.json();

    expect(assessment.currentStep).toBe(1);
    expect(assessment.version).toBe(1);
    expect(["FEMALE", "MALE"]).toContain(assessment.gender);
  });
});