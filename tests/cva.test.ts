import { describe, expect, expectTypeOf, it } from "vitest";
import { cva, defineConfig } from "../src";
import type { DefineConfigOptions, VariantProps } from "../src";

describe("cva", () => {
  describe("runtime behavior", () => {
    it("returns base classes without props", () => {
      const button = cva({ base: "btn inline-flex" });

      expect(button()).toBe("btn inline-flex");
    });

    it("resolves variants and default variants", () => {
      const button = cva({
        base: "btn",
        variants: {
          intent: {
            primary: "bg-blue",
            danger: "bg-red",
          },
          size: {
            sm: "text-sm",
            md: "text-md",
          },
        },
        defaultVariants: {
          intent: "primary",
          size: "md",
        },
      });

      expect(button()).toBe("btn bg-blue text-md");
      expect(button({ intent: "danger", size: "sm" })).toBe("btn bg-red text-sm");
    });

    it("treats null as an explicit variant omission", () => {
      const badge = cva({
        base: "badge",
        variants: {
          tone: {
            neutral: "tone-neutral",
          },
        },
        defaultVariants: {
          tone: "neutral",
        },
      });

      expect(badge({ tone: null })).toBe("badge");
    });

    it("supports boolean variant keys", () => {
      const input = cva({
        base: "input",
        variants: {
          disabled: {
            true: "opacity-50",
            false: "opacity-100",
          },
        },
        defaultVariants: {
          disabled: false,
        },
      });

      expect(input()).toBe("input opacity-100");
      expect(input({ disabled: true })).toBe("input opacity-50");
    });

    it("applies matching compound variants", () => {
      const button = cva({
        base: "btn",
        variants: {
          intent: {
            primary: "primary",
            danger: "danger",
          },
          size: {
            sm: "sm",
            md: "md",
          },
        },
        defaultVariants: {
          intent: "primary",
        },
        compoundVariants: [
          {
            intent: "primary",
            size: ["sm", "md"],
            class: "primary-sized",
          },
          {
            intent: "danger",
            className: "danger-only",
          },
        ],
      });

      expect(button({ size: "sm" })).toBe("btn primary sm primary-sized");
      expect(button({ intent: "danger" })).toBe("btn danger danger-only");
    });

    it("appends class and className props after resolved classes", () => {
      const button = cva({ base: "btn" });

      expect(button({ class: "extra", className: ["more", { active: true }] })).toBe("btn extra more active");
    });

    it("runs configured onComplete hook for cva and cx", () => {
      const { cva: configuredCva, cx } = defineConfig({
        hooks: {
          onComplete: (className) => className.toUpperCase(),
        },
      });

      const button = configuredCva({ base: "btn" });

      expect(button({ class: "extra" })).toBe("BTN EXTRA");
      expect(cx("one", "two")).toBe("ONE TWO");
    });

    it("uses defineConfig cache defaults for cva factories", () => {
      const { cva: configuredCva } = defineConfig({
        cache: false,
        cacheSize: 1,
      });

      const button = configuredCva({
        base: "btn",
        variants: {
          intent: {
            primary: "primary",
          },
        },
      });

      expect(button({ intent: "primary" })).toBe("btn primary");
    });
  });

  describe("types", () => {
    it("infers string and boolean variant props", () => {
      const button = cva({
        base: "btn",
        variants: {
          intent: {
            primary: "primary",
            danger: "danger",
          },
          disabled: {
            true: "disabled",
            false: null,
          },
        },
        defaultVariants: {
          intent: "primary",
          disabled: false,
        },
      });

      expectTypeOf<VariantProps<typeof button>>().toEqualTypeOf<{
        intent?: "primary" | "danger" | null;
        disabled?: boolean | null;
      }>();

      expect(button({ intent: "danger", disabled: true, className: "extra" })).toBe("btn danger disabled extra");
    });

    it("accepts cache options on defineConfig options", () => {
      expectTypeOf<DefineConfigOptions>().toMatchTypeOf<{
        cache?: boolean;
        cacheSize?: number;
      }>();
    });
  });
});
