var selected_index = null;
var page_dialog = null;

function setupPage(locale) {
    var request = new XMLHttpRequest();
    request.open("GET","/roles/static/locale/" + locale + ".json", false);
    request.send(null);
    var message_locale = JSON.parse(request.responseText);

    disableButtons();
    page_dialog = new PageDialog('confirm', message_locale.are_you_sure, message_locale.warning_message);
    page_dialog.close_button_name = message_locale.cancel;
    page_dialog.addAcceptButton(message_locale.proceed, deleteRole);
    var table = $('#datatable-roles').DataTable( {
        "columnDefs": [
            {
                "targets": [ 0 ],
                "visible": false,
                "searchable": false
            },
            {
                "targets": [ 2, 3 ],
                "searchable": false,
                "sortable": false
            }
        ],
        "order": [[ 1, "asc" ]],
        "language": {
            "url": "/static/locale/datatable_" + locale +".json"
        }
    } );
 
    $('#datatable-roles tbody').on( 'click', 'tr', function () {
        if ( $(this).hasClass('selected') ) {
            $(this).removeClass('selected');
            selected_index = null;
            disableButtons();
        }
        else {
            table.$('tr.selected').removeClass('selected');
            $(this).addClass('selected');
            var selected_role = $(this).context.children[0].innerHTML;

            var rows = table.rows().data();

            for (var i = 0; i < rows.length; ++i) {
                if (rows[i][1] == selected_role) {
                    selected_index = rows[i][0];
                }
            }

            if (selected_role == 'Admin') {
                disableButtons();
            } else {
                enableButtons();
            }
        }
    } );
 
    $('#button').click( function () {
        table.row('.selected').remove().draw( false );
        selected_index = null;
        disableButtons();
    } );
}

function enableButtons() {
    document.getElementById('button_go').disabled = false;
    document.getElementById('button_del').disabled = false;
}

function disableButtons() {
    document.getElementById('button_go').disabled = true;
    document.getElementById('button_del').disabled = true;
}

function goButtonEditRole() {
    window.location.href = encodeURI('/roles/edit/' + selected_index);
}

function goButtonDeleteRole() {
    page_dialog.show();
}

function deleteRole() {
    window.location.href = encodeURI('/roles/delete/' + selected_index);
}

// ---

