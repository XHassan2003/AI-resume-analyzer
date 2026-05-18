import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const InputSchema = z.object({
  resumeText: z.string().min(50).max(40000),
  jobDescription: z.string().max(20000).optional().default(""),
});

export type AiFeedback = {
  summary: string;
  strengths: string[];
  improvements: string[];
  jdAlignment?: string;
};

/**
 * Detect whether uploaded text looks like a real resume/CV
 */
function isResumeText(text: string): boolean {
  const normalized = text.toLowerCase();

  const resumeKeywords = [
    "experience",
    "education",
    "skills",
    "projects",
    "work history",
    "employment",
    "summary",
    "objective",
    "certifications",
    "internship",
    "linkedin",
    "technical skills",
    "achievements",
    "developer",
    "engineer",
    "manager",
    "resume",
    "cv",
  ];

  let matches = 0;

  for (const keyword of resumeKeywords) {
    if (normalized.includes(keyword)) {
      matches++;
    }
  }

  // Reject very short documents
  if (normalized.length < 200) {
    return false;
  }

  // Require at least 3 resume-related keywords
  return matches >= 3;
}

export const generateAiFeedback = createServerFn({
  method: "POST",
})
  .inputValidator((input: unknown) => InputSchema.parse(input))
  .handler(
    async ({
      data,
    }): Promise<{
      feedback: AiFeedback | null;
      error: string | null;
    }> => {
      try {
        /**
         * Validate uploaded document
         */
        if (!isResumeText(data.resumeText)) {
          return {
            feedback: null,
            error: "Please upload a valid resume or CV document.",
          };
        }

        /**
         * Check OpenAI API key
         */
        if (!process.env.OPENAI_API_KEY) {
          return {
            feedback: null,
            error: "OpenAI API key is missing.",
          };
        }

        const system =
          "You are an expert technical recruiter and resume coach. " +
          "Analyze the user's resume and optional job description. " +
          "Provide concise, ATS-focused, actionable feedback. " +
          "Be specific and reference actual resume details.";

        const userPrompt = [
          `RESUME:\n${data.resumeText.slice(0, 16000)}`,

          data.jobDescription
            ? `\n\nJOB DESCRIPTION:\n${data.jobDescription.slice(0, 6000)}`
            : "",

          "\n\nReturn ONLY valid JSON in this exact format:",

          `{
  "summary": "2-3 sentence overall assessment",
  "strengths": ["3-6 specific strengths"],
  "improvements": ["3-6 actionable improvements"],
  "jdAlignment": "1-2 sentences about job fit"
}`,
        ].join("");

        /**
         * OpenAI Request
         */
        const response = await openai.chat.completions.create({
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

          response_format: {
            type: "json_object",
          },

          temperature: 0.7,
        });

        const content =
          response.choices[0]?.message?.content;

        if (!content) {
          return {
            feedback: null,
            error: "No AI response received.",
          };
        }

        /**
         * Parse AI JSON
         */
        const parsed = JSON.parse(content) as AiFeedback;

        return {
          feedback: {
            summary: String(parsed.summary ?? ""),

            strengths: Array.isArray(parsed.strengths)
              ? parsed.strengths.map(String)
              : [],

            improvements: Array.isArray(parsed.improvements)
              ? parsed.improvements.map(String)
              : [],

            jdAlignment: parsed.jdAlignment
              ? String(parsed.jdAlignment)
              : undefined,
          },

          error: null,
        };
      } catch (error) {
        console.error("OpenAI Error:", error);

        return {
          feedback: null,
          error: "Failed to generate AI feedback.",
        };
      }
    }
  );