/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      // Six-tier device scale, additive alongside Tailwind's default
      // sm/md/lg/xl/2xl (unchanged — 189 existing usages across the site
      // keep behaving exactly as before). tablet/laptop-sm/laptop-lg/desktop
      // sit at the same min-widths as sm/lg/xl/2xl respectively, so the two
      // scales agree wherever they overlap (md has no named tier here, but
      // still works normally); desktop-lg is the one tier Tailwind has no
      // default for. `mobile` is only here for naming completeness — it's
      // the same as writing no prefix at all (Tailwind is mobile-first).
      screens: {
        'mobile': '0px',
        'tablet': '640px',
        'laptop-sm': '1024px',
        'laptop-lg': '1280px',
        'desktop': '1536px',
        'desktop-lg': '1920px',
      },
      colors: {
        'indigo': {
          '50': '#f0f4ff',
          '100': '#e0e7ff',
          '500': '#6366f1',
          '600': '#4f46e5',
          '700': '#4338ca',
          '900': '#312e81',
        },
        'purple': {
          '900': '#581c87',
          '950': '#3f0f5c',
        },
      },
      fontFamily: {
        sans: ['system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
