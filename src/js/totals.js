const totalsHtml = {
    createHtml: function (values) {
        return `<div class="sortableTableWrapper">
    <table class="sortableTable js-statsTable">
        <thead class="sortableTableHeaders">
            <tr>
                <th class="sortableTable-header sortableTable-title u-maxWidth450">
                    <button class="button button--chromeless u-baseColor--buttonNormal">Totals</button>
                </th>
                <th class="sortableTable-header">
                    <button class="button button--chromeless u-baseColor--buttonNormal">Views</button>
                </th>
                <th class="sortableTable-header">
                    <button class="button button--chromeless u-baseColor--buttonNormal">Reads</button>
                </th>
                <th class="sortableTable-header">
                    <button class="button button--chromeless u-baseColor--buttonNormal">Read ratio</button>
                </th>
                <th class="sortableTable-header">
                    <button class="button button--chromeless u-baseColor--buttonNormal">Claps</button>
                </th>
                <th class="sortableTable-header">
                    <button class="button button--chromeless u-baseColor--buttonNormal">Fans</button>
                </th>
            </tr>
        </thead>
        <tbody class="js-statsTableBody">
            <tr class="sortableTable-row js-statsTableRow">
                <td>
                    <div class="sortableTable-number" style="text-align: left">
                        ${values.totals} articles
                    </div>
                </td>
                <td>
                    <span class="sortableTable-number">${values.views}
                        <span class="u-sm-show"><br>views</span>
                    </span>
                </td>
                <td>
                    <span class="sortableTable-number">${values.reads}
                        <span class="u-sm-show"><br>reads</span>
                    </span>
                </td>
                <td>
                    <span class="sortableTable-number">${readRatio(values.views, values.reads)}%
                        <span class="u-sm-show"><br>ratio</span>
                    </span>
                </td>
                <td>
                    <span class="sortableTable-number">${values.claps}
                        <span class="u-sm-show"><br>claps</span>
                    </span>
                </td>
                <td>
                    <span class="sortableTable-number">${values.fans}
                        <span class="u-sm-show"><br>fans</span>
                    </span>
                </td>
            </tr>
        </tbody>
    </table>
</div>`
    }
}

function readRatio(views, reads) {
    if (!views) {
        return 0
    }
    return (100 * reads / views).toFixed(1)
}

function createTotalsTable() {
    const element = document.createElement('div');
    const totals = totalsHtml;
    const values = mngsData.postsSummary
        .reduce((acc, item) => {
                ++acc.totals
                acc.views += item.views
                acc.reads += item.reads
                acc.fans += item.upvotes
                acc.claps += item.claps
                return acc;
            }
            , {
                totals: 0,
                views: 0,
                reads: 0,
                claps: 0,
                fans: 0
            });
    const innerHTML = totals.createHtml(values);
    element.innerHTML = innerHTML

    const chartPage = document.getElementsByClassName('chartPage')[0];
    const parent = chartPage.parentNode;
    parent.insertBefore(element, chartPage.nextSibling);
}

