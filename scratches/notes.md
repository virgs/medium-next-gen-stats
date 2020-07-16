<script src="https://kit.fontawesome.com/1697e8bf90.js" crossorigin="anonymous"></script>
https://codepen.io/Siddharth11/full/RPvJmO

https://pypi.org/project/medium-stats/
https://medium.com/@virgs/followers?format=json&limit=10000000

- [x] download file
- [x] highlight
- [x] earnings
- [ ] followers
    ```(https://medium.com/_/api/activity?limit=1000000)
        .payload
        .value
        .filter(item => item.activityType === "users_following_you")
            {
                "activityType": "users_following_you",
                ...
                "occurredAt": 1589424110656,
            }
            .concat(
                .filter(item => item.activityType === "users_following_you_rollup")
                ...item.rollupItems
                .filter(item => item.activityType === "users_following_you")
                    {
                        "activityType": "users_following_you",
                        ...
                        "occurredAt": 1589424110656,
                    }
    ```
