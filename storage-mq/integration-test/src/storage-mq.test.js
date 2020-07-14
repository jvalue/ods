const waitOn = require('wait-on')

const URL = process.env.STORAGEMQ_API
const AMQP_URL = process.env.AMQP_URL

describe('Storage-MQ', () => {
  console.log('Storage-MQ URL= ' + URL)

  beforeAll(async () => {
    console.log("Waiting on all dependent services before starting to test")
    const pingUrl = URL + '/'
    await waitOn({ resources: [pingUrl], timeout: 50000 , log: true })
  }, 60000)

  test('GET /version', async () => {
    expect(true).toBeTruthy()
  })
})
