const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

// Watch all files in the monorepo
config.watchFolders = [workspaceRoot];

// Resolve modules from workspace root first, then project
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];

// Allow Metro to resolve TypeScript source files from packages/shared
config.resolver.sourceExts = [...config.resolver.sourceExts, 'ts', 'tsx'];

// Resolve @drug-medicine-lookup/shared from source (not dist)
config.resolver.extraNodeModules = {
  '@drug-medicine-lookup/shared': path.resolve(workspaceRoot, 'packages/shared/src'),
};

// Fix: Zustand uses import.meta.env.MODE — provide a polyfill via Metro globals
config.transformer = {
  ...config.transformer,
  minifierConfig: {
    ...config.transformer?.minifierConfig,
  },
};

// Inject import.meta polyfill for web builds
config.resolver.unstable_enablePackageExports = true;

module.exports = config;
