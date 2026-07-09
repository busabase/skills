import fs from "node:fs";
import path from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig, type Plugin } from "vite";

const ROOT = path.resolve(__dirname, "../../../../");
const PACKAGES = path.join(ROOT, "packages");

/**
 * Resolves workspace package imports (e.g. kui/button, share-domains/gtm/data)
 * from any file inside the monorepo, regardless of that file's location.
 * This is needed because share-domains components import from kui/, but
 * node_modules/kui is only linked inside this skill app, not globally.
 */
function workspaceResolverPlugin(): Plugin {
  const packages: Record<string, string> = {
    "gtm-data": path.join(PACKAGES, "gtm-data"),
    kui: path.join(PACKAGES, "kui"),
    "share-domains": path.join(PACKAGES, "share-domains"),
    sharelib: path.join(PACKAGES, "sharelib"),
    openlib: path.join(PACKAGES, "openlib"),
  };

  function resolveExport(pkgDir: string, subpath: string): string | null {
    const pkgJsonPath = path.join(pkgDir, "package.json");
    if (!fs.existsSync(pkgJsonPath)) return null;
    const pkgJson = JSON.parse(fs.readFileSync(pkgJsonPath, "utf-8"));
    const exports: Record<string, unknown> = pkgJson.exports ?? {};
    const key = subpath === "" ? "." : `./${subpath}`;

    // Try exact key, then wildcard patterns
    const entry = exports[key] ?? findWildcardExport(exports, key);
    if (!entry) return null;

    const file =
      typeof entry === "string"
        ? entry
        : ((entry as Record<string, string>).default ?? (entry as Record<string, string>).types);
    if (!file) return null;

    // Wildcard substitution: replace * in template with matched segment
    return path.join(pkgDir, file);
  }

  function findWildcardExport(exports: Record<string, unknown>, key: string): unknown {
    for (const [pattern, value] of Object.entries(exports)) {
      if (!pattern.includes("*")) continue;
      const [prefix, suffix] = pattern.split("*");
      if (key.startsWith(prefix) && key.endsWith(suffix ?? "")) {
        const wildcard = key.slice(prefix.length, suffix ? key.length - suffix.length : undefined);
        const resolve = (v: unknown): unknown => {
          if (typeof v === "string") return v.replace("*", wildcard);
          if (typeof v === "object" && v !== null) {
            return Object.fromEntries(
              Object.entries(v as Record<string, unknown>).map(([k2, v2]) => [k2, resolve(v2)]),
            );
          }
          return v;
        };
        return resolve(value);
      }
    }
    return undefined;
  }

  return {
    name: "workspace-resolver",
    resolveId(id) {
      for (const [pkgName, pkgDir] of Object.entries(packages)) {
        if (id === pkgName || id.startsWith(`${pkgName}/`)) {
          const subpath = id.slice(pkgName.length + 1); // strip "pkgName/"
          const resolved = resolveExport(pkgDir, subpath);
          if (resolved) return resolved;
        }
      }
      return null;
    },
  };
}

export default defineConfig({
  plugins: [workspaceResolverPlugin(), react()],
  css: {
    postcss: {
      plugins: [
        // @ts-expect-error
        (await import("@tailwindcss/postcss")).default,
      ],
    },
  },
  resolve: {
    alias: {
      "~/domains/gtm/data": path.join(__dirname, "../../../../packages/gtm-data/src"),
      "next/link": path.join(__dirname, "src/next-link-shim.tsx"),
      "next/image": path.join(__dirname, "src/next-image-shim.tsx"),
    },
  },
  server: {
    host: "127.0.0.1",
    port: 3000,
    open: false,
    fs: {
      // ROOT = worktree root; also allow the main kapps checkout (symlink targets resolve there)
      allow: [ROOT, path.resolve(ROOT, "../../.."), __dirname],
    },
  },
});
