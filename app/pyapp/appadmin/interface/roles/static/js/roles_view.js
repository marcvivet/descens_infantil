var selected_index = null;
var page_dialog = null;

$(document).ready(function() {
    disableButtons();
    page_dialog = new PageDialog('confirm', 'Are you sure?', 'Removing roles is dangerous and the effects will be permanent.');
    page_dialog.close_button_name = 'Cancel';
    page_dialog.addAcceptButton('Proceed', deleteRole);
    var table = $('#datatable').DataTable();
 
    $('#datatable tbody').on( 'click', 'tr', function () {
        if ( $(this).hasClass('selected') ) {
            $(this).removeClass('selected');
            selected_index = null;
            disableButtons();
        }
        else {
            table.$('tr.selected').removeClass('selected');
            $(this).addClass('selected');
            selected_index = $(this).context.children[0].innerHTML;
            if (selected_index == '1') {
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
} );

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

