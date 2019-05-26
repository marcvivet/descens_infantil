let datatable = null;

function setupPage(locale, add_toogle) {
    let columnDefs = [
        {
            "targets": [7],
            "searchable": false,
            "sortable": false
        },
        {
            "targets": [0, 1],
            "searchable": false,
            "sortable": false,
            "className": "center-element"
        },
        {
            "targets": [2, 3, 4],
            "className": "center-element"
        }
    ];

    let columnsStyle = [
        { "width": "50px" },
        { "width": "60px" },
        { "width": "70px" },
        { "width": "70px" },
        { "width": "70px" },
        { "width": "20%" },
        { "width": "20%" },
        { "width": "60%" },
    ];

    let order = [[ 5, "asc" ], [ 6, "asc" ]];

    datatable = new CustomDataTable(
        {
            page: 'organizers',
            locale: locale,
            addToggle: add_toogle,
            columnDefs: columnDefs,
            columnsStyle: columnsStyle,
            order: order,
            columnWidth: 470
        });
}

function clickOnDelete(id) {
    datatable.clickOnDelete(id);
}
