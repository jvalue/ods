/* eslint-env jest */
import { handleNotification } from './notifications'
import { NotificationRequest, NotificationType } from './interfaces/notificationRequest'
import axios from 'axios'

jest.mock('axios')

const data = {
  value1: 5
}
const post = axios.post as jest.Mock

afterEach(() => {
  jest.clearAllMocks()
})

test('Notification triggers when condition is met', async () => {
  post.mockReturnValue(Promise.resolve())

  const notificationRequest: NotificationRequest = {
    callbackUrl: 'callback',
    dataLocation: 'data',
    data: data,
    condition: 'data.value1 > 0',
    type: NotificationType.WEBHOOK
  }

  await handleNotification(notificationRequest)

  expect(post).toHaveBeenCalledTimes(1)
  // check arguments for axios post
  expect(post.mock.calls[0][0]).toEqual(notificationRequest.callbackUrl)
  expect(post.mock.calls[0][1].location).toEqual(notificationRequest.dataLocation)
})

test('Notification does not trigger when condition is not met', async () => {
  const notificationRequest: NotificationRequest = {
    callbackUrl: 'callback',
    dataLocation: 'data',
    data: data,
    condition: 'data.value1 < 0',
    type: NotificationType.WEBHOOK
  }

  await handleNotification(notificationRequest)

  expect(post).not.toHaveBeenCalled()
})

test('Notification does not trigger when condition is malformed', async () => {
  const notificationRequest: NotificationRequest = {
    callbackUrl: 'callback',
    dataLocation: 'data',
    data: data,
    condition: 'asdfa;',
    type: NotificationType.WEBHOOK
  }

  await handleNotification(notificationRequest)

  expect(post).not.toHaveBeenCalled()
})
