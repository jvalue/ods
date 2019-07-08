const request = require("supertest");
const waitOn = require("wait-on");

const URL = process.env.CORE_API || "http://localhost:8080";

describe("Core", () => {
  console.log("Core-Service URL= " + URL);

  beforeAll(async () => {
    try {
      const pingUrl = URL + "/version";
      console.log("Waiting for service with URL: " + pingUrl);
      await waitOn({ resources: [pingUrl], timeout: 50000 });
      console.log("[online] Service with URL:  " + pingUrl);
    } catch(err) {
      process.exit(1);
    }
  }, 60000);
  
  test("GET /version", async () => {
    const response = await request(URL).get("/version");
    expect(response.status).toEqual(200);
    expect(response.type).toEqual("text/plain");
    
    const semanticVersionRegEx = '^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)';
    expect(response.text).toMatch(new RegExp(semanticVersionRegEx));
  });

  test("GET /pipelines", async () => {
    const response = await request(URL).get("/pipelines");
    expect(response.status).toEqual(200);
    expect(response.type).toEqual("application/json");

    expect(response.body).toEqual([])
  });

  test("POST & DELETE /pipelines", async () => {
    const reqBody = {
      "adapter": {
        "protocol": "HTTP",
        "format": "XML",
        "location": "http://www.nodisrespect.org"
      },
      "transformations": [
        {
          "func": "return data+data;",
          "data": "[1]"
        },
        {
          "func": "return 1",
          "data": "[]"
        }
      ],
      "trigger": {
        "firstExecution": "1905-12-01T02:30:00.123",
        "periodic": true,
        "interval": 50000
      },
      "metadata": {
        "author": "icke",
        "license": "none"
      }
    };

    const response = await request(URL)
        .post("/pipelines")
        .send(reqBody);

    const UUIDregEx = '[0-9a-fA-F]{8}\\-[0-9a-fA-F]{4}\\-[0-9a-fA-F]{4}\\-[0-9a-fA-F]{4}\\-[0-9a-fA-F]{12}';
    const id = response.body.id;
    expect(response.status).toEqual(201);
    expect(response.header.location).toContain(response.body.id)
    expect(response.body.transformations).toEqual(reqBody.transformations);
    expect(response.body.adapter).toEqual(reqBody.adapter);
    expect(response.body.trigger).toEqual(reqBody.trigger);
    expect(id).toMatch(new RegExp(UUIDregEx));
    expect(id).toEqual(response.body.persistence.pipelineid);

    const delResponse = await request(URL)
        .delete("/pipelines/" + response.body.id)
        .send()

    expect(delResponse.status).toEqual(200);
  })
});
