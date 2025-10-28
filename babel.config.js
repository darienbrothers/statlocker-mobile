module.exports = function (api) {
  api.cache(true);
  
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      [
        'module-resolver',
        {
          root: ['./src'],
          alias: {
            '@': './src',
            '@/components': './src/components',
            '@/store': './src/store',
            '@/lib': './src/lib',
            '@/services': './src/services',
            '@/types': './src/types',
            '@/hooks': './src/hooks',
          },
        },
      ],
      'react-native-reanimated/plugin',
    ],
  };
};
