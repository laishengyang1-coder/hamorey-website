export default {
    content: ['./index.html', './src/**/*.{ts,tsx}'],
    theme: {
        extend: {
            colors: {
                brand: {
                    DEFAULT: 'var(--brand-primary)',
                    dark: 'var(--brand-dark)',
                    light: 'var(--brand-light)',
                    hover: 'var(--brand-hover)',
                    active: 'var(--brand-active)',
                },
                carbon: 'var(--bg-carbon)',
                graphite: 'var(--bg-graphite)',
                'dark-gray': 'var(--bg-dark-gray)',
                metal: 'var(--bg-metal)',
                elevated: 'var(--bg-elevated)',
                content: {
                    primary: 'var(--text-primary)',
                    secondary: 'var(--text-secondary)',
                    muted: 'var(--text-muted)',
                    brand: 'var(--text-brand)',
                },
                status: {
                    success: 'var(--status-success)',
                    warning: 'var(--status-warning)',
                    error: 'var(--status-error)',
                    info: 'var(--status-info)',
                },
                border: {
                    subtle: 'var(--border-subtle)',
                    DEFAULT: 'var(--border-default)',
                    brand: 'var(--border-brand)',
                },
            },
            borderRadius: {
                sm: 'var(--radius-sm)',
                DEFAULT: 'var(--radius-md)',
                lg: 'var(--radius-lg)',
            },
            maxWidth: {
                content: 'var(--content-max-width)',
            },
            height: {
                nav: 'var(--nav-height)',
            },
            spacing: {
                nav: 'var(--nav-height)',
            },
            transitionDuration: {
                fast: '150ms',
                normal: '250ms',
                slow: '500ms',
            },
            fontFamily: {
                sans: ['"HarmonyOS Sans SC"', '"Noto Sans SC"', 'system-ui', 'sans-serif'],
                display: ['"HarmonyOS Sans SC"', '"Noto Sans SC"', 'sans-serif'],
            },
            keyframes: {
                'fade-in-up': {
                    '0%': { opacity: '0', transform: 'translateY(24px)' },
                    '100%': { opacity: '1', transform: 'translateY(0)' },
                },
                'fade-in': {
                    '0%': { opacity: '0' },
                    '100%': { opacity: '1' },
                },
                'scale-in': {
                    '0%': { opacity: '0', transform: 'scale(0.96)' },
                    '100%': { opacity: '1', transform: 'scale(1)' },
                },
            },
            animation: {
                'fade-in-up': 'fade-in-up 0.6s ease-out forwards',
                'fade-in': 'fade-in 0.5s ease-out forwards',
                'scale-in': 'scale-in 0.4s ease-out forwards',
            },
        },
    },
    plugins: [],
};
