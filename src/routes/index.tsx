import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { motion } from "framer-motion";
import { Zap, Target, FileSearch, Loader2 } from "lucide-react";

import { UploadZone } from "@/components/resume/UploadZone";
import { AnalysisReport } from "@/components/resume/AnalysisReport";

import { extractText, isResumeText } from "@/lib/resume-parser";

import { analyze, type AnalysisResult } from "@/lib/resume-analyzer";

import {
  generateAiFeedback,
  type AiFeedback,
} from "@/lib/ai-feedback.functions";
import { ResumeChat } from "@/components/resume/ResumeChat";

export const Route = createFileRoute("/")({
  component: Index,

  head: () => ({
    meta: [
      {
        title: "Resumind — AI-Powered Resume Analyzer",
      },
      {
        name: "description",
        content: "Upload your resume and get an instant AI-powered analysis.",
      },
    ],
  }),
});

function Index() {
  const [file, setFile] = useState<File | null>(null);

  const [jd, setJd] = useState("");

  const [loading, setLoading] = useState(false);

  const [error, setError] = useState<string | null>(null);

  const [result, setResult] = useState<AnalysisResult | null>(null);

  const [ai, setAi] = useState<AiFeedback | null>(null);

  const [aiError, setAiError] = useState<string | null>(null);

  const runAi = useServerFn(generateAiFeedback);

  async function runAnalysis() {
    if (!file) {
      setError("Please upload a resume.");
      return;
    }

    setLoading(true);

    setError(null);
    setResult(null);
    setAi(null);
    setAiError(null);

    try {
      /**
       * Extract resume text
       */
      const text = await extractText(file);

      /**
       * Ensure enough text exists
       */
      if (text.trim().length < 50) {
        throw new Error("Couldn't extract enough text from the file.");
      }

      /**
       * Validate resume/CV
       */
      if (!isResumeText(text)) {
        throw new Error("Please upload a valid resume or CV document.");
      }

      /**
       * Run local analysis
       */
      const baseResult = analyze(text, jd);

      setResult(baseResult);

      /**
       * Run OpenAI analysis
       */
      const { feedback, error: aiErr } = await runAi({
        data: {
          resumeText: text,
          jobDescription: jd,
        },
      });

      /**
       * AI success
       */
      if (feedback) {
        setAi(feedback);

        setResult({
          ...baseResult,

          strengths: feedback.strengths.length
            ? feedback.strengths
            : baseResult.strengths,

          improvements: feedback.improvements.length
            ? feedback.improvements
            : baseResult.improvements,
        });
      } else if (aiErr) {
        /**
         * AI failed
         */
        setAiError(aiErr);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-background">
      {/* Background glow */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div
          className="absolute -top-40 left-1/2 h-125 w-200 -translate-x-1/2 rounded-full opacity-20 blur-3xl"
          style={{
            background: "var(--gradient-hero)",
          }}
        />
      </div>

      <div className="relative mx-auto max-w-5xl px-6 py-12 md:py-20">
        {/* Hero */}
        <motion.header
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-12 text-center"
        >
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 text-xs font-medium text-muted-foreground">
            AI-Powered
          </div>

          <h1 className="mx-auto max-w-3xl text-5xl font-bold tracking-tight text-foreground md:text-6xl">
            Get your resume{" "}
            <span
              className="bg-clip-text text-transparent"
              style={{
                backgroundImage: "var(--gradient-hero)",
              }}
            >
              interview-ready
            </span>
          </h1>

          <p className="mx-auto mt-5 max-w-xl text-lg text-muted-foreground">
            Upload your resume and optionally a job description to receive
            AI-powered insights.
          </p>
        </motion.header>

        {/* Feature row */}
        <div className="mb-10 grid gap-4 sm:grid-cols-3">
          {[
            {
              icon: FileSearch,
              label: "Smart Parsing",
              desc: "PDF & DOCX",
            },

            {
              icon: Zap,
              label: "Instant Score",
              desc: "AI-powered",
            },

            {
              icon: Target,
              label: "JD Matching",
              desc: "Keyword gaps",
            },
          ].map((f) => (
            <div
              key={f.label}
              className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4"
            >
              <div className="rounded-xl bg-primary/15 p-2.5 text-primary">
                <f.icon className="h-5 w-5" />
              </div>

              <div>
                <p className="font-medium text-foreground">{f.label}</p>

                <p className="text-xs text-muted-foreground">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Upload */}
        <div className="space-y-6">
          <UploadZone file={file} onFile={setFile} error={error ?? undefined} />

          {/* Job Description */}
          <div>
            <label className="mb-2 block text-sm font-medium text-foreground">
              Job description{" "}
              <span className="font-normal text-muted-foreground">
                (optional)
              </span>
            </label>

            <textarea
              value={jd}
              onChange={(e) => setJd(e.target.value)}
              placeholder="Paste the job description..."
              rows={5}
              className="w-full resize-none rounded-2xl border border-border bg-card p-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          {/* Error */}
          {error && (
            <div className="rounded-xl border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
              {error}
            </div>
          )}

          {/* Analyze Button */}
          <button
            onClick={runAnalysis}
            disabled={!file || loading}
            className="group relative w-full overflow-hidden rounded-2xl px-6 py-4 text-base font-semibold text-primary-foreground transition-all hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
            style={{
              background: "var(--gradient-hero)",
              boxShadow: "var(--shadow-glow)",
            }}
          >
            <span className="flex items-center justify-center gap-2">
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Analyzing your resume…
                </>
              ) : (
                <>
                  Analyze Resume
                </>
              )}
            </span>
          </button>
        </div>

        {/* Results */}
        {result && (
          <div className="mt-14">
            {/* AI Summary */}
            {ai?.summary && (
              <div
                className="mb-6 rounded-3xl border border-border p-6 md:p-8"
                style={{
                  background: "var(--gradient-card)",
                }}
              >
                <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                  AI Summary
                </div>

                <p className="text-foreground">{ai.summary}</p>

                {ai.jdAlignment && (
                  <p className="mt-3 text-sm text-muted-foreground">
                    <span className="font-medium text-foreground">JD fit:</span>{" "}
                    {ai.jdAlignment}
                  </p>
                )}
              </div>
            )}

            {/* AI Error */}
            {aiError && (
              <div className="mb-6 rounded-xl border border-yellow-500/40 bg-yellow-500/10 p-4 text-sm text-yellow-600">
                {aiError}
              </div>
            )}

            <AnalysisReport result={result} hasJD={jd.trim().length > 0} />
          </div>
        )}
        {result && (
          <div className="mt-10">
            <ResumeChat resumeText={result.rawText} />
          </div>
        )}

        <footer className="mt-20 text-center text-xs text-muted-foreground">
          Your resume is processed securely and analyzed with AI assistance.
        </footer>
      </div>
    </main>
  );
}
