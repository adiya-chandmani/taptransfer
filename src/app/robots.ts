import type { MetadataRoute } from "next";

// PRD 33장: 계좌정보가 검색엔진에 노출되지 않도록 한다.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", disallow: ["/p/", "/admin", "/api/"] }],
  };
}
