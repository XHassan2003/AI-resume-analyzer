import { useCallback, useRef, useState } from "react";
import { Upload, FileText, X } from "lucide-react";
import { motion } from "framer-motion";

interface Props {
  file: File | null;
  onFile: (file: File | null) => void;
}

export function UploadZone({ file, onFile }: Props) {
  const [drag, setDrag] = useState(false);
  const input = useRef<HTMLInputElement>(null);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDrag(false);
      const f = e.dataTransfer.files?.[0];
      if (f) onFile(f);
    },
    [onFile]
  );

  if (file) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between rounded-2xl border border-border bg-card p-5"
      >
        <div className="flex items-center gap-4">
          <div className="rounded-xl bg-primary/15 p-3 text-primary">
            <FileText className="h-6 w-6" />
          </div>
          <div>
            <p className="font-medium text-foreground">{file.name}</p>
            <p className="text-sm text-muted-foreground">
              {(file.size / 1024).toFixed(1)} KB
            </p>
          </div>
        </div>
        <button
          onClick={() => onFile(null)}
          className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
          aria-label="Remove file"
        >
          <X className="h-5 w-5" />
        </button>
      </motion.div>
    );
  }

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setDrag(true);
      }}
      onDragLeave={() => setDrag(false)}
      onDrop={onDrop}
      onClick={() => input.current?.click()}
      className={`flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-12 text-center transition-all ${
        drag
          ? "border-primary bg-primary/5 scale-[1.01]"
          : "border-border bg-card hover:border-primary/50"
      }`}
    >
      <div className="mb-4 rounded-2xl bg-primary/15 p-4 text-primary">
        <Upload className="h-8 w-8" />
      </div>
      <p className="text-lg font-semibold text-foreground">
        Drop your resume here
      </p>
      <p className="mt-1 text-sm text-muted-foreground">
        PDF, DOCX, or TXT · up to 10 MB
      </p>
      <input
        ref={input}
        type="file"
        accept=".pdf,.docx,.doc,.txt"
        className="hidden"
        onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])}
      />
    </div>
  );
}