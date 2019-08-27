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
    const response = await request(URL)
        .post("/pipelines")
        .send(pipelineConfig);

    expect(response.status).toEqual(201);
    expect(response.header.location).toContain(response.body.id);
    expect(response.body.transformations).toEqual(pipelineConfig.transformations);
    expect(response.body.adapter).toEqual(pipelineConfig.adapter);
    expect(response.body.trigger).toEqual(pipelineConfig.trigger);
    expect(response.body.id).toBeDefined();
    expect(response.body.id).not.toEqual(pipelineConfig.id); // id not under control of client

    const delResponse = await request(URL)
        .delete("/pipelines/" + response.body.id)
        .send();

    expect(delResponse.status).toEqual(204);
  });

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
        .send();

    expect(delResponse.status).toEqual(204);
  });

  test("DELETE /pipelines/", async () => {

    await request(URL)
        .post("/pipelines")
        .send(pipelineConfig);
    await request(URL)
        .post("/pipelines")
        .send(pipelineConfig);

    const delResponse = await request(URL)
        .delete("/pipelines/")
        .send();

    expect(delResponse.status).toEqual(204)
  });

  test("GET /events", async () => {
    const response = await request(URL)
        .get("/events")
        .send();

    expect(response.status).toEqual(200);
    expect(response.type).toEqual("application/json");
  });

  test("GET /events/pipeline/{id}", async () => {
    const pipelinesResponse = await request(URL)
        .post("/pipelines")
        .send(pipelineConfig);
    const pipelineId = pipelinesResponse.body.id;

    await request(URL)
        .delete("/pipelines/" + pipelineId);

    const eventsResponse = await request(URL)
        .get("/events/pipeline/"+pipelineId)
        .send();

    expect(eventsResponse.status).toEqual(200);
    expect(eventsResponse.type).toEqual("application/json");
    expect(eventsResponse.body.length).toBe(2);
    expect(eventsResponse.body[0].pipelineConfig).toBe(pipelineId);
    expect(eventsResponse.body[0].eventType).toEqual("PIPELINE_CREATE");
    expect(eventsResponse.body[1].pipelineConfig).toBe(pipelineId);
    expect(eventsResponse.body[1].eventType).toEqual("PIPELINE_DELETE");
  });

  test("GET /events [with offset]", async () => {
    const pipelinesResponse = await request(URL)
        .post("/pipelines")
        .send(pipelineConfig);
    const pipelineId = pipelinesResponse.body.id;

    await request(URL)
        .delete("/pipelines/" + pipelineId);

    const eventsResponse = await request(URL)
        .get("/events/pipeline/"+pipelineId)
        .send();
    const eventId = eventsResponse.body[0].eventId;

    const eventsAfter = await request(URL)
        .get("/events?after="+eventId)
        .send();

    expect(eventsAfter.status).toEqual(200);
    expect(eventsAfter.type).toEqual("application/json");
    expect(eventsAfter.body.length).toBe(1);
    expect(eventsAfter.body[0].eventId).toBe(eventId+1);
    expect(eventsAfter.body[0].pipelineConfig).toBe(pipelineId);
    expect(eventsAfter.body[0].eventType).toEqual("PIPELINE_DELETE");
  });

  test("GET /events/latest", async () => {
    const postResponse = await request(URL)
        .post("/pipelines")
        .send(pipelineConfig);
    const pipelineId = postResponse.body.id;

    await request(URL)
        .delete("/pipelines/" + pipelineId)
        .send();

    const response = await request(URL)
        .get("/events/latest")
        .send();

    expect(response.status).toEqual(200);
    expect(response.type).toEqual("application/json");
    expect(Object.keys(response.body)).toHaveLength(3);
    expect(response.body.eventId).toBeTruthy();
    expect(response.body.pipelineConfig).toBe(pipelineId);
    expect(response.body.eventType).toEqual("PIPELINE_DELETE");
  })
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
    "firstExecution": "1905-12-01T02:30:00.123Z",
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
