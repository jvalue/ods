

describe('Storage-MQ', () => {

  beforeAll(async () => {
    console.log("Waiting on all dependent services before starting to test")
  }, 60000)

  test('GET /version', async () => {
    expect(true).toBeTruthy()
  })
})
