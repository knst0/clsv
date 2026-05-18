export type ClassValue = ClassArray | ClassDictionary | string | number | bigint | null | boolean | undefined;

export type ClassDictionary = Record<string, unknown>;

export type ClassArray = readonly ClassValue[];

export type StringToBoolean<T> = T extends "true" | "false" ? boolean : T;

export type VariantShape = {
  readonly [variant: string]: {
    readonly [value: string]: ClassValue;
  };
};

export type VariantKey<T> = Extract<keyof T, string>;

export type VariantPropsOf<V extends VariantShape> = {
  [K in keyof V as string extends K ? never : K]?: StringToBoolean<VariantKey<V[K]>> | null;
};

export type CVAProps<V extends VariantShape> = VariantPropsOf<V> & {
  class?: ClassValue;
  className?: ClassValue;
};

export interface CVAConfig<V extends VariantShape> {
  base?: ClassValue;
  variants?: V;
  compoundVariants?: Array<
    Partial<{
      [K in keyof V]: StringToBoolean<VariantKey<V[K]>> | Array<StringToBoolean<VariantKey<V[K]>>>;
    }> & {
      class?: ClassValue;
      className?: ClassValue;
    }
  >;
  defaultVariants?: Partial<VariantPropsOf<V>>;
}

export interface DefineConfigOptions {
  /**
   * Enable memoization of resolved base + variant + compound class strings.
   * Cache lives on each compiled function; evicted when the function is GC'd.
   *
   * @default true
   */
  cache?: boolean;

  /**
   * Maximum number of cached variant combinations.
   *
   * @default 500
   */
  cacheSize?: number;

  hooks?: {
    /**
     * Applied to every final class string before returning.
     * Primary use case: pipe through tailwind-merge to deduplicate conflicting utilities.
     *
     * @example
     * import { twMerge } from "tailwind-merge";
     * const { cva } = defineConfig({ hooks: { onComplete: twMerge } });
     */
    onComplete?: (className: string) => string;
  };
}

/**
 * Extracts variant prop types from a cva-produced function.
 *
 * @example
 * const button = cva({ base: "btn", variants: { intent: { primary: "...", danger: "..." } } });
 * type ButtonProps = VariantProps<typeof button>;
 * // → { intent?: "primary" | "danger" }
 */
export type VariantProps<T> = T extends (props?: infer P) => unknown ? Omit<NonNullable<P>, "class" | "className"> : never;
