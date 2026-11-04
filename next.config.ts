import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
    outputFileTracingIncludes: {
        '/*': ['./data/catalogues/*.csv', './data/meta/*.csv'],
    },
    typescript: {
        ignoreBuildErrors: true,
    },
}

export default nextConfig
