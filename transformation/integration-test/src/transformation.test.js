/* eslint-env jest */
const request = require('supertest')
const waitOn = require('wait-on')
const amqp = require("./mock.amqp");
const URL = process.env.TRANSFORMATION_API || 'http://localhost:8080'

const MOCK_RECEIVER_PORT = process.env.MOCK_RECEIVER_PORT || 8081;
const MOCK_RECEIVER_HOST = process.env.MOCK_RECEIVER_HOST || "localhost";
const MOCK_RECEIVER_URL = "http://" + MOCK_RECEIVER_HOST + ":" + MOCK_RECEIVER_PORT;




describe("AMQP TEST", () => {

    let connection
    beforeAll(async() => {
        const pingUrl = URL + "/";
        console.info("Waiting for transformation-service with URL: " + pingUrl);
        await waitOn({ resources: [pingUrl, MOCK_RECEIVER_URL], timeout: 50000 });
        console.info("Waiting for AMQP-Connection...")
        connection = await amqp.initConnection(20, 5);
    }, 60000);

    jest.setTimeout(60000);
    console.log = jest.fn()
    console.info = jest.fn()

    describe("TEST AMQP SERVICE", () => {
        test("Test Connection", async() => {
            //let connection = await amqp.initConnection(20, 5);
            expect(connection).not.toBeNull();
            expect(connection).not.toBeUndefined();
            //connection.close();
        });

        test("Test AdapterData queue", async() => {
            //const connection = await amqp.initConnection(10, 5);
            expect(connection).not.toBeNull();
            expect(connection).not.toBeUndefined();

            const channel = amqp.getAdapterDataChannel(connection);
            expect(channel).not.toBeNull();
            expect(channel).not.toBeUndefined();

        });

        test("Test Notificaiton queue", async() => {
            // const connection = await amqp.initConnection(10, 5);
            expect(connection).not.toBeNull();
            expect(connection).not.toBeUndefined();

            const channel = amqp.getNotificationChannel(connection);
            expect(channel).not.toBeNull();
            expect(channel).not.toBeUndefined();

        });

        test("Test odsData queue", async() => {
            // connection = await amqp.initConnection(10, 5);
            expect(connection).not.toBeNull();
            expect(connection).not.toBeUndefined();

            const channel = amqp.getODSDataChannel(connection);
            expect(channel).not.toBeNull();
            expect(channel).not.toBeUndefined();
        });
    });

    describe("Test table creation/deletion on storage-mq service upon pipeline persistence/deletion", () => {

        test("(POST --> DELETE) /config --- Expect pipeline table creation and deletion ", async(done) => {

            /**===================================
             * Establish connection/ and queues
             ===================================*/
            //const connection = await amqp.initConnection(10, 5);
            expect(connection).not.toBeNull();
            expect(connection).not.toBeUndefined();

            /**===================================
             * Expect the queue to be initialized
             ===================================*/
            const odsDataChannel = amqp.getODSDataChannel(connection);
            expect(odsDataChannel).not.toBeUndefined();
            odsDataChannel.ackAll();

            /**===================================
             * Post the pipelineConfig
             ===================================*/
            let pipelineConfig = getValidPipelineConfig();
            const postResponse = await request(URL).post(`/config`).send(pipelineConfig);

            expect(postResponse.status).toEqual(200);
            expect(postResponse.body.id).not.toBeUndefined()

            const pipelineId = postResponse.body.id

            await sleep(1000) // Wait for the transformation service to take action


            /**=========================================================
             * Consume from ODSData channel (Expect Create Table Event)
             ==========================================================*/
            const createEvent = await amqp.consumeODSDataEvent()

            expect(createEvent).not.toBeUndefined()
            expect(createEvent).not.toBeNull();
            expect(createEvent.eventType).toEqual("DDL")
            expect(createEvent.ddlType).toEqual("CREATE_TABLE")
            expect(createEvent.tableName).toEqual('' + pipelineId)

            /**===================================
             * delete the pipeline config
             ===================================*/
            const deleteResponse = await request(URL).delete(`/config/${postResponse.body.id}`)
            expect(deleteResponse.status).toEqual(200);

            /**==========================================================
             * Consume from ODSData channel (Expect DROP Table event)
             =============================================================*/
            const deleteEvent = await amqp.consumeODSDataEvent()

            expect(deleteEvent).not.toBeUndefined();
            expect(deleteEvent).not.toBeNull();
            expect(deleteEvent.eventType).toEqual("DDL");
            expect(deleteEvent.ddlType).toEqual("DROP_TABLE");
            expect(deleteEvent.tableName).not.toBeUndefined()
            done()

        })
    })

    describe("TEST FAT Event Receival from Adapter service", () => {
        test("Expect TransformationEvent Dispatch to notification channel", async(done) => {

            let pipelineConfig = getValidPipelineConfig()
            pipelineConfig.transformation.func = "return data.one + data.two"


            const adapterDataEvent = {
                datasourceId: 1, // referenced data source id
                data: { one: 1, two: 2 }, // data to be transformed
                dataLocation: undefined, // data location
            };


            const receivedEvent = await testNotificationQueue(connection, pipelineConfig, adapterDataEvent)

            expect(receivedEvent).not.toBeNull();
            expect(receivedEvent).not.toBeUndefined();
            expect(receivedEvent.jobResult).not.toBeUndefined()

            // Check if it is a transofmration event (successfull transformation)
            expect(receivedEvent.jobResult.error).toBeUndefined()
            expect(receivedEvent.jobResult.data).not.toBeNull();
            expect(receivedEvent.jobResult.stats).not.toBeUndefined();
            done();
        });

        test("Expect odsDataEvent Dispatch to odsDdata channel", async(done) => {
            let pipelineConfig = getValidPipelineConfig()
            pipelineConfig.transformation.func = "return data.one + data.two"

            const adapterDataEvent = {
                datasourceId: 1, // referenced data source id
                data: { one: 1, two: 2 }, // data to be transformed
                dataLocation: undefined, // data location
            };

            const receivedEvent = await testOdsDataQueue(connection, pipelineConfig, adapterDataEvent)
            expect(receivedEvent).not.toBeNull();
            expect(receivedEvent).not.toBeUndefined()

            expect(receivedEvent.eventType).toEqual("DML")
            expect(receivedEvent.dmlType).toEqual("CREATE")

            expect(receivedEvent.data).not.toBeNull()
            expect(receivedEvent.data).not.toBeUndefined()

            expect(receivedEvent.data.data).toEqual(3)
            expect(receivedEvent.data.origin).toEqual("" + pipelineConfig.datasourceId)
            expect(receivedEvent.data.license).toEqual(pipelineConfig.metadata.license)

            // receivedOdsEvent = Object.assign({}, receivedEvent)
            done()



            // await testOdsDataQueue(connection, pipelineConfig, adapterDataEvent, (receivedEvent) => {
            //     try {
            //         expect(receivedEvent).not.toBeNull();

            //         // receivedOdsEvent = Object.assign({}, receivedEvent)
            //         delete receivedEvent.data.timestamp

            //         // Check if odsData Event is valid
            //         expect(receivedEvent).toEqual(expectedODSDataEvent)
            //             // expect(receivedEvent.dmlType).toEqual("CREATE")
            //             // expect(receivedEvent.eventType).toEqual("DML")
            //             // expect(receivedEvent.stats).not.BeNull();
            //         done();
            //     } catch (error) {
            //         done(error)
            //     }
            // });
        });

    });

    describe("TEST THIN Event Receival from Adapter service", () => {

        test('Test Mock Receiver - pong (transformation service has not requested url yet)', async() => {
            const pingResponse = await request(MOCK_RECEIVER_URL).get(`/pong/1`)
            expect(pingResponse.status).toEqual(400);
        })

        test('Test Mock Receiver -  ping pong (transformation has requested url already', async() => {
            const pingResponse = await request(MOCK_RECEIVER_URL).get(`/ping/1`)
            expect(pingResponse.status).toEqual(200);

            const pongResponse = await request(MOCK_RECEIVER_URL).get(`/pong/1`)
            expect(pongResponse.status).toEqual(200);
        })

        test("Test Mock Receiver - dataImport", async() => {
            data = { one: 1, two: 2 };
            const postResponse = await request(MOCK_RECEIVER_URL).post(`/adapter/1`).send(data);
            expect(postResponse.status).toEqual(200);

            const getResponse = await request(MOCK_RECEIVER_URL).get(`/adapter/1`);

            expect(getResponse.status).toEqual(200);
            expect(getResponse.body).toEqual(data);
        });



        test("Expect Adapter API not to be called (ping on mock receiver) when no pipeline config is available", async(done) => {
            let pipelineConfig = getValidPipelineConfig()
            pipelineConfig.transformation.func = "return data.one + data.two"

            /**===================================
             * Publish Data to the AdapterData Queue
             ===================================*/
            const adapterDataEvent = {
                datasourceId: 1, // referenced data source id
                data: null,
                dataLocation: '/ping/3', // data location
            };

            amqp.publishAdapterEvent(adapterDataEvent);
            await sleep(3000); // wait for tranformation processing

            /**======================================
             * Check if transformation contacted the url
             *======================================*/
            const pongResponse = await request(MOCK_RECEIVER_URL).get(`/pong/3`)
            expect(pongResponse.status).toEqual(400);
            done()

        })


        test("Expect notification event upon adapterData with data from adapter mock REST API", async(done) => {

            /**===============================================================
             * Store Data in Adapter Mock (this will be fetched by transformation)
             =====================================================================*/
            data = {
                "one": 1,
                "two": 2,
                "three": 3
            }

            const pongResponse = await request(MOCK_RECEIVER_URL).post(`/adapter/1`).send(data)
            expect(pongResponse.status).toEqual(200);

            /**===================================
             * Publish Data to the AdapterData Queue
             ===================================*/
            const adapterDataEvent = {
                datasourceId: 1, // referenced data source id
                data: null,
                dataLocation: '/adapter/1', // data location
            };

            let pipelineConfig = getValidPipelineConfig()
            pipelineConfig.transformation.func = "return data.one + data.two + + data.three"

            const receivedEvent = await testNotificationQueue(connection, pipelineConfig, adapterDataEvent);

            expect(receivedEvent).not.toBeNull();
            expect(receivedEvent).not.toBeUndefined();
            expect(receivedEvent.jobResult).not.toBeUndefined()

            // Check if it is a transofmration event (successfull transformation)
            expect(receivedEvent.jobResult.error).toBeUndefined()
            expect(receivedEvent.jobResult.data).not.toBeNull();
            expect(receivedEvent.jobResult.stats).not.toBeUndefined();
            done();

            done()
        })

        test("Expect odsData (persistence) event upon adapterData with data from adapter mock REST API", async(done) => {

            /**===============================================================
             * Store Data in Adapter Mock (this will be fetched by transformation)
             =====================================================================*/
            data = {
                "one": 1,
                "two": 2,
                "three": 3
            }

            const pongResponse = await request(MOCK_RECEIVER_URL).post(`/adapter/1`).send(data)
            expect(pongResponse.status).toEqual(200);

            /**===================================
             * Publish Data to the AdapterData Queue
             ===================================*/
            const adapterDataEvent = {
                datasourceId: 1, // referenced data source id
                data: null,
                dataLocation: '/adapter/1', // data location
            };

            let pipelineConfig = getValidPipelineConfig()
            pipelineConfig.transformation.func = "return data.one + data.two + + data.three"

            const odsDataEvent = await testOdsDataQueue(connection, pipelineConfig, adapterDataEvent);

            expect(odsDataEvent).not.toBeNull();
            expect(odsDataEvent).not.toBeUndefined()

            expect(odsDataEvent.eventType).toEqual("DML")
            expect(odsDataEvent.dmlType).toEqual("CREATE")

            expect(odsDataEvent.data).not.toBeNull()
            expect(odsDataEvent.data).not.toBeUndefined()

            expect(odsDataEvent.data.data).toEqual(6)
            expect(odsDataEvent.data.origin).toEqual("" + pipelineConfig.datasourceId)
            expect(odsDataEvent.data.license).toEqual(pipelineConfig.metadata.license)

            done()

        })
    })
});
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
describe("CONFIG API", () => {
    console.log("Transformation-Service URL= " + URL);

    beforeAll(async() => {
        const pingUrl = URL + "/";
        console.log("Waiting for transformation-service with URL: " + pingUrl);
        await waitOn({ resources: [pingUrl, MOCK_RECEIVER_URL], timeout: 50000 });
        await sleep(3000) // Wait 3 secs to establish endpoints
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
/**
 * Triggers the dispatch of an event to the notification queue 
 * by creating a pipeline config (including transformation)
 * and publishing a adapterData event to the AdapterData queue.
 * 
 * @param {*} connection amqp connection to consume from 
 * @param {*} pipelineConfig  pipelineconfig that will be persisted via REST API
 * @param {*} adapterDataEvent event that will be published to the adapterdata queue --> will trigger transformation
 * 
 * @returns event that has been published to the notifcation queue.
 */
async function testNotificationQueue(connection, pipelineConfig, adapterDataEvent) {

    /**===================================
     * Establish connection/ and queues
     ===================================*/
    // const connection = await amqp.initConnection(10, 5);
    expect(connection).not.toBeNull();
    expect(connection).not.toBeUndefined();

    /**===================================
     * Empty queues
     ===================================*/
    const adapterChannel = amqp.getAdapterDataChannel(connection);
    expect(adapterChannel).not.toBeUndefined();
    adapterChannel.ackAll()

    const notificationChannel = amqp.getNotificationChannel(connection);
    expect(notificationChannel).not.toBeUndefined();
    notificationChannel.ackAll()

    const odsDataChannel = amqp.getODSDataChannel(connection)
    odsDataChannel.ackAll()

    /**===================================
     * Post the pipelineConfig
     ===================================*/
    const postResponse = await request(URL).post(`/config`).send(pipelineConfig);

    expect(postResponse.status).toEqual(200);
    expect(postResponse.body.id).not.toBeUndefined()
    await amqp.consumeODSDataEvent() // take create table event from queue

    /**===================================
     * Publish Data to the AdapterData Queue
     ===================================*/
    amqp.publishAdapterEvent(adapterDataEvent);

    await sleep(3000); // wait for tranformation processing
    await amqp.consumeODSDataEvent() // take transformed data event from storage queue

    /**===================================
     * delete the pipeline config
     ===================================*/
    const deleteResponse = await request(URL).delete(`/config/${postResponse.body.id}`)
    expect(deleteResponse.status).toEqual(200);
    odsDataChannel.ackAll()
    await amqp.consumeODSDataEvent() // take delete table event from queue

    /**===================================
     * Consume from Notificaiton channel
     ===================================*/
    return await amqp.consumeNotificationEvent()
}


async function testOdsDataQueue(connection, pipelineConfig, adapterDataEvent) {

    /**===================================
    * Establish connection/ and queues
    ===================================*/
    // const connection = await amqp.initConnection(10, 5);
    expect(connection).not.toBeNull();
    expect(connection).not.toBeUndefined();

    /**===================================
     * Empty all channels (by sending ACKS)
     ===================================*/
    const adapterChannel = amqp.getAdapterDataChannel(connection);
    expect(adapterChannel).not.toBeUndefined();
    adapterChannel.ackAll()

    const notificationChannel = amqp.getODSDataChannel(connection);
    expect(notificationChannel).not.toBeUndefined();
    notificationChannel.ackAll()

    const odsDataChanell = amqp.getODSDataChannel(connection)
    expect(notificationChannel).not.toBeUndefined();
    odsDataChanell.ackAll()

    /**===================================
     * Post the pipelineConfig
     ===================================*/
    const postResponse = await request(URL).post(`/config`).send(pipelineConfig);

    expect(postResponse.status).toEqual(200);
    expect(postResponse.body.id).not.toBeUndefined()

    await amqp.consumeODSDataEvent() // remove table creation event

    /**=======================================
     *  Consume the DDL Event (always sent via POST) 
     =========================================*/
    // amqp.consumeFromODSDataChannel((event) => {
    //     expect(event).not.toBeUndefined();
    //     expect(event).not.toBeNull();
    //     expect(event.eventType).toEqual("DDL");
    //     expect(event.ddlType).toEqual("CREATE_TABLE");
    //     expect(event.tableName).not.toBeUndefined()
    // });


    /**===================================
     * Publish Data to the AdapterData Queue
     ===================================*/
    amqp.publishAdapterEvent(adapterDataEvent);
    await sleep(3000); // wait for tranformation processing

    const odsDataEvent = await amqp.consumeODSDataEvent() // Event with transformed data to process

    /**===================================
     * delete the pipeline config
     ===================================*/
    const deleteResponse = await request(URL).delete(`/config/${postResponse.body.id}`)
    expect(deleteResponse.status).toEqual(200);

    await amqp.consumeODSDataEvent() // remove table delete event from data queue

    /**===================================
     * Consume from ODSData channel
     ===================================*/
    return odsDataEvent

}

function getValidPipelineConfig() {
    return {
        datasourceId: 1,
        metadata: getPipelineMetaData(),
        transformation: getTransformationConfig()
    }
}

function getPipelineMetaData() {
    return {

        displayName: 'SOME_NAME',
        description: 'LOREM IPSUM...',
        author: 'ALICE AND BOB',
        license: 'Apache 2.0.7'
    }
}

function getTransformationConfig() {
    return {
        func: 'return data;'
    }
}

/**
 * Sleep function
 * @param ms time to sleep in ms
 */
function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}