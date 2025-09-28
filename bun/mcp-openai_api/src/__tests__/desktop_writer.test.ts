import { describe, it, expect } from "bun:test";
import { writeFile } from "fs/promises";
import path from "path";
import os from "os";

describe("Desktop file writer", () => {
  it("writes a text file on the user's desktop", async () => {
    // Find the desktop path cross-platform
    const desktopPath = path.join(os.homedir(), "Desktop", "bun_test.txt");

    const content = "Hello from Bun test!";
    await writeFile(desktopPath, content, "utf8");

    // Check that the file exists by reading it back
    const text = await Bun.file(desktopPath).text();

    expect(text).toBe(content);

    Bun.file(desktopPath).delete().catch(() => {
      console.error("Failed to delete the test file.");
    });
  });
});
