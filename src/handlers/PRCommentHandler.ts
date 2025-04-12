import { GitHubService } from "../services/GitHubService";
import { AIService } from "../services/AIService";
import { createPRCommentResponsePrompt } from "../utils/PromptBuilder";
import { PRMetadata, PRCommentEvent, File } from "../utils/Types";
import parseDiff from "parse-diff";

export class PRCommentHandler {
  constructor(
    private githubService: GitHubService,
    private aiService: AIService
  ) {}

  async handleComment(eventPayload: any): Promise<void> {
    const comment: PRCommentEvent = eventPayload.comment;

    if (!comment?.body?.toLowerCase().includes("ai")) {
      console.log("AI not mentioned — skipping comment.");
      return;
    }

    if (!comment.user) {
      console.warn("Comment user not found — skipping.");
      return;
    }

    // Fetch PR and repo context
    const prDetails: PRMetadata = await this.githubService.getPRMetadata(eventPayload);

    // Acknowledge with 👀 reaction
    await this.githubService.addReactionToComment(comment.id, "eyes");

    // Fetch the current diff and comments
    const rawDiff = await this.githubService.getDiff();
    const discussion = await this.githubService.getPRComments();

    // Parse diff into structured file/chunk format
    const files: File[] = parseDiff(rawDiff).map((file) => ({
      to: file.to ?? "unknown-file",
      chunks: file.chunks ?? [],
    }));

    // Build a prompt to reply using the thread + diff
    const prompt = createPRCommentResponsePrompt(
      prDetails,
      discussion.join("\n\n"),
      comment.body,
      comment.user.login,
      files
    );

    const aiReply = await this.aiService.reviewPR(prompt, prDetails);

    const response = aiReply || `Sorry, I couldn't generate a response for that, @${comment.user.login} 😅`;

    // Reply to the original comment with AI feedback
    await this.githubService.createReviewCommentReply(comment.id, response);

    // Add 🚀 to signal reply completed
    await this.githubService.addReactionToComment(comment.id, "rocket");
  }
}
