import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  // 상위 디렉터리(홈)의 lock 파일을 프로젝트 루트로 오인하지 않도록 고정한다.
  turbopack: { root: import.meta.dirname },
  async headers() {
    return [
      {
        // PRD 33: 계좌 페이지가 검색엔진에 노출되지 않도록 한다.
        source: "/p/:publicId",
        headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }],
      },
    ];
  },
};

export default nextConfig;
