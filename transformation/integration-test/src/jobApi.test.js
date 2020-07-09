/* eslint-env jest */
const request = require('supertest')
const waitOn = require('wait-on')
const URL = process.env.TRANSFORMATION_API || "http://localhost:8080";


describe("JOB API", () => {
    console.log("Transformation-Service URL= " + URL);

    beforeAll(async() => {
        const pingUrl = URL + "/";
        console.log("Waiting for transformation-service with URL: " + pingUrl);
        await waitOn({ resources: [pingUrl], timeout: 50000 });
    }, 60000);

    test("GET /version", async() => {
        const response = await request(URL).get("/version");
        expect(response.status).toEqual(200);
        expect(response.type).toEqual("text/plain");
        const semanticVersionReExp = "^(0|[1-9]d*).(0|[1-9]d*).(0|[1-9]d*)";
        expect(response.text).toMatch(new RegExp(semanticVersionReExp));
    });

    test("POST /job numerical", async() => {
        const simpleJob = {
            func: "return 1;",
            data: {},
        };

        const response = await request(URL).post("/job").send(simpleJob);

        expect(response.status).toEqual(200);
        expect(response.type).toEqual("application/json");
        const { data, stats } = response.body;
        expect(data).toEqual(1);
        expect(stats.durationInMilliSeconds).toBeGreaterThan(0);
        expect(stats.endTimestamp).toBeGreaterThanOrEqual(stats.startTimestamp);
    });

    test("POST /job", async() => {
        const simpleJob = {
            func: "return {number: 1};",
            data: {},
        };

        const response = await request(URL).post("/job").send(simpleJob);

        expect(response.status).toEqual(200);
        expect(response.type).toEqual("application/json");
        const { data, stats } = response.body;
        expect(data).toEqual({ number: 1 });
        expect(stats.durationInMilliSeconds).toBeGreaterThan(0);
        expect(stats.endTimestamp).toBeGreaterThanOrEqual(stats.startTimestamp);
    });

    test("POST /job with transformation", async() => {
        const transformationJob = {
            func: "return {numberTwo: data.number+1};",
            data: { number: 1 },
        };

        const response = await request(URL).post("/job").send(transformationJob);

        expect(response.status).toEqual(200);
        expect(response.type).toEqual("application/json");
        const { data, stats } = response.body;
        expect(data).toEqual({ numberTwo: 2 });
        expect(stats.durationInMilliSeconds).toBeGreaterThan(0);
        expect(stats.endTimestamp).toBeGreaterThanOrEqual(stats.startTimestamp);
    });

    test("POST /job with syntax error", async() => {
        const transformationJob = {
            func: "syntax error;\nreturn data;",
            data: { number: 1 },
        };

        const response = await request(URL).post("/job").send(transformationJob);

        expect(response.status).toEqual(400);
        expect(response.type).toEqual("application/json");
        const { data, error, stats } = response.body;
        expect(data).toBeUndefined();
        expect(error.name).toEqual("SyntaxError");
        expect(error.lineNumber).toBe(1);
        expect(error.position).toBe(7);
        expect(stats.durationInMilliSeconds).toBeGreaterThan(0);
        expect(stats.endTimestamp).toBeGreaterThanOrEqual(stats.startTimestamp);
    });

    test("POST /job with reference error", async() => {
        const transformationJob = {
            func: "return somethingThatIsntThere;",
            data: { number: 1 },
        };

        const response = await request(URL).post("/job").send(transformationJob);

        expect(response.status).toEqual(400);
        expect(response.type).toEqual("application/json");
        const { data, error, stats } = response.body;
        expect(data).toBeUndefined();
        expect(error.name).toEqual("ReferenceError");
        expect(error.lineNumber).toBe(1);
        expect(error.position).toBe(1);
        expect(stats.durationInMilliSeconds).toBeGreaterThan(0);
        expect(stats.endTimestamp).toBeGreaterThanOrEqual(stats.startTimestamp);
    });

    test("POST /job with no return data", async() => {
        const transformationJob = {
            func: "data.a *= 2;",
            data: { a: 1 },
        };

        const response = await request(URL).post("/job").send(transformationJob);

        expect(response.status).toEqual(400);
        expect(response.type).toEqual("application/json");
        const { data, error, stats } = response.body;
        expect(data).toBeUndefined();
        expect(error.name).toEqual("MissingReturnError");
        expect(error.lineNumber).toBe(0);
        expect(error.position).toBe(0);
        expect(stats.durationInMilliSeconds).toBeGreaterThan(0);
        expect(stats.endTimestamp).toBeGreaterThanOrEqual(stats.startTimestamp);
    });

    function sleep(ms) {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }
});