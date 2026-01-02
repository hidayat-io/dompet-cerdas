import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Simple theme types - just light and dark
export type ThemeName = 'light' | 'dark';

export interface ThemeColors {
    // Background
    bgPrimary: string;
    bgSecondary: string;
    bgCard: string;
    bgHover: string;
    bgMuted: string;

    // Text
    textPrimary: string;
    textSecondary: string;
    textMuted: string;

    // Border
    border: string;
    borderLight: string;

    // Accent
    accent: string;
    accentHover: string;
    accentLight: string;
    accentText: string;

    // Income/Expense - always visible
    income: string;
    incomeBg: string;
    expense: string;
    expenseBg: string;

    // Sidebar
    sidebarBg: string;
    sidebarText: string;
    sidebarActive: string;
    sidebarActiveBg: string;
}

export interface Theme {
    name: ThemeName;
    label: string;
    icon: string;
    colors: ThemeColors;
}

// Simple Light and Dark themes
export const themes: Record<ThemeName, Theme> = {
    light: {
        name: 'light',
        label: 'Terang',
        icon: 'Sun',
        colors: {
            bgPrimary: '#f9fafb',
            bgSecondary: '#ffffff',
            bgCard: '#ffffff',
            bgHover: '#f3f4f6',
            bgMuted: '#e5e7eb',

            textPrimary: '#111827',
            textSecondary: '#4b5563',
            textMuted: '#9ca3af',

            border: '#e5e7eb',
            borderLight: '#f3f4f6',

            accent: '#4f46e5',
            accentHover: '#4338ca',
            accentLight: '#eef2ff',
            accentText: '#ffffff',

            // Income = Blue, Expense = Red
            income: '#2563eb',
            incomeBg: '#dbeafe',
            expense: '#dc2626',
            expenseBg: '#fee2e2',

            sidebarBg: '#ffffff',
            sidebarText: '#4b5563',
            sidebarActive: '#4f46e5',
            sidebarActiveBg: '#eef2ff',
        }
    },
    dark: {
        name: 'dark',
        label: 'Gelap',
        icon: 'Moon',
        colors: {
            bgPrimary: '#0f172a',
            bgSecondary: '#1e293b',
            bgCard: '#1e293b',
            bgHover: '#334155',
            bgMuted: '#475569',

            textPrimary: '#f1f5f9',
            textSecondary: '#cbd5e1',
            textMuted: '#64748b',

            border: '#334155',
            borderLight: '#475569',

            accent: '#818cf8',
            accentHover: '#6366f1',
            accentLight: '#312e81',
            accentText: '#ffffff',

            // Income = Blue, Expense = Red (brighter for dark mode)
            income: '#60a5fa',
            incomeBg: '#1e3a5f',
            expense: '#f87171',
            expenseBg: '#7f1d1d',

            sidebarBg: '#1e293b',
            sidebarText: '#cbd5e1',
            sidebarActive: '#818cf8',
            sidebarActiveBg: '#312e81',
        }
    }
};

// Context type
interface ThemeContextType {
    theme: Theme;
    isDark: boolean;
    toggleTheme: () => void;
    setTheme: (name: ThemeName) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Provider component
interface ThemeProviderProps {
    children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
    const [themeName, setThemeName] = useState<ThemeName>(() => {
        // Check localStorage first
        const saved = localStorage.getItem('dompetcerdas_theme');
        if (saved === 'dark' || saved === 'light') {
            return saved;
        }
        // Check system preference
        if (typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            return 'dark';
        }
        return 'light';
    });

    const theme = themes[themeName];
    const isDark = themeName === 'dark';

    const setTheme = (name: ThemeName) => {
        setThemeName(name);
        localStorage.setItem('dompetcerdas_theme', name);
    };

    const toggleTheme = () => {
        setTheme(isDark ? 'light' : 'dark');
    };

    // Apply theme to document
    useEffect(() => {
        const root = document.documentElement;

        // Set CSS variables
        Object.entries(theme.colors).forEach(([key, value]) => {
            root.style.setProperty(`--${key}`, value);
        });

        // Set body and html background
        document.body.style.backgroundColor = theme.colors.bgPrimary;
        document.body.style.color = theme.colors.textPrimary;

        // Add/remove dark class for any native dark mode CSS
        if (isDark) {
            root.classList.add('dark');
        } else {
            root.classList.remove('dark');
        }
    }, [theme, isDark]);

    return (
        <ThemeContext.Provider value={{ theme, isDark, toggleTheme, setTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};

// Hook to use theme
export const useTheme = (): ThemeContextType => {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};
