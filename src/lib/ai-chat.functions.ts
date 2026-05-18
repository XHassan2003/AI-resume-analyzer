import { createServerFn } from "@tanstack/react-start";
import OpenAI from "openai";
import { z } from "zod";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const InputSchema = z.object({
  message: z.string().min(1),
  resumeText: z.string().min(50),
});

export const chatWithResume = createServerFn({
  method: "POST",
})
  .inputValidator((input: unknown) =>
    InputSchema.parse(input)
  )
  .handler(async ({ data }) => {
    try {
      const system = `
You are an expert AI resume coach.

Help users improve:
- resume bullets
- ATS optimization
- summaries
- achievements
- wording
- formatting
- keyword matching

Be concise and actionable.
`;

      const userPrompt = `
RESUME:
${data.resumeText}

USER QUESTION:
${data.message}
`;

      const response =
        await openai.chat.completions.create({
          model: "gpt-4.1-mini",

          messages: [
            {
              role: "system",
              content: system,
            },
            {
              role: "user",
              content: userPrompt,
            },
          ],
        });

      return {
        message:
          response.choices[0]?.message?.content ??
          "No response.",
      };
    } catch (error) {
      console.error(error);

      return {
        message:
          "AI chatbot failed to respond.",
      };
    }
  });