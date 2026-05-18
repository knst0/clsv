import { describe, expect, expectTypeOf, it } from "vitest";
import { cx } from "../src";
import type { ClassArray, ClassDictionary, ClassValue } from "../src";

const expectCx = (input: ClassValue[], output: string) => {
  expect(cx(...input)).toBe(output);
};

describe("cx", () => {
  describe("runtime behavior", () => {
    it.each<[string, ClassValue[], string]>([
      ["no args", [], ""],

      // strings
      ["single string", ["foo"], "foo"],
      ["multiple strings", ["foo", "bar", "baz"], "foo bar baz"],
      ["preserves internal whitespace", ["foo bar", "baz"], "foo bar baz"],
      ["preserves repeated internal whitespace", ["foo  bar"], "foo  bar"],
      ["skips empty strings", ["", "foo", ""], "foo"],

      // numbers
      ["stringifies numbers", [1, 42], "1 42"],
      ["skips top-level 0", [0], ""],
      ["skips 0 in mixed args", ["foo", 0, "bar"], "foo bar"],
      ["handles negative numbers", [-1], "-1"],
      ["handles floats", [1.5], "1.5"],
      ["skips NaN", [NaN], ""],
      ["includes Infinity", [Infinity], "Infinity"],
      ["mixes strings and numbers", ["foo", 1, "bar", 2], "foo 1 bar 2"],

      // falsy / boolean primitives
      ["skips null", [null], ""],
      ["skips undefined", [undefined], ""],
      ["skips false", [false], ""],
      ["skips top-level true", [true], ""],
      ["strips falsy values from mixed args", ["foo", null, "bar", undefined, "baz", false, 0], "foo bar baz"],

      // dictionaries
      ["includes truthy dictionary keys", [{ foo: true, bar: true }], "foo bar"],
      [
        "omits falsy dictionary keys",
        [
          {
            foo: true,
            bar: false,
            baz: 0,
            qux: null,
            quux: undefined,
            corge: "",
          },
        ],
        "foo",
      ],
      ["includes keys with truthy non-boolean values", [{ foo: 1, bar: "yes", baz: {} }], "foo bar baz"],
      ["includes only dictionary keys, not values", [{ "btn-primary": true }], "btn-primary"],
      ["preserves special dictionary keys verbatim", [{ "foo bar": true, "a:b": true }], "foo bar a:b"],
      ["handles empty dictionary", [{}], ""],
      ["merges dictionaries", [{ foo: true }, { bar: true }, { baz: false }], "foo bar"],

      // arrays
      ["flattens flat arrays", [["foo", "bar"]], "foo bar"],
      ["flattens deeply nested arrays", [["foo", ["bar", ["baz", ["qux"]]]]], "foo bar baz qux"],
      ["skips falsy array entries", [["foo", null, "bar", false, "baz", 0, undefined]], "foo bar baz"],
      ["handles empty arrays", [[]], ""],
      ["handles arrays with only falsy values", [[null, undefined, false, 0, ""]], ""],
      ["supports dictionaries inside arrays", [["foo", { bar: true, baz: false }]], "foo bar"],
      ["supports arrays and dictionaries nested together", [[{ foo: true }, ["bar", { baz: true }]]], "foo bar baz"],

      // real-world mixed usage
      [
        "handles conditional className pattern",
        [
          "btn",
          {
            "btn-active": true,
            "btn-disabled": false,
          },
        ],
        "btn btn-active",
      ],
      [
        "handles Tailwind-style conditional classes",
        [
          "rounded",
          // oxlint-disable-next-line no-constant-binary-expression
          true && "bg-blue-500",
          // oxlint-disable-next-line no-constant-binary-expression
          true && "px-6 py-3",
          {
            "opacity-50": false,
            "cursor-pointer": true,
          },
        ],
        "rounded bg-blue-500 px-6 py-3 cursor-pointer",
      ],
      [
        "handles deeply mixed nesting",
        ["a", ["b", { c: true, d: false }, ["e", null, ["f"]]], { g: 1, h: 0 }, undefined, "i"],
        "a b c e f g i",
      ],

      // quirks / guarantees
      ["ignores top-level booleans", [true, false, "foo"], "foo"],
      ["ignores top-level null and undefined", [null, undefined, "foo"], "foo"],
      ["ignores top-level bigints", [1n as ClassValue], ""],
      ["ignores bigints in mixed args", ["foo", 1n as ClassValue, "bar"], "foo bar"],
      ["does not deduplicate repeated classes", ["foo", "foo", { foo: true }], "foo foo foo"],
      ["preserves insertion order across shapes", [{ a: true }, "b", ["c"], { d: true }], "a b c d"],
      ["preserves object key insertion order", [{ z: true, a: true, m: true }], "z a m"],
    ])("%s", (_name, input, output) => {
      expectCx(input, output);
    });
  });

  describe("object enumeration quirks", () => {
    it("includes inherited enumerable keys because for..in walks the prototype chain", () => {
      const proto = { inherited: true };
      const obj = Object.create(proto) as ClassDictionary;

      obj.own = true;

      expect(cx(obj)).toBe("own inherited");
    });
  });

  describe("whitespace", () => {
    it("does not insert leading or trailing whitespace", () => {
      const result = cx(null, "foo", undefined, "bar", false);

      expect(result).toBe("foo bar");
      expect(result.startsWith(" ")).toBe(false);
      expect(result.endsWith(" ")).toBe(false);
    });
  });

  describe("immutability", () => {
    it("does not mutate arrays", () => {
      const input: ClassArray = ["foo", { bar: true }, ["baz"]];
      const snapshot = structuredClone(input);

      cx(input);

      expect(input).toEqual(snapshot);
    });

    it("does not mutate objects", () => {
      const input: ClassDictionary = { foo: true, bar: false };
      const snapshot = { ...input };

      cx(input);

      expect(input).toEqual(snapshot);
    });
  });

  describe("types", () => {
    it("accepts all ClassValue shapes", () => {
      expectTypeOf(cx).toBeFunction();
      expectTypeOf(cx).parameters.toEqualTypeOf<ClassValue[]>();
      expectTypeOf(cx).returns.toBeString();

      cx("a");
      cx(1);
      cx(1n);
      cx(null);
      cx(undefined);
      cx(true);
      cx(false);
      cx({ foo: true });
      cx(["a", { b: true }]);
      cx("a", 1, null, undefined, false, { foo: 1 }, ["nested", ["deep"]]);
    });

    it("exports ClassValue, ClassDictionary, and ClassArray as usable types", () => {
      const value: ClassValue = "foo";
      const dictionary: ClassDictionary = { foo: true };
      const array: ClassArray = ["foo", { bar: true }];

      expect(cx(value, dictionary, array)).toBe("foo foo foo bar");
    });
  });
});
