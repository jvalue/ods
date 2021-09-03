import type { NextFunction, Request, RequestHandler, Response } from 'express';

/**
 * A wrapper for promise returning request handlers that passes the value of a
 * rejected promise to express's `next` function.
 * @param handler request handler to wrap
 */
export function asyncHandler(
  handler: (req: Request, res: Response, next?: NextFunction) => void | Promise<void>,
): RequestHandler {
  return (req: Request, res: Response, next: NextFunction): void => {
    const handlerResult = handler(req, res, next);
    Promise.resolve(handlerResult).catch(next);
  };
}
