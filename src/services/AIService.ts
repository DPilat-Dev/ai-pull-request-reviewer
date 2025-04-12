import OpenAI from "openai";
import * as core from "@actions/core";
import {createBasePrompt, createPRCommentResponsePrompt, createPRReviewPrompt, createDiffReviewPromptFromRawDiff} from "../utils/PromptBuilder"
import { PRMetadata } from "../utils/Types";

export class AIService {
  private openai: OpenAI;

  constructor() {
    const apiKey = core.getInput("openai_api_key");

    if (!apiKey) {
      throw new Error("OpenAI API key not found.");
    }

    this.openai = new OpenAI({ apiKey });
  }

  async reviewPR(diff: string, prMetadata: PRMetadata): Promise<string> {
    const prompt = createDiffReviewPromptFromRawDiff(diff, prMetadata);

    const response = await this.openai.chat.completions.create({
      model: "gpt-4-turbo",
      messages: [
        {
          role: "system",
          content: "You are a helpful code review assistant.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      max_tokens: 1000,
      temperature: 0.5,
    });

    return response.choices[0]?.message?.content ?? "No feedback from AI.";
  }
}