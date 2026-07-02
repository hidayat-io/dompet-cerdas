import React, { Component, type ReactNode } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, info: React.ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[ErrorBoundary]', error, info);
    this.props.onError?.(error, info);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (!this.state.hasError) return this.props.children;
    if (this.props.fallback) return this.props.fallback;

    const isChunkLoadError =
      this.state.error?.name === 'ChunkLoadError' ||
      /Loading chunk|Failed to fetch dynamically imported module|Importing a module script failed|Load failed/i.test(this.state.error?.message || '');

    return (
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 2,
          p: 4,
          textAlign: 'center',
        }}
      >
        <Typography variant="h5" component="h1" fontWeight={600}>
          {isChunkLoadError ? 'Versi aplikasi telah diperbarui' : 'Terjadi kesalahan'}
        </Typography>
        <Typography variant="body2" color="text.secondary" maxWidth={400}>
          {isChunkLoadError
            ? 'Beberapa bagian aplikasi perlu dimuat ulang untuk versi terbaru.'
            : 'Aplikasi mengalami masalah tak terduga. Coba muat ulang halaman.'}
        </Typography>
        <Button variant="contained" color="primary" onClick={this.handleReload} sx={{ mt: 1 }}>
          Muat Ulang
        </Button>
      </Box>
    );
  }
}

export default ErrorBoundary;
