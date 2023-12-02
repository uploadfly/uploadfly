import supertest from "supertest";
import { app } from "../";

describe("/upload", () => {
  it("should return 401 if no API key is provided", async () => {
    const response = await supertest(app).post("/upload");
    console.log(response.body);
    expect(response.status).toBe(401);
  });
});
