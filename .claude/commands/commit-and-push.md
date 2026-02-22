Create a commit for the current changes and push to remote.

1. Run `pnpm typecheck` and `pnpm lint` to verify code quality
2. Run `git status` and `git diff` to review changes
3. Run `git log --oneline -5` to check recent commit style
4. Stage relevant files (avoid .env or secret files)
5. Write a clear commit message following the repo's style
6. Create the commit
7. Push to the current branch with `git push -u origin HEAD`
