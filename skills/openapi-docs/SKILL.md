---
name: openapi-docs
description: Generate OpenAPI documentation for tRPC endpoints. Use when API endpoints change, need to update API docs, or want to expose REST API documentation. Creates Swagger/OpenAPI specs.
disable-model-invocation: false
allowed-tools: Bash(tsx:*), Bash(pnpm:*), Bash(npx:*)
argument-hint: "[app-name]"
---

# Generate OpenAPI Documentation

Automatically generates OpenAPI 3.0 specification and Swagger UI documentation from tRPC routers.

## What it does

For Next.js apps with tRPC + OpenAPI:
1. Scans tRPC routers and procedures
2. Generates OpenAPI 3.0 JSON specification
3. Creates interactive Swagger UI documentation
4. Exposes REST API endpoints alongside tRPC

## Usage

From app directory:
```bash
cd apps/productready
pnpm openapi:generate
```

Or run directly:
```bash
npx tsx apps/productready/scripts/generate-openapi-docs.mts
```

## Output

Generates documentation accessible at:
- `/api/v1/doc` - Swagger UI (interactive)
- `/api/v1/openapi.json` - OpenAPI spec (JSON)

## When to use

- After adding new tRPC procedures
- When API endpoints change
- Before publishing API documentation
- When integrating with third-party tools
- For API versioning and changelog

## Setup requirements

Apps using OpenAPI should have:

1. **Dependencies**:
   ```json
   {
     "@trpc/server": "^11.x",
     "trpc-openapi": "^1.x"
   }
   ```

2. **OpenAPI metadata in routers**:
   ```typescript
   export const postRouter = router({
     list: publicProcedure
       .meta({
         openapi: {
           method: 'GET',
           path: '/posts',
           tags: ['posts'],
           summary: 'List all posts'
         }
       })
       .input(z.object({ limit: z.number().optional() }))
       .output(z.array(PostSchema))
       .query(async ({ input }) => { ... })
   });
   ```

3. **OpenAPI handler** at `/api/v1/[...trpc]`:
   ```typescript
   import { createOpenApiNextHandler } from 'trpc-openapi';
   ```

## Features

- Interactive Swagger UI
- Request/response schemas
- Try it out functionality
- Authentication support
- API versioning
- Tags and grouping

## Benefits

- REST API alongside tRPC
- Auto-generated documentation
- Client SDK generation support
- Integration with API tools
- Better API discoverability

## Common patterns

### Public endpoints
```typescript
.meta({ openapi: { method: 'GET', path: '/public/data' }})
```

### Authenticated endpoints
```typescript
.meta({ openapi: { 
  method: 'POST', 
  path: '/private/action',
  protect: true 
}})
```

### Versioned APIs
```typescript
.meta({ openapi: { path: '/v2/resource' }})
```

## Troubleshooting

- If docs don't generate: Check `openapi` metadata in procedures
- If endpoint doesn't work: Verify OpenAPI handler is configured
- If schema is wrong: Check input/output Zod schemas

## Related

- tRPC documentation: https://trpc.io/
- OpenAPI spec: https://swagger.io/specification/
- trpc-openapi: https://github.com/jlalmes/trpc-openapi
