/**
 * MoneyNote – Sổ chi tiêu cá nhân
 * Đáp ứng đầy đủ chức năng F01 -> F12 theo đề bài
 */

// 1. DANH MỤC MẶC ĐỊNH THEO ĐỀ BÀI
const CATEGORIES = {
    expense: [
        { name: 'Ăn uống', icon: 'fa-utensils', color: '#EF4444' },
        { name: 'Đi lại', icon: 'fa-motorcycle', color: '#F59E0B' },
        { name: 'Mua sắm', icon: 'fa-bag-shopping', color: '#8B5CF6' },
        { name: 'Học tập', icon: 'fa-graduation-cap', color: '#3B82F6' },
        { name: 'Giải trí', icon: 'fa-gamepad', color: '#EC4899' },
        { name: 'Hóa đơn', icon: 'fa-file-invoice-dollar', color: '#14B8A6' },
        { name: 'Khác', icon: 'fa-ellipsis', color: '#6B7280' }
    ],
    income: [
        { name: 'Lương', icon: 'fa-money-bill-wave', color: '#0E7A55' },
        { name: 'Học bổng', icon: 'fa-award', color: '#2563EB' },
        { name: 'Được cho', icon: 'fa-gift', color: '#D97706' },
        { name: 'Khác', icon: 'fa-coins', color: '#6B7280' }
    ]
};

// Khoá lưu trữ localStorage (F06)
const STORAGE_KEYS = {
    TRANSACTIONS: 'moneynote_transactions_v1',
    BUDGETS: 'moneynote_budgets_v1',
    THEME: 'moneynote_theme_v1'
};

// Trạng thái ứng dụng
let transactions = [];
let budgets = {};
let currentMonth = getCurrentYearMonth();
let selectedModalType = 'expense';
let selectedModalCategory = CATEGORIES.expense[0].name;
let editingTxId = null;
let pendingDeleteId = null;

// 2. HÀM TIỆN ÍCH ĐỊNH DẠNG
function getCurrentYearMonth() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
}

function formatVND(amount) {
    const num = Number(amount) || 0;
    return num.toLocaleString('vi-VN') + ' ₫';
}

function formatDateVN(dateStr) {
    if (!dateStr) return '';
    const [y, m, d] = dateStr.split('-');
    return `${d}/${m}/${y}`;
}

function getCategoryMeta(type, catName) {
    const list = CATEGORIES[type] || CATEGORIES.expense;
    return list.find(c => c.name === catName) || list[list.length - 1];
}

// 3. KHỞI TẠO 10 GIAO DỊCH MẪU KHI MỞ LẦN ĐẦU
function generateSampleTransactions(ym) {
    return [
        { id: 'tx_1', type: 'income', amount: 3500000, category: 'Được cho', date: `${ym}-01`, payment: 'Chuyển khoản', note: 'Gia đình gửi tiền sinh hoạt tháng' },
        { id: 'tx_2', type: 'income', amount: 2000000, category: 'Lương', date: `${ym}-05`, payment: 'Chuyển khoản', note: 'Lương trợ giảng part-time' },
        { id: 'tx_3', type: 'expense', amount: 1500000, category: 'Hóa đơn', date: `${ym}-05`, payment: 'Chuyển khoản', note: 'Tiền phòng trọ và điện nước' },
        { id: 'tx_4', type: 'expense', amount: 45000, category: 'Ăn uống', date: `${ym}-06`, payment: 'Tiền mặt', note: 'Ăn trưa cơm gà ở quán quen' },
        { id: 'tx_5', type: 'expense', amount: 80000, category: 'Đi lại', date: `${ym}-08`, payment: 'Tiền mặt', note: 'Đổ xăng xe máy đi học' },
        { id: 'tx_6', type: 'expense', amount: 320000, category: 'Học tập', date: `${ym}-10`, payment: 'Ví điện tử', note: 'Mua giáo trình và tài liệu lập trình' },
        { id: 'tx_7', type: 'expense', amount: 35000, category: 'Ăn uống', date: `${ym}-12`, payment: 'Tiền mặt', note: 'Mua đậu phụ và trứng chiên bữa tối' },
        { id: 'tx_8', type: 'income', amount: 1200000, category: 'Học bổng', date: `${ym}-14`, payment: 'Chuyển khoản', note: 'Thưởng điểm bài tập lớn xuất sắc' },
        { id: 'tx_9', type: 'expense', amount: 450000, category: 'Mua sắm', date: `${ym}-15`, payment: 'Chuyển khoản', note: 'Mua áo khoác mặc đi học' },
        { id: 'tx_10', type: 'expense', amount: 120000, category: 'Giải trí', date: `${ym}-18`, payment: 'Ví điện tử', note: 'Xem phim cuối tuần cùng bạn' }
    ];
}

// 4. ĐỌC & LƯU DỮ LIỆU LOCALSTORAGE (F06)
function loadData() {
    const rawTx = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
    if (rawTx) {
        try {
            transactions = JSON.parse(rawTx);
        } catch (e) {
            transactions = generateSampleTransactions(currentMonth);
        }
    } else {
        transactions = generateSampleTransactions(currentMonth);
        saveTransactions();
    }

    const rawBudgets = localStorage.getItem(STORAGE_KEYS.BUDGETS);
    if (rawBudgets) {
        try {
            budgets = JSON.parse(rawBudgets);
        } catch (e) {
            budgets = {};
        }
    }
    if (!budgets[currentMonth]) {
        budgets[currentMonth] = 4500000;
        saveBudgets();
    }

    const savedTheme = localStorage.getItem(STORAGE_KEYS.THEME);
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-mode');
        updateThemeButtonUI(true);
    }
}

function saveTransactions() {
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions));
}

function saveBudgets() {
    localStorage.setItem(STORAGE_KEYS.BUDGETS, JSON.stringify(budgets));
}

// 5. LỌC DỮ LIỆU & CẬP NHẬT GIAO DIỆN CHÍNH
function getTransactionsByMonth(ym) {
    return transactions.filter(tx => tx.date && tx.date.startsWith(ym));
}

function renderAll() {
    renderSummaryAndBudget();
    populateCategoryFilterDropdown();
    renderTransactionList();
    renderCategoryChart();
}

// F01 & F08: Tổng quan & Ngân sách tháng
function renderSummaryAndBudget() {
    const monthTxs = getTransactionsByMonth(currentMonth);

    const incomeTxs = monthTxs.filter(t => t.type === 'income');
    const expenseTxs = monthTxs.filter(t => t.type === 'expense');

    const totalIncome = incomeTxs.reduce((sum, t) => sum + Number(t.amount), 0);
    const totalExpense = expenseTxs.reduce((sum, t) => sum + Number(t.amount), 0);
    const balance = totalIncome - totalExpense;

    document.getElementById('total-balance').textContent = formatVND(balance);
    document.getElementById('total-income').textContent = formatVND(totalIncome);
    document.getElementById('total-expense').textContent = formatVND(totalExpense);

    document.getElementById('income-count').textContent = `${incomeTxs.length} khoản thu trong tháng`;
    document.getElementById('expense-count').textContent = `${expenseTxs.length} khoản chi trong tháng`;
    document.getElementById('balance-status').textContent =
        balance >= 0 ? 'Tài chính tháng này đang dương' : 'Chú ý: Chi đang vượt thu trong tháng';

    // Ngân sách tháng (F08)
    const [year, month] = currentMonth.split('-');
    const monthLimit = budgets[currentMonth] || 4500000;
    const percent = monthLimit > 0 ? Math.min(Math.round((totalExpense / monthLimit) * 100), 100) : 0;
    const rawPercent = monthLimit > 0 ? Math.round((totalExpense / monthLimit) * 100) : 0;

    document.getElementById('budget-month-label').textContent = `${month}/${year}`;
    document.getElementById('budget-detail-text').textContent =
        `Đã chi ${formatVND(totalExpense)} / Hạn mức ${formatVND(monthLimit)} (${rawPercent}%)`;

    const bar = document.getElementById('budget-progress-bar');
    const warningBox = document.getElementById('budget-warning-box');
    const warningText = document.getElementById('budget-warning-text');

    bar.style.width = `${percent}%`;
    bar.classList.remove('warning', 'over');

    if (totalExpense > monthLimit) {
        bar.classList.add('over');
        warningBox.classList.remove('hidden');
        const overAmount = totalExpense - monthLimit;
        warningText.textContent = `Cảnh báo: Bạn đã chi vượt hạn mức ngân sách ${formatVND(overAmount)}!`;
    } else if (rawPercent >= 80) {
        bar.classList.add('warning');
        warningBox.classList.remove('hidden');
        warningText.textContent = `Lưu ý: Bạn đã sử dụng ${rawPercent}% ngân sách tháng này.`;
    } else {
        warningBox.classList.add('hidden');
    }
}

// Cập nhật dropdown lọc danh mục (F07)
function populateCategoryFilterDropdown() {
    const select = document.getElementById('filter-category');
    const currentVal = select.value;
    const typeFilter = document.getElementById('filter-type').value;

    let catNames = [];
    if (typeFilter === 'expense') {
        catNames = CATEGORIES.expense.map(c => c.name);
    } else if (typeFilter === 'income') {
        catNames = CATEGORIES.income.map(c => c.name);
    } else {
        const all = [...CATEGORIES.expense.map(c => c.name), ...CATEGORIES.income.map(c => c.name)];
        catNames = [...new Set(all)];
    }

    select.innerHTML = `<option value="all">Tất cả danh mục</option>` +
        catNames.map(name => `<option value="${name}">${name}</option>`).join('');

    if (catNames.includes(currentVal)) {
        select.value = currentVal;
    } else {
        select.value = 'all';
    }
}

// F03 & F07: Hiển thị danh sách giao dịch (mới nhất lên đầu)
function renderTransactionList() {
    const listEl = document.getElementById('transaction-list');
    const typeFilter = document.getElementById('filter-type').value;
    const catFilter = document.getElementById('filter-category').value;
    const keyword = document.getElementById('search-input').value.trim().toLowerCase();

    let filtered = getTransactionsByMonth(currentMonth).filter(tx => {
        if (typeFilter !== 'all' && tx.type !== typeFilter) return false;
        if (catFilter !== 'all' && tx.category !== catFilter) return false;
        if (keyword && !tx.note.toLowerCase().includes(keyword) && !tx.category.toLowerCase().includes(keyword)) {
            return false;
        }
        return true;
    });

    // Sắp xếp mới nhất lên đầu
    filtered.sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id));

    if (filtered.length === 0) {
        listEl.innerHTML = `
            <div class="empty-list">
                <i class="fa-regular fa-folder-open"></i>
                <p>Không tìm thấy giao dịch nào phù hợp.</p>
            </div>
        `;
        return;
    }

    listEl.innerHTML = filtered.map(tx => {
        const meta = getCategoryMeta(tx.type, tx.category);
        const sign = tx.type === 'income' ? '+' : '-';
        return `
            <div class="tx-item" data-id="${tx.id}" title="Bấm để sửa giao dịch">
                <div class="tx-left">
                    <div class="tx-cat-icon ${tx.type}">
                        <i class="fa-solid ${meta.icon}"></i>
                    </div>
                    <div class="tx-info">
                        <div class="tx-note">${escapeHTML(tx.note)}</div>
                        <div class="tx-meta">
                            <span><i class="fa-solid fa-tag"></i> ${tx.category}</span>
                            <span>•</span>
                            <span><i class="fa-regular fa-calendar"></i> ${formatDateVN(tx.date)}</span>
                            <span>•</span>
                            <span>${tx.payment || 'Tiền mặt'}</span>
                        </div>
                    </div>
                </div>
                <div class="tx-right">
                    <span class="tx-amount ${tx.type}">${sign}${formatVND(tx.amount)}</span>
                    <button class="tx-delete-btn" data-delete-id="${tx.id}" title="Xóa giao dịch">
                        <i class="fa-regular fa-trash-can"></i>
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

function escapeHTML(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

// F09: Vẽ biểu đồ Donut thống kê chi tiêu theo danh mục bằng Canvas thuần
function renderCategoryChart() {
    const canvas = document.getElementById('expense-chart');
    const emptyState = document.getElementById('chart-empty-state');
    const legendEl = document.getElementById('category-legend');
    const ctx = canvas.getContext('2d');

    const expenseTxs = getTransactionsByMonth(currentMonth).filter(t => t.type === 'expense');
    const totalExpense = expenseTxs.reduce((sum, t) => sum + Number(t.amount), 0);

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (totalExpense <= 0) {
        canvas.classList.add('hidden');
        emptyState.classList.remove('hidden');
        legendEl.innerHTML = '';
        return;
    }

    canvas.classList.remove('hidden');
    emptyState.classList.add('hidden');

    // Gom nhóm theo danh mục
    const catTotals = {};
    expenseTxs.forEach(tx => {
        catTotals[tx.category] = (catTotals[tx.category] || 0) + Number(tx.amount);
    });

    const stats = Object.keys(catTotals).map(catName => {
        const amount = catTotals[catName];
        const meta = getCategoryMeta('expense', catName);
        const percent = Math.round((amount / totalExpense) * 100);
        return { name: catName, amount, percent, color: meta.color };
    }).sort((a, b) => b.amount - a.amount);

    // Vẽ Donut Chart
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const outerRadius = 90;
    const innerRadius = 56;
    let startAngle = -Math.PI / 2;

    stats.forEach(item => {
        const sliceAngle = (item.amount / totalExpense) * (Math.PI * 2);
        ctx.beginPath();
        ctx.arc(centerX, centerY, outerRadius, startAngle, startAngle + sliceAngle);
        ctx.arc(centerX, centerY, innerRadius, startAngle + sliceAngle, startAngle, true);
        ctx.closePath();
        ctx.fillStyle = item.color;
        ctx.fill();
        startAngle += sliceAngle;
    });

    // Hiển thị chú thích & tỷ lệ %
    legendEl.innerHTML = stats.map(item => `
        <div class="legend-item">
            <div class="legend-left">
                <span class="legend-dot" style="background-color: ${item.color}"></span>
                <span>${item.name}</span>
            </div>
            <div class="legend-right">
                ${formatVND(item.amount)} (${item.percent}%)
            </div>
        </div>
    `).join('');
}

// 6. THÊM / SỬA / XÓA GIAO DỊCH (F02, F04, F05)
function renderModalCategoryGrid() {
    const grid = document.getElementById('modal-category-grid');
    const list = CATEGORIES[selectedModalType];

    if (!list.some(c => c.name === selectedModalCategory)) {
        selectedModalCategory = list[0].name;
    }

    grid.innerHTML = list.map(cat => `
        <div class="cat-option ${cat.name === selectedModalCategory ? 'selected' : ''}" data-cat="${cat.name}">
            <i class="fa-solid ${cat.icon}"></i>
            <span>${cat.name}</span>
        </div>
    `).join('');
}

function openTransactionModal(tx = null) {
    const modal = document.getElementById('transaction-modal');
    const title = document.getElementById('modal-title');
    const deleteBtn = document.getElementById('delete-in-modal-btn');
    const errorBox = document.getElementById('form-error-box');

    errorBox.classList.add('hidden');

    if (tx) {
        editingTxId = tx.id;
        title.textContent = 'Chỉnh sửa giao dịch';
        selectedModalType = tx.type;
        selectedModalCategory = tx.category;
        document.getElementById('tx-id').value = tx.id;
        document.getElementById('tx-amount').value = tx.amount;
        document.getElementById('tx-date').value = tx.date;
        document.getElementById('tx-payment').value = tx.payment || 'Tiền mặt';
        document.getElementById('tx-note').value = tx.note;
        deleteBtn.classList.remove('hidden');
    } else {
        editingTxId = null;
        title.textContent = 'Thêm giao dịch mới';
        selectedModalType = 'expense';
        selectedModalCategory = CATEGORIES.expense[0].name;
        document.getElementById('tx-id').value = '';
        document.getElementById('tx-amount').value = '';
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('tx-date').value = today.startsWith(currentMonth) ? today : `${currentMonth}-01`;
        document.getElementById('tx-payment').value = 'Tiền mặt';
        document.getElementById('tx-note').value = '';
        deleteBtn.classList.add('hidden');
    }

    updateModalTypeButtons();
    renderModalCategoryGrid();
    modal.classList.remove('hidden');
}

function updateModalTypeButtons() {
    document.getElementById('type-expense-btn').classList.toggle('active', selectedModalType === 'expense');
    document.getElementById('type-income-btn').classList.toggle('active', selectedModalType === 'income');
}

function closeTransactionModal() {
    document.getElementById('transaction-modal').classList.add('hidden');
}

function handleSaveTransaction(e) {
    e.preventDefault();
    const amountRaw = document.getElementById('tx-amount').value.trim();
    const dateVal = document.getElementById('tx-date').value;
    const paymentVal = document.getElementById('tx-payment').value;
    const noteVal = document.getElementById('tx-note').value.trim();
    const errorBox = document.getElementById('form-error-box');
    const errorText = document.getElementById('form-error-text');

    const amount = Number(amountRaw);

    // Kiểm tra dữ liệu đầu vào (F02)
    if (!amountRaw || isNaN(amount) || amount <= 0) {
        errorText.textContent = 'Vui lòng nhập số tiền hợp lệ lớn hơn 0.';
        errorBox.classList.remove('hidden');
        return;
    }
    if (amount > 1000000000) {
        errorText.textContent = 'Số tiền quá lớn, vui lòng kiểm tra lại.';
        errorBox.classList.remove('hidden');
        return;
    }
    if (!dateVal) {
        errorText.textContent = 'Vui lòng chọn ngày giao dịch.';
        errorBox.classList.remove('hidden');
        return;
    }
    if (!noteVal) {
        errorText.textContent = 'Vui lòng nhập ghi chú cho giao dịch.';
        errorBox.classList.remove('hidden');
        return;
    }

    if (editingTxId) {
        const idx = transactions.findIndex(t => t.id === editingTxId);
        if (idx !== -1) {
            transactions[idx] = {
                ...transactions[idx],
                type: selectedModalType,
                amount: Math.round(amount),
                category: selectedModalCategory,
                date: dateVal,
                payment: paymentVal,
                note: noteVal
            };
        }
    } else {
        const newTx = {
            id: 'tx_' + Date.now(),
            type: selectedModalType,
            amount: Math.round(amount),
            category: selectedModalCategory,
            date: dateVal,
            payment: paymentVal,
            note: noteVal
        };
        transactions.push(newTx);
    }

    // Chuyển tháng hiện tại tới tháng của giao dịch vừa lưu
    const savedMonth = dateVal.slice(0, 7);
    if (savedMonth !== currentMonth) {
        currentMonth = savedMonth;
        document.getElementById('filter-month').value = currentMonth;
    }

    saveTransactions();
    closeTransactionModal();
    renderAll();
}

// Hộp xác nhận xóa (F05)
function askDeleteTransaction(id) {
    const tx = transactions.find(t => t.id === id);
    if (!tx) return;
    pendingDeleteId = id;
    document.getElementById('confirm-delete-desc').textContent =
        `Bạn có chắc muốn xóa khoản "${tx.note}" (${formatVND(tx.amount)}) không?`;
    document.getElementById('confirm-delete-modal').classList.remove('hidden');
}

function confirmDeleteTransaction() {
    if (!pendingDeleteId) return;
    transactions = transactions.filter(t => t.id !== pendingDeleteId);
    pendingDeleteId = null;
    saveTransactions();
    document.getElementById('confirm-delete-modal').classList.add('hidden');
    closeTransactionModal();
    renderAll();
}

// 7. CHẾ ĐỘ TỐI (F11) & XUẤT FILE EXCEL CSV (F12)
function updateThemeButtonUI(isDark) {
    const btn = document.getElementById('theme-toggle');
    btn.innerHTML = isDark
        ? `<i class="fa-solid fa-sun"></i><span>Chế độ sáng</span>`
        : `<i class="fa-solid fa-moon"></i><span>Chế độ tối</span>`;
}

function toggleTheme() {
    const isDark = document.body.classList.toggle('dark-mode');
    localStorage.setItem(STORAGE_KEYS.THEME, isDark ? 'dark' : 'light');
    updateThemeButtonUI(isDark);
}

function exportToExcelCSV() {
    const monthTxs = getTransactionsByMonth(currentMonth);
    if (monthTxs.length === 0) {
        alert('Không có giao dịch nào trong tháng này để xuất file.');
        return;
    }

    const headers = ['Ngày', 'Loại', 'Danh mục', 'Số tiền (VNĐ)', 'Hình thức', 'Ghi chú'];
    const rows = monthTxs.map(tx => [
        formatDateVN(tx.date),
        tx.type === 'income' ? 'Khoản thu' : 'Khoản chi',
        tx.category,
        tx.amount,
        tx.payment || 'Tiền mặt',
        `"${tx.note.replace(/"/g, '""')}"`
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = `MoneyNote_${currentMonth}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

// 8. GẮN SỰ KIỆN DOM
document.addEventListener('DOMContentLoaded', () => {
    loadData();

    const monthInput = document.getElementById('filter-month');
    monthInput.value = currentMonth;

    renderAll();

    // Đổi tháng
    monthInput.addEventListener('change', e => {
        if (e.target.value) {
            currentMonth = e.target.value;
            if (!budgets[currentMonth]) {
                budgets[currentMonth] = 4500000;
            }
            renderAll();
        }
    });

    // Tìm kiếm & bộ lọc (F07)
    document.getElementById('search-input').addEventListener('input', renderTransactionList);
    document.getElementById('filter-type').addEventListener('change', () => {
        populateCategoryFilterDropdown();
        renderTransactionList();
    });
    document.getElementById('filter-category').addEventListener('change', renderTransactionList);

    // Mở Modal thêm giao dịch
    document.getElementById('open-add-modal-btn').addEventListener('click', () => openTransactionModal());
    document.getElementById('nav-add-btn').addEventListener('click', e => {
        e.preventDefault();
        openTransactionModal();
    });

    // Đóng Modal thêm/sửa
    document.getElementById('close-modal-btn').addEventListener('click', closeTransactionModal);
    document.getElementById('cancel-modal-btn').addEventListener('click', closeTransactionModal);

    // Chuyển loại Thu / Chi trong Modal
    document.getElementById('type-expense-btn').addEventListener('click', () => {
        selectedModalType = 'expense';
        selectedModalCategory = CATEGORIES.expense[0].name;
        updateModalTypeButtons();
        renderModalCategoryGrid();
    });
    document.getElementById('type-income-btn').addEventListener('click', () => {
        selectedModalType = 'income';
        selectedModalCategory = CATEGORIES.income[0].name;
        updateModalTypeButtons();
        renderModalCategoryGrid();
    });

    // Chọn danh mục dạng lưới trong Modal
    document.getElementById('modal-category-grid').addEventListener('click', e => {
        const option = e.target.closest('.cat-option');
        if (!option) return;
        selectedModalCategory = option.dataset.cat;
        renderModalCategoryGrid();
    });

    // Lưu giao dịch
    document.getElementById('transaction-form').addEventListener('submit', handleSaveTransaction);

    // Click vào danh sách giao dịch để Sửa (F04) hoặc Xóa (F05)
    document.getElementById('transaction-list').addEventListener('click', e => {
        const deleteBtn = e.target.closest('[data-delete-id]');
        if (deleteBtn) {
            e.stopPropagation();
            askDeleteTransaction(deleteBtn.dataset.deleteId);
            return;
        }

        const item = e.target.closest('.tx-item');
        if (item) {
            const tx = transactions.find(t => t.id === item.dataset.id);
            if (tx) openTransactionModal(tx);
        }
    });

    // Nút xóa bên trong Modal sửa
    document.getElementById('delete-in-modal-btn').addEventListener('click', () => {
        if (editingTxId) askDeleteTransaction(editingTxId);
    });

    // Xác nhận xóa
    document.getElementById('cancel-delete-btn').addEventListener('click', () => {
        pendingDeleteId = null;
        document.getElementById('confirm-delete-modal').classList.add('hidden');
    });
    document.getElementById('confirm-delete-btn').addEventListener('click', confirmDeleteTransaction);

    // Modal Ngân sách tháng (F08)
    const openBudgetModal = () => {
        const [y, m] = currentMonth.split('-');
        document.getElementById('modal-budget-month').textContent = `${m}/${y}`;
        document.getElementById('budget-input').value = budgets[currentMonth] || 4500000;
        document.getElementById('budget-error-box').classList.add('hidden');
        document.getElementById('budget-modal').classList.remove('hidden');
    };

    document.getElementById('edit-budget-btn').addEventListener('click', openBudgetModal);
    document.getElementById('nav-budget-btn').addEventListener('click', e => {
        e.preventDefault();
        openBudgetModal();
    });
    document.getElementById('close-budget-modal-btn').addEventListener('click', () => {
        document.getElementById('budget-modal').classList.add('hidden');
    });
    document.getElementById('cancel-budget-btn').addEventListener('click', () => {
        document.getElementById('budget-modal').classList.add('hidden');
    });

    document.getElementById('budget-form').addEventListener('submit', e => {
        e.preventDefault();
        const val = Number(document.getElementById('budget-input').value);
        if (!val || val <= 0) {
            document.getElementById('budget-error-box').classList.remove('hidden');
            return;
        }
        budgets[currentMonth] = Math.round(val);
        saveBudgets();
        document.getElementById('budget-modal').classList.add('hidden');
        renderSummaryAndBudget();
    });

    // Chế độ tối (F11)
    document.getElementById('theme-toggle').addEventListener('click', toggleTheme);

    // Xuất file Excel (F12)
    document.getElementById('nav-export-btn').addEventListener('click', e => {
        e.preventDefault();
        exportToExcelCSV();
    });

    // Khôi phục dữ liệu mẫu
    document.getElementById('reset-data-btn').addEventListener('click', () => {
        if (confirm('Khôi phục lại 10 giao dịch mẫu cho tháng hiện tại?')) {
            transactions = generateSampleTransactions(currentMonth);
            saveTransactions();
            renderAll();
        }
    });
});