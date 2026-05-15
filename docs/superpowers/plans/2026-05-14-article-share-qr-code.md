# Article Share QR Code Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a share button on the public article page that opens a modal showing a scannable QR code for the current article URL.

**Architecture:** Keep the feature isolated to the public article detail experience. Generate the QR image locally in the app so the modal can render a real image that mobile browsers can long-press to save.

**Tech Stack:** Next.js App Router, React client component, local API/image generation, Playwright, Vitest

---

### Task 1: Cover the public share experience

**Files:**
- Modify: `tests/e2e/public-site.spec.ts`

- [ ] **Step 1: Write the failing test**
- [ ] **Step 2: Run the e2e test to verify it fails**
- [ ] **Step 3: Implement the minimal UI and QR image flow**
- [ ] **Step 4: Run the e2e test again and make it pass**

### Task 2: Add the article share UI

**Files:**
- Create: `src/components/public/article-share-button.tsx`
- Modify: `src/app/articles/[slug]/page.tsx`
- Modify: `src/app/globals.css`

- [ ] **Step 1: Render a share button below the article title**
- [ ] **Step 2: Open a modal with the QR image and close controls**
- [ ] **Step 3: Ensure mobile-friendly spacing and image presentation**

### Task 3: Generate QR image data locally

**Files:**
- Create: `src/lib/qr-code.ts`
- Create: `src/app/api/qr/route.ts`
- Modify: `tests/unit/share.test.ts`

- [ ] **Step 1: Write a failing unit test for the QR image response helper**
- [ ] **Step 2: Implement minimal local QR image generation**
- [ ] **Step 3: Verify unit tests pass**
