"use client";

/**
 * Visual placeholder for sections that will use approved media later.
 * TODO: Replace with real asset (admin upload / approved partner media) when available.
 * Suggested sources: clinic environments, treatment rooms, doctor consultation, patient recovery,
 * Manizales landscapes, Medellín skyline — gather from partners (e.g. Instagram, Facebook, manual upload).
 */
type ImagePlaceholderProps = {
  /** Short label for the intended image (e.g. "Clinic environment", "Manizales mountains") */
  label: string;
  /** Optional aspect ratio class (default aspect-video) */
  aspectRatio?: "video" | "square" | "4/3";
  className?: string;
};

const aspectClasses = {
  video: "aspect-video",
  square: "aspect-square",
  "4/3": "aspect-[4/3]",
};

export default function ImagePlaceholder({ label, aspectRatio = "video", className = "" }: ImagePlaceholderProps) {
  return (
    <div
      className={`w-full rounded-xl border border-zinc-700 bg-zinc-800/80 flex items-center justify-center text-zinc-500 ${aspectClasses[aspectRatio]} ${className}`}
      role="img"
      aria-label={`Placeholder: ${label}`}
    >
      <span className="text-xs font-medium text-center px-3">[ {label} — approved image can be added here ]</span>
    </div>
  );
}
