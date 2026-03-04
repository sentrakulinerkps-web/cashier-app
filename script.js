// ChinQue POS Redesign - Main JavaScript File (with Real Backend Integration)

const BACKEND_URL = 'https://pos-backend-x1b1.onrender.com';

// Global State
let state = {
    activeTab: 'receipt',
    orderNumber: 1,
    pendingOrders: [],
    deliveryOrders: [],
    completedOrders: [],
    cashAmount: 0,
    abaAmount: 0,
    checkerAmount: 0,
    notepadContent: '',
    spareCurrency: 'IDR (Rp)',
    exchangeRate: 17000,
    settings: {
        autoResetOrderNumber: true,
        notifications: true,
        darkMode: false
    },
    optimisticOrders: [], // For Optimistic UI
    syncQueue: [] // For handling sync errors (unused but kept)
};

// DOM Elements
let contentContainer, loadingOverlay, syncErrorToast, successToast;

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    // Initialize DOM references
    contentContainer = document.getElementById('content-container');
    loadingOverlay = document.getElementById('loading-overlay');
    syncErrorToast = document.getElementById('sync-error');
    successToast = document.getElementById('success-toast');
    
    // Initialize time and date
    updateDateTime();
    setInterval(updateDateTime, 1000);
    
    // Set up bottom navigation
    setupBottomNavigation();
    
    // Load initial data from backend
    loadInitialData();
    
    // Set up event listeners for global actions
    document.getElementById('settings-btn').addEventListener('click', () => {
        state.activeTab = 'more';
        setupBottomNavigation();
        loadTabContent('more');
        // showSettingsModal(); // to be implemented later
    });
    
    // Initialize tooltips (stub)
    initTooltips();
});

// Load initial data from backend
async function loadInitialData() {
    showLoading();
    try {
        // Fetch all orders
        const ordersRes = await fetch(`${BACKEND_URL}/api/orders`);
        const ordersObj = await ordersRes.json(); // { id1: {...}, id2: {...} }
        const orders = Object.values(ordersObj);

        // Categorize orders by status
        state.pendingOrders = orders.filter(o => o.status === 'pending');
        state.deliveryOrders = orders.filter(o => o.status === 'delivery');
        state.completedOrders = orders.filter(o => o.status === 'completed');

        // Fetch current order number
        const orderNoRes = await fetch(`${BACKEND_URL}/api/orderNo`);
        const { orderNo } = await orderNoRes.json();
        state.orderNumber = orderNo;

        // Re-render current tab
        if (state.activeTab === 'pending') updatePendingOrdersTable();
        else if (state.activeTab === 'completed') loadCompletedOrdersTable();
        else if (state.activeTab === 'delivery') initDeliveryTab(); // will render later
        else loadTabContent(state.activeTab); // for receipt and more, we reload the whole tab

        updatePaymentAmounts(); // update cash/aba/checker totals
        updateRecentOrders();   // if receipt tab is active
        setupBottomNavigation(); // update badge counts
    } catch (err) {
        console.error('Failed to load initial data', err);
        showToast('Failed to connect to server', 'error');
    } finally {
        hideLoading();
    }
}

// Update time and date display
function updateDateTime() {
    const now = new Date();
    const timeStr = now.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const dateStr = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    
    document.getElementById('current-time').textContent = timeStr;
    document.getElementById('current-date').textContent = dateStr;
    document.getElementById('order-number').textContent = state.orderNumber;
}

// Set up bottom navigation
function setupBottomNavigation() {
    const navItems = document.querySelectorAll('.bottom-nav-item');
    
    navItems.forEach(item => {
        // Remove active class from all
        item.classList.remove('bottom-nav-active');
        item.querySelector('i').classList.remove('text-blue-600');
        item.querySelector('i').classList.add('text-gray-500');
        item.querySelector('span').classList.remove('text-blue-600');
        item.querySelector('span').classList.add('text-gray-600');
        
        // Add active class to current tab
        if (item.getAttribute('data-tab') === state.activeTab) {
            item.classList.add('bottom-nav-active');
            item.querySelector('i').classList.remove('text-gray-500');
            item.querySelector('i').classList.add('text-blue-600');
            item.querySelector('span').classList.remove('text-gray-600');
            item.querySelector('span').classList.add('text-blue-600');
        }
        
        // Add click event
        item.addEventListener('click', function() {
            const tab = this.getAttribute('data-tab');
            state.activeTab = tab;
            setupBottomNavigation();
            loadTabContent(tab);
        });
    });
    
    // Update pending count badge
    const pendingCount = state.pendingOrders.length + state.optimisticOrders.length;
    const pendingBadge = document.getElementById('pending-count');
    if (pendingCount > 0) {
        pendingBadge.textContent = pendingCount;
        pendingBadge.classList.remove('hidden');
    } else {
        pendingBadge.classList.add('hidden');
    }
}

// Load tab content based on active tab
function loadTabContent(tab) {
    showLoading();
    
    // Simulate loading delay (optional, can be removed)
    setTimeout(() => {
        let content = '';
        
        switch(tab) {
            case 'receipt':
                content = getReceiptTabContent();
                break;
            case 'pending':
                content = getPendingTabContent();
                break;
            case 'delivery':
                content = getDeliveryTabContent();
                break;
            case 'completed':
                content = getCompletedTabContent();
                break;
            case 'more':
                content = getMoreTabContent();
                break;
        }
        
        contentContainer.innerHTML = content;
        
        // Initialize tab-specific functionality
        initTabFunctionality(tab);
        
        hideLoading();
        
        // Add slide-in animation to content
        const elements = contentContainer.querySelectorAll('.slide-in');
        elements.forEach((el, index) => {
            el.style.animationDelay = `${index * 0.05}s`;
        });
    }, 300);
}

// Show loading overlay
function showLoading() {
    loadingOverlay.classList.remove('hidden');
}

// Hide loading overlay
function hideLoading() {
    loadingOverlay.classList.add('hidden');
}

// Show success toast
function showSuccess(message = 'Operation completed successfully') {
    document.getElementById('success-message').textContent = message;
    successToast.classList.remove('hidden');
    successToast.classList.add('success-bounce');
    
    setTimeout(() => {
        successToast.classList.add('hidden');
        successToast.classList.remove('success-bounce');
    }, 3000);
}

// Show sync error toast
function showSyncError() {
    syncErrorToast.classList.remove('hidden');
    
    setTimeout(() => {
        syncErrorToast.classList.add('hidden');
    }, 5000);
}

// General toast for errors
function showToast(message, type = 'error') {
    // Simple alert fallback – you can enhance later
    alert(message);
}

// Get Receipt Tab Content (unchanged from your version)
function getReceiptTabContent() {
    return `
    <div class="max-w-6xl mx-auto">
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <!-- Left Column: Order Form -->
            <div class="lg:col-span-2 space-y-6">
                <!-- Order Header -->
                <div class="bg-white rounded-xl shadow-sm p-6">
                    <div class="flex justify-between items-center mb-6">
                        <h2 class="text-xl font-bold text-gray-900">New Order</h2>
                        <div class="flex items-center space-x-2">
                            <span class="text-gray-500">Order #</span>
                            <span class="text-2xl font-bold text-blue-600">${state.orderNumber}</span>
                        </div>
                    </div>
                    
                    <!-- Customer Information -->
                    <div class="mb-6">
                        <h3 class="text-lg font-semibold mb-3 text-gray-800">Customer Information</h3>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-1">Name</label>
                                <input type="text" id="customer-name" class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all input-focus" placeholder="Enter customer name">
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                                <input type="tel" id="customer-phone" class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all input-focus" placeholder="Enter phone number">
                            </div>
                        </div>
                    </div>
                    
                    <!-- Order Items -->
                    <div class="mb-6">
                        <div class="flex justify-between items-center mb-3">
                            <h3 class="text-lg font-semibold text-gray-800">Order Items</h3>
                            <span class="text-sm text-gray-500">Format: "Item name 10k" or "5 Item 2k"</span>
                        </div>
                        <div class="mb-4">
                            <textarea id="order-items" rows="4" class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all input-focus" placeholder="Enter items (one per line)"></textarea>
                        </div>
                        
                        <!-- Quick Add Buttons -->
                        <div class="flex flex-wrap gap-2 mb-4">
                            <button class="quick-add-btn px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium transition-all" data-item="Coffee 5k">Coffee 5k</button>
                            <button class="quick-add-btn px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium transition-all" data-item="Tea 3k">Tea 3k</button>
                            <button class="quick-add-btn px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium transition-all" data-item="Sandwich 15k">Sandwich 15k</button>
                            <button class="quick-add-btn px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium transition-all" data-item="Cake 8k">Cake 8k</button>
                        </div>
                        
                        <!-- Notes -->
                        <div class="mb-6">
                            <label class="block text-sm font-medium text-gray-700 mb-1">Notes (Optional)</label>
                            <textarea id="order-notes" rows="2" class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all input-focus" placeholder="Add any special instructions..."></textarea>
                        </div>
                    </div>
                    
                    <!-- Action Buttons -->
                    <div class="flex flex-wrap gap-3">
                        <button id="create-order-btn" class="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-all flex items-center">
                            <i class="fas fa-check mr-2"></i> Create Order
                        </button>
                        <button id="clear-order-btn" class="px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium rounded-lg transition-all flex items-center">
                            <i class="fas fa-times mr-2"></i> Clear Form
                        </button>
                        <button id="print-receipt-btn" class="px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-all flex items-center">
                            <i class="fas fa-print mr-2"></i> Print Receipt
                        </button>
                    </div>
                </div>
                
                <!-- Recent Orders Preview -->
                <div class="bg-white rounded-xl shadow-sm p-6">
                    <h3 class="text-lg font-semibold mb-4 text-gray-800">Recent Orders</h3>
                    <div id="recent-orders-list" class="space-y-3">
                        <!-- Recent orders will be populated here -->
                    </div>
                </div>
            </div>
            
            <!-- Right Column: Receipt Preview & Payment -->
            <div class="space-y-6">
                <!-- Receipt Preview -->
                <div class="bg-white rounded-xl shadow-sm p-6 receipt-shadow">
                    <h3 class="text-lg font-semibold mb-4 text-gray-800 flex items-center">
                        <i class="fas fa-receipt mr-2 text-blue-500"></i> Receipt Preview
                    </h3>
                    <div class="border-2 border-dashed border-gray-300 rounded-lg p-4 min-h-[300px] bg-gray-50">
                        <div class="text-center mb-4">
                            <h4 class="font-bold text-lg">CHINQUE POS</h4>
                            <p class="text-sm text-gray-500">Order #${state.orderNumber}</p>
                            <p class="text-sm text-gray-500" id="receipt-time">${document.getElementById('current-time').textContent}</p>
                            <p class="text-sm text-gray-500" id="receipt-date">${document.getElementById('current-date').textContent}</p>
                        </div>
                        
                        <div id="receipt-content" class="text-sm">
                            <div class="border-t border-gray-300 pt-3 mt-3">
                                <div class="flex justify-between mb-1">
                                    <span>Customer:</span>
                                    <span id="receipt-customer">-</span>
                                </div>
                                <div class="flex justify-between mb-1">
                                    <span>Items:</span>
                                    <span id="receipt-items-count">0</span>
                                </div>
                                <div class="border-t border-gray-300 mt-3 pt-3">
                                    <div class="flex justify-between font-bold">
                                        <span>TOTAL:</span>
                                        <span id="receipt-total">៛ 0</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <div class="mt-6 text-center text-gray-500 text-xs">
                            <p>Thank you for your business!</p>
                            <p>chinquepos.com</p>
                        </div>
                    </div>
                </div>
                
                <!-- Payment Summary -->
                <div class="bg-white rounded-xl shadow-sm p-6">
                    <h3 class="text-lg font-semibold mb-4 text-gray-800">Payment Summary</h3>
                    <div class="space-y-4">
                        <div class="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                            <div class="flex items-center">
                                <div class="payment-icon payment-cash">
                                    <i class="fas fa-money-bill-wave"></i>
                                </div>
                                <div class="ml-3">
                                    <p class="font-medium">Cash</p>
                                    <p class="text-xs text-gray-500">Received</p>
                                </div>
                            </div>
                            <div class="text-xl font-bold" id="cash-amount">៛ ${state.cashAmount}</div>
                        </div>
                        
                        <div class="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                            <div class="flex items-center">
                                <div class="payment-icon payment-aba">
                                    <i class="fas fa-credit-card"></i>
                                </div>
                                <div class="ml-3">
                                    <p class="font-medium">ABA Pay</p>
                                    <p class="text-xs text-gray-500">Digital Payment</p>
                                </div>
                            </div>
                            <div class="text-xl font-bold" id="aba-amount">៛ ${state.abaAmount}</div>
                        </div>
                        
                        <div class="flex items-center justify-between p-3 bg-indigo-50 rounded-lg">
                            <div class="flex items-center">
                                <div class="payment-icon payment-checker">
                                    <i class="fas fa-search"></i>
                                </div>
                                <div class="ml-3">
                                    <p class="font-medium">Checker</p>
                                    <p class="text-xs text-gray-500">Verification</p>
                                </div>
                            </div>
                            <div class="text-xl font-bold" id="checker-amount">៛ ${state.checkerAmount}</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
    `;
}

// Get Pending Tab Content
function getPendingTabContent() {
    return `
    <div class="max-w-6xl mx-auto">
        <div class="bg-white rounded-xl shadow-sm p-6">
            <div class="flex justify-between items-center mb-6">
                <h2 class="text-xl font-bold text-gray-900">Pending Orders</h2>
                <div class="flex items-center">
                    <span class="bg-blue-100 text-blue-800 text-sm font-medium px-3 py-1 rounded-full">
                        ${state.pendingOrders.length + state.optimisticOrders.length} orders
                    </span>
                </div>
            </div>
            
            <!-- Optimistic Orders Warning -->
            ${state.optimisticOrders.length > 0 ? `
            <div class="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6 rounded">
                <div class="flex">
                    <div class="flex-shrink-0">
                        <i class="fas fa-sync-alt text-yellow-400"></i>
                    </div>
                    <div class="ml-3">
                        <p class="text-sm text-yellow-700">
                            <span class="font-medium">Syncing:</span> ${state.optimisticOrders.length} order(s) are being processed in the background.
                        </p>
                    </div>
                </div>
            </div>
            ` : ''}
            
            <!-- Orders Table -->
            <div class="overflow-x-auto rounded-lg border border-gray-200">
                <table class="min-w-full divide-y divide-gray-200">
                    <thead class="bg-gray-50">
                        <tr>
                            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order #</th>
                            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Items</th>
                            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody id="pending-orders-body" class="bg-white divide-y divide-gray-200">
                        <!-- Orders will be populated here -->
                    </tbody>
                </table>
                
                ${(state.pendingOrders.length + state.optimisticOrders.length) === 0 ? `
                <div class="text-center py-12">
                    <i class="fas fa-clock text-gray-300 text-4xl mb-4"></i>
                    <h3 class="text-lg font-medium text-gray-900 mb-2">No pending orders</h3>
                    <p class="text-gray-500">All orders are processed and completed.</p>
                </div>
                ` : ''}
            </div>
        </div>
    </div>
    `;
}

// Get Delivery Tab Content
function getDeliveryTabContent() {
    return `
    <div class="max-w-6xl mx-auto">
        <div class="bg-white rounded-xl shadow-sm p-6">
            <div class="flex justify-between items-center mb-6">
                <h2 class="text-xl font-bold text-gray-900">Delivery Management</h2>
                <div class="flex items-center">
                    <span class="bg-green-100 text-green-800 text-sm font-medium px-3 py-1 rounded-full">
                        ${state.deliveryOrders.length} deliveries
                    </span>
                </div>
            </div>
            
            <!-- Delivery Stats -->
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div class="bg-blue-50 rounded-xl p-5">
                    <div class="flex items-center">
                        <div class="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mr-4">
                            <i class="fas fa-truck text-blue-600"></i>
                        </div>
                        <div>
                            <p class="text-sm text-gray-600">Active Deliveries</p>
                            <p class="text-2xl font-bold text-gray-900">${state.deliveryOrders.filter(o => o.status === 'active').length}</p>
                        </div>
                    </div>
                </div>
                
                <div class="bg-yellow-50 rounded-xl p-5">
                    <div class="flex items-center">
                        <div class="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center mr-4">
                            <i class="fas fa-clock text-yellow-600"></i>
                        </div>
                        <div>
                            <p class="text-sm text-gray-600">Pending Pickup</p>
                            <p class="text-2xl font-bold text-gray-900">${state.deliveryOrders.filter(o => o.status === 'pending').length}</p>
                        </div>
                    </div>
                </div>
                
                <div class="bg-green-50 rounded-xl p-5">
                    <div class="flex items-center">
                        <div class="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mr-4">
                            <i class="fas fa-check-circle text-green-600"></i>
                        </div>
                        <div>
                            <p class="text-sm text-gray-600">Completed Today</p>
                            <p class="text-2xl font-bold text-gray-900">${state.deliveryOrders.filter(o => o.status === 'completed').length}</p>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Delivery Orders List -->
            <div id="delivery-orders-list" class="space-y-4">
                <!-- Delivery orders will be populated here -->
            </div>
            
            ${state.deliveryOrders.length === 0 ? `
            <div class="text-center py-12 border-2 border-dashed border-gray-300 rounded-xl">
                <i class="fas fa-truck text-gray-300 text-4xl mb-4"></i>
                <h3 class="text-lg font-medium text-gray-900 mb-2">No delivery orders</h3>
                <p class="text-gray-500 mb-4">Delivery orders will appear here when created.</p>
                <button class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all">
                    <i class="fas fa-plus mr-2"></i> Create Delivery Order
                </button>
            </div>
            ` : ''}
        </div>
    </div>
    `;
}

// Get Completed Tab Content
function getCompletedTabContent() {
    return `
    <div class="max-w-6xl mx-auto">
        <div class="bg-white rounded-xl shadow-sm p-6">
            <div class="flex justify-between items-center mb-6">
                <h2 class="text-xl font-bold text-gray-900">Completed Orders</h2>
                <div class="flex items-center">
                    <span class="bg-green-100 text-green-800 text-sm font-medium px-3 py-1 rounded-full">
                        ${state.completedOrders.length} orders
                    </span>
                </div>
            </div>
            
            <!-- Stats Cards -->
            <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                <div class="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                    <p class="text-sm text-gray-600">Today's Revenue</p>
                    <p class="text-2xl font-bold text-gray-900">៛ ${state.cashAmount + state.abaAmount + state.checkerAmount}</p>
                </div>
                
                <div class="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                    <p class="text-sm text-gray-600">Today's Orders</p>
                    <p class="text-2xl font-bold text-gray-900">${state.completedOrders.length}</p>
                </div>
                
                <div class="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                    <p class="text-sm text-gray-600">Avg. Order Value</p>
                    <p class="text-2xl font-bold text-gray-900">៛ ${state.completedOrders.length > 0 ? Math.round((state.cashAmount + state.abaAmount + state.checkerAmount) / state.completedOrders.length) : 0}</p>
                </div>
                
                <div class="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                    <p class="text-sm text-gray-600">Completion Rate</p>
                    <p class="text-2xl font-bold text-gray-900">100%</p>
                </div>
            </div>
            
            <!-- Filter Options -->
            <div class="flex flex-wrap gap-2 mb-6">
                <button class="filter-btn active px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium">Today</button>
                <button class="filter-btn px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium">This Week</button>
                <button class="filter-btn px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium">This Month</button>
                <button class="filter-btn px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium">All Time</button>
            </div>
            
            <!-- Completed Orders Table -->
            <div class="overflow-x-auto rounded-lg border border-gray-200">
                <table class="min-w-full divide-y divide-gray-200">
                    <thead class="bg-gray-50">
                        <tr>
                            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order #</th>
                            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Items</th>
                            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment</th>
                            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Completed</th>
                            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody id="completed-orders-body" class="bg-white divide-y divide-gray-200">
                        <!-- Completed orders will be populated here -->
                    </tbody>
                </table>
                
                ${state.completedOrders.length === 0 ? `
                <div class="text-center py-12">
                    <i class="fas fa-check-circle text-gray-300 text-4xl mb-4"></i>
                    <h3 class="text-lg font-medium text-gray-900 mb-2">No completed orders yet</h3>
                    <p class="text-gray-500">Completed orders will appear here.</p>
                </div>
                ` : ''}
            </div>
        </div>
    </div>
    `;
}

// Get More Tab Content
function getMoreTabContent() {
    return `
    <div class="max-w-6xl mx-auto">
        <h2 class="text-xl font-bold text-gray-900 mb-6">Tools & Settings</h2>
        
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <!-- Calculator -->
            <div class="tool-card p-6">
                <div class="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4">
                    <i class="fas fa-calculator text-blue-600 text-xl"></i>
                </div>
                <h3 class="text-lg font-semibold mb-2">Calculator</h3>
                <p class="text-gray-600 text-sm mb-4">Quick calculations for payments and totals</p>
                <button class="open-calculator-btn w-full py-2 bg-blue-50 text-blue-700 rounded-lg font-medium hover:bg-blue-100 transition-all">
                    Open Calculator
                </button>
            </div>
            
            <!-- Notepad -->
            <div class="tool-card p-6">
                <div class="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mb-4">
                    <i class="fas fa-sticky-note text-green-600 text-xl"></i>
                </div>
                <h3 class="text-lg font-semibold mb-2">Cashier Notepad</h3>
                <p class="text-gray-600 text-sm mb-4">Notes and reminders for cashier operations</p>
                <button class="open-notepad-btn w-full py-2 bg-green-50 text-green-700 rounded-lg font-medium hover:bg-green-100 transition-all">
                    Open Notepad
                </button>
            </div>
            
            <!-- Checker -->
            <div class="tool-card p-6">
                <div class="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mb-4">
                    <i class="fas fa-search text-purple-600 text-xl"></i>
                </div>
                <h3 class="text-lg font-semibold mb-2">Order Checker</h3>
                <p class="text-gray-600 text-sm mb-4">Check order lists for pricing errors</p>
                <button class="open-checker-btn w-full py-2 bg-purple-50 text-purple-700 rounded-lg font-medium hover:bg-purple-100 transition-all">
                    Open Checker
                </button>
            </div>
            
            <!-- Settings -->
            <div class="tool-card p-6">
                <div class="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mb-4">
                    <i class="fas fa-cog text-gray-600 text-xl"></i>
                </div>
                <h3 class="text-lg font-semibold mb-2">Settings</h3>
                <p class="text-gray-600 text-sm mb-4">Configure POS system preferences</p>
                <button class="open-settings-btn w-full py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-all">
                    Open Settings
                </button>
            </div>
        </div>
        
        <!-- Tools Container (will be filled when tool is opened) -->
        <div id="tools-container">
            <!-- Tools content will be loaded here when a tool is selected -->
            <div class="text-center py-12 text-gray-500">
                <i class="fas fa-tools text-4xl mb-4"></i>
                <h3 class="text-lg font-medium mb-2">Select a tool to get started</h3>
                <p>Choose from the tools above to open it here</p>
            </div>
        </div>
    </div>
    `;
}

// Initialize tab-specific functionality
function initTabFunctionality(tab) {
    switch(tab) {
        case 'receipt':
            initReceiptTab();
            break;
        case 'pending':
            initPendingTab();
            break;
        case 'delivery':
            initDeliveryTab();
            break;
        case 'completed':
            initCompletedTab();
            break;
        case 'more':
            initMoreTab();
            break;
    }
}

// Initialize Receipt Tab
function initReceiptTab() {
    // Quick add buttons
    document.querySelectorAll('.quick-add-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const textarea = document.getElementById('order-items');
            const item = this.getAttribute('data-item');
            textarea.value += (textarea.value ? '\n' : '') + item;
            updateReceiptPreview();
        });
    });
    
    // Create order button
    document.getElementById('create-order-btn').addEventListener('click', createOrder);
    
    // Clear form button
    document.getElementById('clear-order-btn').addEventListener('click', function() {
        document.getElementById('customer-name').value = '';
        document.getElementById('customer-phone').value = '';
        document.getElementById('order-items').value = '';
        document.getElementById('order-notes').value = '';
        updateReceiptPreview();
    });
    
    // Print receipt button
    document.getElementById('print-receipt-btn').addEventListener('click', function() {
        window.print();
    });
    
    // Update receipt preview when inputs change
    document.getElementById('customer-name').addEventListener('input', updateReceiptPreview);
    document.getElementById('order-items').addEventListener('input', updateReceiptPreview);
    
    // Load recent orders
    updateRecentOrders();
    
    // Initial receipt preview update
    updateReceiptPreview();
}

// Create new order with Optimistic UI
async function createOrder() {
    const customerName = document.getElementById('customer-name').value.trim();
    const orderItems = document.getElementById('order-items').value.trim();
    const notes = document.getElementById('order-notes').value.trim();

    if (!orderItems) {
        alert('Please add at least one item');
        return;
    }

    // Parse items and calculate total
    const itemsArray = orderItems.split('\n');
    let total = 0;
    const parsedItems = [];
    itemsArray.forEach(item => {
        if (item.trim()) {
            const match = item.trim().match(/(?:(\d+)\s+)?(.+?)\s+(\d+(?:\.\d+)?)k$/i);
            if (match) {
                const quantity = match[1] ? parseInt(match[1]) : 1;
                const itemName = match[2];
                const price = parseFloat(match[3]) * 1000;
                total += quantity * price;
                parsedItems.push({ name: itemName, quantity, price });
            }
        }
    });

    // Create optimistic order with a unique ID
    const optimisticOrder = {
        id: Date.now() + '-' + Math.random().toString(36).substr(2, 9),
        orderNumber: state.orderNumber,
        customer: customerName || 'Walk-in Customer',
        items: parsedItems,
        total: total,
        notes: notes,
        status: 'pending',
        createdAt: new Date().toISOString(),
        isOptimistic: true
    };

    // Optimistic UI update
    state.optimisticOrders.push(optimisticOrder);
    updateRecentOrders();
    updatePendingOrdersTable();
    setupBottomNavigation();

    showLoading();

    try {
        const response = await fetch(`${BACKEND_URL}/api/orders/${optimisticOrder.id}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(optimisticOrder)
        });

        if (!response.ok) throw new Error('Failed to save order');

        // Convert optimistic to real order
        const realOrder = { ...optimisticOrder };
        delete realOrder.isOptimistic;

        state.pendingOrders.push(realOrder);
        state.optimisticOrders = state.optimisticOrders.filter(o => o.id !== optimisticOrder.id);
        state.orderNumber++; // increment local order number

        // Update backend order number
        await fetch(`${BACKEND_URL}/api/orderNo`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ orderNo: state.orderNumber })
        });

        // Clear form
        document.getElementById('customer-name').value = '';
        document.getElementById('customer-phone').value = '';
        document.getElementById('order-items').value = '';
        document.getElementById('order-notes').value = '';
        updateReceiptPreview();

        showSuccess(`Order #${realOrder.orderNumber} created`);
    } catch (error) {
        console.error(error);
        const failed = state.optimisticOrders.find(o => o.id === optimisticOrder.id);
        if (failed) failed.syncFailed = true;
        showSyncError();
    } finally {
        hideLoading();
        updateRecentOrders();
        updatePendingOrdersTable();
        setupBottomNavigation();
    }
}

// Update receipt preview
function updateReceiptPreview() {
    const customerName = document.getElementById('customer-name').value.trim();
    const orderItems = document.getElementById('order-items').value.trim();
    
    document.getElementById('receipt-customer').textContent = customerName || '-';
    
    let total = 0;
    let itemCount = 0;
    
    if (orderItems) {
        const itemsArray = orderItems.split('\n');
        itemsArray.forEach(item => {
            if (item.trim()) {
                const match = item.trim().match(/(?:(\d+)\s+)?(.+?)\s+(\d+(?:\.\d+)?)k$/i);
                if (match) {
                    const quantity = match[1] ? parseInt(match[1]) : 1;
                    const price = parseFloat(match[3]) * 1000;
                    total += quantity * price;
                    itemCount++;
                }
            }
        });
    }
    
    document.getElementById('receipt-items-count').textContent = itemCount;
    document.getElementById('receipt-total').textContent = `៛ ${total.toLocaleString()}`;
    document.getElementById('receipt-time').textContent = document.getElementById('current-time').textContent;
    document.getElementById('receipt-date').textContent = document.getElementById('current-date').textContent;
}

// Load recent orders (in receipt tab)
function loadRecentOrders() {
    const container = document.getElementById('recent-orders-list');
    if (!container) return;
    
    const allRecentOrders = [...state.pendingOrders, ...state.optimisticOrders]
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 5);
    
    if (allRecentOrders.length === 0) {
        container.innerHTML = `
        <div class="text-center py-6 text-gray-500">
            <i class="fas fa-history text-2xl mb-2"></i>
            <p>No recent orders</p>
        </div>
        `;
        return;
    }
    
    let html = '';
    allRecentOrders.forEach(order => {
        const time = new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const isOptimistic = order.isOptimistic;
        const syncFailed = order.syncFailed;
        
        html += `
        <div class="receipt-item p-3 rounded-lg slide-in">
            <div class="flex justify-between items-center">
                <div>
                    <div class="flex items-center">
                        <span class="font-medium">#${order.orderNumber}</span>
                        ${isOptimistic ? `
                        <span class="ml-2 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full flex items-center">
                            <i class="fas fa-sync-alt text-xs mr-1 ${syncFailed ? 'text-red-500' : 'animate-spin'}"></i>
                            ${syncFailed ? 'Sync Failed' : 'Syncing'}
                        </span>
                        ` : ''}
                    </div>
                    <p class="text-sm text-gray-600">${order.customer}</p>
                </div>
                <div class="text-right">
                    <p class="font-bold">៛ ${order.total.toLocaleString()}</p>
                    <p class="text-xs text-gray-500">${time}</p>
                </div>
            </div>
        </div>
        `;
    });
    
    container.innerHTML = html;
}

function updateRecentOrders() {
    if (state.activeTab === 'receipt') {
        loadRecentOrders();
    }
}

// Initialize Pending Tab
function initPendingTab() {
    updatePendingOrdersTable();
}

// Update pending orders table (both real and optimistic)
function updatePendingOrdersTable() {
    const tbody = document.getElementById('pending-orders-body');
    if (!tbody) return;
    
    const allPendingOrders = [...state.pendingOrders, ...state.optimisticOrders];
    
    if (allPendingOrders.length === 0) {
        tbody.innerHTML = '';
        return;
    }
    
    let html = '';
    allPendingOrders.forEach((order, index) => {
        const time = new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const isOptimistic = order.isOptimistic;
        const syncFailed = order.syncFailed;
        
        html += `
        <tr class="slide-in" style="animation-delay: ${index * 0.05}s">
            <td class="px-6 py-4 whitespace-nowrap">
                <div class="flex items-center">
                    <span class="font-medium">#${order.orderNumber}</span>
                    ${isOptimistic ? `
                    <span class="ml-2">
                        <i class="fas fa-sync-alt text-xs ${syncFailed ? 'text-red-500' : 'text-blue-500 animate-spin'}"></i>
                    </span>
                    ` : ''}
                </div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm font-medium text-gray-900">${order.customer}</div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm text-gray-900">${order.items.length} items</div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm font-bold text-gray-900">៛ ${order.total.toLocaleString()}</div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
                ${isOptimistic ? 
                    `<span class="px-2 py-1 text-xs rounded-full ${syncFailed ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'}">${syncFailed ? 'Sync Failed' : 'Syncing'}</span>` :
                    `<span class="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-800">Pending</span>`
                }
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                ${time}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                ${!isOptimistic ? `
                <button class="text-blue-600 hover:text-blue-900 mr-3 complete-order-btn" data-id="${order.id}">Complete</button>
                <button class="text-red-600 hover:text-red-900 delete-order-btn" data-id="${order.id}">Delete</button>
                ` : `
                <button class="text-blue-600 hover:text-blue-900 retry-sync-btn" data-id="${order.id}">Retry Sync</button>
                `}
            </td>
        </tr>
        `;
    });
    
    tbody.innerHTML = html;
    
    // Attach event listeners
    document.querySelectorAll('.complete-order-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const orderId = this.getAttribute('data-id');
            completeOrder(orderId);
        });
    });
    
    document.querySelectorAll('.delete-order-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const orderId = this.getAttribute('data-id');
            deleteOrder(orderId);
        });
    });
    
    document.querySelectorAll('.retry-sync-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const orderId = this.getAttribute('data-id');
            retrySync(orderId);
        });
    });
}

// Complete an order (move from pending to completed)
async function completeOrder(orderId) {
    const orderIndex = state.pendingOrders.findIndex(o => o.id === orderId);
    if (orderIndex === -1) return;
    
    const order = state.pendingOrders[orderIndex];
    
    // Optimistic update: remove from pending, add to completed (with temporary status)
    state.pendingOrders.splice(orderIndex, 1);
    const completedOrder = { ...order, status: 'completed', completedAt: new Date().toISOString(), paymentMethod: 'cash' };
    state.completedOrders.push(completedOrder);
    updatePaymentAmounts(); // update totals
    updatePendingOrdersTable();
    loadCompletedOrdersTable(); // refresh completed tab if visible
    setupBottomNavigation();
    
    showLoading();
    
    try {
        // Update order on backend (set status to completed)
        const response = await fetch(`${BACKEND_URL}/api/orders/${orderId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...order, status: 'completed' })
        });
        if (!response.ok) throw new Error('Failed to complete order');
        
        showSuccess(`Order #${order.orderNumber} completed`);
    } catch (error) {
        console.error(error);
        // Rollback optimistic update
        state.completedOrders = state.completedOrders.filter(o => o.id !== orderId);
        state.pendingOrders.push(order);
        updatePendingOrdersTable();
        loadCompletedOrdersTable();
        setupBottomNavigation();
        showToast('Failed to complete order. Please try again.', 'error');
    } finally {
        hideLoading();
    }
}

// Delete an order (from pending)
async function deleteOrder(orderId) {
    if (!confirm('Are you sure you want to delete this order?')) return;
    
    const orderIndex = state.pendingOrders.findIndex(o => o.id === orderId);
    if (orderIndex === -1) return;
    
    const order = state.pendingOrders[orderIndex];
    
    // Optimistic removal
    state.pendingOrders.splice(orderIndex, 1);
    updatePendingOrdersTable();
    setupBottomNavigation();
    
    showLoading();
    
    try {
        const response = await fetch(`${BACKEND_URL}/api/orders/${orderId}`, {
            method: 'DELETE'
        });
        if (!response.ok) throw new Error('Failed to delete order');
        
        showSuccess('Order deleted successfully');
    } catch (error) {
        console.error(error);
        // Rollback
        state.pendingOrders.push(order);
        updatePendingOrdersTable();
        setupBottomNavigation();
        showToast('Failed to delete order. Please try again.', 'error');
    } finally {
        hideLoading();
    }
}

// Retry sync for a failed optimistic order
async function retrySync(orderId) {
    const orderIndex = state.optimisticOrders.findIndex(o => o.id == orderId);
    if (orderIndex === -1) return;
    
    const order = state.optimisticOrders[orderIndex];
    
    // Clear failed flag
    delete order.syncFailed;
    updatePendingOrdersTable();
    
    showLoading();
    
    try {
        const response = await fetch(`${BACKEND_URL}/api/orders/${order.id}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(order)
        });
        if (!response.ok) throw new Error('Failed to sync order');
        
        // Convert to real order
        const realOrder = { ...order };
        delete realOrder.isOptimistic;
        delete realOrder.syncFailed;
        
        state.pendingOrders.push(realOrder);
        state.optimisticOrders.splice(orderIndex, 1);
        state.orderNumber++;
        
        // Update backend order number
        await fetch(`${BACKEND_URL}/api/orderNo`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ orderNo: state.orderNumber })
        });
        
        updatePendingOrdersTable();
        setupBottomNavigation();
        showSuccess('Order synced successfully');
    } catch (error) {
        console.error(error);
        order.syncFailed = true;
        updatePendingOrdersTable();
        showSyncError();
    } finally {
        hideLoading();
    }
}

// Initialize Delivery Tab (placeholder)
function initDeliveryTab() {
    const container = document.getElementById('delivery-orders-list');
    if (container) {
        if (state.deliveryOrders.length === 0) {
            container.innerHTML = '<div class="text-center py-6 text-gray-500">No delivery orders found.</div>';
        } else {
            // Render delivery orders – you can implement later
        }
    }
}

// Initialize Completed Tab
function initCompletedTab() {
    // Filter buttons
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.filter-btn').forEach(b => {
                b.classList.remove('active', 'bg-blue-600', 'text-white');
                b.classList.add('bg-gray-100', 'text-gray-800');
            });
            this.classList.remove('bg-gray-100', 'text-gray-800');
            this.classList.add('active', 'bg-blue-600', 'text-white');
            
            // Here you would filter orders based on the selected time range
            // For now, just reload the table
            loadCompletedOrdersTable();
        });
    });
    
    loadCompletedOrdersTable();
}

// Load completed orders table
function loadCompletedOrdersTable() {
    const tbody = document.getElementById('completed-orders-body');
    if (!tbody) return;
    
    if (state.completedOrders.length === 0) {
        tbody.innerHTML = '';
        return;
    }
    
    let html = '';
    state.completedOrders.slice().reverse().forEach((order, index) => {
        const time = new Date(order.completedAt || order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const date = new Date(order.completedAt || order.createdAt).toLocaleDateString();
        
        html += `
        <tr class="slide-in" style="animation-delay: ${index * 0.05}s">
            <td class="px-6 py-4 whitespace-nowrap">
                <span class="font-medium">#${order.orderNumber}</span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm font-medium text-gray-900">${order.customer}</div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm text-gray-900">${order.items.length} items</div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm font-bold text-gray-900">៛ $៛ ${(order.total || 0).toLocaleString()}</div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
                <span class="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">${order.paymentMethod || 'cash'}</span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                ${date} ${time}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <button class="text-blue-600 hover:text-blue-900 mr-3 view-order-btn" data-id="${order.id}">View</button>
                <button class="text-gray-600 hover:text-gray-900 reprint-btn" data-id="${order.id}">Reprint</button>
            </td>
        </tr>
        `;
    });
    
    tbody.innerHTML = html;
}

// Initialize More Tab
function initMoreTab() {
    document.querySelector('.open-calculator-btn')?.addEventListener('click', openCalculator);
    document.querySelector('.open-notepad-btn')?.addEventListener('click', openNotepad);
    document.querySelector('.open-checker-btn')?.addEventListener('click', openChecker);
    document.querySelector('.open-settings-btn')?.addEventListener('click', openSettings);
}

// Open Calculator (simple implementation)
function openCalculator() {
    const container = document.getElementById('tools-container');
    container.innerHTML = `
    <div class="bg-white rounded-xl shadow-sm p-6">
        <div class="flex justify-between items-center mb-6">
            <h3 class="text-lg font-semibold text-gray-800">Calculator</h3>
            <button class="close-tool-btn p-2 hover:bg-gray-100 rounded-lg">
                <i class="fas fa-times"></i>
            </button>
        </div>
        
        <div class="mb-6">
            <div class="bg-gray-50 border border-gray-300 rounded-lg p-4">
                <div class="text-right">
                    <div id="calc-display" class="text-3xl font-bold text-gray-900">0</div>
                    <div id="calc-history" class="text-gray-500 text-sm mt-2 h-6"></div>
                </div>
            </div>
        </div>
        
        <div class="grid grid-cols-4 gap-3">
            <button class="calc-btn col-span-2 p-4 bg-gray-100 hover:bg-gray-200 rounded-lg font-bold text-lg">C</button>
            <button class="calc-btn p-4 bg-gray-100 hover:bg-gray-200 rounded-lg font-bold text-lg">⌫</button>
            <button class="calc-btn p-4 bg-blue-100 hover:bg-blue-200 rounded-lg font-bold text-lg">/</button>
            
            <button class="calc-btn p-4 bg-gray-50 hover:bg-gray-100 rounded-lg font-bold text-lg">7</button>
            <button class="calc-btn p-4 bg-gray-50 hover:bg-gray-100 rounded-lg font-bold text-lg">8</button>
            <button class="calc-btn p-4 bg-gray-50 hover:bg-gray-100 rounded-lg font-bold text-lg">9</button>
            <button class="calc-btn p-4 bg-blue-100 hover:bg-blue-200 rounded-lg font-bold text-lg">*</button>
            
            <button class="calc-btn p-4 bg-gray-50 hover:bg-gray-100 rounded-lg font-bold text-lg">4</button>
            <button class="calc-btn p-4 bg-gray-50 hover:bg-gray-100 rounded-lg font-bold text-lg">5</button>
            <button class="calc-btn p-4 bg-gray-50 hover:bg-gray-100 rounded-lg font-bold text-lg">6</button>
            <button class="calc-btn p-4 bg-blue-100 hover:bg-blue-200 rounded-lg font-bold text-lg">-</button>
            
            <button class="calc-btn p-4 bg-gray-50 hover:bg-gray-100 rounded-lg font-bold text-lg">1</button>
            <button class="calc-btn p-4 bg-gray-50 hover:bg-gray-100 rounded-lg font-bold text-lg">2</button>
            <button class="calc-btn p-4 bg-gray-50 hover:bg-gray-100 rounded-lg font-bold text-lg">3</button>
            <button class="calc-btn p-4 bg-blue-100 hover:bg-blue-200 rounded-lg font-bold text-lg">+</button>
            
            <button class="calc-btn col-span-2 p-4 bg-gray-50 hover:bg-gray-100 rounded-lg font-bold text-lg">0</button>
            <button class="calc-btn p-4 bg-gray-50 hover:bg-gray-100 rounded-lg font-bold text-lg">.</button>
            <button class="calc-btn p-4 bg-green-100 hover:bg-green-200 rounded-lg font-bold text-lg">=</button>
        </div>
    </div>
    `;
    
    // Close tool
    document.querySelector('.close-tool-btn').addEventListener('click', () => {
        container.innerHTML = `
        <div class="text-center py-12 text-gray-500">
            <i class="fas fa-tools text-4xl mb-4"></i>
            <h3 class="text-lg font-medium mb-2">Select a tool to get started</h3>
            <p>Choose from the tools above to open it here</p>
        </div>
        `;
    });
    
    // Basic calculator logic (simplified)
    let display = document.getElementById('calc-display');
    let history = document.getElementById('calc-history');
    let current = '0';
    let previous = null;
    let operation = null;
    
    const updateDisplay = () => display.textContent = current;
    
    document.querySelectorAll('.calc-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const val = btn.textContent;
            if (val === 'C') {
                current = '0';
                previous = null;
                operation = null;
                history.textContent = '';
                updateDisplay();
            } else if (val === '⌫') {
                current = current.slice(0, -1) || '0';
                updateDisplay();
            } else if (['+', '-', '*', '/'].includes(val)) {
                previous = parseFloat(current);
                operation = val;
                history.textContent = current + ' ' + val;
                current = '0';
            } else if (val === '=') {
                if (previous !== null && operation) {
                    const a = previous;
                    const b = parseFloat(current);
                    let result;
                    if (operation === '+') result = a + b;
                    else if (operation === '-') result = a - b;
                    else if (operation === '*') result = a * b;
                    else if (operation === '/' && b !== 0) result = a / b;
                    else result = 'Error';
                    history.textContent += ' ' + current + ' =';
                    current = result.toString();
                    previous = null;
                    operation = null;
                    updateDisplay();
                }
            } else {
                // number or .
                if (val === '.' && current.includes('.')) return;
                current = current === '0' && val !== '.' ? val : current + val;
                updateDisplay();
            }
        });
    });
}

function openNotepad() {
    const container = document.getElementById('tools-container');
    container.innerHTML = `
    <div class="bg-white rounded-xl shadow-sm p-6">
        <div class="flex justify-between items-center mb-4">
            <h3 class="text-lg font-semibold text-gray-800">Cashier Notepad</h3>
            <button class="close-tool-btn p-2 hover:bg-gray-100 rounded-lg">
                <i class="fas fa-times"></i>
            </button>
        </div>
        <textarea id="notepad-textarea" rows="10" class="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-green-500" placeholder="Type your notes here...">${state.notepadContent}</textarea>
        <div class="flex justify-end mt-4">
            <button id="save-notepad" class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">Save Notes</button>
        </div>
    </div>
    `;
    
    document.querySelector('.close-tool-btn').addEventListener('click', () => {
        container.innerHTML = `
        <div class="text-center py-12 text-gray-500">
            <i class="fas fa-tools text-4xl mb-4"></i>
            <h3 class="text-lg font-medium mb-2">Select a tool to get started</h3>
            <p>Choose from the tools above to open it here</p>
        </div>
        `;
    });
    
    document.getElementById('save-notepad').addEventListener('click', async () => {
        const notes = document.getElementById('notepad-textarea').value;
        state.notepadContent = notes;
        try {
            await fetch(`${BACKEND_URL}/api/notepad`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ notepad: notes })
            });
            showSuccess('Notes saved');
        } catch (err) {
            showToast('Failed to save notes', 'error');
        }
    });
}

function openChecker() {
    alert('Checker tool not yet implemented.');
}

function openSettings() {
    alert('Settings not yet implemented.');
}

// Update payment amounts based on completed orders
function updatePaymentAmounts() {
    const cash = state.completedOrders
        .filter(o => o.paymentMethod === 'cash')
        .reduce((sum, o) => sum + o.total, 0);
    const aba = state.completedOrders
        .filter(o => o.paymentMethod === 'aba')
        .reduce((sum, o) => sum + o.total, 0);
    const checker = state.completedOrders
        .filter(o => o.paymentMethod === 'checker')
        .reduce((sum, o) => sum + o.total, 0);
    
    state.cashAmount = cash;
    state.abaAmount = aba;
    state.checkerAmount = checker;
    
    // Update UI if elements exist
    if (document.getElementById('cash-amount')) {
        document.getElementById('cash-amount').textContent = `៛ ${cash.toLocaleString()}`;
    }
    if (document.getElementById('aba-amount')) {
        document.getElementById('aba-amount').textContent = `៛ ${aba.toLocaleString()}`;
    }
    if (document.getElementById('checker-amount')) {
        document.getElementById('checker-amount').textContent = `៛ ${checker.toLocaleString()}`;
    }
}

// Stub functions
function initTooltips() {}
function loadSampleData() {} // no longer needed
