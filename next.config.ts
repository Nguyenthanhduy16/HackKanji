import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';
const withNextIntl=createNextIntlPlugin('./src/i18n/request.ts');
const config: NextConfig = { distDir: process.env.NHAIKANJI_BUILD_DIR || '.next', turbopack: { resolveAlias: { 'next-intl/config': './src/i18n/request.ts' } }, devIndicators: false, images: { unoptimized: true }, experimental: { cpus: 2 } };
export default withNextIntl(config);
