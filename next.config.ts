import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
    outputFileTracingIncludes: {
        '/*': ['./data/catalogues/*.csv'],
    },
}

export default nextConfig
