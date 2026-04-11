// =============================================================================
// script.js  —  Room Management Logic
// Requires: window.RevenueDB  (loaded via revenue.js before this)
// =============================================================================

const ROOM_CONFIG = [
    { id: 'ren1',   name: 'Ren 1',   isPrivate: true,  rates: { 3: 400, 8: 800,  12: 1200 }, hourlyRate: 150 },
    { id: 'ren2',   name: 'Ren 2',   isPrivate: true,  rates: { 3: 400, 8: 800,  12: 1200 }, hourlyRate: 150 },
    { id: 'room1',  name: 'Room 1',  isPrivate: false, rates: { 3: 300, 8: 650,  12: 950  }, hourlyRate: 100 },
    { id: 'room2',  name: 'Room 2',  isPrivate: false, rates: { 3: 300, 8: 650,  12: 950  }, hourlyRate: 100 },
    { id: 'room3',  name: 'Room 3',  isPrivate: false, rates: { 3: 200, 8: 400,  12: 600  }, hourlyRate: 50  },
    { id: 'room4',  name: 'Room 4',  isPrivate: false, rates: { 3: 300, 8: 650,  12: 950  }, hourlyRate: 100 },
    { id: 'room5',  name: 'Room 5',  isPrivate: false, rates: { 3: 300, 8: 650,  12: 950  }, hourlyRate: 100 },
    { id: 'room6',  name: 'Room 6',  isPrivate: false, rates: { 3: 200, 8: 400,  12: 600  }, hourlyRate: 50  },
    { id: 'room7',  name: 'Room 7',  isPrivate: false, rates: { 3: 200, 8: 400,  12: 600  }, hourlyRate: 50  },
    { id: 'room8',  name: 'Room 8',  isPrivate: false, rates: { 3: 350, 8: 700,  12: 1050 }, hourlyRate: 100 },
    { id: 'room9',  name: 'Room 9',  isPrivate: false, rates: { 3: 300, 8: 650,  12: 950  }, hourlyRate: 100 },
    { id: 'room10', name: 'Room 10', isPrivate: false, rates: { 3: 300, 8: 650,  12: 950  }, hourlyRate: 100 },
    { id: 'room11', name: 'Room 11', isPrivate: false, rates: { 3: 300, 8: 650,  12: 950  }, hourlyRate: 100 },
    { id: 'room12', name: 'Room 12', isPrivate: false, rates: { 3: 300, 8: 650,  12: 950  }, hourlyRate: 100 }
];

const BASE_HOURS  = 3;

let rooms           = {};
let updateInterval  = null;
let currentNoteRoom = null;

// =============================================================================
// AUTH
// =============================================================================
function checkAuth() {
    try {
        const auth = localStorage.getItem('mitos-auth');
        if (!auth || auth !== 'authenticated') {
            window.location.href = 'login.html';
        }
    } catch (e) {
        window.location.href = 'login.html';
    }
}

function logout() {
    try {
        localStorage.removeItem('mitos-auth');
        window.location.href = 'login.html';
    } catch (e) {
        console.error('Logout error:', e);
    }
}

// =============================================================================
// GENERATE ROOM TILES
// =============================================================================
function generateRoomTiles() {
    const grid = document.getElementById('roomsGrid');
    grid.innerHTML = ROOM_CONFIG.map(cfg => `
        <div class="room-tile ${cfg.isPrivate ? 'private' : ''}" data-room="${cfg.id}">
            <div class="room-status">
                <div class="status-row">
                    <div class="status-indicator" onclick="toggleDirty('${cfg.id}')">
                        <span class="status-dot"></span>
                        <span class="status-text">Clean</span>
                    </div>
                    <div class="note-indicator" onclick="openNoteModal('${cfg.id}')">
                        <span class="note-icon">&#128221;</span>
                        <span class="note-badge">0</span>
                    </div>
                </div>
                <div class="add-hour-btn" onclick="addHours('${cfg.id}', 1)" title="Add 1 hour (+&#8369;${cfg.hourlyRate})">+1HR</div>
            </div>
            <div class="room-header">
                <h2>${cfg.name}</h2>
                ${cfg.isPrivate ? '<span class="room-badge private-badge">Private</span>' : ''}
            </div>
            <div class="price-tag">&#8369;${cfg.rates[3]} / 3hrs | &#8369;${cfg.rates[8]} / 8hrs | &#8369;${cfg.rates[12]} / 12hrs | +&#8369;${cfg.hourlyRate}/hr</div>
            <div class="timer-section">
                <div class="timer-display">00:00:00</div>
                <div class="cost-display">
                    <div class="room-cost">&#8369;0.00</div>
                    <div class="extra-cost">+&#8369;0.00</div>
                </div>
            </div>
            <div class="time-row">
                <input type="time" class="time-input">
                <select class="duration-select" onchange="selectDuration('${cfg.id}', this.value)">
                    <option value="">Duration</option>
                    <option value="3">3 hours (&#8369;${cfg.rates[3]})</option>
                    <option value="8">8 hours (&#8369;${cfg.rates[8]})</option>
                    <option value="12">12 hours (&#8369;${cfg.rates[12]})</option>
                </select>
            </div>
            <div class="button-group">
                <button class="start-btn" onclick="startTimer('${cfg.id}')">Start</button>
                <button class="stop-btn"  onclick="stopTimer('${cfg.id}')">Stop</button>
            </div>
        </div>
    `).join('');
}

// =============================================================================
// ROOM STATE PERSISTENCE
// =============================================================================
async function loadRooms() {
    try {
        const docRef = window.fb.doc(window.db, "mitos", "rooms");
        const docSnap = await window.fb.getDoc(docRef);

        if (docSnap.exists()) {
            rooms = docSnap.data().data || {};
        } else {
            rooms = {};
        }

        Object.keys(rooms).forEach(roomId => {
            const tile = document.querySelector(`[data-room="${roomId}"]`);
            if (!tile) return;

            const r = rooms[roomId];

            if (r.endTime && Date.now() > r.endTime) tile.classList.add('expired-notification');

            if (r.startTime) {
                tile.classList.add('active');
                const d = new Date(r.startTime);
                tile.querySelector('.time-input').value =
                    `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
            }

            if (r.selectedDuration) {
                tile.querySelector('.duration-select').value = r.selectedDuration;
            }

            if (r.isDirty) {
                tile.classList.add('dirty');
                tile.querySelector('.status-text').textContent = 'Dirty';
                hideTimerElements(tile);
            }

            updateNoteBadge(roomId);
        });

    } catch (e) {
        console.error("Load error:", e);
        rooms = {};
    }
}

async function saveRooms() {
    try {
        await window.fb.setDoc(
            window.fb.doc(window.db, "mitos", "rooms"),
            { data: rooms }
        );
    } catch (e) {
        console.error("Save error:", e);
    }
}

// =============================================================================
// DIRTY / CLEAN
// =============================================================================
function toggleDirty(roomId) {
    const tile = document.querySelector(`[data-room="${roomId}"]`);
    if (!rooms[roomId]) rooms[roomId] = {};
    rooms[roomId].isDirty = !rooms[roomId].isDirty;

    if (rooms[roomId].isDirty) {
        tile.classList.add('dirty');
        tile.querySelector('.status-text').textContent = 'Dirty';
        hideTimerElements(tile);
    } else {
        tile.classList.remove('dirty');
        tile.querySelector('.status-text').textContent = 'Clean';
        showTimerElements(tile);
    }
    saveRooms();
}

function hideTimerElements(tile) {
    ['.timer-section', '.time-row', '.button-group', '.price-tag', '.add-hour-btn']
        .forEach(sel => { const el = tile.querySelector(sel); if (el) el.style.display = 'none'; });
}

function showTimerElements(tile) {
    const show = { '.timer-section': 'block', '.time-row': 'flex', '.button-group': 'flex', '.price-tag': 'block', '.add-hour-btn': 'flex' };
    Object.entries(show).forEach(([sel, val]) => { const el = tile.querySelector(sel); if (el) el.style.display = val; });
}

// =============================================================================
// PRICING HELPERS
// =============================================================================
function getRoomPrice(roomId, duration) {
    const cfg = ROOM_CONFIG.find(r => r.id === roomId);
    if (!cfg) return 300;
    return cfg.rates[duration] || cfg.rates[BASE_HOURS];
}

function getRoomHourlyRate(roomId) {
    const cfg = ROOM_CONFIG.find(r => r.id === roomId);
    return cfg ? cfg.hourlyRate : 100;
}

function getRemainingTime(endTime) {
    const diff = endTime - Date.now();
    if (diff <= 0) return { hours: 0, minutes: 0, seconds: 0, expired: true };
    return {
        hours:   Math.floor(diff / 3600000),
        minutes: Math.floor((diff % 3600000) / 60000),
        seconds: Math.floor((diff % 60000)  / 1000),
        expired: false
    };
}

function calculateCost(startTime, endTime, basePrice, hourlyRate, addedHoursCost = 0) {
    const elapsed = (Math.min(Date.now(), endTime) - startTime) / 3600000;
    let cost = basePrice;
    if (elapsed > BASE_HOURS) cost += Math.ceil(elapsed - BASE_HOURS) * hourlyRate;
    return cost + addedHoursCost;
}

function getOrdersTotal(roomId) {
    if (!rooms[roomId]?.notes) return 0;
    return rooms[roomId].notes.reduce((s, n) => s + (n.price || 0), 0);
}

// =============================================================================
// DURATION SELECT
// =============================================================================
function selectDuration(roomId, hours) {
    if (!hours) return;
    if (!rooms[roomId]) rooms[roomId] = {};
    rooms[roomId].selectedDuration = parseInt(hours);
    document.querySelector(`[data-room="${roomId}"] .duration-select`).value = hours;
    saveRooms();
}

// =============================================================================
// ADD EXTRA HOURS
// =============================================================================
function addHours(roomId, hrs) {
    if (!rooms[roomId]?.endTime) { alert('Please start the timer first!'); return; }
    rooms[roomId].endTime        += hrs * 3600000;
    rooms[roomId].duration       += hrs;
    rooms[roomId].addedHoursCost  = (rooms[roomId].addedHoursCost || 0) + hrs * getRoomHourlyRate(roomId);
    saveRooms();
    updateTimerDisplay(roomId);
}

// =============================================================================
// START TIMER
// =============================================================================
function startTimer(roomId) {
    const tile  = document.querySelector(`[data-room="${roomId}"]`);
    const input = tile.querySelector('.time-input');
    if (!input.value)                     { alert('Please select a start time!'); return; }
    if (!rooms[roomId]?.selectedDuration) { alert('Please select a duration!');   return; }

    const [h, m] = input.value.split(':').map(Number);
    const start  = new Date();
    start.setHours(h, m, 0, 0);
    const dur = rooms[roomId].selectedDuration;

    rooms[roomId].startTime      = start.getTime();
    rooms[roomId].endTime        = start.getTime() + dur * 3600000;
    rooms[roomId].duration       = dur;
    rooms[roomId].basePrice      = getRoomPrice(roomId, dur);
    rooms[roomId].hourlyRate     = getRoomHourlyRate(roomId);
    rooms[roomId].addedHoursCost = 0;

    tile.classList.add('active');
    tile.classList.remove('expired-notification');
    saveRooms();
    updateTimerDisplay(roomId);
}

// =============================================================================
// STOP TIMER  —  writes to RevenueDB
// =============================================================================
async function stopTimer(roomId) {
    const tile = document.querySelector(`[data-room="${roomId}"]`);
    const r    = rooms[roomId];

    if (r?.startTime) {
        const addedCost   = r.addedHoursCost || 0;
        const roomCost    = calculateCost(r.startTime, r.endTime, r.basePrice, r.hourlyRate, addedCost);
        const ordersTotal = getOrdersTotal(roomId);
        const totalBill   = roomCost + ordersTotal;
        const timeOut     = Date.now();
        const cfg         = ROOM_CONFIG.find(c => c.id === roomId);

        // ── Hand off to Revenue module ────────────────────────────────────────
        await RevenueDB.addEntry({
            id:          timeOut,
            roomId,
            roomName:    cfg?.name ?? roomId,
            timeIn:      r.startTime,
            timeOut,
            duration:    r.duration,
            roomCost,
            orders:      r.notes ? r.notes.map(n => ({ name: n.name, price: n.price })) : [],
            ordersTotal,
            totalBill
        });

        // ── Clear this session ────────────────────────────────────────────────
        r.startTime        = null;
        r.endTime          = null;
        r.duration         = null;
        r.addedHoursCost   = 0;
        r.selectedDuration = null;
        r.notes            = [];
    }

    tile.classList.remove('active', 'expired-notification');
    tile.querySelector('.timer-display').textContent = '00:00:00';
    tile.querySelector('.timer-display').style.color = '';
    tile.querySelector('.room-cost').textContent     = '&#8369;0.00';
    tile.querySelector('.extra-cost').textContent    = '+&#8369;0.00';
    tile.querySelector('.time-input').value          = '';
    tile.querySelector('.duration-select').value     = '';
    updateNoteBadge(roomId);
    saveRooms();
}

// =============================================================================
// TIMER DISPLAY  (ticks every second)
// =============================================================================
function updateTimerDisplay(roomId) {
    const tile = document.querySelector(`[data-room="${roomId}"]`);
    const r    = rooms[roomId];
    if (!tile || !r?.endTime) return;

    const remaining = getRemainingTime(r.endTime);
    const cost      = calculateCost(r.startTime, r.endTime, r.basePrice, r.hourlyRate, r.addedHoursCost || 0);
    const extras    = getOrdersTotal(roomId);
    const display   = tile.querySelector('.timer-display');

    if (remaining.expired) {
        display.textContent = '00:00:00';
        display.style.color = 'var(--red)';
        tile.classList.add('expired-notification');
    } else {
        display.textContent = [remaining.hours, remaining.minutes, remaining.seconds]
            .map(v => String(v).padStart(2, '0')).join(':');
        display.style.color = '';
    }

    tile.querySelector('.room-cost').textContent  = `\u20B1${cost.toFixed(2)}`;
    tile.querySelector('.extra-cost').textContent = extras > 0 ? `+\u20B1${extras.toFixed(2)}` : '+\u20B10.00';
}

function updateAllTimers() {
    Object.keys(rooms).forEach(id => { if (rooms[id]?.endTime) updateTimerDisplay(id); });
}

// =============================================================================
// ORDER NOTES MODAL
// =============================================================================
function openNoteModal(roomId) {
    currentNoteRoom = roomId;
    const cfg = ROOM_CONFIG.find(r => r.id === roomId);
    document.getElementById('modalRoomName').textContent = cfg.name;
    document.getElementById('noteModal').classList.add('active');
    renderNotes();
}

function closeNoteModal() {
    document.getElementById('noteModal').classList.remove('active');
    document.getElementById('noteItemInput').value  = '';
    document.getElementById('notePriceInput').value = '';
    currentNoteRoom = null;
}

function addNoteItem() {
    const name  = document.getElementById('noteItemInput').value.trim();
    const price = parseFloat(document.getElementById('notePriceInput').value) || 0;
    if (!name) { alert('Please enter an item name'); return; }

    if (!rooms[currentNoteRoom])       rooms[currentNoteRoom]       = {};
    if (!rooms[currentNoteRoom].notes) rooms[currentNoteRoom].notes = [];
    rooms[currentNoteRoom].notes.push({ id: Date.now(), name, price });

    document.getElementById('noteItemInput').value  = '';
    document.getElementById('notePriceInput').value = '';
    saveRooms();
    renderNotes();
    updateNoteBadge(currentNoteRoom);
    updateTimerDisplay(currentNoteRoom);
}

function deleteNoteItem(noteId) {
    if (!rooms[currentNoteRoom]?.notes) return;
    rooms[currentNoteRoom].notes = rooms[currentNoteRoom].notes.filter(n => n.id !== noteId);
    saveRooms();
    renderNotes();
    updateNoteBadge(currentNoteRoom);
    updateTimerDisplay(currentNoteRoom);
}

function renderNotes() {
    const list  = document.getElementById('notesList');
    const notes = rooms[currentNoteRoom]?.notes;
    if (!notes?.length) {
        list.innerHTML = '<div class="empty-notes">No orders yet. Add items above.</div>';
        return;
    }
    list.innerHTML = notes.map(n => `
        <div class="note-item">
            <div class="note-item-info">
                <div class="note-item-name">${n.name}</div>
                <div class="note-item-price">\u20B1${n.price.toFixed(2)}</div>
            </div>
            <button class="delete-note-btn" onclick="deleteNoteItem(${n.id})">Delete</button>
        </div>
    `).join('');
}

function updateNoteBadge(roomId) {
    const tile = document.querySelector(`[data-room="${roomId}"]`);
    if (!tile) return;
    const count = rooms[roomId]?.notes?.length ?? 0;
    const badge = tile.querySelector('.note-badge');
    badge.textContent = count;
    badge.classList.toggle('has-notes', count > 0);
}

// =============================================================================
// REVENUE BADGE  (green number on the Revenue button)
// =============================================================================
function updateRevenueBadge() {
    const badge = document.getElementById('revenueBadge');
    if (!badge) return;
    const count = RevenueDB.getAll().length;
    badge.textContent   = count;
    badge.style.display = count > 0 ? 'inline-flex' : 'none';
}

// =============================================================================
// RESET ALL
// =============================================================================
async function resetAllRooms() {
    if (!confirm('Reset all rooms? This will clear all timers, orders, and the entire revenue log.')) return;

    rooms = {};
    await RevenueDB.clearAll();

    document.querySelectorAll('.room-tile').forEach(tile => {
        tile.classList.remove('active', 'dirty', 'expired-notification');
        tile.querySelector('.timer-display').textContent = '00:00:00';
        tile.querySelector('.timer-display').style.color = '';
        tile.querySelector('.room-cost').textContent     = '\u20B10.00';
        tile.querySelector('.extra-cost').textContent    = '+\u20B10.00';
        tile.querySelector('.time-input').value          = '';
        tile.querySelector('.duration-select').value     = '';
        tile.querySelector('.status-text').textContent   = 'Clean';
        tile.querySelector('.note-badge').textContent    = '0';
        tile.querySelector('.note-badge').classList.remove('has-notes');
        showTimerElements(tile);
    });

    saveRooms();
    updateRevenueBadge();
}

// =============================================================================
// INIT
// =============================================================================
checkAuth();
generateRoomTiles();

(async () => {
    await RevenueDB.load();   // load revenue cache first
    await loadRooms();        // then load room states
    updateAllTimers();
    updateRevenueBadge();
})();

updateInterval = setInterval(updateAllTimers, 1000);