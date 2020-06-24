function getEarningsOfPost(postId) {
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
                    'postId': postId,
                    'startAt': 0,
                    'endAt': Date.now()
                },
                'query': 'query StatsPostChart($postId: ID!, $startAt: Long!, $endAt: Long!) {\n  post(id: $postId) {\n    id\n    ...StatsPostChart_dailyStats\n    ...StatsPostChart_dailyEarnings\n    __typename\n  }\n}\n\nfragment StatsPostChart_dailyStats on Post {\n  dailyStats(startAt: $startAt, endAt: $endAt) {\n    periodStartedAt\n    views\n    internalReferrerViews\n    memberTtr\n    __typename\n  }\n  __typename\n}\n\nfragment StatsPostChart_dailyEarnings on Post {\n  earnings {\n    dailyEarnings(startAt: $startAt, endAt: $endAt) {\n      periodEndedAt\n      periodStartedAt\n      amount\n      __typename\n    }\n    lastCommittedPeriodStartedAt\n    __typename\n  }\n  __typename\n}\n'
            })
        })
        .then(res => {
            if (res.status !== 200) {
                const message = `Fail to fetch data: (${res.status}) - ${res.statusText}`;
                console.log(message);
                throw message;
            }
            return res.text();
        });
}

const convertGraphQlToPostData = (dailyEarningsOfPost, postId) => {
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
                id: postId,
                earnings: getNumber(day.amount) / 100,
                views: getNumber(day.views),
                collectedAt: collectedAt + new Date().getTimezoneOffset() * 60 * 1000
            };
        });
}
