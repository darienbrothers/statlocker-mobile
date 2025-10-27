module.exports = function (api) {
  const isTest = api.env('test');
  api.cache(true);
  
  const plugins = [
    'nativewind/babel',
    [
      'module-resolver',
      {
        root: ['./src'],
        alias: {
          '@': './src',
          '@/components': './src/components',
          '@/features': './src/features',
          '@/store': './src/store',
          '@/lib': './src/lib',
          '@/services': './src/services',
          '@/types': './src/types',
        },
      },
    ],
  ];

  // Only add reanimated plugin when not in test environment
  if (!isTest) {
    plugins.push('react-native-reanimated/plugin');
  }
  
  return {
    presets: [['babel-preset-expo', { jsxImportSource: 'nativewind' }]],
    plugins,
  };
};
