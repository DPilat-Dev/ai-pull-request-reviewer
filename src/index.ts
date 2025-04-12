import * as core from "@actions/core";
import { PRHandler } from "./handlers/PRHandler";
import { GitHubService } from "./services/GitHubService";
import { AIService } from "./services/AIService";
import * as fs from "fs";

(async () => {
  try {
    core.info("🚀 Starting AI PR Review bot...");

    const eventName = process.env.GITHUB_EVENT_NAME;
    const eventPath = process.env.GITHUB_EVENT_PATH;

    if (!eventPath) throw new Error("GITHUB_EVENT_PATH is not defined.");

    const eventPayload = JSON.parse(fs.readFileSync(eventPath, "utf8"));
    core.info(`🔹 Event Name: ${eventName}`);

    if (eventName !== "pull_request") {
      core.warning(`⚠️ Unsupported event type: ${eventName}`);
      return;
    }

    const token = core.getInput("github_token");
    const githubService = new GitHubService(eventPayload, token);
    const aiService = new AIService();
    const prHandler = new PRHandler(githubService, aiService);

    await prHandler.handlePullRequest(eventPayload);

    core.info("✅ PR handling completed.");
  } catch (error) {
    core.setFailed(`❌ AI PR Review failed: ${error}`);
  }
})();
