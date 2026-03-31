import React, { createContext, useContext, useState, ReactNode } from 'react';
import { createTheme, ThemeProvider as MuiThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

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

// Build MUI theme from custom colors
function buildMuiTheme(t: Theme) {
    return createTheme({
        palette: {
            mode: t.name,
            primary: {
                main: t.colors.accent,
                dark: t.colors.accentHover,
                light: t.colors.accentLight,
                contrastText: t.colors.accentText,
            },
            info: {
                main: t.colors.income,
            },
            error: {
                main: t.colors.expense,
            },
            background: {
                default: t.colors.bgPrimary,
                paper: t.colors.bgCard,
            },
            text: {
                primary: t.colors.textPrimary,
                secondary: t.colors.textSecondary,
                disabled: t.colors.textMuted,
            },
            divider: t.colors.border,
        },
        typography: {
            fontFamily: "'Inter', sans-serif",
        },
        shape: {
            borderRadius: 12,
        },
        components: {
            MuiAppBar: {
                styleOverrides: {
                    root: {
                        backgroundImage: 'none',
                        boxShadow: 'none',
                    },
                },
            },
            MuiButton: {
                styleOverrides: {
                    root: {
                        textTransform: 'none',
                        fontWeight: 600,
                        borderRadius: 10,
                    },
                },
            },
            MuiCard: {
                defaultProps: {
                    variant: 'outlined',
                },
                styleOverrides: {
                    root: {
                        borderRadius: 16,
                    },
                },
            },
            MuiChip: {
                styleOverrides: {
                    root: {
                        borderRadius: 999,
                        fontWeight: 600,
                    },
                },
            },
            MuiCssBaseline: {
                styleOverrides: {
                    body: {
                        margin: 0,
                    },
                    '::-webkit-scrollbar': {
                        width: 8,
                        height: 8,
                    },
                    '::-webkit-scrollbar-track': {
                        background: 'transparent',
                    },
                    '::-webkit-scrollbar-thumb': {
                        background: t.name === 'dark' ? 'rgba(148, 163, 184, 0.32)' : 'rgba(0, 0, 0, 0.15)',
                        borderRadius: 4,
                    },
                    '::-webkit-scrollbar-thumb:hover': {
                        background: t.name === 'dark' ? 'rgba(148, 163, 184, 0.48)' : 'rgba(0, 0, 0, 0.25)',
                    },
                },
            },
            MuiDialog: {
                defaultProps: {
                    fullWidth: true,
                },
                styleOverrides: {
                    paper: {
                        backgroundImage: 'none',
                    },
                },
            },
            MuiDialogTitle: {
                styleOverrides: {
                    root: {
                        padding: '16px 24px',
                    },
                },
            },
            MuiDialogContent: {
                styleOverrides: {
                    root: {
                        padding: '24px',
                    },
                },
            },
            MuiDialogActions: {
                styleOverrides: {
                    root: {
                        padding: '16px 24px',
                    },
                },
            },
            MuiFormControl: {
                defaultProps: {
                    fullWidth: true,
                    size: 'small',
                },
            },
            MuiIconButton: {
                styleOverrides: {
                    root: {
                        borderRadius: 10,
                    },
                },
            },
            MuiOutlinedInput: {
                styleOverrides: {
                    root: {
                        borderRadius: 12,
                    },
                },
            },
            MuiPaper: {
                defaultProps: {
                    variant: 'outlined',
                },
                styleOverrides: {
                    root: {
                        backgroundImage: 'none',
                        borderRadius: 16,
                    },
                },
            },
            MuiTab: {
                styleOverrides: {
                    root: {
                        textTransform: 'none',
                        fontWeight: 600,
                    },
                },
            },
            MuiTabs: {
                styleOverrides: {
                    root: {
                        minHeight: 40,
                    },
                },
            },
            MuiToggleButton: {
                styleOverrides: {
                    root: {
                        textTransform: 'none',
                        fontWeight: 600,
                        borderRadius: 10,
                    },
                },
            },
        },
    });
}

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

    const muiTheme = buildMuiTheme(theme);

    return (
        <ThemeContext.Provider value={{ theme, isDark, toggleTheme, setTheme }}>
            <MuiThemeProvider theme={muiTheme}>
                <CssBaseline />
                {children}
            </MuiThemeProvider>
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
