import React, { useState, useEffect, useRef, useId } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import TextField from '@mui/material/TextField';
import Chip from '@mui/material/Chip';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Paper from '@mui/material/Paper';
import { useTheme } from '../contexts/ThemeContext';
import IconDisplay from './IconDisplay';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import ConfirmDialog from './ConfirmDialog';
import CategoryFormModal from './CategoryFormModal';
import type { TransactionType, Category, Transaction } from '../types';
import { formatRupiahInput } from '../utils/format';

interface QuickAddSheetProps {
    open: boolean;
    type: TransactionType;
    amount: string;
    description: string;
    categoryId: string;
    date: string;
    attachment: { file: File; type: 'image' | 'pdf' } | null;
    categories: Array<{ id: string; name: string; icon: string; color: string; type: TransactionType }>;
    recentCategoryIds: string[];
    onTypeChange: (type: TransactionType) => void;
    onAmountChange: (amount: string) => void;
    onDescriptionChange: (description: string) => void;
    onCategoryChange: (categoryId: string) => void;
    onDateChange: (date: string) => void;
    onAttachmentChange: (attachment: { file: File; type: 'image' | 'pdf' } | null) => void;
    onScanButtonClick: () => void;
    onScanCancelled?: () => void;
    onSave: () => void;
    onClose: () => void;
    isSaving?: boolean;
    error?: string;
    isScanning?: boolean;
    scanMessage?: string;
    scanError?: string;
    onClearScanMessage?: () => void;
    onClearScanError?: () => void;
    // Edit mode
    isEditMode?: boolean;
    isReadOnly?: boolean;
    initialData?: Transaction;
    existingAttachment?: { url: string; name: string; type: 'image' | 'pdf' } | null;
    isAttachmentDeleted?: boolean;
    hasRemoteConflict?: boolean;
    showConflictDialog?: boolean;
    onApplyLatestVersion?: () => void;
    onKeepMyVersion?: () => void;
    onOpenConflictDialog?: () => void;
    onCloseConflictDialog?: () => void;
    onRequestDelete?: () => void;
    showDeleteConfirm?: boolean;
    onCloseDeleteConfirm?: () => void;
    onConfirmDelete?: () => void;
    onAddCategory?: (category: Omit<Category, 'id'>) => Promise<string | undefined>;
    showCategoryModal?: boolean;
    onOpenCategoryModal?: () => void;
    onCloseCategoryModal?: () => void;
    onCategorySaved?: (categoryId: string) => void;
    latestData?: Transaction;
}

// Ikon kategori di "Sering dipakai" dan "Semua kategori" wajib berukuran sama.
// Glyph 14px: di 12px beberapa ikon (mis. receipt) jadi kotak polos di layar DPR 1.
const CATEGORY_BADGE_SIZE = 24;
const CATEGORY_ICON_SIZE = 14;

// Layar < 360px: label tile grid cuma ±76px (di 320px), jadi font label dikecilkan supaya
// kata panjang (mis. "Perlengkapan", "Telekomunikasi") tidak pecah di tengah kata.
const NARROW_GRID_MEDIA = '@media (max-width: 359.95px)';
// Layar < 316px (mis. layar luar HP lipat 280px): grid jadi 2 kolom.
const TWO_COLUMN_GRID_MEDIA = '@media (max-width: 315.95px)';
const getNarrowGridLabelFontSize = (name: string) =>
    Math.max(...name.split(/[\s/]+/).map((word) => word.length)) >= 13 ? '0.625rem' : '0.6875rem';

// Browser tidak memberi titik wrap setelah "/" yang langsung diikuti huruf, jadi nama seperti
// "Sumbangan/Donasi" akan dipecah di tengah kata. <wbr> setelah "/" memberi titik wrap yang wajar.
const withSlashBreaks = (name: string) =>
    name.split('/').map((part, index) => (
        <React.Fragment key={index}>
            {index > 0 && <>/<wbr /></>}
            {part}
        </React.Fragment>
    ));

// className diteruskan karena Chip menyisipkan class MuiChip-icon ke elemen icon-nya.
// Warna sengaja bernama `bgColor`: Chip membaca prop `color` milik icon untuk variant warnanya.
const CategoryIconBadge: React.FC<{ icon: string; bgColor: string; className?: string }> = ({ icon, bgColor, className }) => (
    <Box
        className={className}
        sx={{
            width: CATEGORY_BADGE_SIZE,
            height: CATEGORY_BADGE_SIZE,
            flexShrink: 0,
            borderRadius: '50%',
            bgcolor: bgColor,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
        }}
    >
        <IconDisplay name={icon} size={CATEGORY_ICON_SIZE} sx={{ color: '#fff' }} />
    </Box>
);

// Selisih tinggi layout viewport vs visual viewport di atas angka ini dianggap
// keyboard. Selisih kecil biasanya scrollbar/pembulatan, bukan keyboard.
const KEYBOARD_MIN_HEIGHT = 80;
// Keyboard yang membesar lebih dari ini (mis. animasi bertahap) memicu scroll
// ulang ke input yang fokus. Perubahan kecil diabaikan supaya scroll user tidak ditarik.
const KEYBOARD_GROW_RESCROLL = 48;
// iOS kadang baru memperbarui offsetTop ~50ms SETELAH event resize, tanpa event lanjutan
// (WebKit bug 237851). Ukur ulang sekali lagi setelah event berhenti sejenak.
const VIEWPORT_SETTLE_MS = 250;
// Area terlihat di atas keyboard yang lebih pendek dari ini (praktis hanya landscape)
// tidak cukup untuk header + input + button Simpan: header disembunyikan dan bar dipadatkan.
const COMPACT_SHEET_HEIGHT = 220;

// Teks dari user (nama kategori, nama file, catatan) boleh pecah di mana saja kalau satu kata pun tidak muat.
// `wordBreak: 'break-word'` jadi fallback untuk Safari < 15.4 yang belum mengenal `overflowWrap: 'anywhere'`.
const WRAP_ANYWHERE_SX = { overflowWrap: 'anywhere', wordBreak: 'break-word' } as const;

type VisualViewportBox = { bottomInset: number; height: number; keyboardOpen: boolean };

// Saat keyboard virtual terbuka, Chrome Android & iOS Safari hanya mengecilkan
// visual viewport. Elemen `position: fixed; bottom: 0` tetap menempel di bawah
// layout viewport sehingga tertutup keyboard. Hook ini mengukur jarak bawah
// visual viewport ke bawah layout viewport supaya sheet (dan button Simpan)
// bisa diangkat tepat di atas keyboard.
const useVisualViewportBox = (
    active: boolean,
    layoutRef: React.RefObject<HTMLElement | null>
): VisualViewportBox | null => {
    const [box, setBox] = useState<VisualViewportBox | null>(null);

    useEffect(() => {
        const viewport = typeof window !== 'undefined' ? window.visualViewport : null;
        if (!active || !viewport) return undefined;

        let frame = 0;
        let settleTimer = 0;
        const measure = () => {
            // Pinch-zoom juga mengecilkan visual viewport, tapi itu bukan keyboard.
            if (Math.abs(viewport.scale - 1) > 0.01) {
                setBox(null);
                return;
            }
            // Tinggi containing block elemen fixed = tinggi backdrop (fixed; inset 0).
            // Lebih tepat daripada innerHeight yang ikut menghitung scrollbar.
            const layoutHeight = layoutRef.current?.getBoundingClientRect().height || window.innerHeight;
            const bottomInset = Math.max(0, Math.round(layoutHeight - viewport.height - viewport.offsetTop));
            const height = Math.round(viewport.height);
            // Ditentukan dari tinggi saja (bukan bottomInset): saat iOS menggeser visual
            // viewport sampai mentok bawah, bottomInset = 0 padahal keyboard masih terbuka.
            const keyboardOpen = layoutHeight - viewport.height > KEYBOARD_MIN_HEIGHT;
            setBox((prev) => (
                prev && prev.bottomInset === bottomInset && prev.height === height && prev.keyboardOpen === keyboardOpen
                    ? prev
                    : { bottomInset, height, keyboardOpen }
            ));
        };
        const measureOnFrame = () => {
            frame = 0;
            measure();
        };
        const scheduleMeasure = () => {
            window.clearTimeout(settleTimer);
            settleTimer = window.setTimeout(measure, VIEWPORT_SETTLE_MS);
            if (!frame) frame = window.requestAnimationFrame(measureOnFrame);
        };

        measure();
        viewport.addEventListener('resize', scheduleMeasure);
        viewport.addEventListener('scroll', scheduleMeasure);
        return () => {
            if (frame) window.cancelAnimationFrame(frame);
            window.clearTimeout(settleTimer);
            viewport.removeEventListener('resize', scheduleMeasure);
            viewport.removeEventListener('scroll', scheduleMeasure);
        };
    }, [active, layoutRef]);

    return box;
};

const QuickAddSheet: React.FC<QuickAddSheetProps> = ({
    open,
    type,
    amount,
    description,
    categoryId,
    date,
    attachment,
    categories,
    recentCategoryIds,
    onTypeChange,
    onAmountChange,
    onDescriptionChange,
    onCategoryChange,
    onDateChange,
    onAttachmentChange,
    onScanButtonClick,
    onScanCancelled,
    onSave,
    onClose,
    isSaving = false,
    error,
    isScanning = false,
    scanMessage,
    scanError,
    onClearScanMessage,
    onClearScanError,
    isEditMode = false,
    isReadOnly = false,
    initialData,
    existingAttachment,
    isAttachmentDeleted = false,
    hasRemoteConflict = false,
    showConflictDialog = false,
    onApplyLatestVersion,
    onKeepMyVersion,
    onOpenConflictDialog,
    onCloseConflictDialog,
    onRequestDelete,
    showDeleteConfirm = false,
    onCloseDeleteConfirm,
    onConfirmDelete,
    onAddCategory,
    showCategoryModal = false,
    onOpenCategoryModal,
    onCloseCategoryModal,
    onCategorySaved,
    latestData,
}) => {
    const { theme, isDark } = useTheme();
    const [displayAmount, setDisplayAmount] = useState('');
    const scanInputRef = useRef<HTMLInputElement>(null);
    // ID unik per sheet: dua sheet bisa ter-mount bersamaan (mis. edit + quick add),
    // dan ID duplicate membuat label lampiran membuka input milik sheet lain.
    const scanInputId = useId();
    const attachmentInputId = useId();
    const backdropRef = useRef<HTMLDivElement>(null);
    const contentRef = useRef<HTMLDivElement>(null);
    const viewportBox = useVisualViewportBox(open, backdropRef);
    const keyboardOpen = viewportBox?.keyboardOpen ?? false;
    const keyboardInset = viewportBox?.bottomInset ?? 0;
    const visibleHeight = viewportBox?.height ?? 0;

    // Header disembunyikan di area terlihat yang sangat pendek, dan baru muncul lagi setelah
    // keyboard ditutup: kalau header muncul di tengah mengetik (mis. keyboard memendek),
    // konten bergeser turun dan input yang sedang diketik bisa tertutup bar Simpan.
    const viewportTooShort = keyboardOpen && visibleHeight < COMPACT_SHEET_HEIGHT;
    const [headerHiddenUntilKeyboardCloses, setHeaderHiddenUntilKeyboardCloses] = useState(false);
    if (viewportTooShort && !headerHiddenUntilKeyboardCloses) setHeaderHiddenUntilKeyboardCloses(true);
    if (!keyboardOpen && headerHiddenUntilKeyboardCloses) setHeaderHiddenUntilKeyboardCloses(false);
    const hideHeader = keyboardOpen && (viewportTooShort || headerHiddenUntilKeyboardCloses);

    // Saat keyboard muncul atau area terlihat menyusut, input yang fokus bisa tertutup bar Simpan:
    // area konten digulir supaya input itu ke tengah lagi. Pengecualian: kalau user sendiri yang
    // menggulir input fokus keluar layar (mis. untuk memilih kategori), perubahan kecil (pan, bar
    // saran keyboard) tidak menarik scroll-nya balik; hanya keyboard yang membesar jauh.
    const scrolledAtHeightRef = useRef<number | null>(null);
    // Input fokus yang terakhir di-scroll keluar layar oleh user. Disimpan elemennya (bukan flag)
    // supaya pindah fokus ke input lain otomatis membatalkannya tanpa bergantung event focus
    // (WebKit tidak mengirim focusin saat <input type="date"> difokus).
    const scrolledAwayFocusRef = useRef<Element | null>(null);
    const getFocusedInsideContent = () => {
        const container = contentRef.current;
        const focused = document.activeElement;
        if (!container || !(focused instanceof HTMLElement) || !container.contains(focused)) return null;
        const target = focused.getBoundingClientRect();
        const visible = container.getBoundingClientRect();
        return { container, focused, target, visible, covered: target.top < visible.top || target.bottom > visible.bottom };
    };
    const handleContentScroll = () => {
        const focus = getFocusedInsideContent();
        scrolledAwayFocusRef.current = focus?.covered ? focus.focused : null;
    };
    useEffect(() => {
        if (!keyboardOpen) {
            scrolledAtHeightRef.current = null;
            scrolledAwayFocusRef.current = null;
            return;
        }
        const focus = getFocusedInsideContent();
        if (!focus) return;
        const lastHeight = scrolledAtHeightRef.current;
        if (!focus.covered) {
            scrolledAtHeightRef.current = visibleHeight;
            return;
        }
        const userScrolledItAway = scrolledAwayFocusRef.current === focus.focused;
        if (userScrolledItAway && lastHeight !== null && visibleHeight > lastHeight - KEYBOARD_GROW_RESCROLL) return;
        scrolledAtHeightRef.current = visibleHeight;
        const { container, target, visible } = focus;
        // Yang digulir hanya area konten, bukan scrollIntoView: scrollIntoView ikut
        // menggeser visual viewport sehingga sheet terlihat meloncat.
        container.scrollTop += (target.top + target.height / 2) - (visible.top + visible.height / 2);
    }, [keyboardOpen, visibleHeight, hideHeader]);

    const hasAttachment = !!(attachment || (existingAttachment && !isAttachmentDeleted));

    const handleScanFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) {
            onScanCancelled?.();
            return;
        }
        onAttachmentChange({ file, type: file.type === 'application/pdf' ? 'pdf' : 'image' });
        e.target.value = '';
    };

    useEffect(() => {
        if (open) {
            setDisplayAmount(formatRupiahInput(amount));
        }
    }, [open, amount]);

    const handleAmountInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        const raw = e.target.value.replace(/\D/g, '');
        const formatted = formatRupiahInput(raw);
        setDisplayAmount(formatted);
        onAmountChange(raw);
    };

    const handleAttachmentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        // Reset supaya memilih file yang sama lagi (mis. setelah "Hapus lampiran") tetap memicu change.
        e.target.value = '';
        if (!file) return;
        onAttachmentChange({ file, type: file.type === 'application/pdf' ? 'pdf' : 'image' });
    };

    const filteredCategories = categories.filter(c => c.type === type);
    const recentCats = recentCategoryIds
        .map(id => filteredCategories.find(c => c.id === id))
        .filter((c): c is NonNullable<typeof c> => !!c)
        .slice(0, 5);
    const otherCats = filteredCategories.filter(c => !recentCategoryIds.includes(c.id));

    if (!open) return null;

    return (
        <>
            {/* Backdrop */}
            <Box
                ref={backdropRef}
                sx={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    bgcolor: 'rgba(0, 0, 0, 0.5)',
                    zIndex: 1200,
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
                    left: 0,
                    right: 0,
                    zIndex: 1201,
                    bgcolor: 'background.paper',
                    // Saat keyboard terbuka sheet mengisi penuh area terlihat; sudut membulat
                    // hanya akan memperlihatkan backdrop di dua sudut atas.
                    borderTopLeftRadius: keyboardOpen ? 0 : 24,
                    borderTopRightRadius: keyboardOpen ? 0 : 24,
                    boxShadow: '0 -4px 24px rgba(0,0,0,0.15)',
                    display: 'flex',
                    flexDirection: 'column',
                    // Kalau tinggi tidak cukup (landscape + keyboard), kelebihannya dibuang ke atas,
                    // jadi yang tetap terlihat di atas keyboard adalah button Simpan, bukan header.
                    justifyContent: 'flex-end',
                    animation: 'slideUp 0.25s ease-out',
                    '@keyframes slideUp': {
                        from: { transform: 'translateY(100%)' },
                        to: { transform: 'translateY(0)' },
                    },
                }}
                // Nilai yang berubah mengikuti visual viewport sengaja lewat `style`, bukan sx:
                // tiap nilai sx baru membuat class CSS baru yang tidak pernah dibuang.
                style={{
                    bottom: keyboardInset,
                    maxHeight: keyboardOpen ? visibleHeight : '85vh',
                }}
            >
                {/* Handle (disembunyikan saat keyboard terbuka supaya ruang sempit dipakai untuk isi form) */}
                {!keyboardOpen && (
                    <Box sx={{ pt: 1.5, pb: 1, display: 'flex', justifyContent: 'center' }}>
                        <Box sx={{ width: 36, height: 4, borderRadius: 2, bgcolor: 'divider' }} />
                    </Box>
                )}

                {/* Header (disembunyikan di layar sangat pendek + keyboard supaya input yang diketik tetap terlihat) */}
                {!hideHeader && (
                    <Box sx={{ px: 3, pt: keyboardOpen ? 1 : 0, pb: keyboardOpen ? 1 : 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Typography variant="h6" fontWeight={700}>
                            {isEditMode ? (isReadOnly ? 'Detail Transaksi' : 'Edit Transaksi') : 'Catat Transaksi'}
                        </Typography>
                        <IconButton size="small" onClick={onClose} aria-label="Tutup">
                            <IconDisplay name="X" size={18} />
                        </IconButton>
                    </Box>
                )}

            {/* Content */}
            {/* overscrollBehavior contain: scroll konten tidak merambat ke halaman di belakang
                (di iOS, drag yang merambat saat keyboard terbuka membuat sheet goyang). */}
            <Box
                ref={contentRef}
                onScroll={handleContentScroll}
                sx={{ flex: 1, overflow: 'auto', overscrollBehavior: 'contain', px: 3, pb: keyboardOpen ? 1 : 2 }}
            >
                {isReadOnly && initialData && (
                    <Alert severity="info" sx={{ mb: 2 }}>
                        <Typography variant="body2" fontWeight={700} sx={{ mb: 0.5 }}>
                            Dibuat oleh: {initialData.createdByName || 'anggota lain'}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Transaksi ini hanya bisa diubah oleh pembuatnya.
                        </Typography>
                    </Alert>
                )}
                {hasRemoteConflict && !isReadOnly && (
                    <Alert severity="warning" sx={{ mb: 2 }}>
                        <Typography variant="body2" fontWeight={700} sx={{ mb: 0.5 }}>
                            Transaksi ini berubah di perangkat atau tab lain.
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Tinjau versi terbaru sebelum menyimpan supaya perubahan tidak saling timpa.
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1, mt: 1.5, flexWrap: 'wrap' }}>
                            <Button size="small" variant="outlined" color="warning" onClick={onApplyLatestVersion}>
                                Pakai versi terbaru
                            </Button>
                            <Button size="small" variant="contained" color="warning" onClick={onOpenConflictDialog}>
                                Bandingkan dulu
                            </Button>
                        </Box>
                    </Alert>
                )}
                {/* Type Toggle */}
                <Box
                    sx={{
                        display: 'flex',
                        bgcolor: 'action.hover',
                        borderRadius: 3,
                        p: 0.5,
                        mb: 3,
                    }}
                >
                    {(['EXPENSE', 'INCOME'] as TransactionType[]).map((t) => (
                        <Box
                            key={t}
                            component="button"
                            onClick={() => !isReadOnly && onTypeChange(t)}
                            disabled={isReadOnly}
                            sx={{
                                flex: 1,
                                py: 1.25,
                                px: 2,
                                border: 'none',
                                borderRadius: 2.5,
                                cursor: isReadOnly ? 'not-allowed' : 'pointer',
                                bgcolor: type === t ? 'background.paper' : 'transparent',
                                color: type === t ? (t === 'EXPENSE' ? 'error.main' : 'info.main') : 'text.secondary',
                                fontWeight: 700,
                                fontSize: 14,
                                fontFamily: 'inherit',
                                boxShadow: type === t ? 1 : 'none',
                                transition: 'all 0.15s',
                            }}
                        >
                            {t === 'EXPENSE' ? 'Pengeluaran' : 'Pemasukan'}
                        </Box>
                    ))}
                </Box>

                {/* Amount Input */}
                <Box sx={{ mb: 2 }}>
                    <TextField
                        fullWidth
                        value={displayAmount}
                        onChange={handleAmountInput}
                        placeholder="0"
                        disabled={isReadOnly}
                        inputProps={{
                            inputMode: 'numeric',
                            style: {
                                textAlign: 'center',
                                fontSize: 32,
                                fontWeight: 700,
                                fontVariantNumeric: 'tabular-nums',
                            },
                        }}
                        InputProps={{
                            startAdornment: (
                                <Typography sx={{ fontSize: 24, fontWeight: 700, color: 'text.disabled', mr: 1 }}>
                                    Rp
                                </Typography>
                            ),
                            sx: {
                                bgcolor: 'action.hover',
                                borderRadius: 3,
                                '&:before, &:after': { display: 'none' },
                                py: 1.5,
                            },
                        }}
                        error={!!error}
                        autoFocus
                    />
                </Box>

                {/* Description Input (Wajib) */}
                <Box sx={{ mb: 2.5 }}>
                    <TextField
                        fullWidth
                        size="small"
                        label="Catatan / Keterangan *"
                        value={description}
                        onChange={(e) => onDescriptionChange(e.target.value)}
                        placeholder="Contoh: Makan siang, Bensin, Parkir"
                        disabled={isReadOnly}
                        error={!!error && !description.trim()}
                        helperText={error}
                        slotProps={{
                            inputLabel: { shrink: true },
                        }}
                    />
                </Box>

                {/* AI Scan Struk — selalu terlihat */}
                <Box sx={{ mb: 2.5 }}>
                    <input
                        id={scanInputId}
                        ref={scanInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={handleScanFileChange}
                        style={{ display: 'none' }}
                    />
                    <Button
                        fullWidth
                        variant="outlined"
                        color="primary"
                        onClick={() => {
                            onScanButtonClick();
                            scanInputRef.current?.click();
                        }}
                        disabled={isScanning || isSaving || isReadOnly || !navigator.onLine}
                        startIcon={isScanning ? <CircularProgress size={16} /> : <IconDisplay name="Sparkles" size={16} />}
                        sx={{ borderRadius: 2.5, py: 1 }}
                    >
                        {isScanning ? 'Menganalisis struk...' : 'Scan Struk (AI)'}
                    </Button>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.75, textAlign: 'center' }}>
                        Foto struk dibaca AI, form terisi otomatis
                    </Typography>
                    {isScanning && (
                        <Alert severity="info" sx={{ mt: 1, py: 0.5, fontSize: 12 }}>
                            {scanMessage || 'Menganalisis struk...'}
                        </Alert>
                    )}
                    {scanError && !isScanning && (
                        <Alert severity="warning" sx={{ mt: 1, py: 0.5, fontSize: 12 }} onClose={onClearScanError}>
                            {scanError}
                        </Alert>
                    )}
                    {scanMessage && !isScanning && !scanError && (
                        <Alert severity="success" sx={{ mt: 1, py: 0.5, fontSize: 12 }} onClose={onClearScanMessage}>
                            {scanMessage}
                        </Alert>
                    )}
                </Box>

                {/* Frequent Categories */}
                {recentCats.length > 0 && (
                    <Box sx={{ mb: 3 }}>
                        <Typography variant="caption" fontWeight={600} color="text.secondary" sx={{ mb: 1.5, display: 'block' }}>
                            Sering dipakai
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                            {recentCats.map((cat) => (
                                <Chip
                                    key={cat.id}
                                    icon={<CategoryIconBadge icon={cat.icon} bgColor={cat.color} />}
                                    label={cat.name}
                                    onClick={() => !isReadOnly && onCategoryChange(cat.id)}
                                    disabled={isReadOnly}
                                    sx={{
                                        // Tinggi ikut isi: nama kategori panjang di-wrap, bukan dipotong ellipsis.
                                        height: 'auto',
                                        minHeight: 40,
                                        '& .MuiChip-label': { whiteSpace: 'normal', py: 0.75, ...WRAP_ANYWHERE_SX },
                                        px: 1,
                                        bgcolor: categoryId === cat.id ? theme.colors.accentLight : 'action.hover',
                                        color: categoryId === cat.id ? theme.colors.accent : 'text.primary',
                                        // Border selalu 2px (transparan kalau tidak dipilih): chip yang label-nya
                                        // wrap tidak berubah ukuran saat dipilih.
                                        border: '2px solid',
                                        borderColor: categoryId === cat.id ? theme.colors.accent : 'transparent',
                                        fontWeight: 600,
                                        '&:hover': {
                                            bgcolor: categoryId === cat.id ? theme.colors.accentLight : 'action.selected',
                                        },
                                    }}
                                />
                            ))}
                        </Box>
                    </Box>
                )}

                {/* All Categories */}
                <Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                        <Typography variant="caption" fontWeight={600} color="text.secondary">
                            Semua kategori
                        </Typography>
                        {onAddCategory && onOpenCategoryModal && !isReadOnly && (
                            <Button size="small" variant="text" startIcon={<IconDisplay name="Plus" size={14} />} onClick={onOpenCategoryModal} sx={{ textTransform: 'none' }}>
                                Kategori Baru
                            </Button>
                        )}
                    </Box>
                    <Box
                        sx={{
                            display: 'grid',
                            // minmax(0, 1fr): nama kategori panjang tidak melebarkan kolom keluar sheet.
                            gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
                            [TWO_COLUMN_GRID_MEDIA]: { gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' },
                            gap: 1,
                            overflow: 'visible',
                        }}
                    >
                        {otherCats.map((cat) => (
                            <Box
                                key={cat.id}
                                component="button"
                                onClick={() => !isReadOnly && onCategoryChange(cat.id)}
                                disabled={isReadOnly}
                                sx={{
                                    py: 1.5,
                                    // Padding samping kecil di HP supaya nama umum (mis. "Pendidikan",
                                    // "Transportasi") tetap muat satu baris di layar 320px.
                                    px: { xs: 0.5, sm: 1.5 },
                                    border: 'none',
                                    borderRadius: 2.5,
                                    cursor: 'pointer',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    gap: 0.75,
                                    bgcolor: categoryId === cat.id ? theme.colors.accentLight : 'action.hover',
                                    boxShadow: categoryId === cat.id ? `0 0 0 2px ${theme.colors.accent}` : 'none',
                                    transition: 'all 0.15s',
                                    '&:hover': {
                                        bgcolor: categoryId === cat.id ? theme.colors.accentLight : 'action.selected',
                                    },
                                    // Read-only: tile tampil pudar seperti chip "Sering dipakai" yang disabled.
                                    '&:disabled': { opacity: 0.38, cursor: 'default', pointerEvents: 'none' },
                                }}
                            >
                                <CategoryIconBadge icon={cat.icon} bgColor={cat.color} />
                                {/* Nama yang tidak muat di-wrap ke baris berikutnya, bukan dipotong. */}
                                <Typography
                                    variant="caption"
                                    fontWeight={600}
                                    textAlign="center"
                                    sx={{
                                        width: '100%',
                                        ...WRAP_ANYWHERE_SX,
                                        [NARROW_GRID_MEDIA]: { fontSize: getNarrowGridLabelFontSize(cat.name) },
                                        color: categoryId === cat.id ? theme.colors.accent : 'text.primary',
                                    }}
                                >
                                    {withSlashBreaks(cat.name)}
                                </Typography>
                            </Box>
                        ))}
                    </Box>
                </Box>

                {/* Detail (tanggal, lampiran) — selalu tampil. Nama lampiran di bawah di-wrap: teks nowrap yang
                    panjang dulu melebarkan kolom grid sehingga field Tanggal & button hapus lampiran keluar layar. */}
                <Box sx={{ mt: 2.5, display: 'grid', gap: 2 }}>
                    <TextField
                        fullWidth
                        size="small"
                        label="Tanggal"
                        type="date"
                        value={date}
                        onChange={(e) => onDateChange(e.target.value)}
                        disabled={isReadOnly}
                        slotProps={{ inputLabel: { shrink: true } }}
                    />
                    {/* Mode read-only tanpa lampiran: baris lampiran tidak dirender sama sekali (button tambah
                        pun tidak), jadi tidak ada baris grid kosong yang menambah jarak ke bar Simpan. */}
                    {(!isReadOnly || (existingAttachment && !isAttachmentDeleted)) && (
                        <Box>
                            <input
                                id={attachmentInputId}
                                type="file"
                                accept="image/*,application/pdf"
                                onChange={handleAttachmentChange}
                                style={{ display: 'none' }}
                            />
                            {existingAttachment && !isAttachmentDeleted && !attachment ? (
                                <Paper variant="outlined" sx={{ p: 1.5, bgcolor: 'action.hover', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
                                        <IconDisplay name={existingAttachment.type === 'image' ? 'Image' : 'FileText'} size={20} sx={{ color: theme.colors.textMuted, flexShrink: 0 }} />
                                        {/* Nama file tampil utuh (wrap), sama seperti lampiran baru. */}
                                        <Typography variant="body2" sx={{ flex: 1, minWidth: 0, ...WRAP_ANYWHERE_SX }}>{existingAttachment.name}</Typography>
                                    </Box>
                                    {!isReadOnly && (
                                        <IconButton size="small" onClick={() => onAttachmentChange(null)} disabled={isSaving || isScanning} aria-label="Hapus lampiran">
                                            <IconDisplay name="X" size={16} />
                                        </IconButton>
                                    )}
                                </Paper>
                            ) : !isReadOnly ? (
                                <>
                                    {/* Nama file dari kamera/WhatsApp sering panjang tanpa spasi: dibiarkan pecah di mana saja. */}
                                    <Button component="label" htmlFor={attachmentInputId} variant="outlined" fullWidth disabled={isScanning || isSaving} sx={WRAP_ANYWHERE_SX}>
                                        {attachment ? `Lampiran: ${attachment.file.name}` : 'Tambah foto atau PDF'}
                                    </Button>
                                    {attachment && (
                                        <Button size="small" color="inherit" onClick={() => onAttachmentChange(null)} sx={{ mt: 0.5 }}>
                                            Hapus lampiran
                                        </Button>
                                    )}
                                </>
                            ) : null}
                        </Box>
                    )}
                </Box>
            </Box>

            {/* Floating Action Bar — selalu terlihat di bawah sheet, termasuk saat keyboard terbuka.
                Saat header disembunyikan (area terlihat sangat pendek) bar ikut dipadatkan supaya
                input setinggi 40px tetap muat di atasnya. */}
            <Box
                sx={{
                    position: 'relative',
                    zIndex: 1,
                    px: 3,
                    pt: hideHeader ? 0.75 : 1.5,
                    // Safe-area hanya relevan saat sheet menempel di tepi bawah layar (keyboard tertutup).
                    pb: hideHeader ? 0.75 : keyboardOpen ? 1.5 : 'calc(12px + env(safe-area-inset-bottom, 0px))',
                    borderTop: '1px solid',
                    // Di dark mode garis divider & shadow tipis nyaris tidak terlihat di atas paper gelap,
                    // jadi bar tidak terkesan floating: pakai garis lebih terang + shadow lebih pekat.
                    borderColor: isDark ? 'rgba(255, 255, 255, 0.24)' : 'divider',
                    bgcolor: 'background.paper',
                    boxShadow: isDark ? '0 -10px 24px rgba(0, 0, 0, 0.55)' : '0 -8px 20px rgba(0, 0, 0, 0.08)',
                }}
            >
                {/* Saat keyboard terbuka, Hapus disembunyikan supaya ruang sempit tetap cukup untuk button Update. */}
                {isEditMode && onRequestDelete && !isReadOnly && !keyboardOpen && (
                    <Button
                        fullWidth
                        variant="outlined"
                        color="error"
                        onClick={onRequestDelete}
                        disabled={isSaving || isScanning}
                        startIcon={<IconDisplay name="Trash2" size={18} />}
                        sx={{ mb: 1, borderRadius: 3, py: 1 }}
                    >
                        Hapus Transaksi
                    </Button>
                )}
                <Button
                    fullWidth
                    variant="contained"
                    // Jangan `onClick={onSave}`: click event akan masuk sebagai argumen pertama
                    // handleSave (forceSave) sehingga conflict check versi terlewati.
                    onClick={() => onSave()}
                    disabled={isSaving || isReadOnly || !displayAmount || !categoryId}
                    sx={{
                        py: hideHeader ? 1 : 1.5,
                        borderRadius: 3,
                        fontSize: 16,
                        fontWeight: 700,
                        bgcolor: theme.colors.accent,
                        boxShadow: '0 6px 16px rgba(0, 0, 0, 0.18)',
                        '&:hover': { bgcolor: theme.colors.accentHover },
                    }}
                >
                    {isSaving ? 'Menyimpan...' : isEditMode ? 'Update' : 'Simpan'}
                </Button>
            </Box>
        </Box>

        {/* Conflict Dialog */}
        <Dialog open={showConflictDialog} onClose={isSaving ? undefined : onCloseConflictDialog} maxWidth="sm" fullWidth>
            <DialogContent sx={{ pt: 3 }}>
                <Typography variant="h6" fontWeight={700} sx={{ mb: 1 }}>
                    Versi Transaksi Berubah
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Ada perubahan dari tab atau perangkat lain sejak form ini dibuka. Pilih versi mana yang ingin kamu lanjutkan.
                </Typography>
                {/* Catatan di-wrap di mana saja: catatan panjang tanpa spasi (mis. URL) tidak melebarkan dialog ke samping. */}
                <Box sx={{ display: 'grid', gap: 1.5 }}>
                    <Paper variant="outlined" sx={{ p: 1.5 }}>
                        <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>
                            Versi terbaru di server
                        </Typography>
                        <Typography variant="body2">Jumlah: {latestData ? new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(latestData.amount) : '-'}</Typography>
                        <Typography variant="body2">Tanggal: {latestData?.date || '-'}</Typography>
                        <Typography variant="body2" sx={WRAP_ANYWHERE_SX}>Catatan: {latestData?.description || '-'}</Typography>
                    </Paper>
                    <Paper variant="outlined" sx={{ p: 1.5 }}>
                        <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>
                            Versi yang sedang kamu edit
                        </Typography>
                        <Typography variant="body2">Jumlah: {displayAmount ? `Rp ${displayAmount}` : '-'}</Typography>
                        <Typography variant="body2">Tanggal: {date || '-'}</Typography>
                        <Typography variant="body2" sx={WRAP_ANYWHERE_SX}>Catatan: {description || '-'}</Typography>
                    </Paper>
                </Box>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 3, gap: 1, flexWrap: 'wrap' }}>
                <Button onClick={onCloseConflictDialog} disabled={isSaving}>Tutup</Button>
                <Button variant="outlined" color="warning" onClick={onApplyLatestVersion} disabled={isSaving}>Pakai versi terbaru</Button>
                <Button variant="contained" color="warning" onClick={onKeepMyVersion} disabled={isSaving}>Simpan versi saya</Button>
            </DialogActions>
        </Dialog>

        {/* Delete Confirm */}
        <ConfirmDialog
            isOpen={showDeleteConfirm}
            onClose={onCloseDeleteConfirm || (() => {})}
            onConfirm={onConfirmDelete || (() => {})}
            title="Hapus Transaksi"
            message={
                <Box>
                    <Typography sx={{ mb: 1 }}>Apakah Anda yakin ingin menghapus transaksi ini?</Typography>
                    <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: 'action.hover' }}>
                        <Typography fontWeight={600}>{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(initialData?.amount || 0)}</Typography>
                        <Typography variant="body2" color="text.secondary">{initialData?.description || 'Tidak ada catatan'}</Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>Tindakan ini tidak dapat dibatalkan.</Typography>
                </Box>
            }
            confirmText="Hapus"
            cancelText="Batal"
            type="danger"
            icon="Trash2"
        />

        {/* Category Form Modal */}
        {onAddCategory && onCloseCategoryModal && onCategorySaved && (
            <CategoryFormModal
                isOpen={showCategoryModal}
                defaultType={type}
                categories={categories}
                onClose={onCloseCategoryModal}
                onSave={async (categoryData) => {
                    const newCategoryId = await onAddCategory(categoryData);
                    if (newCategoryId) onCategorySaved(newCategoryId);
                }}
            />
        )}
    </>
    );
};

export default QuickAddSheet;
