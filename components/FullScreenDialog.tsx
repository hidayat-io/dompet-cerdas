import React from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import type { SxProps, Theme } from '@mui/material/styles';
import IconDisplay from './IconDisplay';

interface FullScreenDialogProps {
    open: boolean;
    onClose: () => void;
    title: string;
    description?: React.ReactNode;
    children: React.ReactNode;
    actions?: React.ReactNode;
    headerActions?: React.ReactNode;
    contentSx?: SxProps<Theme>;
    actionsSx?: SxProps<Theme>;
}

const FullScreenDialog: React.FC<FullScreenDialogProps> = ({
    open,
    onClose,
    title,
    description,
    children,
    actions,
    headerActions,
    contentSx,
    actionsSx,
}) => (
    <Dialog
        open={open}
        onClose={onClose}
        fullScreen
        slotProps={{ backdrop: { sx: { backdropFilter: 'blur(4px)' } } }}
    >
        <Box sx={{ display: 'flex', minHeight: '100%', flexDirection: 'column', bgcolor: 'background.default' }}>
            <DialogTitle
                sx={{
                    px: { xs: 2, sm: 3, md: 4 },
                    py: 2,
                    borderBottom: '1px solid',
                    borderColor: 'divider',
                    bgcolor: 'background.paper',
                }}
            >
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                    <IconButton edge="start" onClick={onClose} aria-label="Tutup">
                        <IconDisplay name="ArrowLeft" size={20} />
                    </IconButton>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography variant="h6" fontWeight={700}>
                            {title}
                        </Typography>
                        {description ? (
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, maxWidth: 720 }}>
                                {description}
                            </Typography>
                        ) : null}
                    </Box>
                    {headerActions ? <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>{headerActions}</Box> : null}
                </Box>
            </DialogTitle>

            <DialogContent
                dividers
                sx={[
                    {
                        flex: 1,
                        px: { xs: 2, sm: 3, md: 4 },
                        py: { xs: 2, sm: 3 },
                    },
                    contentSx,
                ]}
            >
                {children}
            </DialogContent>

            {actions ? (
                <DialogActions
                    sx={[
                        {
                            px: { xs: 2, sm: 3, md: 4 },
                            py: 2,
                            borderTop: '1px solid',
                            borderColor: 'divider',
                            bgcolor: 'background.paper',
                        },
                        actionsSx,
                    ]}
                >
                    {actions}
                </DialogActions>
            ) : null}
        </Box>
    </Dialog>
);

export default FullScreenDialog;
