/**
 * next/image shim for the standalone GTM skill app.
 * Renders a plain <img> tag — no optimization, which is fine for a local kit viewer.
 */
import type { ComponentProps } from "react";

interface NextImageProps extends Omit<ComponentProps<"img">, "src" | "width" | "height"> {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  fill?: boolean;
  sizes?: string;
  priority?: boolean;
  quality?: number;
  placeholder?: string;
  blurDataURL?: string;
  unoptimized?: boolean;
  onLoad?: ComponentProps<"img">["onLoad"];
}

export default function NextImage({
  src,
  alt,
  width,
  height,
  fill,
  sizes: _sizes,
  priority: _priority,
  quality: _quality,
  placeholder: _placeholder,
  blurDataURL: _blurDataURL,
  unoptimized: _unoptimized,
  style,
  ...rest
}: NextImageProps) {
  const fillStyle: React.CSSProperties = fill
    ? { position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }
    : {};
  return (
    <img
      src={src}
      alt={alt}
      width={fill ? undefined : width}
      height={fill ? undefined : height}
      style={{ ...fillStyle, ...style }}
      {...rest}
    />
  );
}
