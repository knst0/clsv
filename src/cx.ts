import type { ClassDictionary, ClassValue } from "./types";

export function cx(...classes: ClassValue[]): string {
  let out = "";

  for (let i = 0; i < classes.length; i++) {
    out = appendClass(out, classes[i]);
  }

  return out;
}

function appendClass(out: string, value: ClassValue): string {
  if (!value) return out;

  const type = typeof value;

  if (type === "string" || type === "number") {
    return out ? out + " " + value : String(value);
  }

  if (type !== "object") {
    return out;
  }

  if (Array.isArray(value)) {
    for (let i = 0; i < value.length; i++) {
      out = appendClass(out, value[i] as ClassValue);
    }

    return out;
  }

  const dictionary = value as ClassDictionary;

  for (const key in dictionary) {
    if (dictionary[key]) {
      out = out ? out + " " + key : key;
    }
  }

  return out;
}
