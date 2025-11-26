import { Router } from 'express'

import { SettingsController } from '../settings.controller'

const router = Router()
const controller = new SettingsController()

router.get('/languages', controller.getLanguages)

export default router


