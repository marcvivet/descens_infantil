class CustomDataTable {
    constructor(config) {
        let id = config.id === undefined? 'custom-datatable' : config.id;
        let page = config.page === undefined? null : config.page;
        let locale = config.locale === undefined? 'en' : config.locale;
        let addToggle = config.addToggle === undefined? false : config.addToggle;
        let columnDefs = config.columnDefs === undefined? null : config.columnDefs;
        let columnsStyle = config.columnsStyle === undefined? null : config.columnsStyle;
        let order = config.order === undefined? null : config.order;
        let columnWidth = config.columnWidth === undefined? 400 : config.columnWidth;
        let buttons = config.buttons === undefined? null: config.buttons;

        let request = new XMLHttpRequest();
        request.open("GET",`/${page}/static/locale/` + locale + ".json", false);
        request.send(null);
        this._message_locale = JSON.parse(request.responseText);

        Page.setLocale(locale);

        this._id = id;
        this._page = page;
        this._selected_form = null;
        this._selected_id = null;
        this._toggle = null;

        let datatable_config = {
            //"bInfo": true,
            "bStateSave": true,
            "autoWidth": false,
            "responsive": true,
            "language": {
                "url": "/static/locale/datatable_" + locale + ".json"
            }
        };

        if (buttons != null) {
            datatable_config['dom'] = "Blfrtip";
            datatable_config['buttons'] = buttons;
        }

        if (columnDefs != null) {
            datatable_config['columnDefs'] = columnDefs;
        }

        if (columnsStyle != null) {
            datatable_config['columns'] = columnsStyle;
        }

        if (order != null) {
            datatable_config['order'] = order;
        }

        this._table = $('#' + this._id).DataTable(datatable_config);

        this._page_dialog = new PageDialog(
            'confirm', this._message_locale.are_you_sure, this._message_locale.warning_message);
        this._page_dialog.close_button_name = this._message_locale.cancel;
        this._page_dialog.addAcceptButton(this._message_locale.proceed, () => {
            this._deleteRow()
        });

        if (addToggle) {
             this._toggle = new ToggleVisualization(
                'toggle-visualization', 'list', 'thumbnails', true, columnWidth);
        } else {

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

        if (this._toggle) {
            let thumbnail = document.getElementById(`thumbnails_row_${ this._selected_id }`);
            thumbnail.parentElement.removeChild(thumbnail);
        }

        let table_element = document.getElementById(`table_row_${ this._selected_id }`);
        if (!table_element) {
            if (this._toggle) {
                this._toggle.isDirty();
            }
        } else {
            this._table.row(table_element).remove().draw();
        }

        this._selected_id = null;
        Page.showSuccess(response.message);

        if (this._toggle) {
            this._toggle.update();
        }
    }
}
