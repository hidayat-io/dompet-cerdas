import React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Divider from '@mui/material/Divider';
import { useTheme } from '../contexts/ThemeContext';
import IconDisplay from './IconDisplay';

export interface TransactionAction {
    id: 'view' | 'edit' | 'duplicate' | 'delete';
    label: string;
    icon: string;
    color?: string;
    destructive?: boolean;
}

interface TransactionActionSheetProps {
    open: boolean;
    transaction: {
        id: string;
        description: string;
        amount: number;
        date: string;
        categoryName?: string;
        hasAttachment?: boolean;
        canEdit: boolean;
    } | null;
    onClose: () => void;
    onAction: (action: TransactionAction['id']) => void;
}

const TransactionActionSheet: React.FC<TransactionActionSheetProps> = ({
    open,
    transaction,
    onClose,
    onAction,
}) => {
    const { theme } = useTheme();

    if (!open || !transaction) return null;

    const actions: TransactionAction[] = [
        ...(transaction.hasAttachment ? [{ id: 'view' as const, label: 'Lihat lampiran', icon: 'Image', color: theme.colors.info }] : []),
        ...(transaction.canEdit ? [{ id: 'edit' as const, label: 'Edit transaksi', icon: 'Edit' }] : []),
        ...(transaction.canEdit ? [{ id: 'duplicate' as const, label: 'Duplikat', icon: 'Copy' }] : []),
        ...(transaction.canEdit ? [{ id: 'delete' as const, label: 'Hapus', icon: 'Trash2', color: theme.colors.error, destructive: true }] : []),
    ];

    return (
        <>
            {/* Backdrop */}
            <Box
                sx={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    bgcolor: 'rgba(0, 0, 0, 0.5)',
                    zIndex: 1300,
                    animation: 'fadeIn 0.2s ease-out',
                    '@keyframes fadeIn': {
                        from: { opacity: 0 },
                        to: { opacity: 1 },
                    },
                }}
                onClick={onClose}
            />

            {/* Sheet */}
            <Box
                sx={{
                    position: 'fixed',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    zIndex: 1301,
                    bgcolor: 'background.paper',
                    borderTopLeftRadius: 24,
                    borderTopRightRadius: 24,
                    animation: 'slideUp 0.25s ease-out',
                    '@keyframes slideUp': {
                        from: { transform: 'translateY(100%)' },
                        to: { transform: 'translateY(0)' },
                    },
                    maxHeight: '70vh',
                    overflow: 'auto',
                }}
            >
                {/* Handle */}
                <Box sx={{ pt: 1.5, pb: 1, display: 'flex', justifyContent: 'center' }}>
                    <Box sx={{ width: 36, height: 4, borderRadius: 2, bgcolor: 'divider' }} />
                </Box>

                {/* Transaction Preview */}
                <Box sx={{ px: 3, pb: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
                    <Typography variant="h6" fontWeight={700}>
                        {transaction.description || 'Tanpa deskripsi'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                        {transaction.categoryName} • {transaction.date}
                    </Typography>
                    <Typography
                        variant="h6"
                        fontWeight={700}
                        sx={{
                            mt: 1,
                            color: transaction.amount >= 0 ? theme.colors.expense : theme.colors.income,
                        }}
                    >
                        {transaction.amount >= 0 ? '-' : '+'}{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(Math.abs(transaction.amount))}
                    </Typography>
                </Box>

                {/* Actions */}
                <List disablePadding sx={{ py: 1 }}>
                    {actions.map((action, idx) => (
                        <React.Fragment key={action.id}>
                            <ListItemButton
                                onClick={() => {
                                    onAction(action.id);
                                    onClose();
                                }}
                                sx={{
                                    px: 3,
                                    py: 2,
                                    '&:hover': {
                                        bgcolor: 'action.hover',
                                    },
                                }}
                            >
                                <ListItemIcon sx={{ minWidth: 40 }}>
                                    <Box
                                        sx={{
                                            width: 40,
                                            height: 40,
                                            borderRadius: 2,
                                            bgcolor: action.destructive ? theme.colors.errorLight : 'action.hover',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                        }}
                                    >
                                        <IconDisplay
                                            name={action.icon}
                                            size={20}
                                            sx={{ color: action.color || 'text.primary' }}
                                        />
                                    </Box>
                                </ListItemIcon>
                                <ListItemText
                                    primary={action.label}
                                    primaryTypographyProps={{
                                        fontWeight: 600,
                                        color: action.destructive ? theme.colors.error : 'text.primary',
                                    }}
                                />
                                <IconDisplay name="ChevronRight" size={18} sx={{ color: 'text.disabled' }} />
                            </ListItemButton>
                            {idx < actions.length - 1 && <Divider />}
                        </React.Fragment>
                    ))}
                </List>

                {/* Cancel */}
                <Box sx={{ p: 2, borderTop: '1px solid', borderColor: 'divider' }}>
                    <Box
                        component="button"
                        onClick={onClose}
                        sx={{
                            width: '100%',
                            py: 1.5,
                            border: 'none',
                            borderRadius: 3,
                            bgcolor: 'action.hover',
                            fontWeight: 700,
                            fontSize: 15,
                            fontFamily: 'inherit',
                            cursor: 'pointer',
                        }}
                    >
                        Batal
                    </Box>
                </Box>
            </Box>
        </>
    );
};

export default TransactionActionSheet;
