import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  webpack(config) {
    config.module.rules.push({
      test: /\.svg$/,
      use: [
        {
          loader: "@svgr/webpack",
          options: {
            svgoConfig: {
              plugins: [
                {
                  name: "preset-default",
                  params: {
                    overrides: {
                      removeViewBox: false, // เก็บ viewBox ไว้
                      cleanupIds: false,    // 👈 ใช้ override ตรงนี้แทน
                    },
                  },
                },
                {
                  name: "removeAttrs",
                  params: { attrs: "(data-name)" }, // 👈 ตัวอย่าง: จะลบเฉพาะ data-name ไม่ยุ่งกับ id
                },
              ],
            },
          },
        },
      ],
    });
    return config;
  },
};

export default nextConfig;
