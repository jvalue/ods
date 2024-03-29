import express from 'express';

import {
  PipelineSuccessEvent,
  isValidPipelineSuccessEvent,
} from '../pipelineEvent';
import { TriggerEventHandler } from '../triggerEventHandler';

import { asyncHandler } from './utils';

export class NotificationExecutionEndpoint {
  constructor(private readonly triggerEventHandler: TriggerEventHandler) {}

  registerRoutes = (app: express.Application): void => {
    app.post('/trigger', asyncHandler(this.triggerNotification));
  };

  triggerNotification = async (
    req: express.Request,
    res: express.Response,
  ): Promise<void> => {
    if (!isValidPipelineSuccessEvent(req.body)) {
      res.status(400).send('Malformed notification trigger request.');
      return;
    }
    const triggerEvent: PipelineSuccessEvent = req.body;
    await this.triggerEventHandler.handleEvent(triggerEvent);
    res
      .status(200)
      .send(
        `Successfully sent all notifications for pipeline ${triggerEvent.pipelineId}`,
      );
  };
}
