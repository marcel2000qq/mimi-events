exports.getDatesInRange = function (startDate, endDate) {
    const dates = [];
    let current = new Date(startDate);
    const last = new Date(endDate);
    while (current <= last) {
        const iso = current.toISOString().split('T')[0]; // "YYYY-MM-DD"
        dates.push(iso);
        current.setDate(current.getDate() + 1);
    }
    return dates;
};