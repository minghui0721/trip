import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Phones on the same Wi-Fi open the dev server by its LAN address.
  // Without this, their browser gets the HTML but not the JavaScript, so buttons do nothing.
  allowedDevOrigins: ["192.168.1.102", "192.168.1.*"],
  experimental: {
    // Reopening a dynamic page within 30 seconds reuses the copy already on the phone.
    staleTimes: { dynamic: 30 },
  },
};

export default nextConfig;
