/**
 * @module Issue Service
 * @description Business logic for issue management (IC-5: database storage)
 */

import { db } from '@workspace/database'
import { Prisma } from '@prisma/client'
import { UnauthorizedError, BadRequestError, NotFoundError } from '../../shared/utils/error.util'
import type { CreateIssueDto, IssueListQuery, UpdateIssueDto, IssueResponse, IssueListResponse, IssueCommentResponse } from './issue.types'
import { storageService } from '../../shared/storage/storage.service'

/**
 * Issue Service
 */
export class IssueService {
  /**
   * Validate project key
   * Checks if project exists and is active
   * 
   * @param projectKey - Project public key
   * @returns Project ID if valid
   * @throws {UnauthorizedError} If project key is invalid or project is inactive
   */
  async validateProjectKey(projectKey: string): Promise<number> {
    if (!projectKey || typeof projectKey !== 'string') {
      throw new UnauthorizedError('Project key is required')
    }

    // Validate format
    if (!projectKey.startsWith('proj_')) {
      throw new UnauthorizedError('Invalid project key format')
    }

    // Query project by public key
    const project = await db.project.findFirst({
      where: {
        publicKey: projectKey,
        deletedAt: null, // Not soft-deleted
      },
    })

    if (!project) {
      throw new UnauthorizedError('Invalid project key')
    }

    // Check if project is active
    if (!project.status) {
      throw new UnauthorizedError('Project is inactive')
    }

    return project.id
  }

  /**
   * Validate allowed origin
   * Checks if the request origin is in the project's allowed domains
   * 
   * @param projectId - Project ID
   * @param origin - Request origin (e.g., "https://example.com")
   * @throws {UnauthorizedError} If origin is not allowed
   */
  async validateAllowedOrigin(projectId: number, origin: string | undefined): Promise<void> {
    if (!origin) {
      // In development, allow requests without origin
      if (process.env.NODE_ENV === 'development') {
        return
      }
      throw new UnauthorizedError('Origin header is required')
    }

    // Get project with environments
    const project = await db.project.findUnique({
      where: { id: projectId },
      include: { environments: true },
    })

    if (!project) {
      throw new UnauthorizedError('Project not found')
    }

    // Extract domain from origin (remove protocol)
    const originDomain = origin.replace(/^https?:\/\//, '').replace(/\/$/, '').toLowerCase()
    
    // Allow localhost origins in both development and production
    // This enables SDK testing from localhost even in production
    // Production deployments can still restrict via project.allowedDomains if needed
    if (originDomain.startsWith('localhost:') || originDomain === 'localhost' || originDomain.startsWith('127.0.0.1:')) {
      return
    }

    // Check project-level allowed domains
    const allowedDomains = (project.allowedDomains as string[]) || []
    const isAllowed = allowedDomains.some(domain => {
      const normalizedDomain = domain.toLowerCase().replace(/\/$/, '')
      // Exact match
      if (normalizedDomain === originDomain) {
        return true
      }
      // Wildcard support (e.g., "*.example.com")
      if (normalizedDomain.startsWith('*.')) {
        const baseDomain = normalizedDomain.substring(2)
        return originDomain === baseDomain || originDomain.endsWith(`.${baseDomain}`)
      }
      return false
    })

    if (isAllowed) {
      return
    }

    // Check environment-level allowed origins (if any environment is active)
    const activeEnvironments = project.environments.filter(env => env.isActive)
    for (const env of activeEnvironments) {
      const allowedOrigins = (env.allowedOrigins as string[] | null) || []
      const envAllowed = allowedOrigins.some(envOrigin => {
        const normalizedOrigin = envOrigin.toLowerCase().replace(/\/$/, '')
        if (normalizedOrigin === originDomain) {
          return true
        }
        if (normalizedOrigin.startsWith('*.')) {
          const baseDomain = normalizedOrigin.substring(2)
          return originDomain === baseDomain || originDomain.endsWith(`.${baseDomain}`)
        }
        return false
      })
      if (envAllowed) {
        return
      }
    }

    // Origin not allowed
    throw new UnauthorizedError(`Origin "${origin}" is not allowed for this project`)
  }

  /**
   * Create issue with database storage
   * 
   * @param data - Issue creation data
   * @param origin - Request origin (for validation)
   * @returns Created issue ID
   */
  async create(data: CreateIssueDto, origin?: string): Promise<{ id: number }> {
    // Validate project key and get project ID
    const projectId = await this.validateProjectKey(data.projectKey)

    // Validate origin
    await this.validateAllowedOrigin(projectId, origin)

    // Validate title is not empty
    if (!data.title || data.title.trim().length === 0) {
      throw new BadRequestError('Title is required')
    }

    // Create issue in database
    const issue = await db.issue.create({
      data: {
        projectId,
        title: data.title.trim(),
        description: data.description?.trim() || null,
        severity: data.severity,
        status: 'open',
        reporterInfo: data.userInfo ? {
          id: data.userInfo.id,
          email: data.userInfo.email,
          name: data.userInfo.name,
        } : Prisma.JsonNull,
        metadata: data.metadata === null ? Prisma.JsonNull : data.metadata ?? Prisma.JsonNull,
      },
    })

    // Handle screenshot if provided
    console.log('[API Service] Checking for screenshot in data:', {
      hasScreenshot: !!data.screenshot,
      screenshotType: typeof data.screenshot,
      screenshotKeys: data.screenshot ? Object.keys(data.screenshot) : [],
    })
    
    if (data.screenshot) {
      console.log('[API Service] Processing screenshot for issue:', issue.id, {
        hasScreenshotData: !!data.screenshot.screenshot,
        hasSelector: !!data.screenshot.selector,
        selectorDetails: data.screenshot.selector ? {
          cssSelector: data.screenshot.selector.cssSelector,
          xpath: data.screenshot.selector.xpath,
          outerHTML: data.screenshot.selector.outerHTML?.substring(0, 200) + '...',
          boundingBox: data.screenshot.selector.boundingBox,
        } : null,
      })
      
      // Only save screenshot if screenshot data is available
      // If only selector is available (screenshot capture failed), just save selector
      const hasScreenshotData = data.screenshot.screenshot && typeof data.screenshot.screenshot === 'object'
      const hasSelector = data.screenshot.selector && typeof data.screenshot.selector === 'object'
      
      if (hasScreenshotData) {
        try {
          console.log('[API Service] Saving screenshot to storage...')
          const saveResult = await storageService.saveScreenshot(
            data.screenshot.screenshot,
            projectId, // Pass projectId for proper organization
            issue.id,
            data.screenshot.selector
          )
        console.log('[API Service] Screenshot saved to storage:', {
          storagePath: saveResult.storagePath,
          projectId: saveResult.projectId,
          issueId: saveResult.issueId,
          filename: saveResult.filename,
        })

        // Ensure selector data is properly stored
        let elementSelectorData: any = Prisma.JsonNull
        if (data.screenshot.selector && typeof data.screenshot.selector === 'object') {
          // Verify selector has required fields
          if (data.screenshot.selector.cssSelector && 
              data.screenshot.selector.xpath && 
              data.screenshot.selector.outerHTML &&
              data.screenshot.selector.boundingBox) {
            elementSelectorData = data.screenshot.selector as any
            console.log('[API Service] Element selector data validated and ready to store:', {
              hasCssSelector: !!elementSelectorData.cssSelector,
              hasXpath: !!elementSelectorData.xpath,
              hasOuterHTML: !!elementSelectorData.outerHTML,
              outerHTMLLength: elementSelectorData.outerHTML?.length || 0,
              hasBoundingBox: !!elementSelectorData.boundingBox,
            })
          } else {
            console.warn('[API Service] Element selector missing required fields:', {
              hasCssSelector: !!data.screenshot.selector.cssSelector,
              hasXpath: !!data.screenshot.selector.xpath,
              hasOuterHTML: !!data.screenshot.selector.outerHTML,
              hasBoundingBox: !!data.screenshot.selector.boundingBox,
            })
          }
        } else {
          console.warn('[API Service] Element selector is null or invalid:', {
            selector: data.screenshot.selector,
            type: typeof data.screenshot.selector,
          })
        }
        
        console.log('[API Service] Element selector data to store:', {
          isNull: elementSelectorData === Prisma.JsonNull,
          type: typeof elementSelectorData,
          keys: elementSelectorData !== Prisma.JsonNull ? Object.keys(elementSelectorData) : [],
        })

          const screenshotRecord = await db.issueScreenshot.create({
            data: {
              issueId: issue.id,
              storagePath: saveResult.storagePath,
              storageType: saveResult.storageType,
              mimeType: data.screenshot.screenshot.mimeType,
              width: data.screenshot.screenshot.width,
              height: data.screenshot.screenshot.height,
              fileSize: data.screenshot.screenshot.fileSize,
              elementSelector: elementSelectorData,
            },
          })
          
          console.log('[API Service] Screenshot record created in database:', {
            id: screenshotRecord.id,
            issueId: screenshotRecord.issueId,
            storagePath: screenshotRecord.storagePath,
            hasElementSelector: screenshotRecord.elementSelector !== null,
            elementSelectorType: typeof screenshotRecord.elementSelector,
          })
        } catch (error) {
          // Log error but don't fail issue creation
          console.error(`[API Service] ❌ FAILED to save screenshot for issue ${issue.id}:`, error)
          if (error instanceof Error) {
            console.error('[API Service] Error details:', {
              message: error.message,
              stack: error.stack,
              name: error.name,
            })
          } else {
            console.error('[API Service] Unknown error type:', typeof error, error)
          }
        }
      } else if (hasSelector) {
        // Screenshot capture failed but selector is available
        // Save only selector data without screenshot image
        console.log('[API Service] Screenshot capture failed, but saving selector data only...')
        
        try {
          // Ensure selector data is properly stored
          let elementSelectorData: any = Prisma.JsonNull
          if (data.screenshot.selector && typeof data.screenshot.selector === 'object') {
            // Verify selector has required fields
            if (data.screenshot.selector.cssSelector && 
                data.screenshot.selector.xpath && 
                data.screenshot.selector.outerHTML &&
                data.screenshot.selector.boundingBox) {
              elementSelectorData = data.screenshot.selector as any
              console.log('[API Service] Element selector data validated and ready to store:', {
                hasCssSelector: !!elementSelectorData.cssSelector,
                hasXpath: !!elementSelectorData.xpath,
                hasOuterHTML: !!elementSelectorData.outerHTML,
                outerHTMLLength: elementSelectorData.outerHTML?.length || 0,
                hasBoundingBox: !!elementSelectorData.boundingBox,
              })
            } else {
              console.warn('[API Service] Element selector missing required fields:', {
                hasCssSelector: !!data.screenshot.selector.cssSelector,
                hasXpath: !!data.screenshot.selector.xpath,
                hasOuterHTML: !!data.screenshot.selector.outerHTML,
                hasBoundingBox: !!data.screenshot.selector.boundingBox,
              })
            }
          }
          
          // Create screenshot record with only selector (no image)
          const screenshotRecord = await db.issueScreenshot.create({
            data: {
              issueId: issue.id,
              storagePath: '', // No storage path since no image
              storageType: 'none', // Indicate no image stored
              mimeType: null,
              width: null,
              height: null,
              fileSize: null,
              elementSelector: elementSelectorData,
            },
          })
          
          console.log('[API Service] Selector-only screenshot record created in database:', {
            id: screenshotRecord.id,
            issueId: screenshotRecord.issueId,
            hasElementSelector: screenshotRecord.elementSelector !== null,
            elementSelectorType: typeof screenshotRecord.elementSelector,
          })
        } catch (error) {
          // Log error but don't fail issue creation
          console.error(`[API Service] ❌ FAILED to save selector data for issue ${issue.id}:`, error)
          if (error instanceof Error) {
            console.error('[API Service] Error details:', {
              message: error.message,
              stack: error.stack,
              name: error.name,
            })
          }
        }
      } else {
        console.log('[API Service] ⚠️  Screenshot object provided but has neither screenshot data nor selector')
      }
    } else {
      console.log('[API Service] ⚠️  No screenshot provided in request - data.screenshot is:', data.screenshot)
    }

    // Handle logs if provided
    if (data.logs) {
      const logsToCreate: Array<{
        issueId: number
        logType: string
        level: string | null
        message: string
        stack: string | null
        metadata: any
        timestamp: Date
      }> = []

      // Console logs
      if (data.logs.consoleLogs && Array.isArray(data.logs.consoleLogs)) {
        for (const log of data.logs.consoleLogs) {
          logsToCreate.push({
            issueId: issue.id,
            logType: 'console',
            level: log.level,
            message: log.message,
            stack: null,
            metadata: log.metadata || null,
            timestamp: new Date(log.timestamp),
          })
        }
      }

      // JavaScript errors
      if (data.logs.jsErrors && Array.isArray(data.logs.jsErrors)) {
        for (const error of data.logs.jsErrors) {
          logsToCreate.push({
            issueId: issue.id,
            logType: 'error',
            level: 'error',
            message: error.message,
            stack: error.stack || null,
            metadata: {
              source: error.source,
              line: error.line,
              column: error.column,
            },
            timestamp: new Date(error.timestamp),
          })
        }
      }

      // Network errors
      if (data.logs.networkErrors && Array.isArray(data.logs.networkErrors)) {
        for (const networkError of data.logs.networkErrors) {
          logsToCreate.push({
            issueId: issue.id,
            logType: 'network',
            level: 'error',
            message: networkError.error,
            stack: null,
            metadata: {
              url: networkError.url,
              method: networkError.method,
              status: networkError.status,
              error: networkError.error,
            },
            timestamp: new Date(networkError.timestamp),
          })
        }
      }

      // Bulk create logs
      if (logsToCreate.length > 0) {
        await db.issueLog.createMany({
          data: logsToCreate,
        })
      }
    }

    return { id: issue.id }
  }

  /**
   * List issues with filters and pagination
   * 
   * @param query - Query parameters
   * @returns Paginated issue list
   */
  async list(query: IssueListQuery): Promise<IssueListResponse> {
    const page = query.page || 1
    const limit = query.limit || 10
    const skip = (page - 1) * limit
    const sortBy = query.sortBy || 'createdAt'
    const sortOrder = query.sortOrder || 'desc'

    // Build where clause
    const where: any = {}

    if (query.projectId) {
      where.projectId = query.projectId
    }

    if (query.status) {
      where.status = query.status
    }

    if (query.severity) {
      where.severity = query.severity
    }

    if (query.assigneeId !== undefined) {
      if (query.assigneeId === null) {
        where.assigneeId = null
      } else {
        where.assigneeId = query.assigneeId
      }
    }

    if (query.startDate || query.endDate) {
      where.createdAt = {}
      if (query.startDate) {
        where.createdAt.gte = new Date(query.startDate)
      }
      if (query.endDate) {
        // Include the entire end date by setting to end of day
        const endDate = new Date(query.endDate)
        endDate.setHours(23, 59, 59, 999)
        where.createdAt.lte = endDate
      }
    }

    if (query.search) {
      where.OR = [
        { title: { contains: query.search, mode: 'insensitive' as const } },
        { description: { contains: query.search, mode: 'insensitive' as const } },
      ]
    }

    // Get total count
    const total = await db.issue.count({ where })

    // Get issues with pagination
    const issues = await db.issue.findMany({
      where,
      skip,
      take: limit,
      orderBy: { [sortBy]: sortOrder },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            publicKey: true,
          },
        },
        assignee: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        screenshots: {
          orderBy: { createdAt: 'asc' },
        },
        logs: {
          orderBy: { timestamp: 'asc' },
          take: 100, // Limit logs per issue for list view
        },
      },
    })

    // Format response with signed URLs for screenshots
    const formattedIssues: IssueResponse[] = issues.map(issue => ({
      id: issue.id,
      projectId: issue.projectId,
      title: issue.title,
      description: issue.description,
      severity: issue.severity,
      status: issue.status,
      assigneeId: issue.assigneeId,
      reporterInfo: issue.reporterInfo as any,
      metadata: issue.metadata as any,
      createdAt: issue.createdAt.toISOString(),
      updatedAt: issue.updatedAt.toISOString(),
      screenshots: issue.screenshots.map(screenshot => ({
        id: screenshot.id,
        storagePath: screenshot.storagePath,
        storageType: screenshot.storageType,
        mimeType: screenshot.mimeType,
        width: screenshot.width,
        height: screenshot.height,
        fileSize: screenshot.fileSize,
        elementSelector: screenshot.elementSelector as any,
        createdAt: screenshot.createdAt.toISOString(),
        url: storageService.getScreenshotUrl(screenshot.storagePath, screenshot.storageType) || undefined,
      })),
      logs: issue.logs.map(log => ({
        id: log.id,
        logType: log.logType,
        level: log.level,
        message: log.message,
        stack: log.stack,
        metadata: log.metadata as any,
        timestamp: log.timestamp.toISOString(),
        createdAt: log.createdAt.toISOString(),
      })),
      project: {
        id: issue.project.id,
        name: issue.project.name,
        publicKey: issue.project.publicKey,
      },
      assignee: issue.assignee ? {
        id: issue.assignee.id,
        name: issue.assignee.name,
        email: issue.assignee.email,
      } : null,
    }))

    return {
      data: formattedIssues,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    }
  }

  /**
   * List issues by project key (public endpoint)
   * Returns limited data - no sensitive information
   * 
   * @param projectKey - Project public key
   * @param page - Page number
   * @param limit - Items per page
   * @returns Paginated issue list with limited fields
   */
  async listByProjectKey(projectKey: string, page: number = 1, limit: number = 10): Promise<IssueListResponse> {
    // Validate project key and get project ID
    const projectId = await this.validateProjectKey(projectKey)
    
    const skip = (page - 1) * limit
    
    // Build where clause - only issues for this project
    const where: any = {
      projectId,
    }

    // Get total count
    const total = await db.issue.count({ where })

    // Get issues with pagination - limited fields only
    const issues = await db.issue.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        severity: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    // Format response - limited data only
    const formattedIssues: any[] = issues.map(issue => ({
      id: issue.id,
      title: issue.title,
      severity: issue.severity,
      status: issue.status,
      createdAt: issue.createdAt.toISOString(),
      updatedAt: issue.updatedAt.toISOString(),
    }))

    return {
      data: formattedIssues,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    }
  }

  /**
   * Get issue by ID with all relations
   * 
   * @param id - Issue ID
   * @returns Issue with screenshots and logs
   * @throws {NotFoundError} If issue not found
   */
  async getById(id: number): Promise<IssueResponse> {
    const issue = await db.issue.findUnique({
      where: { id },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            publicKey: true,
          },
        },
        assignee: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        screenshots: {
          orderBy: { createdAt: 'asc' },
        },
        logs: {
          orderBy: { timestamp: 'asc' },
        },
        comments: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    })

    if (!issue) {
      throw new NotFoundError('Issue not found')
    }

    // Format response with signed URLs
    return {
      id: issue.id,
      projectId: issue.projectId,
      title: issue.title,
      description: issue.description,
      severity: issue.severity,
      status: issue.status,
      assigneeId: issue.assigneeId,
      reporterInfo: issue.reporterInfo as any,
      metadata: issue.metadata as any,
      createdAt: issue.createdAt.toISOString(),
      updatedAt: issue.updatedAt.toISOString(),
      screenshots: issue.screenshots.map(screenshot => ({
        id: screenshot.id,
        storagePath: screenshot.storagePath,
        storageType: screenshot.storageType,
        mimeType: screenshot.mimeType,
        width: screenshot.width,
        height: screenshot.height,
        fileSize: screenshot.fileSize,
        elementSelector: screenshot.elementSelector as any,
        createdAt: screenshot.createdAt.toISOString(),
        url: storageService.getScreenshotUrl(screenshot.storagePath, screenshot.storageType) || undefined,
      })),
      logs: issue.logs.map(log => ({
        id: log.id,
        logType: log.logType,
        level: log.level,
        message: log.message,
        stack: log.stack,
        metadata: log.metadata as any,
        timestamp: log.timestamp.toISOString(),
        createdAt: log.createdAt.toISOString(),
      })),
      comments: issue.comments.map(comment => ({
        id: comment.id,
        issueId: comment.issueId,
        userId: comment.userId,
        content: comment.content,
        createdAt: comment.createdAt.toISOString(),
        updatedAt: comment.updatedAt.toISOString(),
        user: {
          id: comment.user.id,
          name: comment.user.name,
          email: comment.user.email,
        },
      })),
      project: {
        id: issue.project.id,
        name: issue.project.name,
        publicKey: issue.project.publicKey,
      },
      assignee: issue.assignee ? {
        id: issue.assignee.id,
        name: issue.assignee.name,
        email: issue.assignee.email,
      } : null,
    }
  }

  /**
   * Update issue status
   * Supports reopening: closed → open
   * 
   * @param id - Issue ID
   * @param status - New status
   * @throws {NotFoundError} If issue not found
   * @throws {BadRequestError} If status transition is invalid
   */
  async updateStatus(id: number, status: 'open' | 'in-progress' | 'resolved' | 'closed'): Promise<void> {
    const issue = await db.issue.findUnique({
      where: { id },
      select: { status: true },
    })

    if (!issue) {
      throw new NotFoundError('Issue not found')
    }

    // Validate status transition (allow reopening from closed to open)
    const validStatuses = ['open', 'in-progress', 'resolved', 'closed']
    if (!validStatuses.includes(status)) {
      throw new BadRequestError(`Invalid status: ${status}`)
    }

    await db.issue.update({
      where: { id },
      data: { status },
    })
  }

  /**
   * Assign issue to user
   * 
   * @param id - Issue ID
   * @param assigneeId - User ID to assign (null to unassign)
   * @throws {NotFoundError} If issue not found
   */
  async assign(id: number, assigneeId: number | null): Promise<void> {
    // Verify issue exists
    const issue = await db.issue.findUnique({
      where: { id },
      select: { id: true },
    })

    if (!issue) {
      throw new NotFoundError('Issue not found')
    }

    // Verify user exists if assigneeId is provided
    if (assigneeId !== null) {
      const user = await db.user.findUnique({
        where: { id: assigneeId },
        select: { id: true },
      })

      if (!user) {
        throw new BadRequestError('Assignee not found')
      }
    }

    await db.issue.update({
      where: { id },
      data: { assigneeId },
    })
  }

  /**
   * Update issue
   * 
   * @param id - Issue ID
   * @param data - Update data
   * @throws {NotFoundError} If issue not found
   */
  async update(id: number, data: UpdateIssueDto): Promise<void> {
    const issue = await db.issue.findUnique({
      where: { id },
      select: { id: true },
    })

    if (!issue) {
      throw new NotFoundError('Issue not found')
    }

    const updateData: any = {}

    if (data.status !== undefined) {
      updateData.status = data.status
    }

    if (data.assigneeId !== undefined) {
      if (data.assigneeId === null) {
        updateData.assigneeId = null
      } else {
        // Verify user exists
        const user = await db.user.findUnique({
          where: { id: data.assigneeId },
          select: { id: true },
        })

        if (!user) {
          throw new BadRequestError('Assignee not found')
        }

        updateData.assigneeId = data.assigneeId
      }
    }

    if (data.description !== undefined) {
      updateData.description = data.description.trim() || null
    }

    await db.issue.update({
      where: { id },
      data: updateData,
    })
  }

  /**
   * Add comment to issue
   * 
   * @param issueId - Issue ID
   * @param userId - User ID (from authenticated request)
   * @param content - Comment content
   * @returns Created comment with user info
   * @throws {NotFoundError} If issue not found
   * @throws {BadRequestError} If content is empty
   */
  async addComment(issueId: number, userId: number, content: string): Promise<IssueCommentResponse> {
    // Validate issue exists
    const issue = await db.issue.findUnique({
      where: { id: issueId },
      select: { id: true },
    })

    if (!issue) {
      throw new NotFoundError('Issue not found')
    }

    // Validate content
    if (!content || content.trim().length === 0) {
      throw new BadRequestError('Comment content is required')
    }

    // Validate user exists
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true },
    })

    if (!user) {
      throw new BadRequestError('User not found')
    }

    // Create comment
    const comment = await db.issueComment.create({
      data: {
        issueId,
        userId,
        content: content.trim(),
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    return {
      id: comment.id,
      issueId: comment.issueId,
      userId: comment.userId,
      content: comment.content,
      createdAt: comment.createdAt.toISOString(),
      updatedAt: comment.updatedAt.toISOString(),
      user: {
        id: comment.user.id,
        name: comment.user.name,
        email: comment.user.email,
      },
    }
  }
}
