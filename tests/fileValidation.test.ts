import { describe, it, expect } from "vitest";
import { sanitizeFileName, validateFile } from "../src/utils/filaValidation";

describe("sanitizeFileName", () => {
  it("keeps a normal file name unchanged", () => {
    expect(sanitizeFileName("report.pdf")).toBe("report.pdf");
  });

  it("strips dangerous characters and path separators", () => {
    expect(sanitizeFileName("../../etc/passwd.txt")).toBe(
      ".._.._etc_passwd.txt",
    );
  });

  it("handles files with no extension", () => {
    expect(sanitizeFileName("README")).toBe("README");
  });

  it("replaces disallowed characters instead of removing them", () => {
    expect(sanitizeFileName("???.png")).toBe("___.png");
  });
});

describe("validateFile", () => {
  it("accepts an allowed type within size limit", () => {
    expect(() => validateFile({ size: 1024, type: "image/png" })).not.toThrow();
  });

  it("rejects a file over the size limit", () => {
    expect(() =>
      validateFile({ size: 20 * 1024 * 1024, type: "image/png" }),
    ).toThrow("too large");
  });

  it("rejects a disallowed MIME type", () => {
    expect(() =>
      validateFile({ size: 1024, type: "application/x-msdownload" }),
    ).toThrow("not allowed");
  });
});
