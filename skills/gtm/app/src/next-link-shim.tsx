/**
 * next/link shim for the standalone GTM skill app.
 * Wraps wouter's Link to be API-compatible with Next.js Link.
 */
import type { ComponentProps } from "react";
import { Link } from "wouter";

interface NextLinkProps extends Omit<ComponentProps<"a">, "href"> {
  href: string;
  children?: React.ReactNode;
  prefetch?: boolean;
  replace?: boolean;
  scroll?: boolean;
  shallow?: boolean;
  passHref?: boolean;
  legacyBehavior?: boolean;
  locale?: string | false;
  as?: string;
}

export default function NextLink({
  href,
  children,
  prefetch: _prefetch,
  replace,
  scroll: _scroll,
  shallow: _shallow,
  passHref: _passHref,
  legacyBehavior,
  locale: _locale,
  as: _as,
  ...rest
}: NextLinkProps) {
  if (legacyBehavior) {
    return <>{children}</>;
  }
  // biome-ignore lint/suspicious/noExplicitAny: shim compatibility
  return (
    <Link to={href} replace={replace} {...(rest as any)}>
      {children}
    </Link>
  );
}
