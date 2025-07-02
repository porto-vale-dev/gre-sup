/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  output: 'standalone', // Essencial para deploy com Docker/Cloud Run
  async rewrites() {
    return [
      {
        source: '/suporte-gre/painel',
        destination: '/dashboard',
      },
      {
        source: '/suporte-gre/painel/archived',
        destination: '/dashboard/archived',
      },
    ];
  },
  allowedDevOrigins: [
 'https://9000-firebase-studio-1749749009211.cluster-m7tpz3bmgjgoqrktlvd4ykrc2m.cloudworkstations.dev',
  ],
  typescript: {
    // Forçar a verificação de tipos no build para garantir a qualidade do código
    ignoreBuildErrors: false,
  },
  eslint: {
    // Forçar a verificação do linter no build
    ignoreDuringBuilds: false,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
