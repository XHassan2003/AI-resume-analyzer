export async function extractText(file: File): Promise<string> {
  const name = file.name.toLowerCase();

  if (name.endsWith(".pdf")) {
    return extractPdf(file);
  }

  if (name.endsWith(".docx") || name.endsWith(".doc")) {
    return extractDocx(file);
  }

  if (name.endsWith(".txt")) {
    return await file.text();
  }

  throw new Error("Unsupported file. Upload PDF, DOCX, or TXT.");
}

async function extractPdf(file: File): Promise<string> {
  try {
    const pdfjsLib = await import("pdfjs-dist");

    const workerSrc = (
      await import("pdfjs-dist/build/pdf.worker.min.mjs?url")
    ).default;

    pdfjsLib.GlobalWorkerOptions.workerSrc = workerSrc;

    const buf = await file.arrayBuffer();

    const pdf = await pdfjsLib.getDocument({
      data: buf,
    }).promise;

    let text = "";

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);

      const content = await page.getTextContent();

      text +=
        content.items
          .map((it: any) => it.str)
          .join(" ") + "\n";
    }

    return text.trim();
  } catch (error) {
    console.error("PDF extraction failed:", error);

    throw new Error("Failed to read PDF file.");
  }
}

async function extractDocx(file: File): Promise<string> {
  try {
    const mammoth = (await import("mammoth")).default;

    const buf = await file.arrayBuffer();

    const result = await mammoth.extractRawText({
      arrayBuffer: buf,
    });

    return result.value.trim();
  } catch (error) {
    console.error("DOCX extraction failed:", error);

    throw new Error("Failed to read DOCX file.");
  }
}

/**
 * Detects whether uploaded text looks like a resume/CV
 */
export function isResumeText(text: string): boolean {
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

  // Reject if too little text
  if (normalized.length < 200) {
    return false;
  }

  // Require at least 3 resume-related keywords
  return matches >= 3;
}