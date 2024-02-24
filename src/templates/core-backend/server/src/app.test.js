import supertest from "supertest";
import server from "./app";

describe("Testing API", () => {
  afterAll(() => {
    server.close();
  });

  it("GET call with valid input", async () => {
    const response = await supertest("http://localhost:3000").get(
      "/medianprime?n=10"
    );
    expect(response.status).toBe(200);
    expect(response.body).toStrictEqual([3, 5]);
  });

  it("GET call with invalid query param", async () => {
    const response = await supertest("http://localhost:3000").get(
      "/medianprime?a=10"
    );
    expect(response.status).toBe(400);
  });

  it("GET call with invalid path", async () => {
    const response = await supertest("http://localhost:3000").get("/home");
    expect(response.status).toBe(404);
  });
});
