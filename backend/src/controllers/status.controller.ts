import os from 'node:os';
import { Request, Response } from 'express';
import { DEPLOY_MESSAGE } from '../config/deployMessage';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/http';

export class StatusController {
  get = asyncHandler(async (_req: Request, res: Response) => {
    sendSuccess(res, {
      deployMessage: DEPLOY_MESSAGE,
      health: 'ok',
      hostname: os.hostname(),
      uptimeSeconds: Math.floor(process.uptime()),
      architecture: 'CloudFront → ALB → Auto Scaling Group → EC2',
      nodeEnv: process.env.NODE_ENV ?? 'development',
    });
  });
}

export const statusController = new StatusController();
