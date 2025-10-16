
import type {NextConfig} from 'next';
import fs from 'fs';
import path from 'path';

// Read the build ID from the .version file
const buildId = fs.readFileSync(path.join(process.cwd(), '.version'), 'utf8').trim();


const nextConfig: NextConfig = {
  /* config options here */
  output: 'standalone', // Essencial para deploy com Docker/Cloud Run
  
  // Make the build ID available to the client
  env: {
    NEXT_PUBLIC_BUILD_ID: buildId,
  },

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
    ],
  },
};

export default nextConfig;
