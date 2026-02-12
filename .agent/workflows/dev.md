---
description: Development workflow for Laundry app - build, test, restart, commit
---

// turbo-all

1. Kill existing dev server: `taskkill /F /IM node.exe 2>$null`
2. Clean Next.js cache: `Remove-Item -Path ".next" -Recurse -Force -ErrorAction SilentlyContinue`
3. Start dev server: `npm run dev`
4. Run build check: `npx next build 2>&1 | Select-Object -Last 25`
5. Git add all: `git add -A`
6. Git status: `git status --short`
7. Git commit: `git commit -m "message"`
