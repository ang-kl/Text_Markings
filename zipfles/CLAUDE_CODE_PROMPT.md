# Claude Code prompt — replace repo contents from ZIP

Run this from inside your local clone of `ang-kl/Text_Markings`, with `Text_Markings_contents.zip` uploaded.

---

You are working in my local clone of the GitHub repository `ang-kl/Text_Markings` (branch `main`). I have uploaded a ZIP named `Text_Markings_contents.zip` containing the complete new contents of the repo (folders `symbols/` and `engine/`, plus `index.html` and `README.md` at the root).

Task: replace the repository contents entirely with the ZIP, then push. Work in this exact order and PAUSE for my confirmation before committing.

1. Safety check. Run `git rev-parse --show-toplevel` and `git remote -v`. Confirm I am at the root of the `Text_Markings` repo and `origin` points at `ang-kl/Text_Markings`. If not, stop and tell me — do nothing else.
2. Locate the ZIP. Find `Text_Markings_contents.zip` (check the repo root and my Downloads folder). If it is missing or empty, stop and tell me — do not delete anything.
3. Delete the old files. Remove every tracked file and folder in the working tree EXCEPT the `.git` directory (and `.gitignore` / `LICENSE` if they exist), using `git rm -r` so the deletions are staged. Never touch `.git`.
4. Add the new files. Extract `Text_Markings_contents.zip` into the repo root, preserving its folder structure and overwriting where needed.
5. Stage and review. Run `git add -A`, then show me `git status` and a two-level tree (`find . -maxdepth 2 -not -path './.git/*'`) so I can confirm both the deletions and the new layout. Then STOP and wait for my go-ahead.
6. On my confirmation, commit and push:
   - commit message: `Replace repo contents with regenerated marking engine + symbol set`
   - then `git push origin main`.

Constraints: never delete or modify the `.git` directory; do not use `--force`; if anything is ambiguous or any step fails, stop and ask rather than guessing.

---

## If you would rather run it yourself

```bash
cd ~/path/to/Text_Markings
git rev-parse --show-toplevel && git remote -v      # confirm the right repo
git rm -rqf .                                        # stage deletion of all tracked files (.git is untouched)
unzip -o ~/Downloads/Text_Markings_contents.zip -d . # lay down the new contents
git add -A
git status                                            # review before committing
git commit -m "Replace repo contents with regenerated marking engine + symbol set"
git push origin main
```
