/**
 * Response Formatter Service
 * Formats query results into user-friendly messages
 */

import { CategoryData, TransactionDetail } from './queryService';

export function escapeMarkdown(text: string | number | null | undefined): string {
    return String(text ?? '').replace(/([_*\[\]()~`>#+\-=|{}.!\\])/g, '\\$1');
}

export function withAccountHeader(message: string, accountName?: string): string {
    if (!accountName) return message;
    return `📁 *Akun: ${escapeMarkdown(accountName)}*\n\n${message}`;
}

/**
 * Convert Lucide icon name to emoji
 */
function iconToEmoji(iconName: string): string {
    const iconMap: { [key: string]: string } = {
        // Finance & Money
        'Wallet': '👛',
        'PiggyBank': '🐷',
        'DollarSign': '💵',
        'CreditCard': '💳',
        'Banknote': '💵',
        'Coins': '🪙',
        'TrendingUp': '📈',
        'TrendingDown': '📉',
        'BarChart': '📊',
        'BarChart2': '📊',
        'PieChart': '📊',
        'LineChart': '📈',
        'Receipt': '🧾',
        'Calculator': '🧮',
        'Percent': '💯',
        'CircleDollarSign': '💰',
        'BadgeDollarSign': '💰',

        // Work & Business
        'Briefcase': '💼',
        'Building': '🏢',
        'Building2': '🏛️',
        'Factory': '🏭',
        'Landmark': '🏛️',
        'Store': '🏪',
        'ShoppingCart': '🛒',
        'Package': '📦',
        'Boxes': '📦',
        'Archive': '🗄️',
        'FileText': '📄',
        'ClipboardList': '📋',

        // Food & Drink
        'Utensils': '🍴',
        'Coffee': '☕',
        'Pizza': '🍕',
        'Beer': '🍺',
        'Wine': '🍷',
        'Milk': '🥛',
        'IceCream2': '🍦',
        'Cake': '🍰',
        'Cookie': '🍪',
        'Apple': '🍎',
        'Salad': '🥗',
        'Soup': '🍲',
        'Sandwich': '🥪',
        'Beef': '🥩',
        'Fish': '🐟',
        'Egg': '🥚',
        'CupSoda': '🥤',
        'Martini': '🍸',
        'UtensilsCrossed': '🍽️',
        'ChefHat': '👨‍🍳',

        // Transport & Travel
        'Car': '🚗',
        'Bus': '🚌',
        'Bike': '🚲',
        'Plane': '✈️',
        'Train': '🚆',
        'Ship': '🚢',
        'Fuel': '⛽',
        'ParkingCircle': '🅿️',
        'Navigation': '🧭',
        'Map': '🗺️',
        'MapPin': '📍',
        'Compass': '🧭',
        'Globe': '🌐',
        'Anchor': '⚓',
        'Rocket': '🚀',
        'Truck': '🚚',
        'Sailboat': '⛵',
        'Tractor': '🚜',

        // Shopping & Lifestyle
        'ShoppingBag': '🛍️',
        'Gift': '🎁',
        'Tag': '🏷️',
        'Tags': '🏷️',
        'Ticket': '🎫',
        'Gem': '💎',
        'Crown': '👑',
        'Shirt': '👕',
        'Glasses': '👓',
        'Watch': '⌚',
        'Scissors': '✂️',
        'Sparkles': '✨',
        'Star': '⭐',
        'Heart': '❤️',
        'Flower': '🌸',
        'Flower2': '🌺',
        'Palette': '🎨',
        'Paintbrush': '🖌️',

        // Electronics & Tech
        'Smartphone': '📱',
        'Laptop': '💻',
        'Monitor': '🖥️',
        'Tv': '📺',
        'Tablet': '📱',
        'Camera': '📷',
        'Headphones': '🎧',
        'Speaker': '🔊',
        'Radio': '📻',
        'Wifi': '📶',
        'Bluetooth': '📶',
        'Battery': '🔋',
        'Cable': '🔌',
        'Cpu': '💾',
        'HardDrive': '💿',
        'Printer': '🖨️',
        'Mouse': '🖱️',
        'Keyboard': '⌨️',
        'Gamepad': '🎮',
        'Joystick': '🕹️',

        // Home & Utilities
        'Home': '🏠',
        'Bed': '🛏️',
        'Sofa': '🛋️',
        'Lamp': '💡',
        'LampDesk': '🕯️',
        'Lightbulb': '💡',
        'Zap': '⚡',
        'Plug': '🔌',
        'Thermometer': '🌡️',
        'Fan': '💨',
        'AirVent': '💨',
        'Droplet': '💧',
        'Droplets': '💦',
        'Flame': '🔥',
        'Snowflake': '❄️',
        'Wind': '💨',
        'Hammer': '🔨',
        'Wrench': '🔧',
        'Key': '🔑',
        'Lock': '🔒',
        'DoorOpen': '🚪',
        'Trash2': '🗑️',
        'Recycle': '♻️',
        'Leaf': '🍃',
        'TreePine': '🌲',
        'Trees': '🌳',

        // Health & Wellness
        'HeartPulse': '💗',
        'Stethoscope': '🩺',
        'Pill': '💊',
        'Syringe': '💉',
        'Activity': '📈',
        'Dumbbell': '🏋️',
        'PersonStanding': '🚶',
        'Footprints': '👣',
        'Brain': '🧠',
        'Eye': '👁️',
        'Ear': '👂',
        'Hand': '✋',
        'CircleUser': '👤',
        'Smile': '😊',
        'Frown': '☹️',
        'Sun': '☀️',
        'Moon': '🌙',
        'CloudSun': '⛅',
        'Umbrella': '☂️',
        'Shield': '🛡️',
        'ShieldCheck': '🛡️',

        // Education & Kids
        'BookOpen': '📖',
        'Book': '📚',
        'BookMarked': '📖',
        'Notebook': '📓',
        'GraduationCap': '🎓',
        'School': '🏫',
        'Pencil': '✏️',
        'PenTool': '🖊️',
        'Highlighter': '🖍️',
        'Eraser': '🧹',
        'Ruler': '📏',
        'Backpack': '🎒',
        'Baby': '👶',
        'ToyBrick': '🧸',
        'Puzzle': '🧩',

        // Entertainment
        'Music': '🎵',
        'Music2': '🎶',
        'Music3': '🎼',
        'Music4': '🎹',
        'Mic': '🎤',
        'Mic2': '🎙️',
        'Video': '📹',
        'Film': '🎬',
        'Clapperboard': '🎬',
        'Popcorn': '🍿',
        'Dice1': '🎲',
        'Dice5': '🎲',
        'Trophy': '🏆',
        'Medal': '🏅',

        // Nature & Outdoors
        'Mountain': '⛰️',
        'MountainSnow': '🏔️',
        'Waves': '🌊',
        'Sunrise': '🌅',
        'Sunset': '🌇',
        'Cloud': '☁️',
        'CloudRain': '🌧️',
        'CloudSnow': '🌨️',
        'Rainbow': '🌈',
        'Bird': '🐦',
        'Cat': '🐱',
        'Dog': '🐶',
        'Bug': '🐛',
        'Rabbit': '🐰',
        'Squirrel': '🐿️',
        'Tent': '⛺',
        'Binoculars': '🔭',
        'Flashlight': '🔦',

        // Religious & Spiritual
        'Church': '⛪',
        'Cross': '✝️',
        'BookHeart': '📖',

        // Communication & Social
        'Phone': '📞',
        'PhoneCall': '📞',
        'Mail': '✉️',
        'MessageCircle': '💬',
        'Send': '📤',
        'Share': '↗️',
        'Users': '👥',
        'UserPlus': '➕',
        'UserCheck': '✅',
        'Handshake': '🤝',
        'PartyPopper': '🎉',

        // Default
        'Default': '📦'
    };

    return iconMap[iconName] || iconMap['Default'];
}

/**
 * Emoji mapping for categories (legacy - for backward compatibility)
 */
const CATEGORY_EMOJI: { [key: string]: string } = {
    'Food': '🍔',
    'Transportation': '🚗',
    'Shopping': '🛒',
    'Health': '💊',
    'Entertainment': '🎬',
    'Bills': '📄',
    'Other': '📦'
};

/**
 * Format number to Indonesian Rupiah
 */
function formatRupiah(amount: number): string {
    if (amount >= 1_000_000) {
        return `Rp ${(amount / 1_000_000).toFixed(1)}jt`;
    } else if (amount >= 1_000) {
        return `Rp ${(amount / 1_000).toFixed(0)}k`;
    } else {
        return `Rp ${amount.toLocaleString('id-ID')}`;
    }
}

/**
 * Format exact Rupiah amount
 */
function formatExactRupiah(amount: number): string {
    return `Rp ${amount.toLocaleString('id-ID')}`;
}

/**
 * Format date to Indonesian format (e.g., "27 Jan")
 */
export function formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agt', 'Sep', 'Okt', 'Nov', 'Des'];
    const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    return `${date.getDate()} ${months[date.getMonth()]} - ${days[date.getDay()]}`;
}

/**
 * Format expense query response
 */
export function formatExpenseResponse(
    total: number,
    count: number,
    timeRange: string
): string {
    const average = count > 0 ? total / count : 0;

    return `💰 *Pengeluaran ${timeRange}*: ${formatExactRupiah(total)}

📊 Detail:
• ${count} transaksi
• Rata-rata: ${formatRupiah(average)}/transaksi`;
}

/**
 * Format income query response
 */
export function formatIncomeResponse(
    total: number,
    count: number,
    timeRange: string
): string {
    return `💵 *Pemasukan ${timeRange}*: ${formatExactRupiah(total)}

📊 Detail:
• ${count} transaksi`;
}

/**
 * Format balance response
 */
export function formatBalanceResponse(balance: number, timeRangeText?: string): string {
    const isZero = balance === 0;
    const emoji = isZero ? 'ℹ️' : balance > 0 ? '💰' : '⚠️';
    const status = isZero ? 'Saldo nol' : balance > 0 ? 'Saldo positif' : 'Saldo negatif';
    const periodText = timeRangeText || '';

    return `${emoji} *Saldo kamu${periodText}*: ${formatExactRupiah(balance)}

${status}`;
}

/**
 * Format category breakdown response
 */
export function formatCategoryBreakdown(
    categories: CategoryData[],
    timeRange: string
): string {
    if (categories.length === 0) {
        return `📊 Belum ada pengeluaran ${timeRange}.`;
    }

    const totalAmount = categories.reduce((sum, cat) => sum + cat.amount, 0);
    const lines = categories.slice(0, 5).map(cat => {
        const emoji = cat.icon ? iconToEmoji(cat.icon) : (CATEGORY_EMOJI[cat.category] || '📦');
        return `${emoji} ${escapeMarkdown(cat.category)}: ${formatRupiah(cat.amount)} (${cat.percentage.toFixed(0)}%)`;
    });

    return `📊 *Pengeluaran per kategori (${timeRange})*:

${lines.join('\n')}

💰 Total: ${formatExactRupiah(totalAmount)}`;
}

export function formatTransactionDetails(
    details: TransactionDetail[],
    timeRange: string,
    notice?: string
): string {
    if (details.length === 0) {
        return `📋 Belum ada transaksi ${timeRange}.`;
    }

    // Separate income and expenses
    const expenses = details.filter(d => d.type === 'EXPENSE');
    const income = details.filter(d => d.type === 'INCOME');

    const totalExpense = expenses.reduce((sum, item) => sum + item.amount, 0);
    const totalIncome = income.reduce((sum, item) => sum + item.amount, 0);
    const netBalance = totalIncome - totalExpense;

    // Build header with summary
    let header = `📋 *Detail transaksi ${timeRange}*\n\n`;
    header += `💰 Ringkasan:\n`;
    if (income.length > 0) {
        header += `  ➕ Pemasukan: ${formatExactRupiah(totalIncome)} (${income.length}x)\n`;
    }
    if (expenses.length > 0) {
        header += `  ➖ Pengeluaran: ${formatExactRupiah(totalExpense)} (${expenses.length}x)\n`;
    }
    if (income.length > 0 && expenses.length > 0) {
        header += `  💎 Saldo: ${formatExactRupiah(netBalance)}\n`;
    }
    header += `\n`;

    const noticeText = notice ? `${notice}\n\n` : '';

    // Show date if range is more than 1 day
    const showDate = !['hari ini', 'kemarin'].includes(timeRange.toLowerCase());

    if (showDate) {
        // Group by date
        const grouped: { [key: string]: TransactionDetail[] } = {};

        details.forEach(item => {
            const dateKey = formatDate(item.date);
            if (!grouped[dateKey]) grouped[dateKey] = [];
            grouped[dateKey].push(item);
        });

        // Create sections from grouped data
        const sections = Object.keys(grouped).map(date => {
            const items = grouped[date].map((item) => {
                const emoji = item.icon ? iconToEmoji(item.icon) : (CATEGORY_EMOJI[item.category] || '📦');
                const typeIndicator = item.type === 'INCOME' ? '➕' : '➖';
                return `${typeIndicator} ${escapeMarkdown(item.description)}\n  💵 ${formatExactRupiah(item.amount)} • ${emoji} ${escapeMarkdown(item.category)}`;
            }).join('\n');
            return `\n📅 *${escapeMarkdown(date)}*\n${items}`;
        }).join('\n');

        return header + noticeText + sections;
    } else {
        // Simple list for single day
        const items = details.map((item, index) => {
            const emoji = item.icon ? iconToEmoji(item.icon) : (CATEGORY_EMOJI[item.category] || '📦');
            const typeIndicator = item.type === 'INCOME' ? '➕' : '➖';
            return `\n${index + 1}. ${typeIndicator} *${escapeMarkdown(item.description)}*\n   💵 ${formatExactRupiah(item.amount)} • ${emoji} ${escapeMarkdown(item.category)}`;
        }).join('');
        return header + noticeText + items;
    }
}

/**
 * Format manual transaction added confirmation
 */
export function formatTransactionAdded(
    amount: number,
    category: string,
    description: string
): string {
    const emoji = CATEGORY_EMOJI[category] || '📦';

    return `✅ *Transaksi berhasil ditambahkan!*

💰 ${formatExactRupiah(amount)}
${emoji} Kategori: ${escapeMarkdown(category)}
📝 Deskripsi: ${escapeMarkdown(description)}
📅 Tanggal: ${new Date().toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
    })}`;
}

export function formatTransactionDraftPreview(
    items: Array<{ amount: number; description: string; categoryName: string }>,
    usedAI: boolean
): string {
    const saveLabel = items.length > 1 ? 'Simpan Semua' : 'Simpan';
    const header = items.length > 1
        ? `🧾 *Cek Dulu Sebelum Disimpan*\n\nSaya menemukan *${items.length} transaksi* dari pesan kamu.\n`
        : `🧾 *Cek Dulu Sebelum Disimpan*\n\nSaya menemukan *1 transaksi* dari pesan kamu.\n`;
    const parserNotice = usedAI
        ? `\n🤖 Dibantu AI karena format pesannya cukup bebas.\n`
        : `\n⚡ Diparse cepat tanpa AI karena formatnya sederhana.\n`;
    const lines = items.map((item, index) => (
        `${index + 1}. *${escapeMarkdown(item.description)}*\n` +
        `   💰 ${formatExactRupiah(item.amount)}\n` +
        `   📁 ${escapeMarkdown(item.categoryName)}`
    )).join('\n\n');
    const editHint = items.length > 1
        ? `\nKalau ada item yang salah, klik tombol *Hapus 1 / Hapus 2 / ...* dulu.\n`
        : '';

    return `${header}${parserNotice}\n${lines}\n${editHint}\nKlik *${saveLabel}* kalau sudah benar.`;
}

export function formatTransactionBatchAdded(
    items: Array<{ amount: number; description: string; categoryName: string }>
): string {
    const totalAmount = items.reduce((sum, item) => sum + item.amount, 0);
    const list = items.slice(0, 5).map((item, index) => (
        `${index + 1}. ${escapeMarkdown(item.description)} • ${formatExactRupiah(item.amount)} • ${escapeMarkdown(item.categoryName)}`
    )).join('\n');
    const moreNotice = items.length > 5 ? `\n... dan ${items.length - 5} transaksi lainnya` : '';

    return `✅ *Transaksi berhasil ditambahkan!*\n\n` +
        `📦 Total transaksi: *${items.length}*\n` +
        `💰 Total nominal: *${formatExactRupiah(totalAmount)}*\n\n` +
        `${list}${moreNotice}`;
}

/**
 * Format unknown intent response
 */
export function formatUnknownIntent(): string {
    return `🤔 *Maaf, saya belum mengerti.*

Coba:
• "berapa pengeluaran minggu ini?"
• "tambah 50000 makan siang"
• "kategori paling boros bulan ini"

Atau ketik /help untuk panduan lengkap.`;
}

/**
 * Format clarification request
 */
export function formatClarification(clarification: string): string {
    return `❓ ${clarification}`;
}

/**
 * Format category list (master data)
 */
export function formatCategoryList(categories: Array<{ id: string; name: string; type?: string }>): string {
    if (!categories || categories.length === 0) {
        return `📋 Belum ada kategori yang dibuat.

💡 Buat kategori baru di aplikasi web DompetCerdas.`;
    }

    const expenseCategories = categories.filter(c => c.type === 'EXPENSE' || !c.type);
    const incomeCategories = categories.filter(c => c.type === 'INCOME');

    let response = `📋 *Daftar Kategori Tersedia*\n\n`;

    if (expenseCategories.length > 0) {
        response += `💸 *Pengeluaran* (${expenseCategories.length} kategori)\n`;
        expenseCategories.forEach((cat, index) => {
            response += `   ${index + 1}. ${escapeMarkdown(cat.name)}\n`;
        });
        response += '\n';
    }

    if (incomeCategories.length > 0) {
        response += `💰 *Pemasukan* (${incomeCategories.length} kategori)\n`;
        incomeCategories.forEach((cat, index) => {
            response += `   ${index + 1}. ${escapeMarkdown(cat.name)}\n`;
        });
        response += '\n';
    }

    response += `---\n💡 *Tips:*\n`;
    response += `• Ketik "breakdown bulan ini" untuk lihat pengeluaran per kategori\n`;
    response += `• Ketik "detail kategori Food" untuk lihat transaksi kategori tertentu`;

    return response;
}

/**
 * Format financial advice response
 */
export function formatFinancialAdvice(advice: string): string {
    return `🤖 *AI Financial Advisor - DompetCerdas*\n\n${advice}\n\n---\n💬 *Mau tanya lebih lanjut?*\nContoh: "tips hemat kategori Food", "kategori mana yang bisa dikurangi?"`;
}

/**
 * Format savings strategy response
 */
export function formatSavingsStrategy(strategy: string): string {
    return `💰 *Strategi Hemat - DompetCerdas*\n\n${strategy}\n\n---\n💬 *Perlu analisa lebih detail?*\nKetik: "analisa pengeluaranku" atau "gimana keuanganku?"`;
}

/**
 * Format expense analysis response
 */
export function formatExpenseAnalysis(analysis: string): string {
    return `🔍 *Analisa Pengeluaran - DompetCerdas*\n\n${analysis}\n\n---\n💬 *Butuh strategi hemat?*\nKetik: "tips hemat bulan depan" atau "saran biar hemat"`;
}

export function formatTelegramAccountStatus(
    accountName: string | undefined,
    accounts: Array<{ id: string; name: string; type?: string }>
): string {
    const lines = accounts.map((account, index) => {
        const marker = account.name === accountName ? '✅' : '•';
        return `${marker} ${index + 1}. ${escapeMarkdown(account.name)}`;
    });

    return `⚙️ *Akun Telegram*\n\n` +
        `Akun aktif saat ini: *${escapeMarkdown(accountName || 'Belum dipilih')}*\n\n` +
        `Daftar akun:\n${lines.join('\n')}`;
}

export function formatTelegramAccountUpdated(accountName: string): string {
    return `✅ *Akun Telegram berhasil diganti*\n\nSekarang bot akan memakai akun: *${escapeMarkdown(accountName)}*`;
}
