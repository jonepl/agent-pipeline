# TASK

Merge the following completed branches into the current branch:

{{BRANCHES}}

These branches correspond to the following completed issues:

{{ISSUES}}

# STEPS

1. For each branch listed above, merge it into the current branch:
   ```
   git merge --no-ff <branch>
   ```
2. Resolve any merge conflicts by choosing the most recent version of conflicting changes. Prefer the feature branch changes unless they clearly break something.
3. After all merges, run the verify contract (`npm run typecheck && npm run test`) to confirm nothing is broken.
4. If tests fail, fix the issue and commit the fix.

# COMMIT

After all merges are complete and tests pass, make a merge commit summarizing what was merged.

Once complete, output <promise>COMPLETE</promise>.
