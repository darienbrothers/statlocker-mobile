/**
 * ESLint rule to prevent hardcoded colors and enforce design token usage
 *
 * This rule warns when:
 * - Hex colors (#000000) are used directly
 * - RGB/RGBA colors are used directly
 * - HSL colors are used directly
 * - Common color names are used directly
 *
 * Exceptions:
 * - Colors in design token files
 * - Transparent color
 * - Colors in test files
 */

const colorPatterns = [
  // Hex colors
  /#[0-9a-fA-F]{3,8}/,
  // RGB/RGBA
  /rgba?\s*\(\s*\d+\s*,\s*\d+\s*,\s*\d+/,
  // HSL/HSLA
  /hsla?\s*\(\s*\d+\s*,\s*\d+%\s*,\s*\d+%/,
  // Common color names (excluding transparent)
  /\b(red|blue|green|yellow|orange|purple|pink|brown|black|white|gray|grey)\b/i,
];

const allowedColors = ['transparent', 'inherit', 'currentColor'];

module.exports = {
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Enforce design token usage instead of hardcoded colors',
      category: 'Best Practices',
      recommended: true,
    },
    fixable: 'code',
    schema: [],
    messages: {
      hardcodedColor:
        'Hardcoded color "{{color}}" found. Use design tokens from Tailwind classes or src/lib/tokens.ts instead.',
      suggestToken:
        'Consider using a design token like "text-primary-900" or "bg-gray-100" instead.',
    },
  },

  create(context) {
    const filename = context.getFilename();

    // Skip token files and test files
    if (
      filename.includes('tokens.ts') ||
      filename.includes('tailwind.config') ||
      filename.includes('.test.') ||
      filename.includes('.spec.')
    ) {
      return {};
    }

    function checkForHardcodedColors(node, value) {
      if (typeof value !== 'string') return;

      // Skip allowed colors
      if (allowedColors.includes(value.toLowerCase())) return;

      // Check against color patterns
      for (const pattern of colorPatterns) {
        if (pattern.test(value)) {
          context.report({
            node,
            messageId: 'hardcodedColor',
            data: { color: value },
            suggest: [
              {
                messageId: 'suggestToken',
                fix: null, // Manual fix required
              },
            ],
          });
          break;
        }
      }
    }

    return {
      // Check object properties (style objects)
      Property(node) {
        if (
          node.key &&
          (node.key.name === 'color' ||
            node.key.name === 'backgroundColor' ||
            node.key.name === 'borderColor' ||
            node.key.name === 'shadowColor')
        ) {
          if (node.value.type === 'Literal') {
            checkForHardcodedColors(node.value, node.value.value);
          }
        }
      },

      // Check string literals in JSX attributes
      JSXExpressionContainer(node) {
        if (node.expression.type === 'Literal') {
          checkForHardcodedColors(node.expression, node.expression.value);
        }
      },

      // Check template literals
      TemplateLiteral(node) {
        node.quasis.forEach(quasi => {
          checkForHardcodedColors(quasi, quasi.value.raw);
        });
      },
    };
  },
};
