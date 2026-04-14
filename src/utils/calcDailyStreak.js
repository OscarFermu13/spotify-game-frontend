export function calcDailyStreak(history) {
    const dailyDates = history
        .filter((g) => g.source === 'daily')
        .map((g) => new Date(g.playedAt).toDateString());

    if (!dailyDates.length) return 0;

    let streak = 0;
    const today = new Date();
    for (let i = 0; i < 365; i++) {
        const d = new Date(today);
        d.setDate(today.getDate() - i);
        if (dailyDates.includes(d.toDateString())) streak++;
        else if (i > 0) break;
    }
    return streak;
}