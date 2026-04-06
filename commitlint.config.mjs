/** @type {import('@commitlint/types').UserConfig} */
export default {
  rules: {
    'type-enum': [
      2,
      'always',
      [
        'feat',
        'fix',
        'docs',
        'style',
        'refactor',
        'perf',
        'test',
        'chore',
        'build',
        'ci',
        'security',
        'release',
        '✨ feat',
        '🐛 fix',
        '📝 docs',
        '💄 style',
        '♻️ refactor',
        '⚡ perf',
        '✅ test',
        '🔧 chore',
        '🏗️ build',
        '👷 ci',
        '🔒 security',
        '🚀 release',
      ],
    ],
    'type-empty': [2, 'never'],
    'subject-empty': [2, 'never'],
    'subject-min-length': [2, 'always', 3],
    'header-max-length': [2, 'always', 100],
  },
  parserPreset: {
    parserOpts: {
      headerPattern:
        /^((?:[\p{Emoji_Presentation}\p{Extended_Pictographic}]+\s)?[a-z]+)(?:\((.+)\))?:\s(.+)$/u,
      headerCorrespondence: ['type', 'scope', 'subject'],
    },
  },
}
