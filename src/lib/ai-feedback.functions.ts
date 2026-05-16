import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

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

export const generateAiFeedback = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => InputSchema.parse(input))
  .handler(async ({ data }): Promise<{ feedback: AiFeedback | null; error: string | null }> => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) return { feedback: null, error: "AI is not configured on the server." };

    const system =
      "You are an expert technical recruiter and resume coach. Analyze the user's resume " +
      "and (optionally) the target job description. Return concise, concrete, actionable feedback. " +
      "Be specific — reference details from the resume. Avoid generic advice.";

    const userPrompt = [
      `RESUME:\n${data.resumeText.slice(0, 16000)}`,
      data.jobDescription
        ? `\n\nJOB DESCRIPTION:\n${data.jobDescription.slice(0, 6000)}`
        : "",
      "\n\nReturn JSON only matching this shape:",
      `{
  "summary": "2-3 sentence overall assessment",
  "strengths": ["3-6 specific strengths"],
  "improvements": ["3-6 specific, actionable improvements"],
  "jdAlignment": "1-2 sentences on fit vs the job (omit if no JD)"
}`,
    ].join("");

    try {
      const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: system },
            { role: "user", content: userPrompt },
          ],
          response_format: { type: "json_object" },
        }),
      });

      if (!res.ok) {
        if (res.status === 429) return { feedback: null, error: "AI is rate-limited. Try again in a moment." };
        if (res.status === 402) return { feedback: null, error: "AI credits exhausted. Add credits in workspace settings." };
        const body = await res.text();
        console.error("AI gateway error", res.status, body);
        return { feedback: null, error: `AI request failed (${res.status}).` };
      }

      const json = (await res.json()) as { choices?: { message?: { content?: string } }[] };
      const content = json.choices?.[0]?.message?.content ?? "";
      const parsed = JSON.parse(content) as AiFeedback;
      return {
        feedback: {
          summary: String(parsed.summary ?? ""),
          strengths: Array.isArray(parsed.strengths) ? parsed.strengths.map(String) : [],
          improvements: Array.isArray(parsed.improvements) ? parsed.improvements.map(String) : [],
          jdAlignment: parsed.jdAlignment ? String(parsed.jdAlignment) : undefined,
        },
        error: null,
      };
    } catch (e) {
      console.error("AI feedback failure", e);
      return { feedback: null, error: "AI feedback could not be generated." };
    }
  });