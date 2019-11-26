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
    if (this._select_edition.selectedIndex > this._select_edition.options.length) {
      this._select_edition.selectedIndex = 0;
    }
    
    return this._select_edition.options[this._select_edition.selectedIndex].text;
  }

  get editionId() {
    if (this._select_edition.selectedIndex > this._select_edition.options.length) {
      this._select_edition.selectedIndex = 0;
    }

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
        "targets": [0, 1],
        "searchable": true,
        "sortable": true,
      },
      {
        "targets": [2, 3],
        "searchable": true,
        "sortable": true,
        "className": "center-element"
      },
    ];
  }

  tableColumnsStyle() {
    return [
      {"width": "50%"},    // 00 - surnames
      {"width": "50%"},    // 01 - name
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

class OutListPageRow extends ListPageRow {

  constructor(config) {
    super(config);
  }

  tableColumnDefs() {
    return [
      {
        "targets": [0],
        "searchable": true,
        "sortable": true,
        "className": "center-element"
      },
      {
        "targets": [1, 2],
        "searchable": true,
        "sortable": true,
      }
    ];
  }

  tableColumnsStyle() {
    return [
      {"width": "50px"},
      {"width": "50%"},
      {"width": "50%"}
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

class ResultsListPageRow extends ListPageRow {

  constructor(config) {
    super(config);

    this._datatable_dis = null;
  }

  setLocale(locale) {
    this._locale = locale;
    
    this._template = `
      <h3>${this._locale.race['classified']}</h3>
      <table id="${this._row_id}_datatable" class="table table-striped table-bordered">
        <thead id="${this._row_id}_table_head">
        ${this.tableHead()}
        </thead>
        <tbody id="${this._row_id}_table_body">
        </tbody>
      </table>
      <h3>${this._locale.race['disqualified']}</h3>
      <table id="${this._row_id}_datatable_dis" class="table table-striped table-bordered">
        <thead id="${this._row_id}_table_head_dis">
        ${this.tableHeadDis()}
        </thead>
        <tbody id="${this._row_id}_table_body_dis">
        </tbody>
      </table>`;
    this._div_x_content[0].innerHTML = this._template;
    this._page.addPageRow(this);
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

        if (this._datatable_dis != null) {
          this._datatable_dis._table.destroy();
        }

        this._div_x_content[0].innerHTML = this._template;

        this.runOnReady(`${this._row_id}_datatable`, () => {
          let table_body = document.getElementById(`${this._row_id}_table_body`);
          let tr = null;

          if (data['classified'] != null) {
            for (let i = 0; i < data['classified'].length; ++i) {
              tr = this.createTableRow(`${this._row_id}_${i}`, data['classified'][i]);
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

        this.runOnReady(`${this._row_id}_datatable_dis`, () => {
          let table_body_dis = document.getElementById(`${this._row_id}_table_body_dis`);
          let tr_dis = null;

          if (data['disqualified'] != null) {
            for (let i = 0; i < data['disqualified'].length; ++i) {
              tr_dis = this.createTableRowDis(`${this._row_id}_${i}_dis`, data['disqualified'][i]);
              table_body_dis.appendChild(tr_dis);
            }
          }

          if (!tr_dis) {
            this.createTableDis();
            this.fadeIn(this._row_id, this._transition_time);
          } else {
            this.runOnReady(tr_dis.id, () => {
              this.createTableDis();
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

  createTableDis() {
    this._datatable_dis = new CustomDataTable({
      id: `${this._row_id}_datatable_dis`,
      page: 'race',
      locale: this._locale_id,
      columnDefs: this.tableColumnDefsDis(),
      columnsStyle: this.tableColumnsStyleDis(),
      order: this.tableOrderDis()
    });
  }

  tableColumnDefs() {
    return [
      {
        "targets": [0],
        "searchable": false,
        "sortable": true,
        "className": "center-element"
      },
      {
        "targets": [1],
        "searchable": true,
        "sortable": true,
        "className": "center-element"
      },
      {
        "targets": [2, 3],
        "searchable": true,
        "sortable": true
      },
      {
        "targets": [4],
        "searchable": false,
        "sortable": true
      },
      {
        "targets": [5, 6],
        "searchable": false,
        "sortable": true,
        "className": "center-element"
      }
    ];
  }

  tableColumnsStyle() {
    return [
      {"width": "50px"},
      {"width": "50px"},
      {"width": "auto"},
      {"width": "auto"},
      {"width": "auto"},
      {"width": "50px"},
      {"width": "125px"}
    ];
  }

  tableOrder() {
    return [
      [6, "asc"]
    ];
  }

  tableHead() {
    return `
      <tr>
        <th>${this._locale.race["position"]}</th>
        <th>${this._locale.race["bib_number"]}</th>
        <th>${this._locale.race["surnames"]}</th>
        <th>${this._locale.race["name"]}</th>
        <th>${this._locale.race["club_name"]}</th>
        <th>${this._locale.race["penalized"]}</th>
        <th>${this._locale.race["time_final"]}</th>
      </tr>`;
  }

  tableColumnDefsDis() {
    return [
      {
        "targets": [0],
        "searchable": true,
        "sortable": true,
        "className": "center-element"
      },
      {
        "targets": [1, 2],
        "searchable": true,
        "sortable": true
      },
      {
        "targets": [3],
        "searchable": false,
        "sortable": true
      },
      {
        "targets": [4],
        "searchable": false,
        "sortable": true,
        "className": "center-element"
      }
    ];
  }

  tableColumnsStyleDis() {
    return [
      {"width": "50px"},
      {"width": "auto"},
      {"width": "auto"},
      {"width": "auto"},
      {"width": "50px"}
    ];
  }

  tableOrderDis() {
    return [
      [0, "asc"]
    ];
  }

  tableHeadDis() {
    return `
      <tr>
        <th>${this._locale.race["bib_number"]}</th>
        <th>${this._locale.race["surnames"]}</th>
        <th>${this._locale.race["name"]}</th>
        <th>${this._locale.race["club_name"]}</th>
        <th>${this._locale.race["race_status"]}</th>
      </tr>`;
  }

  genRaceStatus(disqualified, not_arrived, not_came_out) {
    let status = `<span class="label label-success">${this._locale.race.participant_ok}</span>`;

    if (disqualified) {
      status = `<span class="label label-danger">${this._locale.race.participant_disqualified}</span>`;
    }

    if (not_arrived) {
      status = `<span class="label label-danger">${this._locale.race.participant_not_arrived}</span>`;
    }

    if (not_came_out) {
      status = `<span class="label label-danger">${this._locale.race.participant_not_came_out}</span>`;
    }

    return status;
  }

  getPenalized(penalized) {
    if (penalized == 1) {
      return '<span class="glyphicon glyphicon-remove text-danger" /><span class="hidden">1</span>';
    }
    return '<span class="hidden">0</span>';
  }

  createTableRow(id, row) {
    let tr = document.createElement('tr');
    tr.id = id;

    let penalized = this.getPenalized(row.penalized);
    console.log(row)

    let innerHtml = `
      <td>${row.position}</td>
      <td>${row.bib_number}</td>
      <td>${row.surnames}</td>
      <td>${row.name}</td>
      <td>${row.club_name}</td>
      <td>${penalized}</td>
      <td>${row.time_final}</td>`;

    tr.innerHTML = innerHtml;
    return tr;
  }

  createTableRowDis(id, row) {
    let tr = document.createElement('tr');
    tr.id = id;

    let status = this.genRaceStatus(row.disqualified, row.not_arrived, row.not_came_out);

    let innerHtml = `
      <td>${row.bib_number}</td>
      <td>${row.surnames}</td>
      <td>${row.name}</td>
      <td>${row.club_name}</td>
      <td>${status}</td>`;


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

function updateOutList(create=false) {
  Page.httpRequest({
    action: "list_out",
    edition_id: g_page.editionId
  }, `/race/communicate`, (response) => {
    const categories = response.data.categories;
    const category_dict = response.data.category_dict;

    if (create) {
      for (let i = 0; i < categories.length; ++i) {
        const category = categories[i];
        g_dict_rows[category] = new OutListPageRow(
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

function updateResultsList(create=false) {
  Page.httpRequest({
    action: "list_results",
    edition_id: g_page.editionId
  }, `/race/communicate`, (response) => {
    const categories = response.data.categories;
    const category_dict = response.data.category_dict;

    if (create) {
      for (let i = 0; i < categories.length; ++i) {
        const category = categories[i];
        g_dict_rows[category] = new ResultsListPageRow(
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
    g_page.onEditionChange = updateOutList;
    updateOutList(create=true);
  }

  if (type == "list_results") {
    g_page.onEditionChange = updateResultsList;
    updateResultsList(create=true);
  }
}

function convertToPDF() {
  g_page.convertToPDF();
}