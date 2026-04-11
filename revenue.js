// =============================================================================
// revenue.js  —  Revenue Module (Firestore-backed)
//
// Exposes:  window.RevenueDB
//
// Used by:
//   script.js   (index page) — addEntry(), clearAll(), getAll()
//   revenue.html             — getAll() via renderPage()
//
// Requires window.db and window.fb to be set by the Firebase init block
// in index.html / revenue.html BEFORE this script runs.
// =============================================================================

const RevenueDB = (() => {

    const COL = 'mitos';
    const DOC = 'revenue';

    // In-memory cache so getAll() stays synchronous for the render functions
    let _entries = [];

    // ── Private: write to Firestore ───────────────────────────────────────────
    async function _persist() {
        try {
            await window.fb.setDoc(
                window.fb.doc(window.db, COL, DOC),
                { entries: _entries }
            );
        } catch (e) {
            console.error('RevenueDB save error:', e);
        }
    }

    // ── Public API ────────────────────────────────────────────────────────────

    /**
     * Load all entries from Firestore into memory.
     * Must be awaited once on page load before any other call.
     */
    async function load() {
        try {
            const snap = await window.fb.getDoc(
                window.fb.doc(window.db, COL, DOC)
            );
            _entries = snap.exists() ? (snap.data().entries || []) : [];
        } catch (e) {
            console.error('RevenueDB load error:', e);
            _entries = [];
        }
    }

    /**
     * Add a completed session.
     * Called by script.js → stopTimer()
     *
     * Entry shape:
     * {
     *   id          : timestamp (number)
     *   roomId      : string
     *   roomName    : string
     *   timeIn      : timestamp (ms)
     *   timeOut     : timestamp (ms)
     *   duration    : number  (3 / 8 / 12 + any added hours)
     *   roomCost    : number
     *   ordersTotal : number
     *   totalBill   : number
     *   orders      : [{ name: string, price: number }]
     * }
     */
    async function addEntry(entry) {
        _entries.push(entry);
        await _persist();
        if (typeof updateRevenueBadge === 'function') updateRevenueBadge();
    }

    /**
     * Wipe the entire revenue log.
     * Called by script.js → resetAllRooms()
     */
    async function clearAll() {
        _entries = [];
        await _persist();
        if (typeof updateRevenueBadge === 'function') updateRevenueBadge();
    }

    /**
     * Return all entries, newest first.
     * Called by revenue.html → renderPage() after load() completes.
     */
    function getAll() {
        return _entries.slice().reverse();
    }

    return { load, addEntry, clearAll, getAll };

})();

window.RevenueDB = RevenueDB;