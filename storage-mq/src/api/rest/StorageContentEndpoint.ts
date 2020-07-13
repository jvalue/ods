import * as express from 'express'
import { StorageContentRepository } from "@/storage-content/storageContentRepository"


export class StorageContentEndpoint {

  version = '0.0.1'

  contentRepository: StorageContentRepository

  constructor(contentRepository: StorageContentRepository, app: express.Application) {
    this.contentRepository = contentRepository

    app.get('/', this.getHealthCheck)
    app.get('/version', this.getVersion)

    // Request contents
    app.get('/bucket/:bucketId/content/:contentId', this.handleContentRequest)
    app.get('/bucket/:bucketId/content', this.handleContentsRequest)
  }

  // The following methods need arrow syntax because of javascript 'this' shenanigans

  getHealthCheck = (req: express.Request, res: express.Response): void => {
    res.send('I am alive!')
  }

  getVersion = (req: express.Request, res: express.Response): void => {
    res.header('Content-Type', 'text/plain')
    res.send(this.version)
    res.end()
  }


  /**
   * Handles a request for getting content with contentId from bucket bucketId
   * @param req Request for data.
   * @param res Response containing the content with contentId from bucket bucketId
   */
  handleContentRequest = async (req: express.Request, res: express.Response): Promise<void> => {
  }




  /**
   * Handles a request for getting all contents from bucket bucketId
   * @param req Request for data.
   * @param res Response containing  the data identified by bucketId
   */
  handleContentsRequest = async (req: express.Request, res: express.Response): Promise<void> => {
  }
}
