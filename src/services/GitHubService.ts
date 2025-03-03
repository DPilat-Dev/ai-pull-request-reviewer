import { Octokit } from "@octokit/rest";
import * as core from "@actions/core";

export class GitHubService {
    private octokit: Octokit;

    constructor() {
        // use actions/core library to get the github token
        const token = core.getInput("GITHUB_TOKEN");

        if (!token) {
            throw new Error("GitHub token is required.");
        }

        this.octokit = new Octokit({ auth: token});

    }

    async getPRMetadata(eventPayload : any) {
        const event  = eventPayload;

        const repository = event.repository;
        const issue = event.issue;
        const pullNumber = event.number;

        if (!repository || !issue || !issue.pull_request) {
            core.setFailed("Invalid event data. Repository or PR details are missing.");
        }

        // Fetch the Pull Request Details (https://octokit.github.io/rest.js/v21/#pulls-get)
        const prDetails = await this.octokit.pulls.get({
            owner: repository.owner.login,
            repo: repository.name,
            pull_number: pullNumber,
        });

        // Create a PRDataType
        // Return Data
    }
}