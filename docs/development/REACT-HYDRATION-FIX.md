# React Hydration Error #418 - Fix Guide

## What is React Error #418?

React error #418 is a **hydration mismatch** error. It occurs when the HTML rendered on the server doesn't match what React expects to render on the client during hydration.

## Common Causes

1. **Dynamic values that differ between server and client**
   - `Date.now()`, `new Date()` - time values change
   - `Math.random()` - random values differ
   - `window.location` - not available on server
   - Browser APIs (`localStorage`, `navigator`, etc.)

2. **i18n language detection**
   - Server renders with default language
   - Client detects different language from cookies/localStorage
   - Translation strings differ

3. **Conditional rendering based on client-only APIs**
   - `if (typeof window !== 'undefined')` can cause different DOM structure

4. **Browser extensions**
   - Some extensions modify DOM before React hydrates

## Solutions Applied

### 1. Client-Only Components for Dynamic Content

Created `ClientTimeAgo` component that only renders after hydration:

```tsx
function ClientTimeAgo({ date }: { date: Date | string }) {
  const [timeAgo, setTimeAgo] = useState<string>('');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setTimeAgo(formatTimeAgo(date));
  }, [date]);

  if (!mounted) {
    return <span suppressHydrationWarning></span>;
  }

  return <span suppressHydrationWarning>{timeAgo}</span>;
}
```

### 2. suppressHydrationWarning Attribute

Added `suppressHydrationWarning` to elements with dynamic content:

```tsx
<span suppressHydrationWarning>
  {dynamicContent}
</span>
```

### 3. Consistent i18n Initialization

- Always use `'th'` as initial language on both server and client
- Language detection happens AFTER hydration using `requestAnimationFrame`
- Prevents translation mismatches during SSR

### 4. HTML Lang Attribute

Set consistent `lang` attribute:

```tsx
<html lang="th" suppressHydrationWarning>
```

## How to Debug Hydration Errors

### 1. Enable Development Mode

In development, React shows detailed hydration mismatch errors. Check browser console for:
- Which elements differ
- Expected vs actual values

### 2. Check Server vs Client Rendering

Add temporary logging:

```tsx
useEffect(() => {
  console.log('Client render:', someValue)
}, [])

// Server-side (in component)
console.log('Server render:', someValue)
```

### 3. Use React DevTools

React DevTools can highlight hydration mismatches in the component tree.

### 4. Check for Browser Extensions

Test in incognito mode to rule out browser extensions modifying DOM.

## Best Practices

1. **Avoid dynamic values in initial render**
   - Use `useState` with default values
   - Update in `useEffect` after mount

2. **Use suppressHydrationWarning sparingly**
   - Only for elements that MUST differ between server/client
   - Prefer fixing the root cause

3. **Consistent i18n setup**
   - Same initial language on server and client
   - Detect language after hydration

4. **Test SSR rendering**
   - Verify server-rendered HTML matches client expectations
   - Use tools like `curl` to check server HTML

## Files Modified

1. `apps/admin/app/admin/dashboard/page.tsx` - ClientTimeAgo component
2. `apps/admin/app/layout.tsx` - HTML lang attribute
3. `apps/admin/lib/i18n/config.ts` - Language detection timing

## Testing

After fixes, verify:
1. No hydration errors in browser console
2. Page renders correctly on first load
3. Dynamic content updates after hydration
4. i18n language switching works correctly

