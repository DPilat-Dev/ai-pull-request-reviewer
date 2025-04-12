import { PRMetadata, File, Chunk } from "./Types";


export function createBasePrompt(prDetails: PRMetadata): string {
  return `You are an AI code review assistant integrated with GitHub. Your job is to analyze pull requests for potential improvements in code quality, readability, security, and maintainability.

    Pull Request Metadata:
    - Title: ${prDetails.title}
    - Description: ${prDetails.description}
    - Repository: ${prDetails.repo}
    `;
}

export function createPRReviewPrompt(file: File, chunk: Chunk, prDetails: PRMetadata): string {
  const basePrompt = createBasePrompt(prDetails);
  const instructions = `Please review the following code changes and suggest inline comments as needed. Format your response as a JSON array:

    [
        {
            "lineNumber": <line_number>,
            "comment": "<your suggestion>"
        }
    ]

    Respond only with valid JSON.`;

  const diffText = chunk.changes.map(change => `${change.ln ?? change.ln2}: ${change.content}`).join("\n");
  const codeSection = `\n\nFile: ${file.to}\n\`\`\`diff${diffText}\`\`\``;

  return `${basePrompt} ${instructions} ${codeSection}`;
}

export function createPRCommentResponsePrompt(
  prDetails: PRMetadata,
  discussionThread: string,
  triggeringComment: string,
  commenterName: string,
  codeDiffs: File[]
): string {
  const basePrompt = createBasePrompt(prDetails);

  const codeContext = codeDiffs.flatMap(file =>
    file.chunks.map(chunk => {
      const changes = chunk.changes.map(change => `${change.ln ?? change.ln2}: ${change.content}`).join("\n");
      return `File: ${file.to}\`\`\`diff${changes}\`\`\``;
    })
  ).join("\n\n");

  return `${basePrompt}You are responding to a user comment on a pull request. Consider the ongoing discussion, the provided code context, and the question being asked. Comment from ${commenterName}:"${triggeringComment}"Discussion thread:${discussionThread}Relevant code changes:${codeContext}Compose a helpful and relevant reply to address the comment. Start your message with @${commenterName}.`;
}

export function createDiffReviewPromptFromRawDiff(diff: string, prDetails: PRMetadata): string {
    const base = createBasePrompt(prDetails);
    const instructions = `Analyze the following code diff and provide suggestions for improvement.
  Format your feedback in plain Markdown. Mention potential bugs, readability issues, or security concerns if found.`;
  
    return `${base}\n${instructions}\n\n\`\`\`diff\n${diff}\n\`\`\``;
  }
  