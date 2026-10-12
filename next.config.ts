import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Phones on the same Wi-Fi open the dev server by its LAN address.
  // Without this, their browser gets the HTML but not the JavaScript, so buttons do nothing.
  allowedDevOrigins: ["192.168.1.102", "192.168.1.*"],
};

export default nextConfig;
