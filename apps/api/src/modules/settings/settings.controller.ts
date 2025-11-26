import { Request, Response, NextFunction } from 'express'

import { sendSuccess } from '../../shared/utils/response.util'
import { SettingsService } from './settings.service'

export class SettingsController {
	private service = new SettingsService()

	getLanguages = async (_req: Request, res: Response, next: NextFunction) => {
		try {
			const languages = await this.service.getLanguages()
			sendSuccess(res, { languages })
		} catch (error) {
			next(error)
		}
	}
}


