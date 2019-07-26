const request = require("supertest");
const waitOn = require("wait-on");

const URL = process.env.CORE_API || "http://localhost:9000/core";

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
    const response = await request(URL)
        .post("/pipelines")
        .send(pipelineConfig);

    expect(response.status).toEqual(201);
    expect(response.header.location).toContain(response.body.id)
    expect(response.body.transformations).toEqual(pipelineConfig.transformations);
    expect(response.body.adapter).toEqual(pipelineConfig.adapter);
    expect(response.body.trigger).toEqual(pipelineConfig.trigger);
    expect(response.body.id).toBeDefined();
    expect(response.body.id).not.toEqual(pipelineConfig.id) // id not under control of client

    const delResponse = await request(URL)
        .delete("/pipelines/" + response.body.id)
        .send()

    expect(delResponse.status).toEqual(200);
  })

  test("PUT & DELETE /pipelines/{id}", async () => {

    const postResponse = await request(URL)
      .post("/pipelines")
      .send(pipelineConfig);

    const pipelineId = postResponse.body.id;

    const originalGetResponse = await request(URL)
      .get("/pipelines/" + pipelineId);

    let updatedConfig = pipelineConfig;
    updatedConfig.adapter.location = "http://www.disrespect.com";

    const putResponse = await request(URL)
      .put("/pipelines/" + pipelineId)
      .send(updatedConfig);

    expect(putResponse.status).toEqual(204);

    const updatedGetResponse = await request(URL)
      .get("/pipelines/" + pipelineId);

    expect(originalGetResponse.body.transformations).toEqual(updatedGetResponse.body.transformations);
    expect(originalGetResponse.body.metadata).toEqual(updatedGetResponse.body.metadata);
    expect(originalGetResponse.body.id).toEqual(updatedGetResponse.body.id);
    expect(updatedConfig.adapter.location).toEqual(updatedGetResponse.body.adapter.location);
    expect(originalGetResponse.body.adapter.format).toEqual(updatedGetResponse.body.adapter.format);
    expect(originalGetResponse.body.adapter.protocol).toEqual(updatedGetResponse.body.adapter.protocol);

    const delResponse = await request(URL)
        .delete("/pipelines/" + pipelineId)
        .send()

    expect(delResponse.status).toEqual(200);
    }
  )
});

const pipelineConfig = {
  "id": 12345,
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
    "license": "none",
    "displayName": "test pipeline 1",
    "description": "integraiton testing pipeline"
  }
};
