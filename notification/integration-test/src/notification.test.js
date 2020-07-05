/* eslint-env jest */
const request = require('supertest')
const waitOn = require('wait-on')
const amqp = require('./mock.amqp')
    //import { initConnection } from './mock.amqp'

const URL = process.env.NOTIFICATION_API || 'http://localhost:8080'

const MOCK_RECEIVER_PORT = process.env.MOCK_RECEIVER_PORT || 8081
const MOCK_RECEIVER_HOST = process.env.MOCK_RECEIVER_HOST || 'localhost'
const MOCK_RECEIVER_URL = 'http://' + MOCK_RECEIVER_HOST + ':' + MOCK_RECEIVER_PORT

describe('Notification Config API TEST', () => {
    console.log("Notification-Service URL= " + URL);

    beforeAll(async() => {
        const pingUrl = URL + "/";
        console.log("Waiting for notification-service with URL: " + pingUrl);
        console.log(
            "Waiting for mock webhook receiver with URL: " + MOCK_RECEIVER_URL
        );
        await waitOn({
            resources: [pingUrl, MOCK_RECEIVER_URL],
            timeout: 30000,
        });
    }, 60000);

    test("GET /version", async() => {
        const response = await request(URL).get("/version");
        expect(response.status).toEqual(200);
        expect(response.type).toEqual("text/plain");
        const semanticVersionReExp = "^(0|[1-9]d*).(0|[1-9]d*).(0|[1-9]d*)";
        expect(response.text).toMatch(new RegExp(semanticVersionReExp));
    });

    console.log = jest.fn(); // disable logging

    let persistedSlackConfig = null;
    let persistedWebhookConfig = null;
    let persistedFirebaseConfig = null;

    // let amqpConnection = amqp.initConnection(20, 5);

    /*================================================================
    * Testing Config Persistence (POST REST-INTERFACE)
    =================================================================*/
    describe("Testing POST Rest interface ==> PERSIST CONFIGS", () => {
        test("POST /config/webhook --> persists valid webhook config", async() => {
            const webhookConfig = getValidWebhookConfig();

            const notificationResponse = await request(URL)
                .post("/config/webhook")
                .send(webhookConfig);

            expect(notificationResponse.status).toEqual(200);

            let receivedConfig = Object.assign({}, notificationResponse.body);
            delete receivedConfig.id

            // compare response with config of request
            expect(receivedConfig).toEqual(webhookConfig);
            persistedWebhookConfig = Object.assign({}, notificationResponse.body);

        });

        test("POST /config/slack persists valid slack config", async() => {
            const slackConfig = getValidSlackConfig();

            const notificationResponse = await request(URL)
                .post("/config/slack")
                .send(slackConfig);

            expect(notificationResponse.status).toEqual(200);

            let receivedConfig = Object.assign({}, notificationResponse.body);
            delete receivedConfig.id;

            // compare response with config of request
            expect(receivedConfig).toEqual(slackConfig);

            persistedSlackConfig = notificationResponse.body;
        });

        test("POST /config/fcm persists valid firebase config", async() => {
            const fcmConfig = getValidFCMConfig();

            const notificationResponse = await request(URL)
                .post("/config/fcm")
                .send(fcmConfig);

            expect(notificationResponse.status).toEqual(200);


            let receivedConfig = Object.assign({}, notificationResponse.body);
            delete receivedConfig.id;
            // compare response with config of request

            expect(receivedConfig).toEqual(fcmConfig);
            persistedFirebaseConfig = notificationResponse.body;
        });
    });

    /*================================================================
     * Testing GET Rest Interface (GET PREVIOUS CREATED CONFIGS)
     =================================================================*/
    describe("Testing GET Rest interface ==> GET PREVIOUS CREATED CONFIGS", () => {
        test("GET /config/webhook/1 request previous created webhook config", async() => {
            const receiverResponse = await request(URL).get(`/config/webhook?id=${persistedWebhookConfig.id}`);

            expect(receiverResponse.status).toEqual(200);
            expect(receiverResponse.body).toEqual([persistedWebhookConfig]);
        });

        test("GET /config/fcm/1 request previous created firebase config", async() => {
            const receiverResponse = await request(URL).get(`/config/fcm?id=${persistedFirebaseConfig.id}`);

            expect(receiverResponse.status).toEqual(200);
            expect(receiverResponse.body).toEqual([persistedFirebaseConfig]);
        });

        test("GET /config/slack/1 request previous created slack config", async() => {
            const receiverResponse = await request(URL).get(`/config/slack?id=${persistedSlackConfig.id}`);

            expect(receiverResponse.status).toEqual(200);
            expect(receiverResponse.body).toEqual([persistedSlackConfig]);
        });

        test("GET /config/pipline/1 request all previous as summary for pipeline 1", async() => {
            const receiverResponse = await request(URL).get(
                "/config/pipeline/1"
            );

            expect(receiverResponse.status).toEqual(200);

            persistedWebhookConfig.type = 'webhook'
            persistedSlackConfig.type = 'slack'
            persistedFirebaseConfig.type = 'fcm'


            expect(receiverResponse.body.length).toEqual(3)

            let expected = [
                persistedWebhookConfig,
                persistedFirebaseConfig,
                persistedSlackConfig
            ]

            // Sort by type (slack, webhook, fcm)
            let sortedExpected = expected.sort((a, b) => {
                return a.type.localeCompare(b.type);
            })

            let sortedReceived = receiverResponse.body.sort((a, b) => {
                return a.type.localeCompare(b.type);
            });


            expect(sortedReceived).toEqual(sortedExpected);
        });
    });

    /*================================================================
     * Testing PUT Rest Interface (UPDATE PREVIOUS CREATED CONFIGS)
     =================================================================*/
    describe("Testing PUT Rest Interface (UPDATE PREVIOUS CREATED CONFIGS)", () => {
        test("PUT /config/foo/1 invalid config type provided in url", async() => {
            const putResponse = await request(URL).put(
                "/config/foo/1", {}
            );

            expect(putResponse.status).toEqual(400);
        });

        test("PUT /config/slack/1 - Update slack config", async() => {
            let updatedConfig = getValidSlackConfig()
            updatedConfig.secret = "Updated";

            let putResponse = await request(URL)
                .put(`/config/slack/${persistedSlackConfig.id}`)
                .send(JSON.stringify(updatedConfig))
                .set("Content-Type", "application/json");

            expect(putResponse.status).toEqual(200);
            expect(putResponse.body = 'Sucessfully updated.')

            await sleep(2000);

            let getResponse = await request(URL)
                .get(`/config/slack?id=${persistedSlackConfig.id}`)

            expect(getResponse.status).toEqual(200);
            expect(getResponse.body.length).toEqual(1);
            expect(getResponse.body[0].secret).toEqual("Updated");
        });

        test("PUT /config/webhook/1 - Update webhook config", async() => {
            // Update config
            let updatedConfig = getValidWebhookConfig()
            updatedConfig.url = "Updated";

            let putResponse = await request(URL)
                .put(`/config/webhook/${persistedWebhookConfig.id}`)
                .send(updatedConfig)
                .set("Content-Type", "application/json");

            expect(putResponse.status).toEqual(200);
            expect(putResponse.body = 'Sucessfully updated.')

            await sleep(2000);

            // Get Config 
            let getResponse = await request(URL).get(`/config/webhook?id=${persistedWebhookConfig.id}`);

            expect(getResponse.status).toEqual(200);
            expect(getResponse.body.length).toEqual(1);
            expect(getResponse.body[0].url).toEqual("Updated");
        });

        test("PUT /config/fcm/1 - Update firebase config", async() => {
            let updatedConfig = getValidFCMConfig()
            updatedConfig.topic = "Updated";

            let putResponse = await request(URL)
                .put(`/config/fcm/${persistedFirebaseConfig.id}`)
                .send(updatedConfig)
                .set("Content-Type", "application/json");


            expect(putResponse.status).toEqual(200);
            expect(putResponse.body = 'Sucessfully updated.')

            await sleep(2000);

            // Get the updated Config
            let getResponse = await request(URL).get(`/config/fcm?id=${persistedFirebaseConfig.id}`);

            expect(getResponse.status).toEqual(200);
            expect(getResponse.body.length).toEqual(1)
            expect(getResponse.body[0].topic).toEqual("Updated");
        });
    });

    /*================================================================
     * Testing DELETE Rest Interface (UPDATE PREVIOUS CREATED CONFIGS)
     =================================================================*/
    describe("Testing DELETE Rest Interface (UPDATE PREVIOUS CREATED CONFIGS)", () => {
        test("DELETE /config/foo/1 invalid config type provided in url", async() => {
            const deleteRespone = await request(URL).delete("/config/foo/1", {});
            expect(deleteRespone.status).toEqual(400);
        });

        test("DELETE /config/slack/1 - Delete slack config", async() => {
            const deleteRespone = await request(URL).delete(`/config/slack/${persistedSlackConfig.id}`);
            expect(deleteRespone.status).toEqual(200);

            // Check if it is deleted
            const getResponse = await request(URL).get(`/config/slack?id=${persistedSlackConfig.id}`);
            expect(getResponse.status).toEqual(200)
            expect(getResponse.body).toEqual([])
        });

        test("DELETE /config/webhook/1 - Delete webhook config", async() => {
            const deleteRespone = await request(URL).delete(`/config/webhook/${persistedWebhookConfig.id}`);
            expect(deleteRespone.status).toEqual(200);

            // Check if it is deleted
            const getResponse = await request(URL).get(`/config/webhook?id=${persistedWebhookConfig.id}`);
            expect(getResponse.status).toEqual(200);
            expect(getResponse.body).toEqual([]);
        });

        test("DELETE /config/fcm/1 - Delete firebase config", async() => {
            const deleteRespone = await request(URL).delete(`/config/fcm/${persistedFirebaseConfig.id}`);
            expect(deleteRespone.status).toEqual(200);

            // Check if it is deleted
            const getResponse = await request(URL).get(`/config/webhook?id=${persistedFirebaseConfig.id}`);
            expect(getResponse.status).toEqual(200);
            expect(getResponse.body).toEqual([]);
        });
    });
});
/*==============================================================================
 * AMQP "Transformation Event" consupmtion triggers sending notification
===============================================================================*/
describe("Testing Notification dispatch on Event arrival from queue", () => {
    console.log(
        "Notification-Service URL= " + URL
    );

    jest.setTimeout(30000);

    beforeAll(async() => {
        const pingUrl = URL + "/";
        console.log("Waiting for notification-service with URL: " + pingUrl);
        console.log("Waiting for mock webhook receiver with URL: " + MOCK_RECEIVER_URL);
        await waitOn({
            resources: [pingUrl, MOCK_RECEIVER_URL, ],
            timeout: 50000,
        });
        console.log("Waiting for AMQP-Publisher-Mock to connect to AMQP-Server");

        console.log("AMQP-Publisher-Mock successfully connected to AMQP-Server");
    }, 60000);

    console.log = jest.fn(); // disable logging

    // afterAll(async() => {
    //     if (amqpConnection) {
    //         amqpConnection.close();
    //     }
    // });

    test("Persist valid webhook config and send valid transformation event to the queue --> triggers sending notification to webhook)", async() => {
        // Persist Config
        let notificationConfig = getValidWebhookConfig();
        const configResponse = await request(URL)
            .post("/config/webhook")
            .send(notificationConfig);

        expect(configResponse.status).toEqual(200);
        const persistedConfig = configResponse.body;

        // send Transformation Event to the Queue
        let transformationEvent = getValidTransformationEvent();

        let amqpConnection = await amqp.initConnection(20, 5);
        expect(amqpConnection).not.toBeNull();
        await amqp.publishEvent(transformationEvent);

        await sleep(3000); // wait for processing

        const receiverResponse = await request(MOCK_RECEIVER_URL).get("/webhook1");

        expect(receiverResponse.status).toEqual(200);
        expect(receiverResponse.body.message).toEqual(buildMessage(transformationEvent));

        // Clean up (post delete to notification config interface)
        const deleteResponse = await request(URL).delete(`/config/webhook/${persistedConfig.id}`);
        expect(deleteResponse.status).toEqual(200);

        await amqpConnection.close();
    });

    test('Config with condition "data === null " and send valid transformation event with empty data to the queue --> triggers sending notification to webhook)', async() => {
        // Persist Config
        let notificationConfig = getValidWebhookConfig();

        const configResponse = await request(URL)
            .post("/config/webhook")
            .send(notificationConfig);
        expect(configResponse.status).toEqual(200)

        const persistedConfig = configResponse.body;

        // send Transformation Event to the Queue
        let transformationEvent = getValidTransformationEvent();
        transformationEvent.jobResult.data = null;

        let amqpConnection = await amqp.initConnection(20, 5);
        expect(amqpConnection).not.toBeNull()
        await amqp.publishEvent(transformationEvent);

        await sleep(3000); // wait for processing

        // Check if notification has been send
        const receiverResponse = await request(MOCK_RECEIVER_URL).get("/webhook1");

        expect(receiverResponse.status).toEqual(200);
        expect(receiverResponse.body.message).toEqual(buildMessage(transformationEvent));

        // Clean up (post delete to notification config interface and close amqp connection)
        const deleteResponse = await request(URL).delete(`/config/webhook/${persistedConfig.id}`);
        expect(deleteResponse.status).toEqual(200);
        await amqpConnection.close();
    });

    test("Event does not trigger webhook when condition of corresponding persisted config is false", async() => {
        // Persist Config
        let notificationConfig = getValidWebhookConfig();
        notificationConfig.condition = "data.one > 1";
        notificationConfig.url = MOCK_RECEIVER_URL + "/webhook2";

        const configResponse = await request(URL)
            .post("/config/webhook")
            .send(notificationConfig);
        expect(configResponse.status).toEqual(200);

        const persistedConfig = configResponse.body

        // send Transformation Event to the Queue
        let transformationEvent = getValidTransformationEvent();

        let amqpConnection = await amqp.initConnection(20, 5);
        expect(amqpConnection).not.toBeNull()
        await amqp.publishEvent(transformationEvent);

        await sleep(3000); // wait for processing

        const receiverResponse = await request(MOCK_RECEIVER_URL).get("/webhook2");
        expect(receiverResponse.status).toEqual(404);

        // Clean up (post delete to notification config interface)
        const deleteResponse = await request(URL).delete(`/config/webhook/${persistedConfig.id}`);
        expect(deleteResponse.status).toEqual(200);
    });

    test("EVent triggers slack notification dispatching", async() => {
        const slackConfig = getValidSlackConfig();

        const notificationResponse = await request(URL)
            .post("/config/slack")
            .send(slackConfig);
        expect(notificationResponse.status).toEqual(200);

        const persistedConfig = notificationResponse.body;

        // send Transformation Event to the Queue
        let transformationEvent = getValidTransformationEvent();

        let amqpConnection = await amqp.initConnection(20, 5);
        expect(amqpConnection).not.toBeNull()
        await amqp.publishEvent(transformationEvent);

        await sleep(3000); // wait for processing

        const receiverResponse = await request(MOCK_RECEIVER_URL)
            .get(`/slack/${slackConfig.channelId}/${slackConfig.workspaceId}/${slackConfig.secret}`);

        let notificationMessage = buildMessage(
            transformationEvent
        );
        expect(receiverResponse.status).toEqual(200);
        expect(receiverResponse.body.text).toEqual(notificationMessage);

        // Clean up (post delete to notification config interface)
        const deleteResponse = await request(URL).delete(`/config/webhook/${persistedConfig.id}`);
        expect(deleteResponse.status).toEqual(200);
        await amqpConnection.close();
    });

});

function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}


/*==================================================================
 * Get Valid Configs
 *=================================================================*/
function getValidWebhookConfig() {
    return {
        pipelineId: 1,
        condition: 'true',
        url: MOCK_RECEIVER_URL + '/webhook1'
    }
}

function getValidSlackConfig() {
    return {
        pipelineId: 1,
        condition: 'true',
        workspaceId: 'workspaceId',
        channelId: 'channelId',
        secret: 'secret'
    }
}

function getValidFCMConfig() {
    return {
        pipelineId: 1,
        condition: 'true',
        projectId: 'projectId',
        clientEmail: 'foo@bar.gg',
        privateKey: 'Secret',
        topic: 'Important'

    }
}
/*=======================================================================
 * Valid event from transformation service
 *======================================================================*/
/**
 * Generates a transformation event that is sent to the notification service 
 * after transformation execution.
 * 
 * @returns valid Transformation Event
 */
function getValidTransformationEvent() {
    const jobResult = getValidJobResult()

    const transformationEvent = {
        "pipelineId": 1,
        "pipelineName": 'pipeline1',
        "dataLocation": 'somwhere/1',
        "jobResult": jobResult
    }

    return transformationEvent
}

function getValidJobResult() {
    return {
        data: { "One": 1, "Two": 2 },
        error: getValidJobError(),
        stats: {
            durationInMilliSeconds: 111111,
            startTimestamp: 2222222,
            endTimestamp: 333333
        }
    }
}

function getValidJobError() {
    return {
        name: 'name',
        message: 'Transformation successful',
        lineNumber: 1,
        position: 1,
        stacktrace: ['error', 'error2']
    }
}

/**
 * Builds the notification message to be sent,
 * by composing the contents of the transformation event to readable
 * message
 * 
 * @param event event to extract transformation results from 
 * @returns message to be sent as notification
 */
function buildMessage(event) {

    let message // message to return
    const jobError = event.jobResult.error // Error of transformation (if exists)

    /*======================================================
     *  Build Message for succesfull transformation/pipline
     *=======================================================*/
    if (jobError === undefined) {
        // Build Stats (Time measures for transformation execution)
        const jobStats = event.jobResult.stats
        const start = new Date(jobStats.startTimestamp)
        const end = new Date(jobStats.endTimestamp)

        // Build Success Message
        message = `Pipeline ${event.pipelineName}(Pipeline ID:${event.pipelineId})\n` +
            `has new data available. Fetch at ${event.dataLocation}.\n\n` +
            `Transformation Details:\n` +
            `\tStart: ${start}\n` +
            `\tEnd:  ${end}\n` +
            `\tDuration: ${jobStats.durationInMilliSeconds} ms`

    } else {
        /*====================================================
         *  Build Message for failed transformation/pipline
         *====================================================*/
        message = `Pipeline ${event.pipelineName}(Pipeline ID:${event.pipelineId})Failed.\n\n` +
            `Details:\n` +
            `\tLine: ${jobError.lineNumber}\n` +
            `\tMessage: ${jobError.message}\n` +
            `\tStacktrace: ${ jobError.stacktrace}`
    }

    return message
}