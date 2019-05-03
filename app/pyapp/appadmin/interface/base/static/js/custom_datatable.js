class CustomDataTable {
    constructor(page, locale, addToggle, columnDefs = null, columnsStyle = null, order = null, columnWidth = 400) {
        let request = new XMLHttpRequest();
        request.open("GET",`/${page}/static/locale/` + locale + ".json", false);
        request.send(null);
        this._message_locale = JSON.parse(request.responseText);

        Page.setLocale(locale);

        this._page = page;
        this._selected_form = null;
        this._selected_id = null;
        this._toggle = null;

        let datatable_config = {
            "bStateSave": true,
            "autoWidth": false,
            "responsive": true,
            "language": {
                "url": "/static/locale/datatable_" + locale + ".json"
            }
        };

        if (columnDefs != null) {
            datatable_config['columnDefs'] = columnDefs;
        }

        if (columnsStyle != null) {
            datatable_config['columns'] = columnsStyle;
        }

        if (order != null) {
            datatable_config['order'] = order;
        }

        this._table = $('#custom-datatable').DataTable(datatable_config);

        this._page_dialog = new PageDialog(
            'confirm', this._message_locale.are_you_sure, this._message_locale.warning_message);
        this._page_dialog.close_button_name = this._message_locale.cancel;
        this._page_dialog.addAcceptButton(this._message_locale.proceed, () => {
            this._deleteRow()
        });

        if (addToggle) {
            this._toggle = new ToggleVisualization(
                'toggle-visualization', 'list', 'thumbnails', true, columnWidth);
        }
    }

    clickOnDelete(id) {
        this._selected_id = id;
        this._page_dialog.show();
    }

    _deleteRow() {
        this._page_dialog.hide();
        Page.setLoading(true);
        Page.httpRequest({
            action: "delete",
            id: this._selected_id
        }, `/${this._page}/communicate`, (response) => { this._update(response) });  
    }

    _update(response) {
        Page.setLoading(false);
        let thumbnail = document.getElementById(`thumbnails_row_${ this._selected_id }`);
        thumbnail.parentElement.removeChild(thumbnail);

        let table_element = document.getElementById(`table_row_${ this._selected_id }`);
        if (!table_element) {
            this._toggle.isDirty();
        } else {
            this._table.row(table_element).remove().draw();
        }

        this._selected_id = null;
        Page.showSuccess(response.message);
        this._toggle.update();
    }
}
