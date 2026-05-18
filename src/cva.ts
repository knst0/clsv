import { cx as defaultCx } from "./cx";
import type { ClassValue, CVAConfig, CVAProps, DefineConfigOptions, VariantShape } from "./types";

type CVAFactory = <V extends VariantShape>(config: CVAConfig<V>) => (props?: CVAProps<V>) => string;

const DEFAULT_CACHE_SIZE = 500;

export const defineConfig = (options?: DefineConfigOptions): { cva: CVAFactory; cx: typeof defaultCx } => {
  const onComplete = options?.hooks?.onComplete;
  const defaultCacheEnabled = options?.cache !== false;
  const defaultCacheSize = options?.cacheSize ?? DEFAULT_CACHE_SIZE;

  const cx = (...classes: ClassValue[]): string => {
    const className = defaultCx(...classes);

    return onComplete ? onComplete(className) : className;
  };

  const cva = <V extends VariantShape>(config: CVAConfig<V>) => {
    if (!config.variants && !config.compoundVariants) {
      return (props?: CVAProps<V>) => cx(config.base, props?.class, props?.className);
    }

    const useCache = defaultCacheEnabled && defaultCacheSize > 0;
    let cache: Map<string, string> | undefined;

    return (props?: CVAProps<V>) => {
      const variantProps = (props ?? {}) as CVAProps<V>;
      const ownClass = variantProps.class;
      const ownClassName = variantProps.className;
      const cacheKey = useCache ? getCacheKey(config, variantProps) : "";

      let resolved = useCache ? cache?.get(cacheKey) : undefined;

      if (resolved === undefined) {
        resolved = resolveConfig(config, variantProps);

        if (useCache) {
          cache ??= new Map<string, string>();

          if (cache.size >= defaultCacheSize) {
            const firstKey = cache.keys().next().value;

            if (firstKey !== undefined) {
              cache.delete(firstKey);
            }
          }

          cache.set(cacheKey, resolved);
        }
      }

      return cx(resolved, ownClass, ownClassName);
    };
  };

  return { cva, cx };
};

function resolveConfig<V extends VariantShape>(config: CVAConfig<V>, props: CVAProps<V>): string {
  const variants = config.variants as VariantShape | undefined;
  const classes: ClassValue[] = [config.base];

  if (variants) {
    for (const variantName in variants) {
      const value = getVariantValue(
        (props as Record<string, unknown>)[variantName],
        (config.defaultVariants as Record<string, unknown> | undefined)?.[variantName],
      );

      if (value !== undefined) {
        classes.push(variants[variantName]?.[value]);
      }
    }
  }

  if (config.compoundVariants) {
    const mergedProps = { ...config.defaultVariants, ...removeUndefinedProps(props) };

    for (const compound of config.compoundVariants) {
      if (matchesCompound(compound, mergedProps)) {
        classes.push(compound.class, compound.className);
      }
    }
  }

  return defaultCx(classes);
}

function matchesCompound<V extends VariantShape>(
  compound: NonNullable<CVAConfig<V>["compoundVariants"]>[number],
  props: Record<string, unknown>,
): boolean {
  for (const key in compound) {
    if (key === "class" || key === "className") continue;

    const expected = (compound as Record<string, unknown>)[key];
    const actual = props[key];

    if (Array.isArray(expected)) {
      if (!expected.includes(actual)) return false;
    } else if (actual !== expected) {
      return false;
    }
  }

  return true;
}

function getVariantValue(value: unknown, defaultValue: unknown): string | undefined {
  const resolved = value === undefined ? defaultValue : value;

  if (resolved === null || resolved === undefined) return undefined;
  if (typeof resolved === "boolean") return String(resolved);

  return String(resolved);
}

function removeUndefinedProps(props: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};

  for (const key in props) {
    if (props[key] !== undefined) {
      out[key] = props[key];
    }
  }

  return out;
}

function getCacheKey<V extends VariantShape>(config: CVAConfig<V>, props: CVAProps<V>): string {
  const variants = config.variants;

  if (!variants) return "";

  let key = "";

  for (const variantName in variants) {
    key +=
      variantName +
      ":" +
      getVariantValue(
        (props as Record<string, unknown>)[variantName],
        (config.defaultVariants as Record<string, unknown> | undefined)?.[variantName],
      ) +
      ";";
  }

  return key;
}

export const { cva } = defineConfig();
