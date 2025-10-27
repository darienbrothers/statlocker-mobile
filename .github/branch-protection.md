# Branch Protection Configuration

## Required Status Checks

Configure the following status checks as **required** for the `main` and `develop` branches:

### Quality Gates (Must Pass)
- `quality-gates`
- `final-validation`

### Test Suite (All Must Pass)
- `test-suite (unit)`
- `test-suite (integration)`
- `test-suite (accessibility)`
- `test-suite (performance)`

### Code Quality (Must Pass)
- `code-quality`
- `security-scan`

### Validation Checks (Must Pass)
- `accessibility-validation`
- `performance-validation`

## Branch Protection Rules

### Main Branch (`main`)
```yaml
# Require pull request reviews before merging
require_pull_request_reviews: true
required_approving_review_count: 2
dismiss_stale_reviews: true
require_code_owner_reviews: true

# Require status checks to pass before merging
require_status_checks: true
strict: true # Require branches to be up to date before merging
contexts:
  - quality-gates
  - test-suite (unit)
  - test-suite (integration)
  - test-suite (accessibility)
  - test-suite (performance)
  - code-quality
  - security-scan
  - accessibility-validation
  - performance-validation
  - final-validation

# Restrict pushes to matching branches
enforce_admins: true
restrictions:
  users: []
  teams: ["core-developers"]
  apps: []

# Additional settings
allow_force_pushes: false
allow_deletions: false
required_linear_history: true
```

### Develop Branch (`develop`)
```yaml
# Require pull request reviews before merging
require_pull_request_reviews: true
required_approving_review_count: 1
dismiss_stale_reviews: true
require_code_owner_reviews: false

# Require status checks to pass before merging
require_status_checks: true
strict: true
contexts:
  - quality-gates
  - test-suite (unit)
  - test-suite (integration)
  - code-quality
  - final-validation

# Less strict than main branch
enforce_admins: false
restrictions: null

# Additional settings
allow_force_pushes: false
allow_deletions: false
required_linear_history: false
```

## GitHub CLI Commands

To set up branch protection using GitHub CLI:

```bash
# Main branch protection
gh api repos/:owner/:repo/branches/main/protection \
  --method PUT \
  --field required_status_checks='{"strict":true,"contexts":["quality-gates","test-suite (unit)","test-suite (integration)","test-suite (accessibility)","test-suite (performance)","code-quality","security-scan","accessibility-validation","performance-validation","final-validation"]}' \
  --field enforce_admins=true \
  --field required_pull_request_reviews='{"required_approving_review_count":2,"dismiss_stale_reviews":true,"require_code_owner_reviews":true}' \
  --field restrictions=null \
  --field allow_force_pushes=false \
  --field allow_deletions=false

# Develop branch protection
gh api repos/:owner/:repo/branches/develop/protection \
  --method PUT \
  --field required_status_checks='{"strict":true,"contexts":["quality-gates","test-suite (unit)","test-suite (integration)","code-quality","final-validation"]}' \
  --field enforce_admins=false \
  --field required_pull_request_reviews='{"required_approving_review_count":1,"dismiss_stale_reviews":true,"require_code_owner_reviews":false}' \
  --field restrictions=null \
  --field allow_force_pushes=false \
  --field allow_deletions=false
```

## Code Owners

Create a `.github/CODEOWNERS` file to require specific team reviews:

```
# Global owners
* @statlocker/core-developers

# Critical paths require additional review
/src/lib/ @statlocker/core-developers @statlocker/security-team
/src/store/ @statlocker/core-developers @statlocker/architecture-team
/.github/ @statlocker/devops-team
/scripts/ @statlocker/devops-team

# Accessibility requires accessibility team review
/src/lib/accessibility.ts @statlocker/accessibility-team
/docs/a11y-* @statlocker/accessibility-team
/src/components/Accessible* @statlocker/accessibility-team

# Performance requires performance team review
/src/lib/performance* @statlocker/performance-team
/.github/workflows/performance.yml @statlocker/performance-team
/scripts/performance-* @statlocker/performance-team

# Security requires security team review
/.github/workflows/ci.yml @statlocker/security-team
/src/lib/analytics.ts @statlocker/security-team
```

## Merge Requirements Summary

### For Main Branch
- ✅ 2 approving reviews required
- ✅ Code owner review required
- ✅ All 10 status checks must pass
- ✅ Branch must be up to date
- ✅ No force pushes allowed
- ✅ Linear history required

### For Develop Branch  
- ✅ 1 approving review required
- ✅ 5 core status checks must pass
- ✅ Branch must be up to date
- ✅ No force pushes allowed

### Status Check Details

1. **quality-gates**: TypeScript, ESLint, Prettier, accessibility, performance
2. **test-suite (unit)**: Unit tests with coverage
3. **test-suite (integration)**: Integration tests
4. **test-suite (accessibility)**: Accessibility compliance tests
5. **test-suite (performance)**: Performance tests
6. **code-quality**: Coverage thresholds and quality analysis
7. **security-scan**: Security vulnerability scanning
8. **accessibility-validation**: WCAG compliance validation
9. **performance-validation**: Performance budget validation
10. **final-validation**: All checks summary validation

This configuration ensures that no code can be merged without passing all quality gates and receiving appropriate reviews.