function getRangeInDays(beginDate, endDate) {
    const differenceInDays = Math.ceil((endDate.getTime() - beginDate.getTime()) / oneDayInMilliseconds);
    let dayIterator = beginDate;
    return Array.from(Array(differenceInDays))
        .reduce(acc => {
            const nextInterval = new Date(dayIterator.getTime() + oneDayInMilliseconds);
            const interval = {
                begin: dayIterator,
                end: nextInterval,
                label: getStringifiedDate(dayIterator)
            };
            acc = acc.concat(interval);
            dayIterator = nextInterval;
            return acc;
        }, []);
}

function getRangeInMonths(beginDate, endDate) {
    const differenceInMonths = endDate.getUTCMonth() - beginDate.getUTCMonth() + (12 * (endDate.getUTCFullYear() - beginDate.getUTCFullYear())) + 1;
    let monthIterator = beginDate;
    return Array.from(Array(differenceInMonths))
        .reduce(acc => {
            const nextInterval = new Date(monthIterator.getUTCFullYear(), monthIterator.getUTCMonth() + 1);
            const interval = {
                begin: monthIterator,
                end: nextInterval,
                label: getStringifiedMonth(monthIterator)
            };
            acc = acc.concat(interval);
            monthIterator = nextInterval;
            return acc;
        }, []);
}

function getRangeInWeeks(beginDate, endDate) {
    const oneWeekInMilliseconds = oneDayInMilliseconds * 7;
    const differenceInWeeks = Math.abs(Math.round((endDate.getTime() - beginDate.getTime()) / oneWeekInMilliseconds)) + 1;
    let weekIterator = beginDate;
    return Array.from(Array(differenceInWeeks))
        .reduce(acc => {
            const nextWeek = new Date(weekIterator.getTime() + oneWeekInMilliseconds);
            const interval = {
                begin: weekIterator,
                end: nextWeek,
                label: getStringifiedWeekDifference(weekIterator, new Date(nextWeek.getTime() - oneDayInMilliseconds))
            };
            acc = acc.concat(interval);
            weekIterator = nextWeek;
            return acc;
        }, []);
}

function getStringifiedDate(value) {
    const date = new Date(value.getTime() + timezoneOffsetInMs)
    const day = (date.getUTCDate() + '').padStart(2, '0');
    const monthShort = date.toLocaleString('default', {month: 'long'}).substr(0, 3);
    const month = monthShort.substr(0, 1).toUpperCase() + monthShort.substr(1);
    const year = date.getUTCFullYear();
    return `${day}/${month}/${year}`;
}

function getStringifiedWeekDifference(initial, end) {
    const differentYears = initial.getFullYear() !== end.getFullYear();
    const differentMonth = initial.getUTCMonth() !== end.getUTCMonth();

    let initialString = (initial.getUTCDate() + '').padStart(2, '0');
    const initialMonth = initial.toLocaleString('default', {month: 'long'}).substr(0, 3);

    if (differentYears) {
        initialString = getStringifiedDate(initial);
    } else if (differentMonth) {
         initialString = `${initialString}/${initialMonth}`;
    }
    return `${initialString} to ${getStringifiedDate(end)}`;
}

function getStringifiedMonth(monthIterator) {
    const monthName = monthIterator.toLocaleString('default', {month: 'long'});
    return monthName.substr(0, 1).toUpperCase() + monthName.substr(1) + '/' + monthIterator.getFullYear();
}

const ranges = [
    {
        rangeMethod: getRangeInDays,
        label: 'Daily',
    },
    {
        rangeMethod: getRangeInWeeks,
        label: 'Weekly',
    },
    {
        rangeMethod: getRangeInMonths,
        label: 'Monthly',
    },
];

const timeRanges = [30, 90, 180, 360, 1800];
