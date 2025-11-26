# Coding Rules & Conventions

## 📋 Table of Contents
1. [Naming Conventions](#naming-conventions)
2. [File & Folder Structure](#file--folder-structure)
3. [Code Comments & Documentation](#code-comments--documentation)
4. [TypeScript Guidelines](#typescript-guidelines)
5. [API Design](#api-design)
6. [Database Conventions](#database-conventions)
7. [React/Next.js Conventions](#reactnextjs-conventions)
8. [Git Conventions](#git-conventions)

---

## 🏷️ Naming Conventions

### **General Rules**
- ใช้ภาษาอังกฤษเท่านั้น
- ชื่อต้องสื่อความหมาย (descriptive)
- หลีกเลี่ยง abbreviations ที่ไม่ชัดเจน
- ใช้ consistent naming ทั้ง project

---

### **1. Files & Folders**

#### **Files**
```typescript
// ✅ Good
user.controller.ts
product.service.ts
banner.types.ts
auth.middleware.ts

// ❌ Bad
UserController.ts      // PascalCase for files
user_controller.ts     // snake_case
userCtrl.ts           // abbreviation
```

**Rules:**
- **lowercase with dots**: `module.type.ts`
- **kebab-case**: สำหรับ config files: `next.config.js`, `tsconfig.json`
- **Extensions**: `.ts`, `.tsx`, `.js`, `.jsx`

#### **React Components**
```typescript
// ✅ Good
UserProfile.tsx
BannerCard.tsx
ProductList.tsx

// ❌ Bad
userProfile.tsx       // Should be PascalCase
user-profile.tsx      // kebab-case
```

**Rules:**
- **PascalCase**: สำหรับ React components
- **Match component name**: `export function UserProfile()` → `UserProfile.tsx`

#### **Folders**
```typescript
// ✅ Good
src/modules/user/
src/components/ui/
apps/api/

// ❌ Bad
src/modules/User/     // PascalCase
src/modules/user_management/  // snake_case
```

**Rules:**
- **lowercase**: ทุก folder
- **kebab-case**: ถ้ามีหลายคำ: `product-category/`
- **singular**: ใช้ singular form: `module/` not `modules/`

---

### **2. Variables & Constants**

#### **Variables**
```typescript
// ✅ Good
const userName = 'John'
const isActive = true
const totalPrice = 100
let currentPage = 1

// ❌ Bad
const UserName = 'John'      // PascalCase
const user_name = 'John'     // snake_case
const x = 'John'             // not descriptive
const temp = true            // ambiguous
```

**Rules:**
- **camelCase**: ทุก variables
- **Descriptive**: ชื่อต้องบอกว่าเก็บอะไร
- **Boolean**: เริ่มด้วย `is`, `has`, `should`, `can`
  - `isActive`, `hasPermission`, `shouldUpdate`, `canDelete`

#### **Constants**
```typescript
// ✅ Good
const MAX_FILE_SIZE = 10485760
const API_BASE_URL = 'https://api.example.com'
const DEFAULT_PAGE_SIZE = 20
const HTTP_STATUS = {
  OK: 200,
  NOT_FOUND: 404,
  SERVER_ERROR: 500
}

// ❌ Bad
const maxFileSize = 10485760    // Should be UPPER_CASE
const ApiBaseUrl = 'https://'   // Mixed case
const pageSize = 20             // Not indicating it's constant
```

**Rules:**
- **UPPER_SNAKE_CASE**: สำหรับ constants
- **Group related constants**: ใช้ object หรือ enum

#### **Enums**
```typescript
// ✅ Good
enum UserRole {
  ADMIN = 'ADMIN',
  USER = 'USER',
  GUEST = 'GUEST'
}

enum OrderStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED'
}

// ❌ Bad
enum userRole {              // Should be PascalCase
  admin = 'admin',          // Should be UPPER_CASE
  user = 'user'
}
```

**Rules:**
- **PascalCase**: ชื่อ enum
- **UPPER_CASE**: enum values
- **String values**: ใช้ string แทน number

---

### **3. Functions & Methods**

#### **Functions**
```typescript
// ✅ Good
function getUserById(id: string): User { }
function calculateTotalPrice(items: Item[]): number { }
function isValidEmail(email: string): boolean { }
async function fetchUserData(userId: string): Promise<User> { }

// ❌ Bad
function GetUserById(id: string) { }     // PascalCase
function get_user(id: string) { }        // snake_case
function getUser(id: string) { }         // too generic
function calc(items: Item[]) { }         // abbreviation
```

**Rules:**
- **camelCase**: ทุก functions
- **Verb + Noun**: เริ่มด้วย verb (get, set, create, update, delete, fetch, etc.)
- **Descriptive**: บอกว่าทำอะไร
- **Boolean returns**: เริ่มด้วย `is`, `has`, `should`, `can`

#### **Common Verb Prefixes**
```typescript
// GET operations
getUserById()
fetchUserData()
findUserByEmail()
retrieveOrderDetails()

// CREATE operations
createUser()
addProduct()
insertRecord()
registerUser()

// UPDATE operations
updateUserProfile()
modifySettings()
editProduct()
setUserRole()

// DELETE operations
deleteUser()
removeProduct()
clearCache()

// CHECK operations
isValid()
hasPermission()
canAccess()
shouldUpdate()

// UTILITY operations
formatDate()
parseJson()
validateEmail()
transformData()
```

#### **Async Functions**
```typescript
// ✅ Good
async function fetchProducts(): Promise<Product[]> { }
async function createUser(data: CreateUserDto): Promise<User> { }

// ❌ Bad
async function getProducts() { }     // Missing return type
function fetchProducts() { }         // Should be async
```

**Rules:**
- **async/await**: ใช้แทน Promise chains
- **Return type**: ต้องระบุ `Promise<T>`

---

### **4. Classes**

```typescript
// ✅ Good
class UserService {
  private userRepository: UserRepository
  
  constructor(userRepository: UserRepository) {
    this.userRepository = userRepository
  }
  
  async findById(id: string): Promise<User | null> { }
}

class ProductController {
  private productService: ProductService
  
  async getAll(req: Request, res: Response): Promise<void> { }
}

// ❌ Bad
class userService { }              // Should be PascalCase
class User_Service { }             // snake_case
class US { }                       // abbreviation
```

**Rules:**
- **PascalCase**: ทุก classes
- **Noun**: ใช้ noun (UserService, ProductController)
- **Suffix patterns**:
  - `*Service`: Business logic
  - `*Controller`: HTTP handlers
  - `*Repository`: Database access
  - `*Middleware`: Express middleware
  - `*Validator`: Validation logic
  - `*Dto`: Data Transfer Objects
  - `*Entity`: Database entities

---

### **5. Interfaces & Types**

```typescript
// ✅ Good - Interfaces
interface User {
  id: string
  email: string
  name: string
}

interface CreateUserDto {
  email: string
  password: string
  name?: string
}

interface ApiResponse<T> {
  data: T
  message: string
  status: number
}

// ✅ Good - Type Aliases
type UserId = string
type UserRole = 'ADMIN' | 'USER' | 'GUEST'
type Nullable<T> = T | null
type ApiHandler = (req: Request, res: Response) => Promise<void>

// ❌ Bad
interface IUser { }               // Hungarian notation (no I prefix)
interface user { }                // lowercase
type userRole = 'ADMIN'           // lowercase
```

**Rules:**
- **PascalCase**: ทั้ง interfaces และ types
- **No prefix**: ไม่ใช้ `I` prefix (TypeScript convention)
- **Descriptive**: ชื่อต้องบอกว่าเป็นอะไร
- **Suffix `Dto`**: สำหรับ Data Transfer Objects

---

### **6. React Components**

```typescript
// ✅ Good
export function UserProfile({ userId }: UserProfileProps) { }
export function ProductCard({ product }: ProductCardProps) { }
export function BannerList() { }

// ❌ Bad
export function userProfile() { }           // lowercase
export function User_Profile() { }          // snake_case
export function UP() { }                    // abbreviation
```

**Props Interface:**
```typescript
// ✅ Good
interface UserProfileProps {
  userId: string
  onUpdate?: (user: User) => void
  className?: string
}

// ❌ Bad
interface Props { }                    // too generic
interface IUserProfileProps { }        // I prefix
interface UserProfile_Props { }        // snake_case
```

**Rules:**
- **PascalCase**: component names
- **Props suffix**: `ComponentNameProps`
- **Descriptive**: ชื่อบอกว่าเป็น component อะไร

---

### **7. API Endpoints**

```typescript
// ✅ Good
GET    /api/public/v1/users
GET    /api/public/v1/users/:id
POST   /api/admin/v1/users
PUT    /api/admin/v1/users/:id
DELETE /api/admin/v1/users/:id

GET    /api/public/v1/products
GET    /api/public/v1/products/categories
GET    /api/public/v1/products/:id/reviews

// ❌ Bad
GET    /api/getUsers                  // verb in URL
GET    /api/user/:id                  // singular
POST   /api/users/create              // redundant 'create'
GET    /api/Users                     // PascalCase
GET    /api/user_list                 // snake_case
```

**Rules:**
- **lowercase**: ทุก paths
- **kebab-case**: ถ้ามีหลายคำ: `/product-categories`
- **plural nouns**: `/users`, `/products` (not `/user`)
- **no verbs**: ใช้ HTTP methods แทน verbs
- **nested resources**: `/products/:id/reviews`
- **versioning**: `/v1/`, `/v2/`

---

### **8. Database**

#### **Table Names**
```sql
-- ✅ Good
users
products
product_categories
order_items

-- ❌ Bad
User                  -- PascalCase
tbl_users            -- prefix
user                 -- singular
```

**Rules:**
- **lowercase**: ทุก table names
- **snake_case**: ถ้ามีหลายคำ
- **plural**: ใช้ plural form

#### **Column Names**
```sql
-- ✅ Good
id
user_id
first_name
last_name
created_at
updated_at
is_active

-- ❌ Bad
ID                   -- uppercase
userId               -- camelCase
FirstName            -- PascalCase
user_name            -- ambiguous (use first_name, last_name)
```

**Rules:**
- **lowercase**: ทุก columns
- **snake_case**: ถ้ามีหลายคำ
- **descriptive**: ชื่อต้องชัดเจน
- **Foreign keys**: `table_id` (e.g., `user_id`, `product_id`)
- **Booleans**: `is_*`, `has_*` (e.g., `is_active`, `has_premium`)
- **Timestamps**: `created_at`, `updated_at`, `deleted_at`

#### **Prisma Models**

```prisma
// ✅ Good - TypeScript style with @map() to SQL style
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String?
  password  String
  role      Role     @default(USER)
  isActive  Boolean  @default(true) @map("is_active")      // camelCase → snake_case
  createdAt DateTime @default(now()) @map("created_at")    // camelCase → snake_case
  updatedAt DateTime @updatedAt @map("updated_at")         // camelCase → snake_case

  @@map("users")  // Singular → Plural
}

model ProductCategory {
  id        String   @id
  name      String
  slug      String   @unique
  isActive  Boolean  @map("is_active")
  createdAt DateTime @map("created_at")
  
  @@map("product_categories")  // PascalCase → snake_case plural
}

// ❌ Bad - Inconsistent naming
model User {
  id         String   @id
  email      String   @unique
  is_active  Boolean              // Already snake_case (should be camelCase in Prisma)
  created_at DateTime             // Already snake_case (should be camelCase in Prisma)
  
  @@map("user")                   // Should be plural "users"
}

// ❌ Bad - No mapping
model User {
  id        String   @id
  isActive  Boolean              // Will create "isActive" in DB (wrong!)
  createdAt DateTime             // Will create "createdAt" in DB (wrong!)
  
  // No @@map() - table will be "User" (wrong!)
}
```

**Rules:**
- **Model names**: PascalCase, Singular (`User`, `ProductCategory`)
- **Field names**: camelCase in Prisma (`isActive`, `createdAt`)
- **@map()**: แปลง field names เป็น snake_case (`is_active`, `created_at`)
- **@@map()**: แปลง model names เป็น plural snake_case (`users`, `product_categories`)
- **Foreign keys**: camelCase ใน Prisma, map เป็น snake_case
  ```prisma
  userId String @map("user_id")
  ```

**Benefits:**
- ✅ TypeScript code: `user.isActive` (camelCase - TypeScript convention)
- ✅ Database: `is_active` (snake_case - SQL convention)
- ✅ Type safety: Prisma generates TypeScript types
- ✅ Best practices: Follow conventions ของแต่ละ layer

**Example Usage:**
```typescript
// TypeScript code (camelCase)
const user = await db.user.findUnique({ where: { id } })
console.log(user.isActive)    // ✅ camelCase
console.log(user.createdAt)   // ✅ camelCase

// Database query (snake_case)
// SELECT id, email, is_active, created_at FROM users
```

---

## 💬 Code Comments & Documentation

### **1. Function Documentation (JSDoc)**

```typescript
/**
 * Retrieves a user by their ID from the database
 * 
 * @param id - The unique identifier of the user
 * @returns A promise that resolves to the user object or null if not found
 * @throws {NotFoundError} If the user does not exist
 * @throws {DatabaseError} If database connection fails
 * 
 * @example
 * ```typescript
 * const user = await getUserById('user-123');
 * console.log(user.email);
 * ```
 */
async function getUserById(id: string): Promise<User | null> {
  // Validate ID format
  if (!isValidId(id)) {
    throw new ValidationError('Invalid user ID format')
  }
  
  // Fetch user from database
  const user = await db.user.findUnique({ 
    where: { id } 
  })
  
  return user
}
```

**JSDoc Tags:**
```typescript
/**
 * Brief description (required)
 * 
 * Detailed description (optional)
 * 
 * @param paramName - Description
 * @returns Description of return value
 * @throws {ErrorType} When error occurs
 * @example Example usage code
 * @see Related function or doc
 * @deprecated Use newFunction instead
 * @todo What needs to be done
 */
```

---

### **2. Class Documentation**

```typescript
/**
 * Service class for managing user-related operations
 * 
 * This service handles all business logic related to users including
 * creation, updates, authentication, and authorization.
 * 
 * @example
 * ```typescript
 * const userService = new UserService(userRepository);
 * const user = await userService.create({ email, password });
 * ```
 */
export class UserService {
  private userRepository: UserRepository

  /**
   * Creates a new instance of UserService
   * 
   * @param userRepository - Repository for user data access
   */
  constructor(userRepository: UserRepository) {
    this.userRepository = userRepository
  }

  /**
   * Creates a new user with the provided data
   * 
   * @param data - User creation data
   * @returns The created user object
   * @throws {ValidationError} If data is invalid
   * @throws {ConflictError} If email already exists
   */
  async create(data: CreateUserDto): Promise<User> {
    // Implementation
  }
}
```

---

### **3. Inline Comments**

```typescript
// ✅ Good - Explain WHY, not WHAT
function calculateDiscount(price: number, userType: UserRole): number {
  // Premium users get 20% discount due to loyalty program
  if (userType === 'PREMIUM') {
    return price * 0.8
  }
  
  // Apply 10% discount for orders over $100 (marketing campaign)
  if (price > 100) {
    return price * 0.9
  }
  
  return price
}

// ❌ Bad - Obvious comments
function calculateDiscount(price: number, userType: UserRole): number {
  // Check if user is premium
  if (userType === 'PREMIUM') {
    // Multiply price by 0.8
    return price * 0.8
  }
  
  return price
}

// ✅ Good - Complex logic explanation
function validatePassword(password: string): boolean {
  // Password must meet security requirements:
  // - At least 8 characters
  // - Contains uppercase, lowercase, number, and special character
  // - Not in common passwords list (performance: O(1) lookup)
  const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/
  return regex.test(password) && !COMMON_PASSWORDS.has(password)
}
```

**Rules:**
- ✅ **Explain WHY**: อธิบายเหตุผล ไม่ใช่ว่าทำอะไร
- ✅ **Complex logic**: อธิบาย algorithm หรือ business rules
- ✅ **Workarounds**: อธิบาย temporary fixes หรือ hacks
- ✅ **TODOs**: ระบุสิ่งที่ต้องทำต่อ
- ❌ **Obvious code**: ไม่ต้อง comment สิ่งที่ชัดเจนอยู่แล้ว
- ❌ **Commented code**: ลบ code ที่ไม่ใช้ออก อย่าแค่ comment

---

### **4. TODO Comments**

```typescript
// ✅ Good
// TODO(username): Add pagination support by 2024-11-01
// TODO: Optimize query performance (JIRA-123)
// FIXME: Race condition when multiple requests (urgent)
// HACK: Temporary fix for IE11 compatibility, remove after IE11 EOL

// ❌ Bad
// TODO: fix this
// TODO: make it better
// fix later
```

**Format:**
```typescript
// TODO(assignee): Description (deadline/ticket)
// FIXME: Critical issue description
// HACK: Temporary workaround explanation
// NOTE: Important information
// WARNING: Potential issue warning
```

---

### **5. API Endpoint Documentation**

```typescript
/**
 * @route   GET /api/admin/v1/users
 * @desc    Get all users (admin only)
 * @access  Private (Admin)
 * @param   {number} page - Page number (default: 1)
 * @param   {number} limit - Items per page (default: 20)
 * @param   {string} search - Search query (optional)
 * @returns {Object[]} Array of user objects
 * 
 * @example
 * GET /api/admin/v1/users?page=1&limit=20&search=john
 * 
 * Response:
 * {
 *   "data": [...],
 *   "pagination": {
 *     "page": 1,
 *     "limit": 20,
 *     "total": 100
 *   }
 * }
 */
router.get('/', adminAuthMiddleware, userController.getAll)
```

---

### **6. Module/File Header Comments**

```typescript
/**
 * @module UserService
 * @description Service for managing user operations
 * 
 * This module provides business logic for user management including:
 * - User registration and authentication
 * - Profile management
 * - Role and permission handling
 * 
 * @requires @workspace/database
 * @requires bcrypt
 * 
 * @author Development Team
 * @created 2024-10-10
 * @lastModified 2024-10-15
 */

import { db } from '@workspace/database'
import bcrypt from 'bcrypt'
```

---

### **7. React Component Documentation**

```typescript
/**
 * User profile card component
 * 
 * Displays user information in a card format with avatar,
 * name, email, and action buttons.
 * 
 * @component
 * @example
 * ```tsx
 * <UserProfileCard
 *   user={user}
 *   onEdit={() => handleEdit(user.id)}
 *   onDelete={() => handleDelete(user.id)}
 * />
 * ```
 */
interface UserProfileCardProps {
  /** User object to display */
  user: User
  /** Callback when edit button is clicked */
  onEdit?: () => void
  /** Callback when delete button is clicked */
  onDelete?: () => void
  /** Additional CSS classes */
  className?: string
}

export function UserProfileCard({ 
  user, 
  onEdit, 
  onDelete, 
  className 
}: UserProfileCardProps) {
  // Component implementation
}
```

---

## ✅ Code Quality Rules

### **1. General Principles**

```typescript
// ✅ Good - Single Responsibility
class UserService {
  async create(data: CreateUserDto): Promise<User> { }
  async update(id: string, data: UpdateUserDto): Promise<User> { }
}

class EmailService {
  async sendWelcomeEmail(user: User): Promise<void> { }
}

// ❌ Bad - Multiple Responsibilities
class UserService {
  async create(data: CreateUserDto): Promise<User> { }
  async sendWelcomeEmail(user: User): Promise<void> { }
  async logActivity(userId: string): Promise<void> { }
}
```

---

### **2. Error Handling**

```typescript
// ✅ Good - Specific error types
class NotFoundError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'NotFoundError'
  }
}

async function getUserById(id: string): Promise<User> {
  const user = await db.user.findUnique({ where: { id } })
  
  if (!user) {
    throw new NotFoundError(`User with ID ${id} not found`)
  }
  
  return user
}

// ❌ Bad - Generic errors
async function getUserById(id: string): Promise<User> {
  const user = await db.user.findUnique({ where: { id } })
  
  if (!user) {
    throw new Error('Error')  // Too generic
  }
  
  return user
}
```

---

### **3. Function Size**

```typescript
// ✅ Good - Small, focused functions
async function createUser(data: CreateUserDto): Promise<User> {
  const validatedData = await validateUserData(data)
  const hashedPassword = await hashPassword(validatedData.password)
  const user = await saveUser({ ...validatedData, password: hashedPassword })
  await sendWelcomeEmail(user)
  return user
}

// ❌ Bad - Too large
async function createUser(data: CreateUserDto): Promise<User> {
  // 100+ lines of validation, hashing, saving, emailing...
}
```

**Rules:**
- ฟังก์ชันควรสั้น (< 50 lines)
- แยกฟังก์ชันใหญ่เป็นฟังก์ชันย่อย
- 1 function = 1 responsibility

---

## 📚 Additional Resources

- [TypeScript Style Guide](https://google.github.io/styleguide/tsguide.html)
- [Airbnb JavaScript Style Guide](https://github.com/airbnb/javascript)
- [Clean Code JavaScript](https://github.com/ryanmcdermott/clean-code-javascript)
- [JSDoc Reference](https://jsdoc.app/)

---

**Last Updated**: October 10, 2025  
**Version**: 1.0.0

