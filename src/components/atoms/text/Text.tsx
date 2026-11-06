import type { CSSProperties, ReactNode } from "react";
import s from "./Text.module.css";

type TextTag =
  | "p"
  | "span"
  | "div"
  | "label"
  | "small"
  | "strong"
  | "em"
  | "h1"
  | "h2"
  | "h3"
  | "h4"
  | "h5"
  | "h6";

export type TextProps = {
  as?: TextTag;
  children?: ReactNode;

  size?:
    | "xxs"
    | "xs"
    | "xsl"
    | "sm"
    | "md"
    | "lg"
    | "xl"
    | "xxl"
    | "large";
  weight?: 300 | 400 | 500 | 600 | 700 | 800 | 900;

  color?: string;

  align?: "left" | "center" | "right" | "justify";
  lineHeight?: number | string;

  className?: string;
  style?: CSSProperties;
};

const weightToClass: Record<
  NonNullable<TextProps["weight"]>,
  string
> = {
  300: s.w300,
  400: s.w400,
  500: s.w500,
  600: s.w600,
  700: s.w700,
  800: s.w800,
  900: s.w900,
};

const sizeToClass: Record<
  NonNullable<TextProps["size"]>,
  string
> = {
  xxs: s.xxs,
  xsl: s.xsl,
  xs: s.xs,
  sm: s.sm,
  md: s.md,
  lg: s.lg,
  xl: s.xl,
  xxl: s.xxl,
  large: s.large,
};

const alignToClass: Record<
  NonNullable<TextProps["align"]>,
  string
> = {
  left: s.left,
  center: s.center,
  right: s.right,
  justify: s.justify,
};

export function Text({
  as = "span",
  children,
  size = "md",
  weight = 400,
  color,
  align,
  lineHeight,
  className,
  style,
}: TextProps) {
  const Tag = as;

  const cls = [
    s.base,
    sizeToClass[size],
    weightToClass[weight],
    align ? alignToClass[align] : "",
    className || "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <Tag
      className={cls}
      style={{
        color,
        lineHeight,
        margin: 0,
        ...style,
      }}
    >
      {children}
    </Tag>
  );
}
