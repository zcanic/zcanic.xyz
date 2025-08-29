/** @type {import('tailwindcss').Config} */
export default {
	darkMode: ["class"],
	content: [
		"./index.html",
		"./src/**/*.{js,ts,jsx,tsx}",
	],
	theme: {
		container: {
			center: true,
			padding: '2rem',
			screens: {
				'sm': '640px',
				'md': '768px',
				'lg': '1024px',
				'xl': '1280px',
				'2xl': '1400px'
			}
		},
		extend: {
			fontFamily: {
				sans: ['Inter', 'system-ui', 'sans-serif'],
				display: ['Satoshi', 'sans-serif'],
				mono: ['Fira Code', 'monospace'],
			},
			colors: {
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				background: 'hsl(var(--background))',
				foreground: 'hsl(var(--foreground))',
				primary: {
					DEFAULT: 'hsl(var(--primary))',
					foreground: 'hsl(var(--primary-foreground))'
				},
				secondary: {
					DEFAULT: 'hsl(var(--secondary))',
					foreground: 'hsl(var(--secondary-foreground))'
				},
				destructive: {
					DEFAULT: 'hsl(var(--destructive))',
					foreground: 'hsl(var(--destructive-foreground))'
				},
				muted: {
					DEFAULT: 'hsl(var(--muted))',
					foreground: 'hsl(var(--muted-foreground))'
				},
				accent: {
					DEFAULT: 'hsl(var(--accent))',
					foreground: 'hsl(var(--accent-foreground))'
				},
				popover: {
					DEFAULT: 'hsl(var(--popover))',
					foreground: 'hsl(var(--popover-foreground))'
				},
				card: {
					DEFAULT: 'hsl(var(--card))',
					foreground: 'hsl(var(--card-foreground))'
				},
				slate: {
					50: '#f8fafc',
					100: '#f1f5f9',
					200: '#e2e8f0',
					300: '#cbd5e1',
					400: '#94a3b8',
					500: '#64748b',
					600: '#475569',
					700: '#334155',
					800: '#1e293b',
					900: '#0f172a',
					950: '#020617',
				},
				indigo: {
					50: '#eef2ff',
					100: '#e0e7ff',
					200: '#c7d2fe',
					300: '#a5b4fc',
					400: '#818cf8',
					500: '#6366f1',
					600: '#4f46e5',
					700: '#4338ca',
					800: '#3730a3',
					900: '#312e81',
					950: '#1e1b4b',
				},
				cream: {
					50: '#FFFDF7',
					100: '#FFF9E8',
					200: '#FFF1D0',
					300: '#FFE9B8',
					400: '#FFD280',
					500: '#FFBC4D',
					600: '#FFA31A',
					700: '#E68A00',
					800: '#CC7A00',
					900: '#A66300',
				},
				mocha: {
					50: '#F9F5F2',
					100: '#F2EAE4',
					200: '#E5D6C9',
					300: '#D8C2AF',
					400: '#BFA995',
					500: '#A68F7B',
					600: '#8D7864',
					700: '#73624F',
					800: '#594C3C',
					900: '#40362A',
				},
				blush: {
					50: '#FFF0F4',
					100: '#FFE1E9',
					200: '#FFC3D3',
					300: '#FFA5BE',
					400: '#FF87A8',
					500: '#FF6993',
					600: '#FF4B7E',
					700: '#FF2D69',
					800: '#FF0F54',
					900: '#E60042',
				},
				night: {
					50: '#F0F4FF',
					100: '#E1E9FF',
					200: '#C3D3FF',
					300: '#A5BEFF',
					400: '#7291FA',
					500: '#4063F0',
					600: '#2A46DB',
					700: '#1F34B8',
					800: '#152392',
					900: '#0B1257',
				},
				sunset: {
					50: '#FFF3F0', 
					100: '#FFE6E0',
					200: '#FFCEC2',
					300: '#FFB5A3',
					400: '#FF9C85',
					500: '#FF8366',
					600: '#FF6947',
					700: '#FF5029',
					800: '#FF360A',
					900: '#EB2500',
				},
				stardust: {
					50: '#F4F0FF',
					100: '#E9E0FF',
					200: '#D3C2FF',
					300: '#BCA3FF',
					400: '#A685FF',
					500: '#9066FF',
					600: '#7A47FF',
					700: '#6429FF',
					800: '#4E0AFF',
					900: '#3D00EB',
				},
				dark: {
					bg: '#1A1825',
					card: '#262338',
					border: '#3D3654',
					text: '#E9E4F9',
					muted: '#9D96B8',
					hover: '#332D4A',
					active: '#443C66',
				}
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)'
			},
			keyframes: {
				'accordion-down': {
					from: { height: '0' },
					to: { height: 'var(--radix-accordion-content-height)' }
				},
				'accordion-up': {
					from: { height: 'var(--radix-accordion-content-height)' },
					to: { height: '0' }
				},
				'float': {
					'0%, 100%': { transform: 'translateY(0)' },
					'50%': { transform: 'translateY(-3px)' }
				},
				'pulse-light': {
					'0%, 100%': { opacity: 1 },
					'50%': { opacity: 0.8 }
				},
				'fade-in': {
					'0%': { opacity: 0 },
					'100%': { opacity: 1 }
				},
				'slide-up': {
					'0%': { transform: 'translateY(5px)', opacity: 0 },
					'100%': { transform: 'translateY(0)', opacity: 1 }
				},
				'shimmer': {
					'0%': { backgroundPosition: '200% 0' },
					'100%': { backgroundPosition: '-200% 0' }
				},
				'page-fade-in': {
					'0%': { opacity: 0, transform: 'translateY(5px)' },
					'100%': { opacity: 1, transform: 'translateY(0)' }
				},
			},
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out',
				'float': 'float 2s ease-in-out infinite',
				'pulse-light': 'pulse-light 3s ease-in-out infinite',
				'fade-in': 'fade-in 0.2s ease-out',
				'slide-up': 'slide-up 0.3s ease-out',
				'shimmer': 'shimmer 4s ease-in-out infinite',
				'page-fade-in': 'page-fade-in 0.3s ease-out',
			},
			backgroundImage: {
				'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
				'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
			},
			boxShadow: {
				'soft': '0 2px 10px rgba(0, 0, 0, 0.05)',
				'soft-lg': '0 4px 20px rgba(0, 0, 0, 0.08)',
				'inner-soft': 'inset 0 2px 4px rgba(0, 0, 0, 0.03)',
				'accent': '0 0 10px rgba(99, 102, 241, 0.3)',
				'accent-dark': '0 0 10px rgba(165, 180, 252, 0.2)',
			},
		}
	},
	plugins: [
		require('@tailwindcss/typography'),
		require("tailwindcss-animate")
	],
} 