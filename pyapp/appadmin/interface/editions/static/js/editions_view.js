let datatable = null;

function setupPage(locale, add_toogle) {
    let columnDefs = [
        {
            "targets": [0, 1],
            "searchable": false,
            "sortable": false,
            "className": "center-element"
        },
        {
            "targets": [2, 3, 4, 5],
            "className": "center-element"
        }
    ];

    let columnsStyle = [
        { "width": "50px" },
        { "width": "60px" },
        { "width": "50px" },
        { "width": "50px" },
        { "width": "50px" },
        { "width": "50px" },
        { "width": "33%" },
        { "width": "33%" },
        { "width": "33%" },
    ];

    let order = [[ 2, "desc" ]];
    datatable = new CustomDataTable({
        page: 'editions',
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
