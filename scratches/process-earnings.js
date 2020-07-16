const fs = require('fs');

const posts = JSON.parse(fs.readFileSync('medium-next-generation-stats.json')
    .toString());

const ranges = {};
posts
    .forEach(post => post.earnings.dailyEarnings
        .forEach(earning => {
            ranges[earning.periodStartedAt] = null;
            ranges[earning.periodEndedAt] = null;
        }));

const dates = Object
    .keys(ranges)
    .map(value => parseInt(value))
    .sort();

console.log(['Date'].concat(posts
    .map(post => post.title))
    .join(';'));
dates.forEach(date => {
    console.log([new Date(date)]
        .concat(posts
            .map(post => post.earnings.dailyEarnings
                .reduce((acc, earning) => {
                    if (earning.periodStartedAt <= date && earning.periodEndedAt >= true) {
                        return acc + earning.amount;
                    }
                    return acc;
                }, 0))
        )
        .join(';'));
})
