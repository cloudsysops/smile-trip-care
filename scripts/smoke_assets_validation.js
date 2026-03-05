// Basic smoke test for asset validation schema (run with: npm run smoke:assets)
const { z } = require("zod");

const AssetCategorySchema = z.enum([
  "clinic",
  "finca",
  "lodging",
  "tour",
  "team",
  "other",
]);

const AssetLocationSchema = z.enum(["Medellín", "Manizales", "Other"]);

const AssetMetadataSchema = z.object({
  title: z.string().min(1).max(300),
  category: AssetCategorySchema,
  location: AssetLocationSchema,
  tags: z.array(z.string().min(1).max(50)).default([]),
  alt_text: z.string().min(1).max(500),
  source_url: z.string().url().optional(),
});

try {
  AssetMetadataSchema.parse({
    title: "Clinic exterior",
    category: "clinic",
    location: "Medellín",
    tags: ["clinic", "medellin"],
    alt_text: "Front view of Clínica San Martín in Medellín",
  });
  console.log("Asset metadata validation smoke test: OK");
} catch (err) {
  console.error("Asset metadata validation smoke test FAILED");
  console.error(err);
  process.exit(1);
}

