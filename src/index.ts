import * as core from "@actions/core";
import { PRHandler } from "./handlers/PRHandler";
import { GitHubService } from "./services/GitHubService";

const githubService = new GitHubService();

const prHandler = new PRHandler(githubService);

const eventData = {
    eventName: process.env.GITHUB_EVENT_NAME,
    payload: require(process.env.GITHUB_EVENT_PATH ?? '')
};

(async ()=> {
    try {
        core.info("🚀 Starting event processing...\n");
        core.info(`🔹 Event Name: ${eventData.eventName}`);
        core.info(`📦 Event Payload: ${eventData.payload}`);

        if (eventData.eventName === 'pull_request') {
            // call a PR Handler
            core.info("🔍 Processing Pull Request...");
            prHandler.handlePullRequest(eventData.payload);
        }
        else if (eventData.eventName === 'issue_comment') {
            // call a PR issue comment handler
            core.info("💬 Processing Issue Comment...");
        }
        else {
            core.warning(`⚠️ Event "${eventData.eventName}" is not handled.`);
        }

        core.info("✅ Event processing completed successfully.");
    } catch (error) {
        core.setFailed(`❌ Error durring event processing: ${error}`);
    }
})();