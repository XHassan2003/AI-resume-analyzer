export interface ParsedResume {
  name?: string;
  email?: string;
  phone?: string;
  links: string[];
  sections: Record<string, boolean>;
  wordCount: number;
  raw: string;
}

export interface AnalysisResult {
  score: number;
  parsed: ParsedResume;
  strengths: string[];
  improvements: string[];
  matched: string[];
  missing: string[];
  matchScore: number;
  rawText: string;
  categories: { label: string; score: number }[];
}

const SECTION_KEYWORDS = {
  experience: /\b(experience|employment|work history)\b/i,
  education: /\b(education|academic|university|bachelor|master|phd)\b/i,
  skills: /\b(skills|technologies|tech stack|competencies)\b/i,
  projects: /\b(projects|portfolio)\b/i,
  summary: /\b(summary|objective|profile|about)\b/i,
  contact: /\b(contact|email|phone)\b/i,
};

const ACTION_VERBS = [
  "built", "led", "designed", "developed", "implemented", "launched",
  "improved", "increased", "reduced", "managed", "created", "architected",
  "optimized", "delivered", "shipped", "scaled", "automated", "owned",
];

export function parseResume(text: string): ParsedResume {
  const clean = text.replace(/\s+/g, " ").trim();
  const email = clean.match(/[\w.+-]+@[\w-]+\.[\w.-]+/)?.[0];
  const phone = clean.match(/(\+?\d[\d\s().-]{8,}\d)/)?.[0];
  const links = Array.from(clean.matchAll(/https?:\/\/[^\s)]+/g)).map((m) => m[0]);
  const firstLine = text.split("\n").map((l) => l.trim()).find((l) => l.length > 2);
  const name = firstLine && firstLine.length < 60 && !firstLine.includes("@")
    ? firstLine
    : undefined;

  const sections: Record<string, boolean> = {};
  for (const [k, re] of Object.entries(SECTION_KEYWORDS)) sections[k] = re.test(text);

  return {
    name,
    email,
    phone,
    links,
    sections,
    wordCount: clean.split(" ").length,
    raw: text,
  };
}

function tokenize(s: string): string[] {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9+#.\s-]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 1);
}

export function analyze(text: string, jobDescription: string): AnalysisResult {
  const parsed = parseResume(text);
  const lower = text.toLowerCase();

  const strengths: string[] = [];
  const improvements: string[] = [];

  // Contact
  let contactScore = 0;
  if (parsed.email) { contactScore += 40; strengths.push("Email is clearly listed"); }
  else improvements.push("Add a professional email address");
  if (parsed.phone) contactScore += 30;
  else improvements.push("Include a phone number for recruiters");
  if (parsed.links.length) { contactScore += 30; strengths.push("Includes online profiles or portfolio links"); }
  else improvements.push("Add LinkedIn / GitHub / portfolio links");

  // Sections
  const sectionsFound = Object.values(parsed.sections).filter(Boolean).length;
  const sectionsScore = Math.round((sectionsFound / 6) * 100);
  if (parsed.sections.experience) strengths.push("Dedicated experience section found");
  else improvements.push("Add a clear 'Experience' section");
  if (!parsed.sections.skills) improvements.push("Add a 'Skills' section listing key technologies");
  if (!parsed.sections.summary) improvements.push("Open with a short professional summary");

  // Length
  let lengthScore = 100;
  if (parsed.wordCount < 200) {
    lengthScore = 40;
    improvements.push("Resume is too short — aim for 400–800 words");
  } else if (parsed.wordCount > 1200) {
    lengthScore = 60;
    improvements.push("Resume is long — consider trimming to ~1 page");
  } else strengths.push(`Healthy length (${parsed.wordCount} words)`);

  // Action verbs
  const verbHits = ACTION_VERBS.filter((v) => new RegExp(`\\b${v}\\b`, "i").test(text)).length;
  const verbScore = Math.min(100, verbHits * 14);
  if (verbHits >= 5) strengths.push(`Strong action verbs (${verbHits} found)`);
  else improvements.push("Use more action verbs like 'built', 'led', 'shipped'");

  // Quantified impact
  const numbers = (text.match(/\b\d+%|\b\d{2,}\b/g) ?? []).length;
  const impactScore = Math.min(100, numbers * 8);
  if (numbers >= 5) strengths.push("Quantified impact with metrics");
  else improvements.push("Quantify achievements with numbers and %");

  // Keyword matching vs job description
  const jdTokens = Array.from(new Set(tokenize(jobDescription))).filter(
    (t) => !STOP.has(t) && t.length > 2
  );
  const resumeSet = new Set(tokenize(lower));
  const matched = jdTokens.filter((t) => resumeSet.has(t));
  const missing = jdTokens.filter((t) => !resumeSet.has(t));
  const matchScore = jdTokens.length
    ? Math.round((matched.length / jdTokens.length) * 100)
    : 0;

  const categories = [
    { label: "Contact", score: contactScore },
    { label: "Sections", score: sectionsScore },
    { label: "Length", score: lengthScore },
    { label: "Action Verbs", score: verbScore },
    { label: "Impact", score: impactScore },
    { label: "JD Match", score: jobDescription ? matchScore : 70 },
  ];

  const score = Math.round(
    categories.reduce((s, c) => s + c.score, 0) / categories.length
  );

  return {
    score,
    parsed,
    strengths,
    improvements,
    matched: matched.slice(0, 30),
    missing: missing.slice(0, 20),
    matchScore,
    categories,
    rawText: text,
  };
}

const STOP = new Set([
  "the","and","for","with","you","your","our","are","that","this","from","will",
  "have","has","not","but","all","any","can","into","who","what","when","where",
  "their","they","them","its","it's","a","an","of","to","in","on","at","or","be",
  "is","as","by","we","us","i","me","my","plus","etc","other","using","use",
  "experience","skills","work","role","team","ability","strong","good","years",
]);