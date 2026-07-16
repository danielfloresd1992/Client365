import type { Config } from "tailwindcss";

import flowbiteReact from "flowbite-react/plugin/tailwindcss";




const config: Config = {
    // La app es solo tema claro: sin esto, el default 'media' activa las
    // clases dark: de flowbite cuando el SO está en modo oscuro (labels blancos).
    darkMode: "selector",
    content: [
        "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/app/**/*.{js,ts,jsx,tsx,mdx}",

        ".flowbite-react\\class-list.json",
        ".flowbite-react/class-list.json"
    ],
    theme: {
        extend: {
            backgroundImage: {
                "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
                "gradient-conic":
                    "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
            },
            boxShadow: {
                'custom': '2px 2px 13px #857a7a',
              }
        },
        fontFamily: {
            sans: ['var(--font-geist-sans)', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
            serif: ['Georgia', 'serif'],
            mono: ['var(--font-geist-mono)', 'SFMono-Regular', 'monospace'],
        },
    },
    plugins: [flowbiteReact],
};
export default config;