import { File } from "./Types";
import { minimatch } from "minimatch";

/**
 * Exclude files from a list of diffed files based on glob-style patterns.
 *
 * @param files - Array of parsed diff files.
 * @param patterns - Comma-separated list of glob patterns to exclude.
 * @returns Filtered list of files that do not match any exclusion pattern.
 */
export function excludeMatchingFiles(files: File[], patterns: string): File[] {
  const patternList = patterns.split(",").map((p) => p.trim()).filter(Boolean);

  return files.filter(file => {
    return !patternList.some(pattern => minimatch(file.to ?? "", pattern));
  });
}
