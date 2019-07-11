/* eslint-env jest */
const request = require("supertest");
const waitOn = require("wait-on");

const URL = process.env.SCHEDULER_API || "http://localhost:8080";

describe("Scheduler", () => {
  console.log("Scheduler-Service URL= " + URL);

  beforeAll(async () => {
    const pingUrl = URL + "/";
    console.log("Waiting for service with URL: " + pingUrl);
    await waitOn({ resources: [pingUrl], timeout: 50000 });
  }, 60000);

  test("GET /version", async () => {
    const response = await request(URL).get("/version");
    expect(response.status).toEqual(200);
    expect(response.type).toEqual("text/plain");
    expect(response.text).toMatch(new RegExp("^(0|[1-9]d*).(0|[1-9]d*).(0|[1-9]d*)"));
    // for semantic version
  });

});

const sleep = (ms) => {
  return new Promise(resolve => setTimeout(resolve, ms))
}
