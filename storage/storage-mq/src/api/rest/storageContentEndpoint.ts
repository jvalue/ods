import express from 'express';

import { StorageContentRepository } from '../../storage-content/storageContentRepository';

import { asyncHandler } from './utils';

export class StorageContentEndpoint {
  private readonly version = '0.0.1';

  constructor(private readonly contentRepository: StorageContentRepository) {}

  // The following methods need arrow syntax because of javascript 'this' shenanigans

  registerRoutes = (app: express.Application): void => {
    app.get(
      '/bucket/:bucketId/content/:contentId',
      asyncHandler(this.handleContentRequest),
    );
    app.get(
      '/bucket/:bucketId/content',
      asyncHandler(this.handleAllContentRequest),
    );
  };

  getVersion = (): string => {
    return this.version;
  };

  /**
   * Handles a request for getting content with contentId from bucket bucketId
   * @param req Request for data.
   * @param res Response containing the content with contentId from bucket bucketId
   */
  handleContentRequest = async (
    req: express.Request,
    res: express.Response,
  ): Promise<void> => {
    const bucketId = Number.parseInt(req.params.bucketId, 10);
    const contentId = Number.parseInt(req.params.contentId, 10);

    if (isNaN(bucketId) || bucketId < 1) {
      res
        .status(400)
        .send('Cannot request content: No valid bucket id provided');
      return;
    }
    if (isNaN(contentId) || contentId < 1) {
      res
        .status(400)
        .send('Cannot request content: No valid bucket id provided');
      return;
    }

    try {
      const content = await this.contentRepository.getContent(
        `${bucketId}`,
        `${contentId}`,
      );
      if (content === undefined) {
        res
          .status(404)
          .send(
            `Content with id "${contentId}" not found in bucker "${bucketId}"`,
          );
        return;
      }
      res.status(200).send(content);
    } catch (err) {
      console.error(
        `Could not get content on bucket "${bucketId}" with content id "${contentId}"\n`,
        err,
      );
      res
        .status(500)
        .send(
          `Could not get content on bucket ${bucketId} with content id "${contentId}`,
        );
    }
  };

  /**
   * Handles a request for getting all contents from bucket bucketId
   * @param req Request for data.
   * @param res Response containing  the data identified by bucketId
   */
  handleAllContentRequest = async (
    req: express.Request,
    res: express.Response,
  ): Promise<void> => {
    const bucketId = Number.parseInt(req.params.bucketId, 10);

    if (isNaN(bucketId) || bucketId < 1) {
      res
        .status(400)
        .send('Cannot request content: No valid bucket id provided');
      return;
    }

    try {
      const content = await this.contentRepository.getAllContent(`${bucketId}`);
      if (content === undefined) {
        res.status(404).send(`Bucket "${bucketId}" does not exist`);
        return;
      }
      res.status(200).send(content);
    } catch (err) {
      console.error(`Could not get content on bucket "${bucketId}"\n`, err);
      res.status(500).send(`Could not get content on bucket ${bucketId}`);
    }
  };
}
