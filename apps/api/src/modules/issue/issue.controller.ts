/**
 * @module Issue Controller
 * @description HTTP request handlers for issue submission endpoints
 */

import { Request, Response, NextFunction } from 'express'
import { IssueService } from './issue.service'
import { sendSuccess } from '../../shared/utils/response.util'
import type { CreateIssueDto, IssueListQuery, UpdateIssueDto, AddCommentDto } from './issue.types'
import { AuthenticatedRequest } from '@workspace/types'
import { storageService } from '../../shared/storage/storage.service'
import * as path from 'path'
import * as fs from 'fs'

export class IssueController {
  private service = new IssueService()

  /**
   * Create new issue (public endpoint)
   * 
   * @route POST /api/public/v1/issues
   * @access Public (project key validation only)
   */
  create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data: CreateIssueDto = req.body
      const origin = req.headers.origin || req.headers.referer
      
      // Log incoming request data (without full screenshot dataUrl)
      console.log('[API Controller] Received issue creation request:', {
        title: data.title,
        hasScreenshot: !!data.screenshot,
        screenshotType: typeof data.screenshot,
        screenshotKeys: data.screenshot ? Object.keys(data.screenshot) : [],
        screenshotDetails: data.screenshot ? {
          hasScreenshotData: !!data.screenshot.screenshot,
          screenshotDataType: typeof data.screenshot.screenshot,
          hasSelector: !!data.screenshot.selector,
          selectorType: typeof data.screenshot.selector,
          selectorDetails: data.screenshot.selector ? {
            cssSelector: data.screenshot.selector.cssSelector,
            xpath: data.screenshot.selector.xpath,
            outerHTML: data.screenshot.selector.outerHTML?.substring(0, 200) + '...',
            boundingBox: data.screenshot.selector.boundingBox,
          } : null,
        } : null,
        origin,
      })
      
      const issue = await this.service.create(data, origin)
      
      sendSuccess(res, {
        id: issue.id,
      }, 201, 'Issue submitted successfully')
    } catch (error) {
      next(error)
    }
  }

  /**
   * List issues (admin endpoint)
   * 
   * @route GET /api/admin/v1/issues
   * @access Admin (JWT authentication required)
   */
  list = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const query: IssueListQuery = {
        page: req.query.page ? parseInt(req.query.page as string) : undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
        projectId: req.query.projectId ? parseInt(req.query.projectId as string) : undefined,
        status: req.query.status as 'open' | 'in-progress' | 'resolved' | 'closed' | undefined,
        severity: req.query.severity as 'low' | 'medium' | 'high' | 'critical' | undefined,
        assigneeId: req.query.assigneeId !== undefined ? (req.query.assigneeId === 'null' ? undefined : parseInt(req.query.assigneeId as string)) : undefined,
        startDate: req.query.startDate as string | undefined,
        endDate: req.query.endDate as string | undefined,
        search: req.query.search as string,
        sortBy: req.query.sortBy as 'createdAt' | 'updatedAt' | 'severity' | 'status' | undefined,
        sortOrder: req.query.sortOrder as 'asc' | 'desc' | undefined,
      }

      const result = await this.service.list(query)
      sendSuccess(res, result)
    } catch (error) {
      next(error)
    }
  }

  /**
   * List issues by project key (public endpoint)
   * 
   * @route GET /api/public/v1/issues?projectKey={key}&page={page}&limit={limit}
   * @access Public (project key validation only)
   */
  listPublic = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const projectKey = req.query.projectKey as string
      const page = req.query.page ? parseInt(req.query.page as string) : 1
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10

      if (!projectKey) {
        return res.status(400).json({
          error: 'BadRequest',
          message: 'projectKey query parameter is required',
          status: 400,
        })
      }

      const result = await this.service.listByProjectKey(projectKey, page, limit)
      sendSuccess(res, result)
    } catch (error) {
      next(error)
    }
  }

  /**
   * Get issue by ID (admin endpoint)
   * 
   * @route GET /api/admin/v1/issues/:id
   * @access Admin (JWT authentication required)
   */
  getById = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const id = parseInt(req.params.id)
      if (isNaN(id)) {
        return res.status(400).json({
          error: 'BadRequest',
          message: 'Invalid issue ID',
          status: 400,
        })
      }

      const issue = await this.service.getById(id)
      sendSuccess(res, issue)
    } catch (error) {
      next(error)
    }
  }

  /**
   * Update issue (admin endpoint)
   * 
   * @route PATCH /api/admin/v1/issues/:id
   * @access Admin (JWT authentication required)
   */
  update = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const id = parseInt(req.params.id)
      if (isNaN(id)) {
        return res.status(400).json({
          error: 'BadRequest',
          message: 'Invalid issue ID',
          status: 400,
        })
      }

      const data: UpdateIssueDto = req.body
      await this.service.update(id, data)

      sendSuccess(res, { id }, 200, 'Issue updated successfully')
    } catch (error) {
      next(error)
    }
  }

  /**
   * Serve screenshot with signed URL verification
   * 
   * @route GET /api/admin/v1/issues/screenshots/:path
   * @access Admin (signed URL token required)
   */
  getScreenshot = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const storagePath = decodeURIComponent(req.params.path)
      const token = req.query.token as string
      const expiresParam = req.query.expires
      const expires = expiresParam ? parseInt(String(expiresParam), 10) : 0

      // Log request details for debugging
      console.log('[Screenshot Controller] Request received:', {
        url: req.url,
        originalUrl: req.originalUrl,
        path: req.params.path,
        storagePath,
        token: token ? `${token.substring(0, 10)}...` : 'missing',
        tokenLength: token?.length,
        expires,
        expiresParam,
        expiresType: typeof expiresParam,
        hasToken: !!token,
        hasExpires: !!expiresParam,
        queryParams: Object.keys(req.query),
        allQueryParams: req.query,
      })

      // Verify token
      if (!token || !expires || isNaN(expires)) {
        console.error('[Screenshot Controller] Missing token or expiration:', {
          hasToken: !!token,
          hasExpires: !!expiresParam,
          expiresValue: expires,
          isNaN: isNaN(expires),
        })
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'Missing token or expiration',
          status: 401,
          debug: {
            hasToken: !!token,
            hasExpires: !!expiresParam,
            expiresValue: expires,
          },
        })
      }

      // Verify token signature
      const isValid = storageService.verifySignedUrlToken(storagePath, token, expires)
      console.log('[Screenshot Controller] Token verification:', {
        storagePath,
        isValid,
        expires,
        now: Math.floor(Date.now() / 1000),
        expired: Math.floor(Date.now() / 1000) > expires,
      })

      if (!isValid) {
        return res.status(403).json({
          error: 'Forbidden',
          message: 'Invalid or expired token',
          status: 403,
          debug: {
            storagePath,
            expires,
            now: Math.floor(Date.now() / 1000),
            expired: Math.floor(Date.now() / 1000) > expires,
          },
        })
      }

      // Get file path
      // Handle both old format (screenshots/{issueId}/...) and new format (screenshots/{projectId}/{issueId}/...)
      const rootDir = process.cwd()
      // Check if we're in apps/api and adjust path accordingly
      const projectRoot = rootDir.endsWith('/apps/api') || rootDir.endsWith('\\apps\\api')
        ? path.resolve(rootDir, '../..')
        : rootDir
      const fullPath = path.join(projectRoot, 'storage', 'uploads', storagePath)

      // Log path resolution for debugging
      console.log('[Screenshot Controller] Serving screenshot:', {
        storagePath,
        rootDir,
        projectRoot,
        fullPath,
        fileExists: fs.existsSync(fullPath),
      })

      // Check if file exists
      if (!fs.existsSync(fullPath)) {
        // Try alternative path resolution
        const altPath = path.join(process.cwd(), 'storage', 'uploads', storagePath)
        console.warn('[Screenshot Controller] File not found at primary path, trying alternative:', altPath)
        
        if (fs.existsSync(altPath)) {
          console.log('[Screenshot Controller] Found file at alternative path, using it')
          // Use alternative path
          const ext = path.extname(altPath).toLowerCase()
          const contentTypeMap: Record<string, string> = {
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg',
            '.png': 'image/png',
            '.webp': 'image/webp',
            '.gif': 'image/gif',
          }
          const contentType = contentTypeMap[ext] || 'image/jpeg'
          
          res.setHeader('Content-Type', contentType)
          res.setHeader('Cache-Control', 'private, max-age=3600')
          const origin = req.headers.origin
          if (origin) {
            res.setHeader('Access-Control-Allow-Origin', origin)
            res.setHeader('Access-Control-Allow-Credentials', 'true')
          }
          
          return res.sendFile(path.resolve(altPath))
        }
        
        return res.status(404).json({
          error: 'NotFound',
          message: 'Screenshot not found',
          status: 404,
          debug: {
            storagePath,
            primaryPath: fullPath,
            alternativePath: altPath,
            rootDir,
            projectRoot,
          },
        })
      }

      // Determine content type from file extension
      const ext = path.extname(fullPath).toLowerCase()
      const contentTypeMap: Record<string, string> = {
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.png': 'image/png',
        '.webp': 'image/webp',
        '.gif': 'image/gif',
      }
      const contentType = contentTypeMap[ext] || 'image/jpeg'

      // Send file with CORS headers to allow cross-origin image requests
      res.setHeader('Content-Type', contentType)
      res.setHeader('Cache-Control', 'private, max-age=3600') // Cache for 1 hour
      
      // Add CORS headers for screenshot images (needed when admin is on different origin)
      const origin = req.headers.origin
      if (origin) {
        res.setHeader('Access-Control-Allow-Origin', origin)
        res.setHeader('Access-Control-Allow-Credentials', 'true')
      }
      
      res.sendFile(path.resolve(fullPath))
    } catch (error) {
      next(error)
    }
  }

  /**
   * Add comment to issue (admin endpoint)
   * 
   * @route POST /api/admin/v1/issues/:id/comments
   * @access Admin (JWT authentication required)
   */
  addComment = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const id = parseInt(req.params.id)
      if (isNaN(id)) {
        return res.status(400).json({
          error: 'BadRequest',
          message: 'Invalid issue ID',
          status: 400,
        })
      }

      const { content } = req.body as AddCommentDto
      const userId = req.user!.id

      const comment = await this.service.addComment(id, userId, content)
      sendSuccess(res, comment, 201, 'Comment added successfully')
    } catch (error) {
      next(error)
    }
  }
}

