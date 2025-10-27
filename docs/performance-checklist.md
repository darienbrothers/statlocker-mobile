# Performance Checklist

## Overview

This checklist ensures that StatLocker maintains high performance standards across all features and platforms. Use this checklist during development, code reviews, and before releases.

## Performance Budget

### Bundle Size
- [ ] **Total bundle size < 10MB**
- [ ] **JavaScript bundle < 5MB**
- [ ] **Individual assets < 2MB**
- [ ] **No unused dependencies**
- [ ] **Code splitting implemented for large features**

### Runtime Performance
- [ ] **60fps tab switches** on current-generation devices
- [ ] **No layout shift** on CTA appearances/disappearances
- [ ] **Smooth animations** (no frame drops during transitions)
- [ ] **Fast app startup** (< 3 seconds to interactive)
- [ ] **Memory usage < 100MB** during normal operation

### Network Performance
- [ ] **Images optimized** with appropriate formats (WebP, AVIF)
- [ ] **Lazy loading** implemented for images and heavy components
- [ ] **Offline functionality** for core features
- [ ] **Efficient caching** strategies in place

## Code Quality Standards

### Component Performance
- [ ] **Memoized heavy list components** (React.memo, useMemo)
- [ ] **Optimized FlatList** with proper keyExtractor and getItemLayout
- [ ] **Debounced user input** handlers (search, form inputs)
- [ ] **Throttled scroll** event handlers
- [ ] **Proper cleanup** in useEffect hooks

### State Management
- [ ] **Minimal re-renders** (check with React DevTools Profiler)
- [ ] **Optimized selectors** in Zustand store
- [ ] **Avoid unnecessary state updates**
- [ ] **Proper dependency arrays** in hooks

### Image Optimization
- [ ] **OptimizedImage component** used for all images
- [ ] **Appropriate image sizes** for different screen densities
- [ ] **Placeholder strategies** implemented (skeleton, blur, color)
- [ ] **Error handling** with fallback images

## Testing Requirements

### Performance Tests
- [ ] **Animation performance tests** (60fps validation)
- [ ] **Memory leak tests** for heavy components
- [ ] **Bundle size regression tests**
- [ ] **Render performance benchmarks**

### Manual Testing
- [ ] **Test on older devices** (iPhone 8, Android API 23)
- [ ] **Test with slow network** conditions
- [ ] **Test with limited memory** scenarios
- [ ] **Test accessibility** with screen readers

## CI/CD Integration

### Automated Checks
- [ ] **Performance budget validation** in CI
- [ ] **Bundle size analysis** on PRs
- [ ] **ESLint performance rules** enabled
- [ ] **Test coverage > 80%** for performance-critical code

### Monitoring
- [ ] **Performance monitoring** enabled in production
- [ ] **Error tracking** for performance issues
- [ ] **Analytics events** for performance metrics
- [ ] **Crash reporting** configured

## Platform-Specific Optimizations

### iOS
- [ ] **Haptic feedback** optimized (not overused)
- [ ] **Safe area handling** correct
- [ ] **Keyboard behavior** smooth
- [ ] **Memory warnings** handled

### Android
- [ ] **Back button** behavior correct
- [ ] **Hardware back** gesture support
- [ ] **Different screen sizes** tested
- [ ] **Various Android versions** supported

## Development Guidelines

### Code Review Checklist
- [ ] **No console.log** statements in production code
- [ ] **Proper error boundaries** implemented
- [ ] **Loading states** for async operations
- [ ] **Accessibility labels** for interactive elements
- [ ] **TypeScript strict mode** compliance

### Performance Patterns
- [ ] **Use React.memo** for expensive components
- [ ] **Use useMemo** for expensive calculations
- [ ] **Use useCallback** for event handlers passed to children
- [ ] **Implement virtualization** for long lists
- [ ] **Use Suspense** for code splitting

## Common Performance Anti-Patterns to Avoid

### ❌ Don't Do
- Creating objects/functions in render
- Using array index as key in dynamic lists
- Inline styles that create new objects
- Unnecessary re-renders due to object/array recreation
- Heavy computations in render without memoization
- Large images without optimization
- Synchronous operations on main thread

### ✅ Do Instead
- Memoize objects and functions
- Use stable, unique keys for list items
- Use StyleSheet.create or className
- Memoize objects and arrays in state/props
- Use useMemo for expensive calculations
- Use OptimizedImage component
- Use async operations with proper loading states

## Performance Monitoring

### Metrics to Track
- **Frame rate** during animations and scrolling
- **Memory usage** over time
- **Bundle size** growth
- **App startup time**
- **Time to interactive**
- **Network request performance**

### Tools
- **React DevTools Profiler** for component performance
- **Flipper** for React Native debugging
- **Metro bundler** for bundle analysis
- **Performance monitoring** service (Firebase, Sentry)

## Emergency Performance Issues

### Critical Performance Bugs
If performance drops below acceptable levels:

1. **Immediate Actions**
   - Revert recent changes if possible
   - Disable non-critical features
   - Add performance monitoring

2. **Investigation**
   - Use React DevTools Profiler
   - Check memory usage patterns
   - Analyze bundle size changes
   - Review recent code changes

3. **Resolution**
   - Implement targeted optimizations
   - Add performance tests to prevent regression
   - Update performance budget if needed

## Performance Budget Violations

### When Budget is Exceeded
1. **Analyze the violation** - understand what caused it
2. **Evaluate impact** - is it worth the performance cost?
3. **Optimize or adjust** - either fix the issue or update budget
4. **Add monitoring** - prevent future regressions

### Updating Performance Budget
Performance budgets should be updated when:
- New features require additional resources
- Target devices change (newer/older)
- User experience requirements change
- Technical constraints change

## Resources

### Documentation
- [React Native Performance](https://reactnative.dev/docs/performance)
- [React Performance](https://react.dev/learn/render-and-commit)
- [Web Performance](https://web.dev/performance/)

### Tools
- [React DevTools](https://react.dev/learn/react-developer-tools)
- [Flipper](https://fbflipper.com/)
- [Bundle Analyzer](https://github.com/webpack-contrib/webpack-bundle-analyzer)

---

**Remember**: Performance is a feature, not an afterthought. Build it in from the start and maintain it throughout development.