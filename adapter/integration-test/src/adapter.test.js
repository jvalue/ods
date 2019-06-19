const request = require("supertest");
const waitOn = require("wait-on");
const jsonAdapterconfig = require("./resources/JsonAdapterConfig.json");
const xmlAdapterconfig = require("./resources/XmlAdapterConfig.json");

const URL = process.env.ADAPTER_API || "http://localhost:8080";

describe("Adapter", () => {
  console.log("Adapter-Service URL= " + URL);

  beforeAll(async () => {
    const urlToCheck = URL + "/version";
    console.log("Waiting for service with URL: " + urlToCheck);
    await waitOn({ resources: [urlToCheck], timeout: 50000 });
  }, 60000);

  test("GET /version", async () => {
    const response = await request(URL).get("/version");
    expect(response.status).toEqual(200);
    expect(response.type).toEqual("text/plain");
    expect(response.text).toMatch(new RegExp("^(0|[1-9]d*).(0|[1-9]d*)"));
    // for semantic version
    //expect(response.text).toMatch(new RegExp('^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)'));
  });

  test("GET /formats", async () => {
    const response = await request(URL).get("/formats");
    expect(response.status).toEqual(200);
    expect(response.type).toEqual("application/json");
    expect(response.body.length).toBeGreaterThanOrEqual(2);

    response.body.forEach(e => {
      expect(e.type).toBeDefined();
      expect(e.parameters).toBeDefined();
    });
  });

  test("GET /protocols", async () => {
    const response = await request(URL).get("/protocols");
    expect(response.status).toEqual(200);
    expect(response.type).toEqual("application/json");
    expect(response.body.length).toBeGreaterThanOrEqual(1);

    response.body.forEach(e => {
      expect(e.type).toBeDefined();
      expect(e.parameters).toBeDefined();
    });
  });

  test("POST /dataImport JSON-Adapter", async () => {
    const response = await request(URL)
      .post("/dataImport")
      .send(jsonAdapterconfig);
    expect(response.status).toEqual(200);
    expect(response.body).toEqual({ whateverwillbe: "willbe", quesera: "sera" });
  });

  test("POST /dataImport XML-Adapter", async () => {
    const response = await request(URL)
      .post("/dataImport")
      .send(xmlAdapterconfig);
    expect(response.status).toEqual(200);
    expect(response.body).toEqual({
      from: "Jani",
      heading: "Reminder",
      to: "Tove",
      body: "Don't forget me this weekend!"
    });
  });
});
