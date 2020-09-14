import * as express from 'express'
import { StorageContentRepository } from '../../storage-content/storageContentRepository'

export class StorageContentEndpoint {
  version = '0.0.1'

  contentRepository: StorageContentRepository

  constructor (contentRepository: StorageContentRepository, app: express.Application) {
    this.contentRepository = contentRepository

    // Request contents
    app.get('/bucket/:bucketId/content/:contentId', this.handleContentRequest)
    app.get('/bucket/:bucketId/content', this.handleAllContentRequest)
  }

  // The following methods need arrow syntax because of javascript 'this' shenanigans

  getHealthCheck = (req: express.Request, res: express.Response): void => {
    res.send('I am alive!')
  }

  getVersion = (): string => {
    return this.version
  }

  /**
   * Handles a request for getting content with contentId from bucket bucketId
   * @param req Request for data.
   * @param res Response containing the content with contentId from bucket bucketId
   */
  handleContentRequest = async (req: express.Request, res: express.Response): Promise<void> => {
    const bucketId = parseInt(req.params.bucketId)
    const contentId = parseInt(req.params.contentId)

    if (!bucketId || bucketId < 1) {
      res.status(400).send('Cannot request content: No valid bucket id provided')
      return
    }
    if (!contentId || contentId < 1) {
      res.status(400).send('Cannot request content: No valid bucket id provided')
      return
    }

    try {
      const content = await this.contentRepository.getContent(`${bucketId}`, `${contentId}`)
      if (content) {
        res.status(200).send(content)
        return
      } else {
        res.status(404).send(`Content with id "${contentId}" not found in bucker "${bucketId}"`)
        return
      }
    } catch (err) {
      console.error(`Could not get content on bucket "${bucketId}" with content id "${contentId}"\n${err}`)
      res.status(500).send(`Could not get content on bucket ${bucketId} with content id "${contentId}`)
    }
  }

  /**
   * Handles a request for getting all contents from bucket bucketId
   * @param req Request for data.
   * @param res Response containing  the data identified by bucketId
   */
  handleAllContentRequest = async (req: express.Request, res: express.Response): Promise<void> => {
    const bucketId = parseInt(req.params.bucketId)

    if (!bucketId || bucketId < 1) {
      res.status(400).send('Cannot request content: No valid bucket id provided')
      return
    }

    try {
      const content = await this.contentRepository.getAllContent(`${bucketId}`)
      if (content) {
        res.status(200).send(content)
        return
      } else {
        res.status(404).send(`Bucket "${bucketId}" does not exist`)
        return
      }
    } catch (err) {
      console.error(`Could not get content on bucket "${bucketId}"\n${err}`)

      res.status(500).send(`Could not get content on bucket ${bucketId}`)
    }
  }
}
