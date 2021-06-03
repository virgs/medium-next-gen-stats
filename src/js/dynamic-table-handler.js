const addDateLabel = (item, postId) => {
    const postData = mngsData.postsSummary
        .find(post => post.id === postId);
    const readingTime = item.parentElement.querySelector('.readingTime').parentElement;
    console.log(readingTime)

    const divider = document.createElement('span');
    divider.classList.add('middotDivider');
    item.insertBefore(divider, readingTime);
    const publishedDate = document.createElement('span');
    publishedDate.classList.add('readingTime');
    publishedDate.title = getStringifiedDate(new Date(+postData.firstPublishedAt));
    item.insertBefore(publishedDate, divider);
}

const addHighlightButton = (item, postId) => {
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
            const highlightButton = item.querySelectorAll('span .highlight-in-chart').length;
            const thereIsNoHighlightButton = highlightButton <= 0;
            if (thereIsNoHighlightButton) {
                const row = item.parentElement.parentElement;
                const postId = row.getAttribute('data-action-value');
                addHighlightButton(item, postId);
                addDateLabel(item, postId);
                addClapsRow(row, postId);
                addPreviewImageAsBackgroundRow(row, postId);
            }
        });
};

function addClapsRow(row, postId) {
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

function addPreviewImageAsBackgroundRow(row, postId) {
    const titleRow = row.querySelectorAll('td')[0];
    const imageUrl = mngsData.postsSummary
        .filter(post => post.id === postId && post.previewImage && post.previewImage.id)
        .reduce((acc, item) => `https://miro.medium.com/max/150/${item.previewImage.id}`, '');

    titleRow.classList.add('mngs-title-img');
    titleRow.style.cursor = 'unset';
    titleRow.style.padding = '5px 5px 5px 0';
    titleRow.style['background'] = `url("${imageUrl}") center center / cover no-repeat content-box rgba(255, 255, 255, 0.85)`;
    titleRow.style['background-blend-mode'] = 'lighten';

    Array.from(titleRow.children)
        .forEach(item => item.style['padding-left'] = '5px');

}

function enableTableDynamicChecking() {
    checkNecessityOfAddingNewElements();
    setInterval(checkNecessityOfAddingNewElements, 500);
}
