function getEarningsOfPost(post) {
    return fetch('https://medium.com/_/graphql',
        {
            credentials: 'same-origin',
            method: 'POST',
            headers: {
                accept: '*/*',
                'graphql-operation': 'StatsPostChart',
                'content-type': 'application/json',
            },
            body: JSON.stringify({
                'operationName': 'StatsPostChart',
                'variables': {
                    'postId': post.id,
                    'startAt': 0,
                    'endAt': Date.now() + oneDayInMilliseconds
                },
                'query': 'query StatsPostChart($postId: ID!, $startAt: Long!, $endAt: Long!) {\n  post(id: $postId) {\n    id\n    ...StatsPostChart_dailyStats\n    ...StatsPostChart_dailyEarnings\n    __typename\n  }\n}\n\nfragment StatsPostChart_dailyStats on Post {\n  dailyStats(startAt: $startAt, endAt: $endAt) {\n    periodStartedAt\n    views\n    internalReferrerViews\n    memberTtr\n    __typename\n  }\n  __typename\n}\n\nfragment StatsPostChart_dailyEarnings on Post {\n  earnings {\n    dailyEarnings(startAt: $startAt, endAt: $endAt) {\n      periodEndedAt\n      periodStartedAt\n      amount\n      __typename\n    }\n    lastCommittedPeriodStartedAt\n    __typename\n  }\n  __typename\n}\n'
            })
        })
        .then(async res => {
            if (res.status !== 200) {
                const message = `Fail to fetch data: (${res.status}) - ${res.statusText}`;
                console.log(message);
                return [];
            }
            const text = await res.text();
            const payload = JSON.parse(text);
            return payload.data.post.earnings.dailyEarnings;
        })
        .catch(() => []);
}

const convertGraphQlToPostData = (dailyEarningsOfPost, post) => {
    return (dailyEarningsOfPost || [])
        .map(day => {
            let collectedAt = day.collectedAt;
            if (collectedAt === undefined) {
                if (day.periodEndedAt) {
                    collectedAt = (day.periodEndedAt + day.periodStartedAt) / 2;
                } else {
                    collectedAt = day.periodStartedAt
                }
            }
            return {
                title: post.title,
                id: post.id,
                earnings: getNumber(day.amount) / 100,
                // views: getNumber(day.views),
                collectedAt: collectedAt
            };
        });
}
