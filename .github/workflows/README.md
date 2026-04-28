# GitHub Actions Workflows

3 automated workflows that run tests, security checks, and code quality monitoring.

---

## 3 Workflows

### 1. **test.yml** - Every Push/PR
Runs all 35 tests on Node 18.x & 20.x, checks if critical files were deleted, verifies TypeScript compiles.

### 2. **pr-validation.yml** - Pull Requests
Posts test results in PR comments, scans for secrets/eval() usage, blocks merge if checks fail.

### 3. **quality.yml** - Daily at 2 AM UTC
Runs tests 3 times to find flaky tests, checks for outdated dependencies, audits critical files.

---

## What Gets Protected

❌ Can't delete:
- `src/lib/errors.ts`
- `src/lib/encrypt-decrypt.ts`
- All test files (35 tests)
- `package.json`, `pnpm-lock.yaml`

---

## Quick Reference

**Before pushing:** Run `pnpm vitest --run` locally

**Your PR gets checked for:**
- ✅ All 35 tests pass
- ✅ No critical files deleted
- ✅ No hardcoded secrets
- ✅ No dangerous code (eval)
- ✅ TypeScript compiles

**Daily status check:**
- Tests don't flake (run 3x)
- Dependencies are fresh
- All critical files exist

---

## Viewing Results

**GitHub Actions tab** → Select workflow → View logs

**PR comments** → Auto-posted with test results

---

## If Something Fails

| Error | Fix |
|-------|-----|
| Tests fail locally too | Run `pnpm vitest --run` |
| Critical file deleted | Restore from git history |
| Flaky test detected | Run test multiple times locally |
| Dependency outdated | Check daily quality.yml report |

---

## To Customize

**Add protected file:**
1. Edit `CRITICAL_FILES` in test.yml
2. Edit `CRITICAL_FILES` in quality.yml

**Change test requirement:**
1. Edit `MIN_TESTS=30` in quality.yml

**Change daily schedule:**
1. Edit cron in quality.yml: `cron: '0 2 * * *'` (2 AM UTC)
