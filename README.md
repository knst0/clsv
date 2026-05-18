# knst0//clsv

Small class name utilities for TypeScript projects.

`@knst/clsv` provides:

- `cx` for joining strings, arrays, objects, numbers, and falsy values into a class string.
- `cva` for declaring variant-based class factories.
- `defineConfig` for configuring `cva` and `cx`, including final class hooks and cache defaults.
- Type helpers such as `ClassValue` and `VariantProps`.

## Installation

```shell
npm install @knst/clsv
```

```shell
yarn add @knst/clsv
pnpm add @knst/clsv
bun add @knst/clsv
```

## Usage

### cx

```ts
import { cx } from "@knst/clsv";

const className = cx("inline-flex items-center", ["rounded-md", false && "opacity-50"], {
  "bg-blue-600 text-white": true,
  "cursor-not-allowed": false,
});

// "inline-flex items-center rounded-md bg-blue-600 text-white"
```

`cx` keeps truthy strings and numbers, flattens arrays, includes object keys with truthy values, and skips falsy values.

### cva

```ts
import { cva, type VariantProps } from "@knst/clsv";

const button = cva({
  base: "inline-flex items-center justify-center rounded-md font-medium",
  variants: {
    intent: {
      primary: "bg-blue-600 text-white",
      secondary: "bg-slate-100 text-slate-900",
      danger: "bg-red-600 text-white",
    },
    size: {
      sm: "h-8 px-3 text-sm",
      md: "h-10 px-4 text-base",
      lg: "h-12 px-6 text-lg",
    },
    disabled: {
      true: "pointer-events-none opacity-50",
      false: null,
    },
  },
  compoundVariants: [
    {
      intent: ["primary", "danger"],
      size: "lg",
      class: "tracking-wide",
    },
  ],
  defaultVariants: {
    intent: "primary",
    size: "md",
    disabled: false,
  },
});

type ButtonVariants = VariantProps<typeof button>;

button();
// "inline-flex items-center justify-center rounded-md font-medium bg-blue-600 text-white h-10 px-4 text-base"

button({ intent: "danger", size: "lg", className: "w-full" });
// "inline-flex items-center justify-center rounded-md font-medium bg-red-600 text-white h-12 px-6 text-lg tracking-wide w-full"
```

Pass `null` for a variant to explicitly omit that variant and ignore its default.

### defineConfig

```ts
import { defineConfig } from "@knst/clsv";
import { twMerge } from "tailwind-merge";

export const { cva, cx } = defineConfig({
  cache: true,
  cacheSize: 500,
  hooks: {
    onComplete: twMerge,
  },
});
```

## License

Released under the [MIT License](./LICENSE).
