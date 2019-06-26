const request = require("supertest");
const waitOn = require("wait-on");

const URL = process.env.STORAGE_API || "http://localhost:3000";

describe("Storage", () => {
  console.log("Storage-Service URL= " + URL);

  beforeAll(async () => {
    try {
      const pingUrl = URL;
      console.log("Waiting for service with URL: " + pingUrl);
      await waitOn({ resources: [pingUrl], timeout: 50000 });
      console.log("[online] Service with URL:  " + pingUrl);
    } catch(err) {
      process.exit(1);
    }
  }, 60000);
  
  test("POST /rpc/createStructureForDatasource", async () => {
    const reqBody = {
      pipelineid: "pipeline-123test",
    };

    const response = await request(URL)
      .post("/rpc/createstructurefordatasource")
      .send(reqBody);
    expect(response.status).toEqual(200);
  });

  test("POST /pipeline-123test_data", async () => {
    const reqBody = {
      data: {
        argument1: "string",
        argument2: 123
      },
    };

    const response = await request(URL)
      .post("/pipeline-123test_data")
      .send(reqBody);
    expect(response.status).toEqual(201);
  });

  test("GET /pipeline-123test_data", async () => {

    const response = await request(URL)
      .get("/pipeline-123test_data");
    expect(response.status).toEqual(200);
    expect(response.body.length).toEqual(1);
    expect(response.body[0].id).toBeDefined();
    expect(response.body[0].data).toEqual({argument1: "string", argument2: 123});
  });

  test("POST /pipeline-123test_metadata", async () => {
    const reqBody = {
      timestamp: '2004-10-19 10:23:54',
      origin: 'origin',
      license: 'license',
      pipelineId: 'pipelineid',
      id_data: 1
    };

    const response = await request(URL)
      .post("/pipeline-123test_metadata")
      .send(reqBody);
    expect(response.status).toEqual(201);
  });

  test("GET /pipeline-123test_metadata", async () => {

    const response = await request(URL)
      .get("/pipeline-123test_metadata");
    expect(response.status).toEqual(200);
    expect(response.body.length).toEqual(1);
    expect(response.body[0].id).toBeDefined();
    expect(response.body[0].timestamp).toEqual('2004-10-19T10:23:54');
    expect(response.body[0].license).toEqual('license');
    expect(response.body[0].pipelineId).toEqual('pipelineid');
    expect(response.body[0].id_data).toEqual(1);
  });

  test("POST /rpc/deleteStructureForDatasource", async () => {
    const reqBody = {
      pipelineid: "pipeline-123test",
    };

    const response = await request(URL)
      .post("/rpc/deletestructurefordatasource")
      .send(reqBody);
    expect(response.status).toEqual(200);
  });
});
