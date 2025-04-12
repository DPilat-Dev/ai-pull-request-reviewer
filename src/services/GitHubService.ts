import { Octokit } from "@octokit/rest";
import * as core from "@actions/core";
import { PRCommentEvent, PRMetadata } from "../utils/Types";

export class GitHubService {
  private octokit: Octokit;
  private owner: string;
  private repo: string;
  private pullNumber: number;

  constructor(private eventPayload: any, token: string) {
    if (!token) {
      throw new Error("GitHub token is required.");
    }

    this.octokit = new Octokit({ auth: token });

    const repository = eventPayload.repository;
    const issue = eventPayload.issue || eventPayload.pull_request;

    if (!repository || !issue) {
      throw new Error("Invalid event data. Repository or PR details are missing.");
    }

    this.owner = repository.owner.login;
    this.repo = repository.name;
    this.pullNumber = issue.number;
  }

  async getPRMetadata(eventPayload: any): Promise<PRMetadata>{
    try {
        // Directly use the eventPayload object
        const event = eventPayload;

        // Extract necessary information from the event payload
        const repository = event.repository;
        const issue = event.issue;

        if (!repository || !issue || !issue.pull_request) {
            throw new Error("Invalid event data. Repository or PR details are missing.");
        }

        const pullNumber = issue.number;

        // Fetch additional PR details if needed
        const prResponse = await this.octokit.pulls.get({
            owner: repository.owner.login,
            repo: repository.name,
            pull_number: pullNumber,
        });

        // Fetch PR comments
        const commentsResponse = await this.octokit.issues.listComments({
            owner: repository.owner.login,
            repo: repository.name,
            issue_number: pullNumber,
        });

        // Map comments to PRComment format
        const comments: PRCommentEvent[] = commentsResponse.data.map(comment => ({
            body: comment.body ? comment.body : "",
            user: comment.user ? { login: comment.user.login, id: comment.user.id } : undefined,
            id: comment.id,
        }));

        return {
            owner: repository.owner.login,
            repo: repository.name,
            pull_number: pullNumber,
            title: prResponse.data.title ?? "",
            description: prResponse.data.body ?? "",
            comments: comments ? comments : [], 
        }

    } catch (error) {
        console.error("Error fetching PR details:", error);
        throw error;
    }
  }

  async getDiff(): Promise<string> {
    const response = await this.octokit.pulls.get({
      owner: this.owner,
      repo: this.repo,
      pull_number: this.pullNumber,
      mediaType: { format: "diff" },
    });
    return response.data as unknown as string;
  }

  async getPRComments(): Promise<string[]> {
    const { data } = await this.octokit.issues.listComments({
      owner: this.owner,
      repo: this.repo,
      issue_number: this.pullNumber,
    });

    return data.map(comment => `${comment.user?.login}: ${comment.body}`);
  }

  async createComment(comment: string): Promise<void> {
    await this.octokit.issues.createComment({
      owner: this.owner,
      repo: this.repo,
      issue_number: this.pullNumber,
      body: comment,
    });
    core.info("✅ AI comment posted to PR.");
  }

  async createReviewComment(comments: { path: string; position: number; body: string }[]): Promise<void> {
    await this.octokit.pulls.createReview({
      owner: this.owner,
      repo: this.repo,
      pull_number: this.pullNumber,
      event: "COMMENT",
      comments,
    });
    core.info("✅ Review comments posted to PR.");
  }

  async createReviewCommentReply(comment_id: number, body: string): Promise<void> {
    await this.octokit.pulls.createReplyForReviewComment({
      owner: this.owner,
      repo: this.repo,
      pull_number: this.pullNumber,
      comment_id,
      body,
    });
    core.info(`💬 Replied to review comment ${comment_id}`);
  }

  async addReactionToComment(commentId: number, reaction: "+1" | "-1" | "laugh" | "confused" | "heart" | "hooray" | "rocket" | "eyes"): Promise<void> {
    await this.octokit.reactions.createForIssueComment({
      owner: this.owner,
      repo: this.repo,
      comment_id: commentId,
      content: reaction,
    });
    core.info(`🚀 Added reaction '${reaction}' to comment ${commentId}`);
  }

  async labelPullRequest(labels: string[]): Promise<void> {
    await this.octokit.issues.addLabels({
      owner: this.owner,
      repo: this.repo,
      issue_number: this.pullNumber,
      labels,
    });
    core.info(`🏷 Labels [${labels.join(", ")}] added to PR.`);
  }
}