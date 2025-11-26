# Collector SDK Build Process

## Building the SDK

The collector SDK needs to be built after making changes to ensure the browser uses the latest code.

### Build Command

```bash
cd apps/collector-sdk
pnpm build
```

This will:
1. Compile TypeScript source files
2. Bundle all dependencies (html2canvas, css-selector-generator)
3. Generate `dist/collector.min.js` (UMD format for browser)

### Development Mode

For development with auto-rebuild:

```bash
cd apps/collector-sdk
pnpm dev
```

This runs `vite build --watch` which rebuilds on file changes.

### Build Output

- **Input**: `src/index.ts` and all imported modules
- **Output**: `dist/collector.min.js` (minified UMD bundle)
- **Format**: UMD (Universal Module Definition) for browser compatibility

### Verifying Build

After building, check:

1. **File exists**: `apps/collector-sdk/dist/collector.min.js`
2. **File size**: Should be ~200-500KB (includes html2canvas)
3. **Browser console**: Check for latest log messages from your changes

### Common Issues

#### Changes Not Reflecting

1. **Rebuild required**: Run `pnpm build` after code changes
2. **Browser cache**: Hard refresh (Ctrl+Shift+R / Cmd+Shift+R)
3. **Wrong file**: Ensure browser loads `collector.min.js` not source files

#### Build Errors

- **TypeScript errors**: Run `pnpm typecheck` first
- **Missing dependencies**: Run `pnpm install`
- **Vite errors**: Check `vite.config.ts` configuration

### Integration

The built file is typically:
- Served from `/collector.min.js` or `/collector-sdk/dist/collector.min.js`
- Loaded via script tag: `<script src="/collector.min.js"></script>`
- Or via CDN if deployed

### Performance Notes

- **Bundle size**: Includes html2canvas (~200KB) and css-selector-generator
- **Minification**: Uses esbuild for fast minification
- **Source maps**: Disabled in production (set `sourcemap: true` in vite.config.ts for debugging)


