# Git History Cleanup Guide

**Purpose:** Remove unwanted files and Claude Code-generated markdown from git history before publishing the repository publicly.

**⚠️ IMPORTANT:** Perform this cleanup **BEFORE** the first public push to GitHub to avoid complications.

---

## How to Clean Git History Before Publishing

### **Recommended Tool: `git-filter-repo`**

This is the officially recommended replacement for `git filter-branch` (which is deprecated). It's **fast**, **safe**, and handles edge cases properly.

#### **Installation**

```bash
# macOS (Homebrew)
brew install git-filter-repo

# Or via pip
pip3 install git-filter-repo

# Or download directly
curl -O https://raw.githubusercontent.com/newren/git-filter-repo/main/git-filter-repo
chmod +x git-filter-repo
sudo mv git-filter-repo /usr/local/bin/
```

#### **Workflow - Do This BEFORE First Public Push**

```bash
# 1. Make a backup (safety first!)
cd /Users/johnfreier/initiatives/projects/clickup-mcp-server
git clone . ../clickup-mcp-server-backup

# 2. Remove remote (git-filter-repo requires this)
git remote remove origin

# 3. Remove unwanted files/directories from ALL history
# Example: Remove all markdown files in docs/ directory
git filter-repo --path docs/ --invert-paths

# Or remove specific files
git filter-repo --path 'task-analysis-*.json' --invert-paths
git filter-repo --path 'tool-analysis-*.json' --invert-paths
git filter-repo --path '.claude/plans/' --invert-paths
git filter-repo --path '.claude/chats/' --invert-paths

# 4. Verify the cleanup
git log --all --oneline --graph
git count-objects -vH  # Check repo size reduction

# 5. Add remote back
git remote add origin https://github.com/YOUR_GITHUB_USERNAME/clickup-remote-mcp-server.git

# 6. Force push to new repo (first time only)
git push -u origin main --force
```

#### **Alternative: Remove Multiple Patterns at Once**

Create a file with paths to remove:

```bash
# Create paths-to-remove.txt
cat > paths-to-remove.txt << 'EOF'
.claude/plans/
.claude/chats/
.claude/prompts/
docs/docs-to-persist/
docs/prompts/
docs/skills/
task-analysis-*.json
tool-analysis-*.json
test-all-tools-ultrathink.js
HUMAN-TODO-AND-DECIDE-ITEMS.md
GIT-HISTORY-CLEANUP-GUIDE.md
docs/AGENTIC-MARKETING-STRATEGY-CLICKUP-MCP.md
docs/BRUTAL-ASSESSMENT.md
docs/CLICKUP-MCP-LAUNCH-MEGAPROMPT.md
docs/CLICKUP-MCP-LAUNCH-STRATEGY.md
docs/DEPLOYMENT-CHECKLIST-AGENTICALLY-EXECUTABLE.md
docs/DOCUMENTATION_ALIGNMENT_PLAN.md
docs/HN-LAUNCH-POST-CLICKUP-MCP.md
docs/PRE-LAUNCH-STATUS-REPORT.md
docs/USER_SETUP_GUIDE.md
docs/mcp_test_plan.md
docs/release-notes.md
docs/research/
docs/strategy/
tests/integration/
tests/scripts/
EOF

# Remove all paths in the file
git filter-repo --paths-from-file paths-to-remove.txt --invert-paths
```

#### **Important Considerations**

**⚠️ Timing:** Do this **BEFORE** your first public push to avoid complications:
- If you haven't pushed to public GitHub yet → **Perfect time to do this**
- If you've already pushed publicly → Users who cloned will have old history (requires force push)

**⚠️ Warnings:**
- This **rewrites all commit SHAs** - history is completely changed
- Anyone who has cloned your repo will need to re-clone
- Cannot be undone (that's why we made a backup)
- Test on backup first if unsure

**✅ Benefits:**
- Smaller repository size
- Cleaner history for public consumption
- No sensitive/junk files in git history
- Professional appearance

#### **Before/After Verification**

```bash
# Check current repo size
du -sh .git

# After cleanup, compare
du -sh .git

# Verify removed files are gone from history
git log --all --full-history --diff-filter=A -- "path/to/removed/file.md"
# Should return nothing if successfully removed
```

#### **Alternative Tool: BFG Repo Cleaner**

If you prefer a simpler GUI-like tool:

```bash
# Install
brew install bfg

# Remove files by name pattern
bfg --delete-files '*.md' --no-blob-protection

# Remove entire folders
bfg --delete-folders '.claude/plans' --no-blob-protection

# Clean up
git reflog expire --expire=now --all
git gc --prune=now --aggressive
```

---

## My Recommendation

**When to do this:** Right before you create your **first public GitHub repository**:

1. Finish all major architecture work
2. Create your cleanup list (paths-to-remove.txt)
3. Run `git-filter-repo` to clean history
4. Create fresh GitHub repo
5. Push cleaned history

**What to remove:**
- `.claude/plans/` - Your planning notes
- `.claude/chats/` - Chat histories
- `docs/strategy/` - Internal strategy docs
- `docs/prompts/` - AI prompts
- `*-MEGAPROMPT.md` - Large prompt files
- `HUMAN-TODO-*.md` - TODO files
- `task-analysis-*.json`, `tool-analysis-*.json` - Temporary analysis files
- `tests/integration/`, `tests/scripts/` - Test artifacts
- `GIT-HISTORY-CLEANUP-GUIDE.md` - This file itself (meta!)

**What to keep:**
- `src/` - All source code
- `README.md`, `CHANGELOG.md`, `LICENSE` - Documentation
- `package.json`, `tsconfig.json`, `wrangler.toml` - Config
- `.gitignore` - Git config
- `CLAUDE.md` - Project-specific AI instructions (optional - you decide)

---

## Step-by-Step Cleanup Checklist

- [ ] Backup entire repository: `git clone . ../clickup-mcp-server-backup`
- [ ] Create `paths-to-remove.txt` with all unwanted files/folders
- [ ] Install `git-filter-repo`: `brew install git-filter-repo`
- [ ] Remove remote: `git remote remove origin`
- [ ] Run filter: `git filter-repo --paths-from-file paths-to-remove.txt --invert-paths`
- [ ] Verify cleanup: `git log --all --oneline --graph`
- [ ] Check size reduction: `du -sh .git`
- [ ] Add remote back: `git remote add origin https://github.com/YOUR_GITHUB_USERNAME/clickup-remote-mcp-server.git`
- [ ] Force push: `git push -u origin main --force`
- [ ] Verify on GitHub web interface
- [ ] Delete backup if satisfied: `rm -rf ../clickup-mcp-server-backup`

---

**Result:** A clean, professional git history ready for public consumption! 🚀
