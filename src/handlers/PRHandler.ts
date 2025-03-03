import { GitHubService } from "../services/GitHubService";

export class PRHandler {

    constructor(
        private githubService: GitHubService){

    }

    async handlePullRequest(eventPath: string) {
        const prDetails = await this.githubService.getPRMetadata(eventPath);
    }
}