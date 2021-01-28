const addHighlightButton = (item) => {
    const divider = document.createElement('span');
    divider.classList.add('middotDivider');
    item.appendChild(divider);

    const link = document.createElement('a');
    link.classList.add('highlight-in-chart');
    link.classList.add('link');
    link.classList.add('u-baseColor--link');
    link.classList.add('sortableTable-link');
    if (!isHighlightPostFeatureEnabled()) {
        link.classList.add('mngs-highlight-button-disabled');
    }
    link.text = 'Highlight';
    item.appendChild(link);

    const postId = item.parentElement.parentElement.getAttribute('data-action-value');
    link.setAttribute('data-post-id', postId);
    link.setAttribute('href', '#');
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

        if (statsOptions.postsIdsToHighlight.includes(postId)) {
            statsOptions.postsIdsToHighlight = statsOptions.postsIdsToHighlight.filter(id => id !== postId)
            link.text = 'Highlight';
        } else {
            link.text = 'Hide';
            statsOptions.postsIdsToHighlight.push(postId)
        }
        await generateChart();
    };
}

const hidePost = async (post) => {
    statsOptions.postsIdsToHighlight = statsOptions.postsIdsToHighlight.filter(id => id !== post.id);
    const link = document.querySelector(`a[data-post-id="${post.id}"]`);
    if (link) {
        link.text = 'Highlight';
        await generateChart();
    }
};

const checkNecessityOfAddingNewElements = () => {
    Array.from(document.querySelectorAll('.sortableTable-rowTitle span.sortableTable-text'))
        .forEach((item,) => {
            const spansCount = item.querySelectorAll('span .highlight-in-chart').length;
            if (spansCount <= 0) {
                addHighlightButton(item);
                addClapsRow(item.parentElement.parentElement);
            }
        });
};

function addClapsRow(row) {
    const postId = row.getAttribute('data-action-value');
    const fansRow = row.querySelectorAll('td')[4];
    const claps = mngsData.postsSummary
        .filter(post => post.id === postId)
        .map(item => item.claps);

    const clapsRow = fansRow.cloneNode(true);
    clapsRow.querySelectorAll('span')[0].innerText = claps;
    clapsRow.querySelectorAll('span')[1].innerHTML = `${claps}<span class="u-sm-show"><br>claps</span>`;
    clapsRow.querySelectorAll('span')[1].setAttribute('title', claps);

    fansRow.parentElement.insertBefore(clapsRow, fansRow);
}

function enableTableDynamicChecking() {
    checkNecessityOfAddingNewElements();
    setInterval(checkNecessityOfAddingNewElements, 500);
}


//previewImage:
// id: "0*vtVVuA1gz5ivHFOi"
// isFeatured: true
// originalHeight: 1803
// originalWidth: 3000
// unsplashPhotoId: "IUY_3DvM__w"
