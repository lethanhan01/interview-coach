const config = {
  plugins: {
    'postcss-preset-mantine': {},
    'postcss-simple-vars': {
      variables: {
        'mantine-breakpoint-xs': '36em',
        'mantine-breakpoint-sm': '48em',
        'mantine-breakpoint-md': '62em',
        'mantine-breakpoint-lg': '75em',
        'mantine-breakpoint-xl': '88em',
      },
    },
    // Giữ lại trong giai đoạn chuyển tiếp cho các component cũ dùng Tailwind v4
    '@tailwindcss/postcss': {},
  },
}

export default config
