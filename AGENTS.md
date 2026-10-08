# Project Directives & Coding Guidelines

## Critical Rules
1. **Always Update GitHub on Code Changes**:
   Whenever any code change is made in this project:
   - Run `node scripts/build.js` to compile Babel bundle `app.bundle.js` and synchronize `public/` directory.
   - Stage all changes: `git add .`
   - Commit with a descriptive message: `git commit -m "..."`
   - Push immediately to GitHub: `git push origin main`
   - Verify deployment status if needed.

2. **Active Firebase Database**:
   - Project Name: `ME NEUST WEBSITE V2`
   - Project ID: `me-neust-website-v2`
   - Project Number: `358554783327`
   - All cloud sync calls in `server.js` and `static-engine.js` connect directly to this Firebase project.

3. **Code Quality & UI/UX**:
   - Zero disruptive blocking browser dialogs (`alert()`, `confirm()`).
   - Use the floating glassmorphic Toast Notification System (`window.showToast`) and modern action confirmation modal (`ConfirmModal`).
   - Maintain fluid transitions (`.tab-content-fade`), tactile button press feedback, and responsive layout modes.
   - Preserve all faculty administrator accounts and the complete 3,105 ME licensure question bank.
