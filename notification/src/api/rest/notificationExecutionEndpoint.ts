import * as express from 'express'

import { TransformationEvent } from '../transformationEvent'
import { TriggerEventHandler } from '../triggerEventHandler'

export class NotificationExecutionEndpoint {

  triggerEventHandler: TriggerEventHandler

  constructor (triggerEventHandler: TriggerEventHandler, app: express.Application) {
    this.triggerEventHandler = triggerEventHandler

    app.post('/trigger', this.triggerNotification)
  }

  // The following methods need arrow syntax because of javascript 'this' shenanigans

  triggerNotification = async (req: express.Request, res: express.Response): Promise<void> => {
    const triggerEvent = req.body as TransformationEvent
    if (!this.triggerEventHandler.isValidTransformationEvent(triggerEvent)) {
      res.status(400).send('Malformed notification trigger request.')
      return
    }

    await this.triggerEventHandler.handleEvent(triggerEvent)
    res.status(200).send(`Successfully sent all notifications for pipeline ${triggerEvent.pipelineId}`)
  }
}
