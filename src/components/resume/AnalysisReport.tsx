import { motion } from "framer-motion";
import { CheckCircle2, AlertCircle, Mail, Phone, Link as LinkIcon, Sparkles } from "lucide-react";
import type { AnalysisResult } from "@/lib/resume-analyzer";
import { ScoreRing } from "./ScoreRing";
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
} from "recharts";

export function AnalysisReport({ result, hasJD }: { result: AnalysisResult; hasJD: boolean }) {
  const { parsed, strengths, improvements, categories, matched, missing, matchScore } = result;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      {/* Score header */}
      <div
        className="flex flex-col items-center gap-8 rounded-3xl border border-border p-8 md:flex-row md:p-10"
        style={{ background: "var(--gradient-card)", boxShadow: "var(--shadow-card)" }}
      >
        <ScoreRing score={result.score} />
        <div className="flex-1 space-y-4 text-center md:text-left">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            <Sparkles className="h-3.5 w-3.5" />
            AI Analysis Complete
          </div>
          <h2 className="text-3xl font-bold text-foreground">
            {parsed.name ?? "Your Resume"}
          </h2>
          <div className="flex flex-wrap justify-center gap-3 text-sm text-muted-foreground md:justify-start">
            {parsed.email && (
              <span className="inline-flex items-center gap-1.5"><Mail className="h-4 w-4" />{parsed.email}</span>
            )}
            {parsed.phone && (
              <span className="inline-flex items-center gap-1.5"><Phone className="h-4 w-4" />{parsed.phone}</span>
            )}
            {parsed.links.length > 0 && (
              <span className="inline-flex items-center gap-1.5"><LinkIcon className="h-4 w-4" />{parsed.links.length} link(s)</span>
            )}
          </div>
        </div>
      </div>

      {/* Category bars */}
      <div className="rounded-3xl border border-border bg-card p-6 md:p-8">
        <h3 className="mb-6 text-lg font-semibold text-foreground">Breakdown by Category</h3>
        <div className="grid gap-8 md:grid-cols-[1fr_1.1fr] md:items-center">
          <div className="h-64 w-full md:h-72">
            <div className="h-75 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={categories} outerRadius="78%">
                <PolarGrid stroke="var(--border)" />
                <PolarAngleAxis
                  dataKey="label"
                  tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
                />
                <PolarRadiusAxis
                  angle={90}
                  domain={[0, 100]}
                  tick={false}
                  axisLine={false}
                />
                <Radar
                  dataKey="score"
                  stroke="var(--primary)"
                  fill="var(--primary)"
                  fillOpacity={0.35}
                  strokeWidth={2}
                />
              </RadarChart>
            </ResponsiveContainer>
            </div>
          </div>
          <div className="grid gap-5">
          {categories.map((cat, i) => (
            <div key={cat.label}>
              <div className="mb-2 flex justify-between text-sm">
                <span className="font-medium text-foreground">{cat.label}</span>
                <span className="text-muted-foreground">{cat.score}/100</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-muted">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${cat.score}%` }}
                  transition={{ duration: 0.8, delay: i * 0.08 }}
                  className="h-full rounded-full"
                  style={{
                    background:
                      cat.score >= 70
                        ? "var(--gradient-hero)"
                        : "var(--warning)",
                  }}
                />
              </div>
            </div>
          ))}
          </div>
        </div>
      </div>

      {/* Strengths & improvements */}
      <div className="grid gap-6 md:grid-cols-2">
        <FeedbackCard
          icon={<CheckCircle2 className="h-5 w-5" />}
          title="Strengths"
          items={strengths}
          tone="primary"
        />
        <FeedbackCard
          icon={<AlertCircle className="h-5 w-5" />}
          title="Improvements"
          items={improvements}
          tone="warning"
        />
      </div>

      {/* Keyword matching */}
      {hasJD && (
        <div className="rounded-3xl border border-border bg-card p-6 md:p-8">
          <div className="mb-6 flex items-baseline justify-between">
            <h3 className="text-lg font-semibold text-foreground">Job Description Match</h3>
            <span className="text-2xl font-bold text-primary">{matchScore}%</span>
          </div>
          <div className="space-y-5">
            <KeywordList label="Matched keywords" words={matched} tone="primary" />
            <KeywordList label="Missing keywords" words={missing} tone="muted" />
          </div>
        </div>
      )}
    </motion.div>
  );
}

function FeedbackCard({
  icon, title, items, tone,
}: { icon: React.ReactNode; title: string; items: string[]; tone: "primary" | "warning" }) {
  const color = tone === "primary" ? "text-primary" : "text-warning";
  return (
    <div className="rounded-3xl border border-border bg-card p-6 md:p-8">
      <h3 className={`mb-4 flex items-center gap-2 text-lg font-semibold ${color}`}>
        {icon} {title}
      </h3>
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nothing to report here.</p>
      ) : (
        <ul className="space-y-3">
          {items.map((it, i) => (
            <motion.li
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="flex gap-3 text-sm text-foreground"
            >
              <span className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${tone === "primary" ? "bg-primary" : "bg-warning"}`} />
              {it}
            </motion.li>
          ))}
        </ul>
      )}
    </div>
  );
}

function KeywordList({ label, words, tone }: { label: string; words: string[]; tone: "primary" | "muted" }) {
  return (
    <div>
      <p className="mb-2 text-sm font-medium text-muted-foreground">{label} ({words.length})</p>
      {words.length === 0 ? (
        <p className="text-sm text-muted-foreground">—</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {words.map((w) => (
            <span
              key={w}
              className={
                tone === "primary"
                  ? "rounded-full bg-primary/15 px-3 py-1 text-xs font-medium text-primary"
                  : "rounded-full border border-border bg-muted px-3 py-1 text-xs text-muted-foreground"
              }
            >
              {w}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}