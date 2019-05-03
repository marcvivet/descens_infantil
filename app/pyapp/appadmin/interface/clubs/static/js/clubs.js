let datatable = null;

function setupPage(locale, add_toogle) {
    let columnDefs = [
        {
            "targets": [4, 5, 6],
            "searchable": false,
            "sortable": false
        },
        {
            "targets": [0, 1],
            "searchable": false,
            "sortable": false,
            "className": "center-element"
        }
    ];

    let columnsStyle = [
        { "width": "50px" },
        { "width": "60px" },
        { "width": "15%" },
        { "width": "75px" },
        { "width": "15%" },
        { "width": "150px" },
        null
    ];

    let order = [[ 2, "asc" ]];

    datatable = new CustomDataTable('clubs', locale, add_toogle, columnDefs, columnsStyle, order);
}

function clickOnDelete(id) {
    datatable.clickOnDelete(id);
}
