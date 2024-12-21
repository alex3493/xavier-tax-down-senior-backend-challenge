import { Request, Response, NextFunction } from "express";

/**
 * Middleware to validate that the request has 'application/json' content type.
 * If the content type is not 'application/json', it responds with a 400 status
 * and an error message. Otherwise, it passes control to the next middleware.
 *
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next middleware function
 */
export function validateJson(req: Request, res: Response, next: NextFunction) {
  const shouldCheckHeader = () => ['POST', 'PUT', 'PATCH'].includes(req.method);

  if (shouldCheckHeader() && !req.is("application/json")) {
    return res
      .status(400)
      .json({ error: "Expected application/json content type" });
  }
  next();
}
