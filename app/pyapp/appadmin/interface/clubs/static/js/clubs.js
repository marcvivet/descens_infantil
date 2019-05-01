var page_dialog = null;
var table = null;
var selected_form = null;
var selected_id = null;
var toggle = null;


function setupPage(locale, add_toogle) {
    var request = new XMLHttpRequest();
    request.open("GET","/clubs/static/locale/" + locale + ".json", false);
    request.send(null);
    var message_locale = JSON.parse(request.responseText);

    if (add_toogle) {
        toggle = new ToggleVisualization('clubs-toggle-visualization', 'list', 'thumbnails', true);
    }

    table = $('#datatable-clubs').DataTable( {
        "bStateSave": true,
        "autoWidth": false,
        "responsive": true,
        "columnDefs": [
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
        ],
        "columns": [
            { "width": "50px" },
            { "width": "60px" },
            { "width": "15%" },
            { "width": "75px" },
            { "width": "15%" },
            { "width": "150px" },
            null
        ],
        "order": [[ 2, "asc" ]],
        "language": {
            "url": "/static/locale/datatable_" + locale + ".json"
        }
    });

    page_dialog = new PageDialog('confirm', message_locale.are_you_sure, message_locale.warning_message);
    page_dialog.close_button_name = message_locale.cancel;
    page_dialog.addAcceptButton(message_locale.proceed, deleteClub);

    Page.setLocale(locale);
}


function buttonDelete(element) {
    selected_form = element.parentElement;
    page_dialog.show();
}

function updateElements(response) {
    Page.setLoading(false);
    let thumbnail = document.getElementById(`thumbnails_row_${ selected_id }`);
    thumbnail.parentElement.removeChild(thumbnail);

    let table_element = document.getElementById(`table_row_${ selected_id }`);
    if (!table_element) {
        toggle.isDirty();
    } else {
        table.row(table_element).remove().draw();
    }

    selected_id = null;
    Page.showSuccess(response.message);
    toggle.update();
}

function deleteClub() {
    selected_id = selected_form.querySelector('input[name="club_id"]').value;
    selected_form = null;
    page_dialog.hide();
    Page.setLoading(true);
    Page.httpRequest({
        action: "delete",
        club_id: selected_id
    }, '/clubs/communicate', updateElements);  
}