var selected_index = null;

$(document).ready(function() {
    disableButtonGo();
    var table = $('#datatable').DataTable();
 
    $('#datatable tbody').on( 'click', 'tr', function () {
        if ( $(this).hasClass('selected') ) {
            $(this).removeClass('selected');
            selected_index = null;
            disableButtonGo();
        }
        else {
            table.$('tr.selected').removeClass('selected');
            $(this).addClass('selected');
            selected_index = $(this).context.children[0].innerHTML;
            enableButtonGo();
        }
    } );
 
    $('#button').click( function () {
        table.row('.selected').remove().draw( false );
        selected_index = null;
        disableButtonGo();
    } );
} );

function enableButtonGo() {
    document.getElementById('button_go').disabled = false;
}

function disableButtonGo() {
    document.getElementById('button_go').disabled = true;
}

function goButtonExactMatch() {
    window.location.href = encodeURI('/exact_match/' + selected_index);
}

// ---

