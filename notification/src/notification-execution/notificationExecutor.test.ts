/* eslint-env jest */
import axios from 'axios';

import {
  NotificationConfig,
  NotificationType,
  SlackParameter,
  WebhookParameter,
} from '../notification-config/notificationConfig';

import VM2SandboxExecutor from './condition-evaluation/vm2SandboxExecutor';
import SlackCallback from './notificationCallbacks/slackCallback';
import NotificationExecutor from './notificationExecutor';

jest.mock('axios');

describe('JSNotificationService', () => {
  describe('notification system', () => {
    // Type assertion is ok here, because we have mocked the whole axios module
    // Disable unbound-method due to issue with jest
    // eslint-disable-next-line @typescript-eslint/unbound-method
    const post = axios.post as jest.Mock;

    let notificationService: NotificationExecutor;

    let data: Record<string, unknown>;

    beforeEach(() => {
      notificationService = new NotificationExecutor(new VM2SandboxExecutor());
      console.log = jest.fn();
      /* =======================================================
       * An Event sent by the Pipeline Service
       * on successful transformation/pipeline
       * ===================================================== */
      data = { value1: 1, b: 2 };
    });

    afterEach(() => {
      jest.clearAllMocks();
    });

    it('should trigger notification when transformation failed and condition is "data == undefined', async () => {
      post.mockReturnValue(Promise.resolve());

      const webhookParameter: WebhookParameter = {
        url: 'callback',
      };
      const notificationConfig: NotificationConfig = {
        id: 1,
        pipelineId: 1,
        condition: 'data === undefined',
        type: NotificationType.WEBHOOK,
        parameter: webhookParameter,
      };

      const message = 'message';
      const dataLocation = 'location';
      await notificationService.execute(notificationConfig, dataLocation, message, undefined);

      expect(post).toHaveBeenCalledTimes(1);
      // Check arguments for axios post (expect.objectContaining due to additional timestamp attribute)
      expect(post).toHaveBeenCalledWith(
        webhookParameter.url,
        expect.objectContaining({ location: dataLocation, message: message }),
      );
    });

    it('should trigger notification when transformation failed and condition is "!data', async () => {
      post.mockReturnValue(Promise.resolve());

      const webhookParameter: WebhookParameter = {
        url: 'callback',
      };
      const notificationConfig: NotificationConfig = {
        id: 1,
        pipelineId: 1,
        condition: '!data',
        type: NotificationType.WEBHOOK,
        parameter: webhookParameter,
      };

      const message = 'message';
      const dataLocation = 'location';
      await notificationService.execute(notificationConfig, dataLocation, message, undefined);

      expect(post).toHaveBeenCalledTimes(1);
      // Check arguments for axios post (expect.objectContaining due to additional timestamp attribute)
      expect(post).toHaveBeenCalledWith(
        webhookParameter.url,
        expect.objectContaining({ location: dataLocation, message: message }),
      );
    });

    it('should trigger notification when condition is met', async () => {
      post.mockReturnValue(Promise.resolve());

      const webhookParameter: WebhookParameter = {
        url: 'callback',
      };
      const notificationConfig: NotificationConfig = {
        id: 1,
        pipelineId: 1,
        condition: 'data.value1 > 0',
        type: NotificationType.WEBHOOK,
        parameter: webhookParameter,
      };

      const message = 'message';
      const dataLocation = 'location';
      await notificationService.execute(notificationConfig, dataLocation, message, data);

      expect(post).toHaveBeenCalledTimes(1);
      // Check arguments for axios post (expect.objectContaining due to additional timestamp attribute)
      expect(post).toHaveBeenCalledWith(
        webhookParameter.url,
        expect.objectContaining({ location: dataLocation, message: message }),
      );
    });

    test('should not trigger when condition is malformed', async () => {
      const webhookParameter: WebhookParameter = {
        url: 'callback',
      };
      const notificationConfig: NotificationConfig = {
        id: 1,
        pipelineId: 3,
        condition: 'asdfa;',
        type: NotificationType.WEBHOOK,
        parameter: webhookParameter,
      };

      try {
        const message = 'message';
        const dataLocation = 'location';
        await notificationService.execute(notificationConfig, dataLocation, message, data);
        throw new Error('Fail test');
      } catch (err) {
        expect(err).toHaveProperty(
          'message',
          'Malformed expression received: asdfa;\n Error message: ' + 'ReferenceError: asdfa is not defined',
        );
      }

      expect(post).not.toHaveBeenCalled();
    });

    test('SLACK request', async () => {
      const slackParameter: SlackParameter = {
        workspaceId: '012',
        channelId: '123',
        secret: '42',
      };
      const request: NotificationConfig = {
        id: 1,
        condition: 'data.value1 > 0',
        pipelineId: 42,
        type: NotificationType.SLACK,
        parameter: slackParameter,
      };

      const message = 'message';
      const dataLocation = 'location';
      await notificationService.execute(request, dataLocation, message, data);

      const expectedObject: SlackCallback = {
        text: message,
      };
      expect(post).toHaveBeenCalledTimes(1);
      const expectedUrl = `https://hooks.slack.com/services/${slackParameter.workspaceId}/${slackParameter.channelId}/${slackParameter.secret}`;

      expect(post).toHaveBeenCalledWith(expectedUrl, expectedObject);
    });
  });
});
