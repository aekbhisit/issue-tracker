import { Router } from 'express'

import { FileManagerController } from '../file_manager.controller'
import { fileManagerValidation } from '../file_manager.validation'
import { validate } from '../../../shared/middlewares/validation.middleware'

const router = Router()
const controller = new FileManagerController()
const upload = controller.uploadMiddleware()

router.get('/', validate(fileManagerValidation.list), controller.list)
router.post('/upload', validate(fileManagerValidation.upload), upload.array('files'), controller.upload)
router.post('/folder', validate(fileManagerValidation.createFolder), controller.createFolder)
router.patch('/rename', validate(fileManagerValidation.rename), controller.rename)
router.delete('/', validate(fileManagerValidation.delete), controller.delete)

export default router

