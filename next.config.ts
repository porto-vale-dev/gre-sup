
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
        source: '/pos-contemplacao/archived',
        destination: '/pos-contemplacao/archived',
      }
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
      {
        protocol: 'https',
        hostname: 'dzbsqlutdjwabgjuhsin.supabase.co',
        port: '',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
