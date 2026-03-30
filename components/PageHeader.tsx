import React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

interface PageHeaderProps {
    title: string;
    description?: React.ReactNode;
    eyebrow?: string;
    actions?: React.ReactNode;
}

const PageHeader: React.FC<PageHeaderProps> = ({ title, description, eyebrow, actions }) => (
    <Box
        sx={{
            display: 'flex',
            flexDirection: { xs: 'column', md: 'row' },
            alignItems: { md: 'flex-end' },
            justifyContent: 'space-between',
            gap: 2,
            mb: 3,
        }}
    >
        <Box sx={{ minWidth: 0 }}>
            {eyebrow ? (
                <Typography variant="caption" fontWeight={700} textTransform="uppercase" letterSpacing="0.14em" color="text.secondary" sx={{ display: 'block', mb: 0.75 }}>
                    {eyebrow}
                </Typography>
            ) : null}
            <Typography variant="h5" fontWeight={700}>
                {title}
            </Typography>
            {description ? (
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, maxWidth: 720 }}>
                    {description}
                </Typography>
            ) : null}
        </Box>
        {actions ? <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>{actions}</Box> : null}
    </Box>
);

export default PageHeader;
