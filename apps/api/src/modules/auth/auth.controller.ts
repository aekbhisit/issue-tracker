/**
 * @module Auth Controller
 * @description HTTP handlers for authentication endpoints
 */

import { Request, Response, NextFunction } from 'express'
import { AuthenticatedRequest } from '@workspace/types'
import { AuthService } from './auth.service'
import { sendSuccess } from '../../shared/utils/response.util'

export class AuthController {
  private service = new AuthService()

  /**
   * Register new user
   * 
   * @route POST /auth/register
   * @access Public
   */
  register = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const tokens = await this.service.register(req.body)
      sendSuccess(res, tokens, 201, 'Registration successful')
    } catch (error) {
      next(error)
    }
  }

  /**
   * Login user
   * 
   * @route POST /auth/login
   * @access Public
   */
  login = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const tokens = await this.service.login(req.body)
      sendSuccess(res, tokens, 200, 'Login successful')
    } catch (error: any) {
      // Log detailed error information for debugging
      console.error('Login error:', {
        message: error?.message,
        name: error?.name,
        stack: error?.stack,
        email: req.body?.email,
        hasPassword: !!req.body?.password,
      })
      next(error)
    }
  }

  /**
   * Get current user
   * 
   * @route GET /auth/me
   * @access Private
   */
  getCurrentUser = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      sendSuccess(res, req.user)
    } catch (error) {
      next(error)
    }
  }

  /**
   * Get test user
   * 
   * @route GET /auth/test
   * @access Private
   */
  getTestUser = async (_req: Request, res: Response, next: NextFunction) => {
    try {
      // Test user endpoint - return current user info if authenticated
      sendSuccess(res, { message: 'Test endpoint - implement as needed' }, 200, 'Test user successful')
    } catch (error) {
      next(error)
    }
  }

  /**
   * Logout user
   * 
   * @route POST /auth/logout
   * @access Private (but allows unauthenticated requests for cleanup)
   */
  logout = async (_req: Request, res: Response, next: NextFunction) => {
    try {
      // In JWT-based auth, logout is handled client-side
      // This endpoint can be used for logging or token blacklisting
      // Allow unauthenticated requests (client may have already cleared token)
      sendSuccess(res, null, 200, 'Logout successful')
    } catch (error) {
      next(error)
    }
  }
}

