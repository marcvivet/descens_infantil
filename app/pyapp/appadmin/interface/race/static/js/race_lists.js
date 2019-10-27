class PageList extends Page {
  constructor(type, config={}) {
    super(config);

    this._type = type;
    this._select_edition = document.getElementById("select_edition");
    this._select_edition.onchange = () => {
      this.editionChanged();
    };

    let last_state = localStorage.getItem("selected_edition");
    if (last_state) {
      this._select_edition.value = last_state;
    }

    this.onEditionChange = null;
  }

  get editionYear() {
    return this._select_edition.options[this._select_edition.selectedIndex].text;
  }

  get editionId() {
    return this._select_edition.options[this._select_edition.selectedIndex].value;
  }

  editionChanged() {
    localStorage.setItem(
      "selected_edition", this.editionId);

    if (this.onEditionChange) {
      this.onEditionChange();
    }
  }

  convertToPDF() {
    window.location.href = `/race/${this._type}/${this.editionId}/${this.editionYear}`
  }
};


class ListPageRow extends PageRow {

  constructor(config) {
    super({
      title: config.title === undefined? "" : config.title
    });

    this._row_id = config.id === undefined? 'row_id' : config.id;
    this._page = config.page === undefined? new Page() : config.page;
    this._locale_id = config.locale === undefined? 'en' : config.locale;

    this._div_row.classList.add('opacity_0');
    this._div_row.id = this._row_id;
    this._div_x_content[0].id = `${this._row_id}_list`;

    this._datatable = null;
    this._transition_time = 300;

    Page.httpRequest({
      action: "get_locale",
    }, `/race/communicate`, (response) => {
      this.setLocale(response.data)
    });
  }

  runOnReady(id, func) {
    var element = document.getElementById(id);
    if (element) {
      func();
    } else {
      setTimeout(() => {
        this.runOnReady(id, func);
      }, 100);
    }
  }

  setLocale(locale) {
    this._locale = locale;
    
    this._template = `
      <table id="${this._row_id}_datatable" class="table table-striped table-bordered">
        <thead id="${this._row_id}_table_head">
        ${this.tableHead()}
        </thead>
        <tbody id="${this._row_id}_table_body">
        </tbody>
      </table>`;
    this._div_x_content[0].innerHTML = this._template;
    this._page.addPageRow(this);
  }

  fadeIn(id, time) {
    setTimeout(() => {
      let div = document.getElementById(id);
      div.style.opacity = 1;
    }, time);
  } 

  fillTable(data) {
    this.runOnReady(this._row_id, () => {
      let list_row = document.getElementById(this._row_id);
      list_row.style.opacity = 0;

      setTimeout(()=>{
        this._div_x_content[0].innerHTML = "";

        if (this._datatable != null) {
          this._datatable._table.destroy();
        }

        this._div_x_content[0].innerHTML = this._template;

        this.runOnReady(`${this._row_id}_datatable`, () => {
          let table_body = document.getElementById(`${this._row_id}_table_body`);
          let tr = null;

          if (data != null) {
            for (let i = 0; i < data.length; ++i) {
              tr = this.createTableRow(`${this._row_id}_${i}`, data[i]);
              table_body.appendChild(tr);
            }
          }

          if (!tr) {
            this.createTable();
            this.fadeIn(this._row_id, this._transition_time);
          } else {
            this.runOnReady(tr.id, () => {
              this.createTable();
              this.fadeIn(this._row_id, this._transition_time);
            });
          }
        });
      }, this._transition_time);
    });
  }

  createTable() {
    this._datatable = new CustomDataTable({
      id: `${this._row_id}_datatable`,
      page: 'race',
      locale: this._locale_id,
      columnDefs: this.tableColumnDefs(),
      columnsStyle: this.tableColumnsStyle(),
      order: this.tableOrder()
    });
  }

  onEditionChange() {
    
  }

  tableColumnDefs() {
    throw new Error('You have to implement the method tableColumnDefs!');
  }

  tableColumnsStyle() {
    throw new Error('You have to implement the method tableColumnsStyle!');
  }

  tableOrder() {
    throw new Error('You have to implement the method tableOrder!');
  }

  tableHead() {
    throw new Error('You have to implement the method tableHead!');

  }

  createTableRow(id, row) {
    throw new Error('You have to implement the method createTableRow!');
  }
}

class BibNumberListPageRow extends ListPageRow {

  constructor(config) {
    super(config);
  }

  tableColumnDefs() {
    return [
      {
        "targets": [0, 1, 2, 3],
        "searchable": true,
        "sortable": true,
        "className": "center-element"
      }
    ];
  }

  tableColumnsStyle() {
    return [
      {"width": "20%"},    // 00 - surnames
      {"width": "15%"},    // 01 - name
      {"width": "50px"},   // 05 - category
      {"width": "50px"},   // 04 - bib number
    ];
  }

  tableOrder() {
    return [
      [0, "asc"]
    ];
  }

  tableHead() {
    return `
      <tr>
        <th>${this._locale.race["surnames"]}</th>
        <th>${this._locale.race["name"]}</th>
        <th>${this._locale.race["category"]}</th>                 
        <th>${this._locale.race["bib_number"]}</th>
      </tr>`;
  }

  createTableRow(id, row) {
    let tr = document.createElement('tr');
    tr.id = id
    let innerHtml = `
      <td>${row.surnames}</td>
      <td>${row.name}</td>
      <td>${row.category}</td>
      <td>${row.bib_number}</td>`;

    tr.innerHTML = innerHtml;
    return tr;
  }
}

class RaceListPageRow extends ListPageRow {

  constructor(config) {
    super(config);
  }

  tableColumnDefs() {
    return [
      {
        "targets": [0, 1, 2],
        "searchable": true,
        "sortable": true,
        "className": "center-element"
      }
    ];
  }

  tableColumnsStyle() {
    return [
      {"width": "50px"}
    ];
  }

  tableOrder() {
    return [
      [0, "asc"]
    ];
  }

  tableHead() {
    return `
      <tr>
        <th>${this._locale.race["bib_number"]}</th>
        <th>${this._locale.race["surnames"]}</th>
        <th>${this._locale.race["name"]}</th>
      </tr>`;
  }

  createTableRow(id, row) {
    let tr = document.createElement('tr');
    tr.id = id
    let innerHtml = `
      <td>${row.bib_number}</td>
      <td>${row.surnames}</td>
      <td>${row.name}</td>`;

    tr.innerHTML = innerHtml;
    return tr;
  }
}

let g_dict_rows = {};
let g_page = null;
let g_title = null;

function updateBibNumberList() {
  Page.httpRequest({
    action: "list_bib_number",
    edition_id: g_page.editionId
  }, `/race/communicate`, (response) => {
    g_dict_rows['default'].fillTable(response.data)
  });
}

function updateRaceList(create=false) {
  Page.httpRequest({
    action: "list_out",
    edition_id: g_page.editionId
  }, `/race/communicate`, (response) => {
    const categories = response.data.categories;
    const category_dict = response.data.category_dict;

    if (create) {
      for (let i = 0; i < categories.length; ++i) {
        const category = categories[i];
        g_dict_rows[category] = new RaceListPageRow(
          {
            id: `list_row_${i}`,
            page: g_page,
            locale: g_locale,
            title: `${g_title} ${category}`,
          }
        );
        g_dict_rows[category].fillTable(category_dict[category])
      }
    } else {
      for (let i = 0; i < categories.length; ++i) {
        const category = categories[i];
        g_dict_rows[category].fillTable(category_dict[category])
      }
    }
  });
}

function setupPage(type, locale, title) {
  g_title = title;
  g_page = new PageList(type);
  g_locale = locale;

  if (type == "list_bib_number") {
    g_dict_rows['default'] =
      new BibNumberListPageRow(
        {
          id: "list_row",
          page: g_page,
          locale: locale,
          title: title,
        }
      );

    g_page.onEditionChange = updateBibNumberList;
    updateBibNumberList();
  }

  if (type == "list_out") {
    g_page.onEditionChange = updateRaceList;
    updateRaceList(create=true);
  }

  if (type == "list_results") {

  }
}

function convertToPDF() {
  g_page.convertToPDF();
}