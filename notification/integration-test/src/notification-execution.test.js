/* eslint-env jest */
const request = require('supertest')
const waitOn = require('wait-on')

const URL = process.env.NOTIFICATION_API || 'http://localhost:8080'

const MOCK_RECEIVER_PORT = process.env.MOCK_RECEIVER_PORT || 8081
const MOCK_RECEIVER_HOST = process.env.MOCK_RECEIVER_HOST || 'localhost'
const MOCK_RECEIVER_URL = 'http://' + MOCK_RECEIVER_HOST + ':' + MOCK_RECEIVER_PORT

describe('Scheduler', () => {
    console.log('Scheduler-Service URL= ' + URL)

    beforeAll(async() => {
        const pingUrl = URL + '/'
        console.log('Waiting for notification-service with URL: ' + pingUrl)
        console.log('Waiting for mock webhook receiver with URL: ' + MOCK_RECEIVER_URL)
        await waitOn({ resources: [pingUrl, MOCK_RECEIVER_URL], timeout: 50000 })
    }, 60000)

    test('POST /webhook triggers webhook', async() => {
        const dataLocation = 'storage/1234'
        const notificationJob = {
            pipelineName: 'webhookpipeline',
            pipelineId: 1,
            dataLocation: dataLocation,
            data: {
                value1: 1
            },
            condition: 'data.value1 > 0',
            type: 'WEBHOOK',
            url: MOCK_RECEIVER_URL + '/webhook1'
        }

        const notificationResponse = await request(URL)
            .post('/webhook')
            .send(notificationJob)

        expect(notificationResponse.status).toEqual(200)
        await sleep(3000) // wait for processing

        const receiverResponse = await request(MOCK_RECEIVER_URL)
            .get('/webhook1')

        expect(receiverResponse.status).toEqual(200)
        expect(receiverResponse.body.location).toEqual(dataLocation)
    })

    test('POST /webhook does not trigger webhook when condition is false', async() => {
        const notificationJob = {
            pipelineName: 'do not trigger',
            pipelineId: 2,
            dataLocation: 'storage/1234',
            data: {
                value1: 1
            },
            condition: 'data.value1 < 0',
            url: MOCK_RECEIVER_URL + '/webhook2',
            type: 'WEBHOOK'
        }

        const notificationResponse = await request(URL)
            .post('/webhook')
            .send(notificationJob)

        expect(notificationResponse.status).toEqual(200)
        await sleep(3000)

        const receiverResponse = await request(MOCK_RECEIVER_URL)
            .get('/webhook2')

        expect(receiverResponse.status).toEqual(404)
    })

    test('POST /slack triggers slack notification', async() => {
        const dataLocation = 'storage/234'
        const slackJob = {
            pipelineName: 'peterchens pipeline',
            pipelineId: 666,
            dataLocation,
            data: {
                niceString: 'nice'
            },
            condition: 'typeof data.niceString === "string"',
            type: 'SLACK',
            channelId: '12',
            workspaceId: '34',
            secret: '56'
        }

        const notificationResponse = await request(URL)
            .post('/slack')
            .send(slackJob)
        expect(notificationResponse.status).toEqual(200)

        await sleep(3000)

        const receiverResponse = await request(MOCK_RECEIVER_URL)
            .get('/slack/12/34/56')

        expect(receiverResponse.status).toEqual(200)
        expect(receiverResponse.body.text)
            .toEqual(`Pipeline ${slackJob.pipelineName}(${slackJob.pipelineId}) has new data available. Fetch at ${dataLocation}.`)
    })

    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms))
    }
})
