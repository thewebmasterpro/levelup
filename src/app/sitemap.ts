import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://levelupnow.be";
  return [
    { url: base, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/login`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${base}/charte`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${base}/confidentialite`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${base}/mentions-legales`, changeFrequency: "yearly", priority: 0.3 },
  ];
}
