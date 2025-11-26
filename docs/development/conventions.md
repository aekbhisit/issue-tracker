# Code Conventions

See [RULES.md](../../RULES.md) for complete coding rules and conventions.

## Quick Reference

### File Naming
- **lowercase with dots**: `user.controller.ts`
- **PascalCase for React**: `UserProfile.tsx`

### Code Naming
- **camelCase**: variables, functions
- **PascalCase**: classes, interfaces, components
- **UPPER_SNAKE_CASE**: constants

### Comments
- Use JSDoc for functions and classes
- Explain WHY, not WHAT
- Use TODO/FIXME/HACK for special cases

## Module Structure

### API Module
```
modules/[feature]/
├── [feature].controller.ts
├── [feature].service.ts
├── [feature].validation.ts
├── [feature].types.ts
└── routes/
    ├── public.routes.ts
    └── admin.routes.ts
```

### Next.js Module
```
modules/[feature]/
├── components/
├── hooks/
├── services/
├── types/
└── utils/
```

## UI/UX Guidelines

For creating admin interface components, see **[Admin UI/UX Guidelines](./admin-ui-guidelines.md)**.

This guide covers:
- Design system (colors, typography, spacing)
- Component patterns (buttons, badges, tables, forms)
- Layout patterns
- Loading states
- Best practices and code examples

