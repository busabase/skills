import { spawnSync } from "node:child_process";

// JSON.parse validates syntax but discards overwritten object members. Validate
// the original text with Python's standard JSON parser before releasing any raw
// bytes. This is a publishing-tool dependency, never a plugin runtime dependency.
const rejectDuplicateKeys = `
import json
import sys

class DuplicateKey(ValueError):
    pass

def unique_object(pairs):
    result = {}
    for key, value in pairs:
        if key in result:
            raise DuplicateKey()
        result[key] = value
    return result

try:
    json.loads(sys.stdin.buffer.read().decode("utf-8"),
               object_pairs_hook=unique_object, parse_int=str, parse_float=str)
except DuplicateKey:
    sys.stderr.write("duplicate JSON object key")
    sys.exit(2)
except Exception:
    sys.stderr.write("strict JSON validation failed")
    sys.exit(3)
`;

/** Parse standard JSON while rejecting duplicate keys, including escaped names. */
export const parseStrictJson = (source, label) => {
  let text;
  let parsed;
  try {
    text = typeof source === "string"
      ? source
      : new TextDecoder("utf-8", { fatal: true, ignoreBOM: true }).decode(source);
    parsed = JSON.parse(text);
  } catch {
    // Native parser errors may quote the input. Never echo credentials or raw
    // values from a broken release file in a log or CI annotation.
    throw new Error(`${label} must contain valid UTF-8 JSON`);
  }
  // Isolated mode excludes the checkout and PYTHONPATH from Python imports.
  const checked = spawnSync("python3", ["-I", "-c", rejectDuplicateKeys], {
    input: text,
    encoding: "utf8",
    timeout: 10_000,
    maxBuffer: 64 * 1024,
  });
  if (checked.error) {
    throw new Error(`${label}: Python 3 is required for strict JSON release validation`);
  }
  if (checked.status !== 0) {
    const reason = checked.status === 2 ? "duplicate JSON object key" : "strict JSON validation failed";
    throw new Error(`${label}: ${reason}`);
  }
  return parsed;
};
