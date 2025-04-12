import { GitHubService } from "../services/GitHubService";
import { AIService } from "../services/AIService";
import * as core from "@actions/core";
import { PRMetadata } from "../utils/Types";
import { excludeMatchingFiles } from "../utils/Utils";
import parseDiff from "parse-diff";

export class PRHandler {
  constructor(
    private githubService: GitHubService,
    private aiService: AIService
  ) {}

  async handlePullRequest(eventPayload: any): Promise<void> {
    try {
      const metadata = await this.githubService.getPRMetadata(eventPayload);
      core.info(`📌 Reviewing PR #${metadata.pull_number}: ${metadata.title}`);
  
      const diff = await this.githubService.getDiff();
  
      const prMetadata: PRMetadata = {
        owner: metadata.owner,
        repo: metadata.repo,
        pull_number: metadata.pull_number,
        title: metadata.title,
        description: metadata.description ?? "",
      };
  
      // ⬇️ Parse the unified diff
      const parsedFiles = parseDiff(diff).map(file => ({
        to: file.to ?? "unknown",
        chunks: file.chunks ?? [],
      }));
  
      // ⬇️ Filter out ignored files
      const excluded = "*.test.ts,*.md"; // or get from input/config
      const filteredFiles = excludeMatchingFiles(parsedFiles, excluded);
  
      if (filteredFiles.length === 0) {
        core.info("🚫 No files to review after applying exclude filters.");
        return;
      }
  
      // ⬇️ Reconstruct the filtered diff (optional, depends on your prompt flow)
      const filteredDiff = filteredFiles.flatMap(file =>
        file.chunks.flatMap(chunk =>
          chunk.changes.map(change => change.content)
        )
      ).join("\n");
  
      const feedback = await this.aiService.reviewPR(filteredDiff, prMetadata);
      await this.githubService.createComment(feedback);
  
      core.info("✅ AI review comment posted.");
    } catch (error) {
      core.setFailed(`❌ Failed to handle pull request: ${error}`);
    }
  }  
}
