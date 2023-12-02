import supertest from "supertest";
import { app } from "../";
import dotenv from "dotenv";

dotenv.config();

const apiKey = {
  active: process.env.UF_TEST_API_KEY_ACTIVE,
  inactive: process.env.UF_TEST_API_KEY_INACTIVE,
  invalid: "***********************************",
};

describe("/upload", () => {
  it("should return 401 if no API key is provided", async () => {
    const response = await supertest(app).post("/upload");
    expect(response.status).toBe(401);
    expect(response.body.error).toBe(
      "Unauthorized request. API key is missing."
    );
  });

  it("should return 401 if API key is invalid", async () => {
    const response = await supertest(app)
      .post("/upload")
      .set("Authorization", `Bearer ${apiKey.invalid}`);
    expect(response.status).toBe(401);
    expect(response.body.error).toBe(
      "Unauthorized request. API key is invalid."
    );
  });

  it("should return 401 if API key has been deactivated", async () => {
    const response = await supertest(app)
      .post("/upload")
      .set("Authorization", `Bearer ${apiKey.inactive}`);
    expect(response.status).toBe(401);
    expect(response.body.error).toBe("API key has been deactivated.");
  });
});
