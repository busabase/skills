// Type-check stubs for the two specifiers only the Base44 Deno runtime resolves. They exist so
// `pnpm typecheck` works on a laptop; they are NOT deployed (only base44/ is).
declare module "base44:runtime" {
  export const secrets: { get(name: string): string | undefined };
  export function waitUntil<T>(promise: Promise<T>): Promise<T>;
}

declare module "npm:@base44/sdk" {
  export function createClientFromRequest(request: Request): {
    auth: { me(): Promise<{ role?: string } | null> };
    asServiceRole: { entities: Record<string, unknown> };
  };
}
