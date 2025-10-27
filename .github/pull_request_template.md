# Pull Request

## Description
<!-- Provide a brief description of the changes in this PR -->

## Type of Change
<!-- Mark the relevant option with an "x" -->
- [ ] 🐛 Bug fix (non-breaking change which fixes an issue)
- [ ] ✨ New feature (non-breaking change which adds functionality)
- [ ] 💥 Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] 📚 Documentation update
- [ ] 🎨 Style/UI changes
- [ ] ♻️ Code refactoring (no functional changes)
- [ ] ⚡ Performance improvements
- [ ] 🧪 Test additions or updates
- [ ] 🔧 Build/CI changes
- [ ] ♿ Accessibility improvements

## Related Issues
<!-- Link to related issues using "Fixes #123" or "Closes #123" -->
- Fixes #
- Related to #

## Changes Made
<!-- List the main changes made in this PR -->
- 
- 
- 

## Testing
<!-- Describe the testing you've done -->
- [ ] Unit tests pass (`npm run test:unit`)
- [ ] Integration tests pass (`npm run test:integration`)
- [ ] Accessibility tests pass (`npm run accessibility:test`)
- [ ] Performance tests pass
- [ ] Manual testing completed
- [ ] Tested on iOS simulator/device
- [ ] Tested on Android simulator/device

## Quality Checklist
<!-- Ensure all quality gates are met -->
- [ ] TypeScript compilation passes (`npm run type-check`)
- [ ] ESLint passes (`npm run lint`)
- [ ] Prettier formatting applied (`npm run format`)
- [ ] Accessibility compliance verified (`npm run accessibility:check`)
- [ ] Performance budget maintained (`npm run performance:check`)
- [ ] Code coverage maintained (>80%)

## Accessibility Checklist
<!-- For UI changes, verify accessibility compliance -->
- [ ] All interactive elements have proper accessibility labels
- [ ] Touch targets are ≥44pt × 44pt
- [ ] Color contrast meets WCAG AA standards (≥4.5:1 for normal text)
- [ ] Screen reader navigation tested
- [ ] Keyboard navigation works (if applicable)
- [ ] Focus management is proper
- [ ] Dynamic text scaling supported

## Performance Checklist
<!-- For performance-sensitive changes -->
- [ ] No layout shifts introduced
- [ ] Animations maintain 60fps
- [ ] Bundle size impact assessed
- [ ] Memory usage optimized
- [ ] No performance regressions
- [ ] Heavy operations are memoized/optimized

## Security Checklist
<!-- For security-sensitive changes -->
- [ ] No sensitive data exposed in logs
- [ ] Input validation implemented
- [ ] Authentication/authorization respected
- [ ] No new security vulnerabilities introduced
- [ ] Dependencies are up to date and secure

## Screenshots/Videos
<!-- Add screenshots or videos to demonstrate the changes -->
### Before
<!-- Screenshot/video of the current state -->

### After
<!-- Screenshot/video of the new state -->

## Breaking Changes
<!-- If this is a breaking change, describe what breaks and how to migrate -->
- 

## Migration Guide
<!-- If applicable, provide migration instructions -->
- 

## Deployment Notes
<!-- Any special deployment considerations -->
- [ ] No special deployment steps required
- [ ] Database migrations needed
- [ ] Environment variables updated
- [ ] Third-party service configuration changed

## Reviewer Notes
<!-- Any specific areas you'd like reviewers to focus on -->
- 
- 

## Post-Merge Tasks
<!-- Tasks to complete after merging -->
- [ ] Update documentation
- [ ] Notify stakeholders
- [ ] Monitor performance metrics
- [ ] Update related issues

---

## Review Checklist (for reviewers)
- [ ] Code follows project conventions and style guide
- [ ] Logic is sound and efficient
- [ ] Error handling is appropriate
- [ ] Tests are comprehensive and meaningful
- [ ] Documentation is updated if needed
- [ ] Accessibility requirements are met
- [ ] Performance impact is acceptable
- [ ] Security considerations are addressed
- [ ] Breaking changes are properly documented

## CI Status
<!-- This will be automatically updated by GitHub Actions -->
All CI checks must pass before merging:
- Quality Gates
- Test Suite (Unit, Integration, Accessibility, Performance)
- Code Quality Analysis
- Security Scan
- Bundle Analysis
- Accessibility Validation
- Performance Validation