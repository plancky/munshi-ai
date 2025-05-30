import type { Config } from "tailwindcss";

// @ts-nocheck
const genFontSizes = (obj) =>
    Object.entries(obj).reduce(
        (acc, val: any) => ({
            ...acc,
            [val[0]]: [
                val[1][0],
                {
                    lineHeight: val[1][1],
                    letterSpacing: val[1][2],
                    fontWeight: val[1][3],
                },
            ],
        }),
        {},
    );

const config: Config = {
    darkMode: ["class"],
    content: [
        "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            fontFamily: {
                primary: "var(--font-primary)",
                heading: "var(--font-heading)",
            },
            fontSize: genFontSizes({
                "2xl": ["3.5rem", "1.2", "-0.3%", "400"],
                xl: ["3rem", "1.2", "-0.3%", "400"],
                lg: ["2.25rem", "1.2", "-0.3%", "400"],
                md: ["2rem", "1", "-0.3%", "400"],
                subheading: ["1.2rem", "1.4", "1", "300"],
                subheading_lg: ["2rem", "1.25", "1", "300"],
                subheading_sm: ["1rem", "1.4", "1", "100"],
                body: ["1rem", "1.4", "1", "400"],
                body_lg: ["1.2rem", "1.4", "1.2", "400"],
                body_sm: ["0.8rem", "1.4", "1.2", "400"],
            }),
            typography: () => ({
                shadcn: {
                    css: {
                        "--tw-prose-body": "var(--color-foreground)",
                        "--tw-prose-headings": "var(--color-foreground)",
                        "--tw-prose-lead": "var(--color-foreground)",
                        "--tw-prose-links": "var(--color-foreground)",
                        "--tw-prose-bold": "var(--color-foreground)",
                        "--tw-prose-counters": "var(--color-foreground)",
                        "--tw-prose-bullets": "var(--color-foreground)",
                        "--tw-prose-hr": "var(--color-foreground)",
                        "--tw-prose-quotes": "var(--color-foreground)",
                        "--tw-prose-quote-borders": "var(--color-foreground)",
                        "--tw-prose-captions": "var(--color-foreground)",
                        "--tw-prose-code": "var(--color-foreground)",
                        "--tw-prose-pre-code": "var(--color-foreground)",
                        "--tw-prose-pre-bg": "var(--color-foreground)",
                        "--tw-prose-th-borders": "var(--color-foreground)",
                        "--tw-prose-td-borders": "var(--color-foreground)",
                        "--tw-prose-invert-body": "var(--color-foreground)",
                        "--tw-prose-invert-headings": "var(--color-foreground)",
                        "--tw-prose-invert-lead": "var(--color-foreground)",
                        "--tw-prose-invert-links": "var(--color-foreground)",
                        "--tw-prose-invert-bold": "var(--color-foreground)",
                        "--tw-prose-invert-counters": "var(--color-foreground)",
                        "--tw-prose-invert-bullets": "var(--color-foreground)",
                        "--tw-prose-invert-hr": "var(--color-foreground)",
                        "--tw-prose-invert-quotes": "var(--color-foreground)",
                        "--tw-prose-invert-quote-borders":
                            "var(--color-foreground)",
                        "--tw-prose-invert-captions": "var(--color-foreground)",
                        "--tw-prose-invert-th-borders":
                            "var(--color-foreground)",
                        "--tw-prose-invert-td-borders":
                            "var(--color-foreground)",
                    },
                },
            }),
            colors: {
                background: "hsl(var(--background) / var(--tw-bg-opacity))",
                foreground: "hsl(var(--foreground) / var(--tw-text-opacity))",
                card: {
                    DEFAULT: "hsl(var(--card) / var(--tw-bg-opacity))",
                    foreground:
                        "hsl(var(--card-foreground) / var(--tw-text-opacity))",
                },
                popover: {
                    DEFAULT: "hsl(var(--popover) / var(--tw-bg-opacity))",
                    foreground:
                        "hsl(var(--popover-foreground) / var(--tw-text-opacity))",
                },
                primary: {
                    DEFAULT: "hsl(var(--primary) / var(--tw-bg-opacity))",
                    foreground:
                        "hsl(var(--primary-foreground) / var(--tw-text-opacity))",
                },
                secondary: {
                    DEFAULT: "hsl(var(--secondary))",
                    foreground: "hsl(var(--secondary-foreground))",
                },
                muted: {
                    DEFAULT: "hsl(var(--muted))",
                    foreground: "hsl(var(--muted-foreground))",
                },
                accent: {
                    DEFAULT: "hsl(var(--accent))",
                    foreground: "hsl(var(--accent-foreground))",
                },
                destructive: {
                    DEFAULT: "hsl(var(--destructive))",
                    foreground: "hsl(var(--destructive-foreground))",
                },
                border: "hsl(var(--border))",
                input: "hsl(var(--input))",
                ring: "hsl(var(--ring))",
                chart: {
                    "1": "hsl(var(--chart-1))",
                    "2": "hsl(var(--chart-2))",
                    "3": "hsl(var(--chart-3))",
                    "4": "hsl(var(--chart-4))",
                    "5": "hsl(var(--chart-5))",
                },
            },
            borderRadius: {
                lg: "var(--radius)",
                md: "calc(var(--radius) - 2px)",
                sm: "calc(var(--radius) - 4px)",
            },
        },
    },
    plugins: [
        require("tailwindcss-animate"),
        require("@tailwindcss/typography"),
    ],
};
export default config;
