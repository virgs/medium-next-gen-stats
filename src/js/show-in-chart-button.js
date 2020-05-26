const addHighlightButton = (item) => {
    const divider = document.createElement('span');
    divider.classList.add('middotDivider');
    item.appendChild(divider);

    const link = document.createElement('a');
    link.classList.add('link');
    link.classList.add('u-baseColor--link');
    link.classList.add('sortableTable-link');
    link.text = 'Highlight';
    item.appendChild(link);

    const postId = item.parentElement.parentElement.getAttribute('data-action-value');
    link.setAttribute('data-post-id', postId);
    link.onclick = async () => {
        setTimeout(() => {
            document.documentElement
                .querySelector('.mngs-stats-page-title')
                .scrollIntoView({
                    behavior: 'smooth',
                    block: 'start',
                    inline: 'nearest'
                });
        }, 100);

        if (postsIdsToHighlight.includes(postId)) {
            postsIdsToHighlight = postsIdsToHighlight.filter(id => id !== postId)
            link.text = 'Highlight';
        } else {
            link.text = 'Hide';
            postsIdsToHighlight.push(postId)
        }
        await generateChart();
    };
}

const hidePost = async (post) => {
    postsIdsToHighlight = postsIdsToHighlight.filter(id => id !== post.id);
    const link = document.querySelector(`a[data-post-id="${post.id}"]`);
    if (link) {
        link.text = 'Highlight';
        await generateChart();
    }
};

const checkNecessityOfAddingHighlightButton = () => {
    Array.from(document.querySelectorAll('.sortableTable-rowTitle .sortableTable-text'))
        .forEach((item,) => {
            const spansCount = item.querySelectorAll('span').length;
            if (spansCount <= 4) {
                addHighlightButton(item);
            }
        });
};
checkNecessityOfAddingHighlightButton();
setInterval(checkNecessityOfAddingHighlightButton, 500);

