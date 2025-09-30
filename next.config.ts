
import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
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
      {
        source: '/suporte-gre/cobranca/dashboard',
        destination: '/suporte-gre/cobranca/dashboard',
      },
      {
        source: '/suporte-gre/cobranca/archived',
        destination: '/suporte-gre/cobranca/archived',
      },
      {
        source: '/pos-contemplacao/dashboard',
        destination: '/pos-contemplacao/dashboard',
      },
      {
        source: '/pos-contemplacao/archived',
        destination: '/pos-contemplacao/archived',
      },
    ];
  },
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
