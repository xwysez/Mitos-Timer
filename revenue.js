// =============================================================================
// revenue.js  —  Revenue Module
//
// Exposes:  window.RevenueDB
//
// Used by:
//   script.js   (index page) — addEntry(), clearAll(), getAll()
//   revenue.html             — getAll() via renderPage()
//
// All data persists in localStorage under key 'mitos-revenue-log'
// =============================================================================

const RevenueDB = (() => {

    const KEY = 'mitos-revenue-log';

    // ── Private: read / write localStorage ───────────────────────────────────
    function load() {
        try {
            const raw = localStorage.getItem(KEY);
            return raw ? JSON.parse(raw) : [];
        } catch (e) {
            return [];
        }
    }

    function save(log) {
        try {
            localStorage.setItem(KEY, JSON.stringify(log));
        } catch (e) {
            console.error('RevenueDB save error:', e);
        }
    }

    // ── Public API ────────────────────────────────────────────────────────────

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
    function addEntry(entry) {
        const log = load();
        log.push(entry);
        save(log);
        // Refresh badge if we're on the index page
        if (typeof updateRevenueBadge === 'function') updateRevenueBadge();
    }

    /**
     * Wipe the entire revenue log.
     * Called by script.js → resetAllRooms()
     */
    function clearAll() {
        save([]);
        if (typeof updateRevenueBadge === 'function') updateRevenueBadge();
    }

    /**
     * Return all entries, newest first.
     * Called by revenue.html on page load.
     */
    function getAll() {
        return load().slice().reverse();
    }

    return { addEntry, clearAll, getAll };

})();
