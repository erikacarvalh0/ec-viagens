# CI permissions and timeout

GitHub Actions CI uses a read-only GITHUB_TOKEN and a 20-minute job timeout. PR checks remain independent across branches, and this workflow does not cancel other PRs' checks. No application code or secrets change.
