const { getDefaultConfig } = require('@expo/metro-config');

const defaultConfig = getDefaultConfig(__dirname);
defaultConfig.resolver.sourceExts.push('cjs');

module.exports = {
	transformer: {
		assetPlugins: ['expo-asset/tools/hashAssetFiles'],
	},
};
