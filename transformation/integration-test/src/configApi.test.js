/* eslint-env jest */
const request = require('supertest')
const waitOn = require('wait-on')
const URL = process.env.TRANSFORMATION_API || 'http://localhost:8080'

const MOCK_RECEIVER_PORT = process.env.MOCK_RECEIVER_PORT || 8081;
const MOCK_RECEIVER_HOST = process.env.MOCK_RECEIVER_HOST || "localhost";
const MOCK_RECEIVER_URL = "http://" + MOCK_RECEIVER_HOST + ":" + MOCK_RECEIVER_PORT;

describe("CONFIG API", () => {
    console.log("Transformation-Service URL= " + URL);

    beforeAll(async() => {
        const pingUrl = URL + "/";
        console.log("Waiting for transformation-service with URL: " + pingUrl);
        await waitOn({ resources: [pingUrl, MOCK_RECEIVER_URL], timeout: 50000 });
    }, 60000);

    describe("TEST VALID", () => {
        test("GET /config - empty pipeline config list in db", async() => {
            const response = await request(URL).get("/config");

            expect(response.status).toEqual(200);
            expect(response.body).toEqual([]);
        });

        test("(POST-->GET--> DELETE) /config - Persist pipeline Config", async() => {
            const config = getValidPipelineConfig();
            /**====================================
             * POST
             *======================================*/
            const postResponse = await request(URL).post(`/config`).send(config);

            expect(postResponse.status).toEqual(200);
            expect(postResponse.type).toEqual("application/json");
            expect(postResponse.body.id).not.toBeUndefined();

            const lastInsertedId = postResponse.body.id;
            let receivedConfig = Object.assign({}, postResponse.body);
            delete receivedConfig.id;
            expect(receivedConfig).toEqual(config);
            /**====================================
             * GET
             *======================================*/
            const getResponse = await request(URL).get("/config");
            const getConfig = getResponse.body[getResponse.body.length - 1]; // Gat last element

            expect(getResponse.status).toEqual(200);
            expect(postResponse.body).toEqual(getConfig);

            /**====================================
             * DELETE
             *======================================*/
            const deleteResponse = await request(URL).delete(`/config/${lastInsertedId}`);

            expect(deleteResponse.status).toEqual(200);
        });

        test("(POST-->UPDATE-->GET--> DELETE) /config - Updates pipeline Config", async() => {
            /**====================================
             * POST
             *======================================*/
            const config = getValidPipelineConfig();
            const postResponse = await request(URL).post(`/config`).send(config);
            const lastInsertedId = postResponse.body.id;
            /**====================================
             * Update
             *======================================*/
            config.datasourceId = 4711;

            const updateResonse = await request(URL).put(`/config/${lastInsertedId}`).send(config);

            expect(updateResonse.status).toEqual(200);
            //expect(updateResonse.type).toEqual("application/json");

            let receivedConfig = Object.assign({}, updateResonse.body);
            expect(receivedConfig.datasourceId).toEqual(4711);

            /**====================================
             * GET
             *======================================*/
            const getResponse = await request(URL).get("/config");

            const getConfig = getResponse.body[getResponse.body.length - 1];
            expect(getResponse.status).toEqual(200);
            expect(getConfig).toEqual(updateResonse.body);
            /**====================================
             * DELETE
             *======================================*/
            const deleteResponse = await request(URL).delete(`/config/${lastInsertedId}`);
            expect(deleteResponse.status).toEqual(200);
        });

        test("(POST --> DELETE --> GET)  /config - Tests DELETION", async() => {
            /*====================================
             * POST the config
             *=-=================================*/
            const config = getValidPipelineConfig();
            const postResponse = await request(URL).post("/config").send(config);

            expect(postResponse.status).toEqual(200);
            expect(postResponse.type).toEqual("application/json");
            expect(postResponse.body.id).not.toBeUndefined();

            const insertedId = postResponse.body.id;

            // Compare received with sent config
            let receivedConfig = Object.assign({}, postResponse.body);
            delete receivedConfig.id;
            expect(receivedConfig).toEqual(config);

            /*====================================
             * DELETE the config
             *==================================*/
            const deleteResponse = await request(URL).delete(`/config/${insertedId}`);

            expect(deleteResponse.status).toEqual(200);

            /*====================================
             * GET Empty config
             *==================================*/
            const getResponse = await request(URL).get(`/config/`);

            expect(getResponse.status).toEqual(200);
            expect(getResponse.type).toEqual("application/json");

            expect(getResponse.body).toEqual([]);
        });
    });

    describe("TEST INVALID ID", () => {
        test("(DELETE) /config/{id} - Expect Bad Request for id that does not exist in database", async() => {
            const invalidId = 4711;
            const deleteResponse = await request(URL).delete(`/config/${invalidId}`);
            expect(deleteResponse.status).toEqual(400);
        });

        test("(UPDATE) /config/{id} - Expect Bad Request for id that does not exist in database", async() => {
            const invalidId = 4711;
            const config = getValidPipelineConfig();
            const response = await request(URL).put(`/config/${invalidId}`).send(config);
            expect(response.status).toEqual(400);
        });

        test("(GET) /config/{id} - Expect Empty list for id that does not exist in database", async() => {
            const invalidId = 4711;
            const getResponse = await request(URL).get(`/config?id=${invalidId}`);
            expect(getResponse.status).toEqual(200);
            expect(getResponse.body).toEqual([]);
        });
    });

    describe("TEST INVALID CONFIG PERSISTENCE", () => {
        test("(POST--> GET) /config/{id} - Expect Bad Request for id that does not exist in database", async() => {
            const config = getValidPipelineConfig();

            delete config.transformation;
            const response = await request(URL).post(`/config/`).send(config);

            expect(response.status).toEqual(400);

            const getResponse = await request(URL).get(`/config/`);
            expect(getResponse.status).toEqual(200);
            expect(getResponse.body.length).toEqual(0);
        });

        test("(POST --> UPDATE --> GET --> DELETE) /config/{id} - Expect Bad Request for id that does not exist in database", async() => {
            const config = getValidPipelineConfig();

            /*====================================
             * POST valid config
             *=-=================================*/
            const postResponse = await request(URL).post(`/config/`).send(config);
            expect(postResponse.status).toEqual(200);

            /*====================================
             * UPDATE invalid config
             *=-=================================*/
            const persistedId = postResponse.body.id;
            delete config.transformation.func;
            const putResponse = await request(URL).put(`/config/${persistedId}`).send(config);
            expect(putResponse.status).toEqual(400);

            /*====================================
             * GET valid config
             *=-=================================*/
            const getResponse = await request(URL).get(`/config/`);
            expect(getResponse.status).toEqual(200);
            expect(getResponse.body).toEqual([postResponse.body]);

            /*====================================
             * DELTE valid config
             *=-=================================*/
            const deleteResponse = await request(URL).delete(`/config/${persistedId}`);
            expect(deleteResponse.status).toEqual(200);
        });
    });
});

function getValidPipelineConfig() {
    return {
        datasourceId: 1,
        metadata: getPipelineMetaData(),
        transformation: getTransformationConfig(),
    };
}

function getPipelineMetaData() {
    return {
        displayName: "SOME_NAME",
        description: "LOREM IPSUM...",
        author: "ALICE AND BOB",
        license: "Apache 2.0",
    };
}

function getTransformationConfig() {
    return {
        func: "return data;",
    };
}