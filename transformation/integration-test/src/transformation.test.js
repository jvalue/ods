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
        console.log("Waiting for transformation-service with URL: " + pingUrl);
        await waitOn({ resources: [pingUrl, MOCK_RECEIVER_URL], timeout: 50000 });
        connection = await amqp.initConnection(20, 5);
    }, 60000);

    jest.setTimeout(60000);
    // console.log = jest.fn()
    // console.info = jest.fn()

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

    describe("Test table creation/delteion on storage-mq service upon pipeline persistence/deletion", () => {

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
            console.warn(`CREATE Promise resolved`)
            expect(createEvent).not.toBeUndefined()
            expect(createEvent).not.toBeNull();
            expect(createEvent.eventType).toEqual("DDL")
            expect(createEvent.ddlType).toEqual("CREATE_TABLE")
            expect(createEvent.tableName).toEqual('' + pipelineId)
            console.warn(`CREATE TEST done`)

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


            // amqp.consumeFromODSDataChannel(async(event) => {
            //     try {
            //         expect(event).not.toBeUndefined()
            //         expect(event).not.toBeNull();
            //         expect(event.eventType).toEqual("DDL")
            //         expect(event.ddlType).toEqual("CREATE_TABLE")
            //         expect(event.tableName).toEqual('' + pipelineId)

            //         // await sleep(5000) // Wait for the transformation service to take action

            //         /**===================================
            //          * delete the pipeline config
            //          ===================================*/
            //         const deleteResponse = await request(URL).delete(`/config/${postResponse.body.id}`)
            //         expect(deleteResponse.status).toEqual(200);

            //         /**==========================================================
            //          * Consume from ODSData channel (Expect DROP Table event)
            //          =============================================================*/
            //         amqp.consumeFromODSDataChannel((event) => {
            //             expect(event).not.toBeUndefined();
            //             expect(event).not.toBeNull();
            //             expect(event.eventType).toEqual("DDL");
            //             expect(event.ddlType).toEqual("DROP_TABLE");
            //             expect(event.tableName).not.toBeUndefined()
            //             done()
            //         })
            //         done()
            //     } catch (error) {
            //         done(error)
            //     }
            // })

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

            // await testNotificationQueue(connection, pipelineConfig, adapterDataEvent, (receivedEvent) => {
            //     try {
            //         expect(receivedEvent).not.toBeNull();
            //         expect(receivedEvent).not.toBeUndefined();
            //         expect(receivedEvent.jobResult).not.toBeUndefined()

            //         // Check if it is a transofmration event (successfull transformation)
            //         expect(receivedEvent.jobResult.error).toBeUndefined()
            //         expect(receivedEvent.jobResult.data).not.toBeNull();
            //         expect(receivedEvent.jobResult.stats).not.toBeUndefined();
            //         done();
            //     } catch (err) {
            //         done(err)
            //     }
            // });
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