exports.getDatesInRange = (start, end) => {
    const dates = [];
    let current = new Date(start);
    const stop = new Date(end);
    while (current <= stop) {
        dates.push(current.toISOString().split('T')[0]);
        current.setDate(current.getDate() + 1);
    }
    return dates;
};
