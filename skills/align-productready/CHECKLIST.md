# ProductReady Alignment Checklist

This is the **definitive checklist** for aligning any app with `apps/productready`.

## 🎯 Infrastructure Scope

### What to Align (Boilerplate - Must Match 100%)
- **Config files**: tsconfig.json, next.config.mjs, .env.example, drizzle.config.ts, postcss.config.mjs, vitest.config.ts
- **Auth (Better Auth)**: src/lib/auth/* (config, client, plugins)
- **Database (Drizzle)**: src/server/db.ts, src/db/schema/*, src/db/migrations/*, src/db/seed.ts
- **tRPC**: src/server/trpc.ts, src/server/context/*, src/lib/trpc/*
- **i18n**: src/i18n/* (config, formatters, translations)
- **Utilities**: src/lib/utils.ts, src/lib/constants.ts, src/lib/env.ts
- **Middleware**: src/middleware.ts (proxy, i18n, auth)
- **Standard Routes**: /api/health, /api/build-info, /api/trpc/[trpc]
- **systemadmin Domain**: src/domains/systemadmin/* (complete domain)
- **Dependencies**: Core package versions

### What NOT to Overwrite (Business Logic)
- **Domains**: src/domains/* (except systemadmin)
- **App Routes**: App-specific logic in /[lang]/dashboard/*, /[lang]/agents/*
- **Branding**: Colors, logos, marketing copy
- **Features**: App-specific functionality
- **Demo Data**: App-specific demo mode data

---

## 🔧 Infrastructure Files (Must Match 100%)

### Config Files
- [ ] `tsconfig.json`
  - compilerOptions.paths must match
  - include/exclude patterns must match
  - moduleResolution: "NodeNext"
  
- [ ] `next.config.mjs`
  - Same experimental features
  - Same webpack config
  - Same redirects/rewrites patterns (app-specific differences OK)
  
- [ ] `.env.example`
  - Same required environment variables structure
  - Database/API names will differ (app-specific)
  - Same optional variables
  
- [ ] `drizzle.config.ts`
  - Same schema path pattern
  - Same output directory
  - Same driver configuration
  
- [ ] `postcss.config.mjs`
  - Same PostCSS plugins
  
- [ ] `vitest.config.ts`
  - Same test configuration

### Database & ORM
- [ ] `drizzle.config.ts`
  - Same schema path
  - Same output directory
  - Same driver configuration
  
- [ ] `src/server/db.ts`
  - Same connection setup
  - Same pool configuration
  - Same error handling

### Authentication
- [ ] `src/lib/auth/config.ts` (Better Auth)
  - Same providers configuration
  - Same session settings
  - Same callback URLs pattern
  
- [ ] `src/lib/auth/client.ts`
  - Same client initialization
  - Same hooks exports

### tRPC
- [ ] `src/server/trpc.ts`
  - Same context creation pattern
  - Same middleware setup
  - Same error formatting
  
- [ ] `src/lib/trpc/client.tsx`
  - Same client configuration
  - Same links setup
  - Same query client config

### Dependencies (Version Alignment)
- [ ] `package.json` - Core dependencies must match versions:
  - `better-auth`
  - `drizzle-orm`
  - `@trpc/server`
  - `@trpc/client`
  - `@trpc/react-query`
  - `next`
  - `react`
  - `react-dom`
  - `typescript`
  - `tailwindcss`
  - `biome`

---

## 📁 Structure (Must Exist)

### Domain-Driven Design
- [ ] `src/domains/` directory exists
- [ ] `src/domains/systemadmin/` exists (must match productready)
  - [ ] `components/`
  - [ ] `logic/`
  - [ ] `types/`
  - [ ] `trpc/`
  - [ ] `openapi/` (optional)
  - [ ] `README.md`

### Content Structure
- [ ] `content/spec/` directory exists
- [ ] `content/docs/` directory exists (Fumadocs)
- [ ] `content/changelog/` directory exists

### Required Spec Files (6 files)
- [ ] `content/spec/product-design.md` - PRD with ICP alignment
- [ ] `content/spec/icp-guide.md` - Ideal Customer Profile
- [ ] `content/spec/marketing-guide.md` - Positioning & messaging
- [ ] `content/spec/onboarding-story.md` - User activation flows
- [ ] `content/spec/design-system.md` - Design tokens & patterns
- [ ] `content/spec/vi.md` - Visual identity & brand

### API Structure
- [ ] `src/app/api/health/route.ts` - Health check endpoint
- [ ] `src/app/api/build-info/route.ts` - Build version info
- [ ] `src/app/api/trpc/[trpc]/route.ts` - tRPC handler

---

## 🎨 Design System (Must Align)

### CSS Variables
- [ ] `src/app/global.css` exists
- [ ] Contains all required CSS variables:
  - `--background`, `--foreground`
  - `--primary`, `--primary-foreground`
  - `--secondary`, `--secondary-foreground`
  - `--accent`, `--accent-foreground`
  - `--muted`, `--muted-foreground`
  - `--card`, `--card-foreground`
  - `--border`, `--input`, `--ring`
  - `--radius` (border radius)
  - Spacing variables (if defined)

### Design Documentation
- [ ] `content/spec/vi.md` complete with:
  - Brand colors (primary, secondary, accent)
  - Typography (fonts, sizes, weights)
  - Logo specifications
  - Brand personality
  
- [ ] `content/spec/design-system.md` complete with:
  - Color tokens
  - Typography scale
  - Spacing scale
  - Component patterns
  - Usage guidelines

### Consistency Check
- [ ] CSS variables in `global.css` match `design-system.md`
- [ ] Design tokens in `design-system.md` match `vi.md`
- [ ] No hardcoded colors in components (use CSS variables)
- [ ] No hardcoded spacing (use Tailwind spacing or CSS variables)

---

## 🔧 Features (Must Implement)

### Authentication
- [ ] Auth system implemented (Clerk or Better Auth)
- [ ] Login page/component
- [ ] Signup page/component
- [ ] User profile page
- [ ] Protected routes middleware

### Core Components
- [ ] Footer component exists
  - [ ] Links to legal pages
  - [ ] Social media links
  - [ ] Company info
  
- [ ] Header/Navigation component
  - [ ] Logo
  - [ ] Main navigation
  - [ ] User menu (if authenticated)

### Legal Pages
- [ ] Privacy Policy page (`/privacy-policy`)
- [ ] Terms of Service page (`/terms-of-service`)
- [ ] Brand page (`/brand`) - optional but recommended

### Pricing (if applicable)
- [ ] Pricing page (`/pricing`)
- [ ] Pricing tiers defined
- [ ] Feature comparison table

### Assets
- [ ] `src/app/icon.tsx` - Dynamic favicon
- [ ] `public/icon.svg` - SVG icon
- [ ] `public/favicon.ico` - ICO favicon
- [ ] Screenshots in `public/screenshots/` (recommended)

---

## 📊 Monitoring & Observability

### Health Checks
- [ ] `/api/health` endpoint exists
  - [ ] Returns 200 OK
  - [ ] Checks database connection
  - [ ] Checks external services (if any)

### Build Info
- [ ] `/api/build-info` endpoint exists
  - [ ] Returns build timestamp
  - [ ] Returns git commit hash
  - [ ] Returns version number

### Cron Jobs (if applicable)
- [ ] `/api/cron/*` endpoints for scheduled tasks
- [ ] Proper authentication/authorization
- [ ] Error handling and logging

---

## 🔌 Backend & API

### Backend & API

### tRPC Routers (Must Implement)

#### User Preferences Router
- [ ] `src/domains/user/trpc/preferences.ts` exists
- [ ] `updateAvatar` mutation implemented
  - Updates `users.image` with relative path
  - Updates `user_profiles.image_attachment_id`
  - Marks old attachment as inactive
- [ ] `removeAvatar` mutation implemented
  - Clears `users.image`
  - Clears `user_profiles.image_attachment_id`
  - Marks old attachment as inactive
- [ ] `updateLanguage` mutation implemented
- [ ] `updateTheme` mutation implemented
- [ ] `getProfile` query implemented
- [ ] `getLanguage` query implemented
- [ ] `getTheme` query implemented

#### Spaces Router
- [ ] `src/domains/spaces/trpc/spaces.ts` exists
- [ ] `updateLogo` mutation implemented
  - Updates `organizations.logo` with relative path
  - Updates `spaces.logo_attachment_id`
  - Marks old attachment as inactive
  - Requires owner/admin role
- [ ] `removeLogo` mutation implemented
  - Clears `organizations.logo`
  - Clears `spaces.logo_attachment_id`
  - Marks old attachment as inactive
  - Requires owner/admin role
- [ ] `list` query implemented
- [ ] `getCurrent` query implemented
- [ ] `create` mutation implemented
- [ ] `update` mutation implemented
- [ ] `delete` mutation implemented

### Upload Hooks (Must Implement)
- [ ] `src/hooks/upload/upload-to-s3.ts` exists
  - [ ] `useS3Uploader` hook
  - [ ] `blobUrlToFile` utility
- [ ] `src/hooks/upload/use-avatar-upload.ts` exists
  - [ ] Wraps `useS3Uploader`
  - [ ] Calls `updateAvatar` mutation
  - [ ] Handles metadata with `type: "user-avatar"`
- [ ] `src/hooks/upload/use-editor-image-upload.ts` exists (if needed)
  - [ ] Wraps `useS3Uploader`
  - [ ] Handles metadata with `type: "post-image"`

### Database Schema (Must Have Fields)
- [ ] `src/db/schema/user-profiles.ts`
  - [ ] `imageAttachmentId` field exists
  - [ ] Used for tracking avatar attachment ID
- [ ] `src/db/schema/spaces.ts`
  - [ ] `logoAttachmentId` field exists
  - [ ] Used for tracking logo attachment ID

### UI Components (Must Implement)
- [ ] `src/domains/user/components/account-settings.tsx` exists
  - [ ] Uses `AvatarUpload` component
  - [ ] Uses `useAvatarUpload` hook
  - [ ] Calls `updateAvatar` and `removeAvatar` mutations
  - [ ] Shows current avatar from session
- [ ] `src/domains/spaces/components/space-settings.tsx` exists
  - [ ] Uses `AvatarUpload` component for logo
  - [ ] Uses `useAvatarUpload` hook with spaceId
  - [ ] Calls `updateLogo` and `removeLogo` mutations
  - [ ] Shows current logo from space data
  - [ ] Includes `DeleteSpaceDialog` component
- [ ] `src/domains/spaces/components/delete-space-dialog.tsx` exists
  - [ ] Requires Space ID confirmation
  - [ ] Copy Space ID to clipboard button
  - [ ] Proper warning messages

### Attachment Metadata (Must Follow Pattern)
- [ ] Attachment types defined in `src/domains/attachments/types/metadata.ts`:
  - [ ] `USER_AVATAR: "user-avatar"`
  - [ ] `SPACE_LOGO: "space-logo"`
  - [ ] `POST_IMAGE: "post-image"` (if needed)
  - [ ] `CHAT_ATTACHMENT: "chat-attachment"` (if needed)
- [ ] Metadata includes:
  - [ ] `type` field
  - [ ] `userId` field
  - [ ] `spaceId` field (if applicable)
  - [ ] `replacedBy` field (for tracking replacements)
  - [ ] `isActive` field (false when replaced)

### Storage Rules (Must Follow)
- [ ] Avatar/Logo paths stored as **relative paths**
  - ✅ Correct: `/api/attachment/att_xxx`
  - ❌ Wrong: `https://domain.com/api/attachment/att_xxx`
- [ ] Old attachments **not deleted** on update
  - Marked with `metadata.isActive = false`
  - Cleaned up by SystemAdmin bulk operations
- [ ] Attachment IDs tracked in profile tables
  - `user_profiles.image_attachment_id`
  - `spaces.logo_attachment_id`

### Admin Panel (if applicable)
- [ ] Admin routes exist (`/admin/*`)
- [ ] Admin authentication/authorization
- [ ] Admin dashboard
- [ ] User management
- [ ] Content management

### MCP Integration (if applicable)
- [ ] Admin MCP endpoint (`/admin/api/mcp`)
- [ ] User MCP endpoint (`/api/mcp`)
- [ ] Proper authentication

### OpenAPI (if applicable)
- [ ] OpenAPI documentation endpoint
- [ ] REST API routes
- [ ] API authentication

---

## 🔌 Package Integrations

### Email (if applicable)
- [ ] `packages/emaillib` integrated
- [ ] Email templates created
- [ ] Transactional emails configured
- [ ] Email sending tested

### Billing (if applicable)
- [ ] `packages/billing` integrated
- [ ] Payment provider configured (LemonSqueezy/Stripe/Airwallex)
- [ ] Subscription plans defined
- [ ] Webhook handlers implemented

---

## 📋 Quality & Documentation

### Package.json
- [ ] `appStatus` field exists and is complete:
  ```json
  {
    "appStatus": {
      "port": 3001,
      "description": "App description",
      "status": "🎯 优秀",
      "specs": {
        "prd": true,
        "icp": true,
        "marketing": true,
        "onboarding": true,
        "designSystem": true,
        "vi": true
      },
      "structure": {
        "content": true,
        "langRoutes": true
      },
      "legal": {
        "privacy": true,
        "terms": true,
        "brand": false
      },
      "theme": {
        "aligned": true
      },
      "features": {
        "footer": true,
        "auth": true,
        "pricing": false,
        "icon": true,
        "screenshots": false
      },
      "monitoring": {
        "health": true,
        "buildInfo": true,
        "cron": false
      },
      "backend": {
        "admin": false,
        "adminMcp": false,
        "openapi": false,
        "userMcp": false
      },
      "integrations": {
        "email": true,
        "billing": false
      },
      "qualityScore": 100
    }
  }
  ```

### Changelog
- [ ] Changelog entry created for alignment changes
- [ ] Format: `content/changelog/YYYYMMDD-align-with-productready.md`

### Testing
- [ ] `make typecheck` passes with no errors
- [ ] `pnpm lint:err` passes with no errors
- [ ] App builds successfully (`pnpm build`)
- [ ] App runs successfully (`pnpm dev`)

---

## 📈 Quality Score Calculation

**Quality Score = (Number of complete spec files / 6) × 100%**

- 6/6 files = 100% = 🎯 优秀 (Excellent)
- 5/6 files = 83% = ✅ 良好 (Good)
- 4/6 files = 67% = 🚧 开发中 (In Development)
- 3/6 files = 50% = 🚧 开发中 (In Development)
- 0-2/6 files = 0-33% = ⚠️ 需改进 (Needs Improvement)

---

## 🎯 Alignment Levels

### Level 1: Basic Alignment (Minimum Viable)
- ✅ All infrastructure files match
- ✅ All 6 spec files exist
- ✅ Basic structure (domains/, content/)
- ✅ No typecheck/lint errors

### Level 2: Standard Alignment (Production Ready)
- ✅ Level 1 complete
- ✅ Design system fully aligned
- ✅ Core features implemented (Auth, Footer, Health)
- ✅ Legal pages exist

### Level 3: Full Alignment (Gold Standard)
- ✅ Level 2 complete
- ✅ All monitoring endpoints
- ✅ Package integrations (email, billing if needed)
- ✅ Admin panel (if applicable)
- ✅ 100% quality score

---

## 🚀 Quick Check Commands

```bash
# Check infrastructure files
diff apps/productready/tsconfig.json apps/<app>/tsconfig.json
diff apps/productready/tailwind.config.ts apps/<app>/tailwind.config.ts
diff apps/productready/next.config.ts apps/<app>/next.config.ts

# Check structure
ls -la apps/<app>/src/domains/
ls -la apps/<app>/content/spec/

# Check design system
cat apps/<app>/src/app/global.css | grep "^  --"
cat apps/<app>/content/spec/vi.md
cat apps/<app>/content/spec/design-system.md

# Check features
curl http://localhost:3001/api/health
curl http://localhost:3001/api/build-info

# Check quality
make typecheck
pnpm lint:err
```

---

**Use this checklist for every alignment operation. Check off items as you verify them.**
