/* eslint-env jest */
const request = require("supertest");
const waitOn = require("wait-on");

const URL = process.env.SCHEDULER_API || "http://localhost:8080";
const MOCK_SERVER_PORT = process.env.MOCK_SERVER_PORT || 8081;
const MOCK_SERVER_HOST = process.env.MOCK_SERVER_HOST || "localhost";
const MOCK_SERVER_URL = "http://" + MOCK_SERVER_HOST + ":" + MOCK_SERVER_PORT;

describe("Scheduler", () => {
  console.log("Scheduler-Service URL= " + URL);

  beforeAll(async () => {
    const pingUrl = URL + "/";
    console.log("Waiting for service with URL: " + pingUrl);
    console.log("Waiting for service with URL: " + MOCK_SERVER_URL);
    await waitOn({ resources: [pingUrl, MOCK_SERVER_URL], timeout: 50000 });
  }, 60000);

  test("GET /version", async () => {
    const response = await request(URL).get("/version");
    expect(response.status).toEqual(200);
    expect(response.type).toEqual("text/plain");
    expect(response.text).toMatch(new RegExp("^(0|[1-9]d*).(0|[1-9]d*)"));
    // for semantic version
  });

  test("GET /jobs", async () => {
    await sleep(1200); // wait until scheduler does sync
    const response = await request(URL).get("/jobs");
    expect(response.status).toEqual(200);
    expect(response.type).toEqual("application/json");
    expect(response.body.length).toEqual(1);
    expect(response.body[0].scheduleJob).toBeDefined(); // TODO: make explicit
    expect(response.body[0].pipelineConfig).toEqual({
      id: 123,
      adapter: {},
      transformations: {},
      persistence: {},
      metadata: {},

      trigger: {
        periodic: true,
        firstExecution: Date.UTC(2019, 1, 1, 12, 5, 12, 30),
        interval: 10000
      }
    });
  });
});

const sleep = (ms) => {
  return new Promise(resolve => setTimeout(resolve, ms))
}
