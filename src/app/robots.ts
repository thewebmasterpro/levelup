import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/espace", "/auth", "/mot-de-passe"],
    },
    sitemap: "https://levelupnow.be/sitemap.xml",
  };
}
