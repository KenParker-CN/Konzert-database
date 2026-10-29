import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
    outputFileTracingIncludes: {
        '/*': ['./data/catalogues/*.csv'],
    },
    typescript: {
        ignoreBuildErrors: true,
    },
}

export default nextConfig
