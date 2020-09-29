import * as express from 'express'

import { PipelineEvent } from '../transformationEvent'
import { TriggerEventHandler } from '../triggerEventHandler'

export class NotificationExecutionEndpoint {
  triggerEventHandler: TriggerEventHandler

  constructor (triggerEventHandler: TriggerEventHandler, app: express.Application) {
    this.triggerEventHandler = triggerEventHandler

    app.post('/trigger', this.triggerNotification)
  }

  triggerNotification = async (req: express.Request, res: express.Response): Promise<void> => {
    if (!this.triggerEventHandler.isValidPipelineEvent(req.body)) {
      res.status(400).send('Malformed notification trigger request.')
      return
    }
    const triggerEvent: PipelineEvent = req.body
    await this.triggerEventHandler.handleEvent(triggerEvent)
    res.status(200).send(`Successfully sent all notifications for pipeline ${triggerEvent.pipelineId}`)
  }
}
