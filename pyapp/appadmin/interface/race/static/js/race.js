let row_participants = null;
let datatable = null;

class ViewParticipantsPageRow extends PageRow {

  constructor(locale_id, page_type) {
    super({
      title: "none",
      rowId: 'participants_row'
    });

    this._page_type = page_type;
    this._participants_data = null;
    this._template = document.getElementById('list').innerHTML;
    this._locale_id = locale_id;
    this._datatable = null;
    this._clubs = null;
    this._clubs_lut = null;
    this._disable_select = false;
    this._currData = null;

    Page.httpRequest({
      action: "get_locale",
    }, `/race/communicate`, (response) => {
      this.setLocale(response.data)
    });

    Page.httpRequest({
      action: "get_clubs",
    }, `/race/communicate`, (response) => {
      this._clubs = response.data;
      this._clubs_lut = {};
      for (let i = 0; i < this._clubs.length; ++i) {
        this._clubs_lut[this._clubs[i].id] = {
          name: this._clubs[i].name,
          emblem: this._clubs[i].emblem

        }
      }
    });

    this._page = new Page();
    this._page.addPageRow(this);

    this._select_edition = document.getElementById("select_edition");
    this._select_edition.onchange = () => {
      this.editionChanged();
    };

    //this._div_table_body = document.getElementById("table_body");
    //this._div_thumbnails_body = document.getElementById("thumbnails_body");

    let last_state = localStorage.getItem("selected_edition");
    if (last_state) {
      this._select_edition.value = last_state;
    }

    Page.httpRequest({
      action: "get_participants",
      edition_id: this.editionId
    }, `/race/communicate`, (response) => {
      this.setParticipants(response.data)
    });

    this._page.show();
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

  runOnChildrenReady(id, func) {
    var element = document.getElementById(id);
    if (element.hasChildNodes) {
      func();
    } else {
      setTimeout(() => {
        this.runOnChildrenReady(id, func);
      }, 100);
    }
  }

  runOnNotReady(id, func) {
    var element = document.getElementById(id);
    if (element) {
      setTimeout(() => {
        this.runOnNotReady(id, func);
      }, 100);
    } else {
      func();
    }
  }

  setLocale(locale) {
    this._locale = locale;
    this.title = this._locale.race[this._page_type] + ' ' + this.editionYear;
  }

  createTable() {
    if (this._page_type == 'results') {
      this.createTableResults();
    } else if (this._page_type == 'enter_times') {
      this.createTableEnterTimes();
    } else {
      this.createTableDefault();
    }
  }

  createTableResults() {
    let columnDefs = [
      {
        "targets": [3, 5, 6, 7, 8],
        "searchable": false,
        "sortable": true,
        "className": "center-element"
      },
      {
        "targets": [4],
        "className": "center-element"
      }
    ];

    let columnsStyle = [
      {"width": "20%"},    // 00 - surnames
      {"width": "15%"},    // 01 - name
      {"width": "25%"},    // 02 - club name
      {"width": "100px"},  // 03 - birthday
      {"width": "50px"},   // 04 - bib number
      {"width": "50px"},   // 05 - category
      {"width": "50px"},   // 06 - penalized
      {"width": "50px"},   // 07 - status
      {"width": "125px"},  // 08 - time
      {"width": "125px"}   // 09 - final time
    ];

    let exportOptions = {
      columns: [0, 1, 4, 5, 6, 7, 8, 9]
    }

    let buttons = [{
        extend: "copy",
        className: "btn-sm",
        title: this.title,
        exportOptions: exportOptions,
        footer: false
      },
      {
        extend: "csv",
        className: "btn-sm",
        title: this.title,
        exportOptions: exportOptions,
        footer: false
      },
      {
        extend: "excel",
        className: "btn-sm",
        title: this.title,
        exportOptions: exportOptions,
        footer: false
      },
      {
        extend: "pdfHtml5",
        className: "btn-sm",
        title: this.title,
        exportOptions: exportOptions,
        footer: true
      },
      {
        extend: "print",
        className: "btn-sm",
        title: this.title,
        exportOptions: exportOptions,
        footer: false
      },
    ];

    let order = [
      [4, "asc"]
    ];

    this._datatable = new CustomDataTable({
      page: 'race',
      locale: this._locale_id,
      columnDefs: columnDefs,
      columnsStyle: columnsStyle,
      order: order,
      buttons: buttons
    });

    this.title = this._locale.race.participants_for_edition + this.editionYear;
  }

  disableSelectTable() {
    this._disable_select = true;
  }

  enableSelectTable() {
    this._disable_select = false;
  }

  removeSelectTableElement() {
    $('#table_body>tr.selected').removeClass('selected');

    $('#participant_name_select').html("&nbsp;")
    $('#bib_number_select').html("0");
    $('#club_image_select').attr("src", "/static/images/NO_IMAGE.jpg");
    $('#club_name_select').html("&nbsp;");
    $('#category_select').html("0");
    $('#birthday_select').html("0000-00-00");
    
    $('#time_minutes_select').val("");
    $('#time_seconds_select').val("");
    $('#time_hundreds_select').val("");

    $("#time_minutes_select").prop("disabled", true);
    $("#time_seconds_select").prop("disabled", true);
    $("#time_hundreds_select").prop("disabled", true);

    $('#penalized_select').bootstrapToggle('off');
    $('#disqualified_select').bootstrapToggle('off');
    $('#not_arrived_select').bootstrapToggle('off');
    $('#not_came_out_select').bootstrapToggle('off');

    $('#penalized_select').bootstrapToggle('disable');
    $('#disqualified_select').bootstrapToggle('disable');
    $('#not_arrived_select').bootstrapToggle('disable');
    $('#not_came_out_select').bootstrapToggle('disable');

    $("#button-save").prop("disabled", true);
    this._currData = null;
  }

  selectTableElement(offset, selected=null) {
    this.saveTableElement();
    if (this._disable_select) return;

    if (! selected ) {
      selected = $('#table_body>tr.selected').first();
      if (! selected ) {
        selected = $('#table_body>tr:eq(0)');
        selected.addClass('selected');
      }
    }
    
    let curItemIndex = this._datatable._table.row(selected).index();
    let curTableIndexs = this._datatable._table.rows().indexes();
    let curIndexArrayKey = curTableIndexs.indexOf(curItemIndex);
    let itemIndex = curTableIndexs[curIndexArrayKey + offset];
    let item = this._datatable._table.row(itemIndex);

    $('#table_body>tr.selected').removeClass('selected');
    $(item.node()).addClass('selected');
    item.show().draw(false);

    let id = $(item.node()).attr('id').substring(10);

    let participant = this._participants_data[id];

    $('#participant_name_select').html(`${participant.name} ${participant.surnames}`)
    $('#bib_number_select').html(participant.bib_number);
    $('#club_image_select').attr("src", participant.club_emblem);
    $('#club_name_select').html(participant.club_name);
    $('#category_select').html(participant.category);
    $('#birthday_select').html(participant.birthday);
    
    let minutes = participant.time.substring(0, 2);
    let seconds = participant.time.substring(3, 5);
    let hundreds = participant.time.substring(6, 8);

    this._currData = {
      participant_id: parseInt(participant.id),
      edition_id: parseInt(participant.edition_id),
      penalized: participant.penalized,
      disqualified: participant.disqualified,
      not_arrived: participant.not_arrived,
      not_came_out: participant.not_came_out,
      time: participant.time,
    }

    $('#time_minutes_select').val(minutes);
    $('#time_seconds_select').val(seconds);
    $('#time_hundreds_select').val(hundreds);

    $("#time_minutes_select").prop("disabled", false);
    $("#time_seconds_select").prop("disabled", false);
    $("#time_hundreds_select").prop("disabled", false);

    $('#penalized_select').bootstrapToggle('enable');
    $('#disqualified_select').bootstrapToggle('enable');
    $('#not_arrived_select').bootstrapToggle('enable');
    $('#not_came_out_select').bootstrapToggle('enable');

    if (participant.penalized) {
      $('#penalized_select').bootstrapToggle('on');
    } else {
      $('#penalized_select').bootstrapToggle('off');
    }

    if (participant.disqualified) {
      $('#disqualified_select').bootstrapToggle('on');
    } else {
      $('#disqualified_select').bootstrapToggle('off');
    }

    if (participant.not_arrived) {
      $('#not_arrived_select').bootstrapToggle('on');
    } else {
      $('#not_arrived_select').bootstrapToggle('off');
    }

    if (participant.not_came_out) {
      $('#not_came_out_select').bootstrapToggle('on');
    } else {
      $('#not_came_out_select').bootstrapToggle('off');
    }

    $("#button-save").prop("disabled", false);
  }

  saveTableElement() {
    if (this._disable_select) return;
    if (!this._currData) return;
    let selected = $('#table_body>tr.selected').first();
    if (!selected) return;
    
    let curItemIndex = this._datatable._table.row(selected).index();
    let item = this._datatable._table.row(curItemIndex);

    let id = $(item.node()).attr('id').substring(10);
    let participant = this._participants_data[id];
    let time = `${$('#time_minutes_select').val()}:${$('#time_seconds_select').val()}.${$('#time_hundreds_select').val()}`;

    if (time == ':.') {
      time = '00:00.00';
    }

    let data = {
      participant_id: parseInt(participant.id),
      edition_id: parseInt(participant.edition_id),
      penalized: $("#penalized_select").is(':checked')? 1 : 0,
      disqualified: $("#disqualified_select").is(':checked')? 1 : 0,
      not_arrived: $("#not_arrived_select").is(':checked')? 1 : 0,
      not_came_out: $("#not_came_out_select").is(':checked')? 1 : 0,
      time: time,
    };

    if (JSON.stringify(data) === JSON.stringify(this._currData)) {
      return;
    }

    this._currData = data;

    Page.httpRequest({
      action: "update_times",
      participant_data: data
    }, `/race/communicate`, ((participantId, participantData) => {
      return (response) => {
        this._participants_data[id].penalized = participantData.penalized;
        this._participants_data[id].disqualified = participantData.disqualified;
        this._participants_data[id].not_arrived = participantData.not_arrived;
        this._participants_data[id].not_came_out = participantData.not_came_out;
        this._participants_data[id].time = participantData.time;
        
        this.restoreRow(id);
      }
    })(id, data), (status, responseText) => {
      Page.showError(responseText);
    });
    
  }


  createTableDefault() {
    let columnDefs = [{
        "targets": [0],
        "searchable": false,
        "sortable": false,
        "className": "center-element"
      },
      {
        "targets": [5],
        "className": "center-element"
      },
      {
        "targets": [4, 6, 7, 8, 9],
        "searchable": false,
        "sortable": true,
        "className": "center-element"
      }
    ];

    let columnsStyle = [
      {"width": "50px"},  // 00 - actions
      {"width": "20%"},   // 01 - surnames
      {"width": "15%"},   // 02 - name
      {"width": "25%"},   // 03 - club name
      {"width": "100px"}, // 04 - birthday
      {"width": "50px"},  // 05 - bib number
      {"width": "50px"},  // 06 - category
      {"width": "50px"},  // 07 - penalized
      {"width": "50px"},  // 08 - status
      {"width": "125px"} // 09 - time
    ];

    let buttons = null;

    let order = [
      [5, "asc"]
    ];

    this._datatable = new CustomDataTable({
      page: 'race',
      locale: this._locale_id,
      columnDefs: columnDefs,
      columnsStyle: columnsStyle,
      order: order,
      buttons: buttons
    });

    this.title = this._locale.race.participants_for_edition + this.editionYear;
  }

  createTableEnterTimes() {
    let columnDefs = [
      {
        "targets": [4],
        "className": "center-element"
      },
      {
        "targets": [3, 5, 6, 7, 8],
        "searchable": false,
        "sortable": true,
        "className": "center-element"
      }
    ];

    let columnsStyle = [
      {"width": "20%"},   // 01 - surnames
      {"width": "15%"},   // 02 - name
      {"width": "25%"},   // 03 - club name
      {"width": "100px"}, // 04 - birthday
      {"width": "50px"},  // 05 - bib number
      {"width": "50px"},  // 06 - category
      {"width": "50px"},  // 07 - penalized
      {"width": "50px"},  // 08 - status
      {"width": "125px"}  // 09 - time
    ];

    let buttons = null;

    let order = [
      [4, "asc"]
    ];

    this._datatable = new CustomDataTable({
      page: 'race',
      locale: this._locale_id,
      columnDefs: columnDefs,
      columnsStyle: columnsStyle,
      order: order,
      buttons: buttons
    });

    this.title = this._locale.race.participants_for_edition + this.editionYear;

    $('#button-previous').on('click', (event) => {
      $("#custom-datatable").DataTable().search("");
      this.selectTableElement(-1);
    });

    $('#button-next').on('click', (event) => {
      $("#custom-datatable").DataTable().search("");
      this.selectTableElement(1);
    });

    $('#table_body').on( 'click', 'tr', (event) => {
      if ( $(event.target).parent().hasClass('selected') ) {
        $(event.target).parent().removeClass('selected');
        this.removeSelectTableElement();
      } else {
        this.selectTableElement(0, $(event.target).parent());
      }
    });

    this._datatable._page_dialog._event_display = (show) => {

      if (show) {
        this.disableSelectTable();
      } else {
        this.enableSelectTable();
      }
    };

    this.removeSelectTableElement();
    $('#disqualified_select').change(
      () => {
        if($("#disqualified_select").is(':checked')) {
          $('#not_arrived_select').bootstrapToggle('off');
          $('#not_came_out_select').bootstrapToggle('off');
        }
      }
    );

    $('#not_arrived_select').change(
      () => {
        if($("#not_arrived_select").is(':checked')) {
          $('#disqualified_select').bootstrapToggle('off');
          $('#not_came_out_select').bootstrapToggle('off');
        }
      }
    );

    $('#not_came_out_select').change(
      () => {
        if($("#not_came_out_select").is(':checked')) {
          $('#disqualified_select').bootstrapToggle('off');
          $('#not_arrived_select').bootstrapToggle('off');
        }
      }
    );

    $('#button-save').on('click', (event) => {
      this.saveTableElement();
    });

    window.setInterval(() => {
      this.saveTableElement();
    }, 250);
  }

  fadeIn(id, time) {
    setTimeout(() => {
      let div = document.getElementById(id);
      div.style.opacity = 1;
    }, time);
  }

  setParticipants(data) {
    this._participants_data = {};
    let transition_time = 300;

    let participants_row = document.getElementById('participants_row');
    participants_row.style.opacity = 0;

    setTimeout(()=>{
      list.innerHTML = "";

      if (this._datatable != null) {
        this._datatable._table.destroy();
      }

      this.runOnNotReady('custom-datatable', () => {
        let list = document.getElementById('list');
        list.innerHTML = this._template;

        this.runOnReady('custom-datatable', () => {
          let table_body = document.getElementById('table_body');
          let tr = null;
          for (let i = 0; i < data.length; ++i) {
            tr = this.createTableRow(data[i]);
            table_body.appendChild(tr);
          }

          if (!tr) {
            this.createTable();
            this.fadeIn('participants_row', 500);
          } else {
            this.runOnReady(tr.id, () => {
              this.createTable();
              this.fadeIn('participants_row', 500);
            });
          }
        });
      });
    }, transition_time);
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

      Page.httpRequest({
        action: "get_participants",
        edition_id: this.editionId
      }, `/race/communicate`, (response) => {
        this.setParticipants(response.data)
      });
  }

  getStatus(disqualified, not_arrived, not_came_out) {
    let status = `${this._locale.race.participant_ok}`;

    if (disqualified) {
      status = `${this._locale.race.participant_disqualified}`;
    }

    if (not_arrived) {
      status = `${this._locale.race.participant_not_arrived}`;
    }

    if (not_came_out) {
      status = `${this._locale.race.participant_not_came_out}`;
    }

    return status;
  }

  splitStatus(status) {
    let disqualified = false;
    let not_arrived = false;
    let not_came_out = false;

    if (status == `${this._locale.race.participant_disqualified}`) {
      disqualified = true;
    }

    if (status == `${this._locale.race.participant_not_arrived}`) {
      not_arrived = true;
    }

    if (status == `${this._locale.race.participant_not_came_out}`) {
      not_came_out = true;
    }

    return [disqualified, not_arrived, not_came_out];
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

  createTableRow(participant) {
    let id = `${participant.id}_${participant.edition_id}`
    let tr = document.createElement('tr');
    tr.id = 'table_row_' + id;

    this._participants_data[id] = participant;

    let status = this.genRaceStatus(
      participant.disqualified, participant.not_arrived, participant.not_came_out);


    let penalized = '<span class="hidden">0</span>';
    if (participant.penalized == 1) {
      penalized = '<span class="glyphicon glyphicon-remove text-danger" /><span class="hidden">1</span>'
    }

    let innerHtml = '';

    if (this._page_type == 'edit_participants') {
      innerHtml += `<td><table class="table-buttons" id="actions_${id}">
          <tr>
            <td id="button_1_${id}">
              <button type="button" tooltip="${this._locale.race.tooltip_edit}" tooltip-position="bottom" onclick="clickOnEdit('${id}');"
                      class="btn btn-primary btn-xs">
                <i class="fa fa-edit"> </i>
              </button>
            </td>
            <td id="button_2_${id}">
              <button type="button" tooltip="${this._locale.race.tooltip_delete}" tooltip-position="bottom" onclick="clickOnDelete('${id}');"
                      class="btn btn-danger btn-xs">
                <i class="fa fa-remove"> </i>
              </button>
            </td>
          </tr>
        </table>
        </td>`;
    }

    innerHtml += `
      <td id="surnames_${id}">${participant.surnames}</td>
      <td id="name_${id}">${participant.name}</td>
      <td id="club_name_${id}">${participant.club_name}</td>
      <td id="birthday_${id}">${participant.birthday}</td>
      <td id="bib_number_${id}">${participant.bib_number}</td>
      <td id="category_${id}">${participant.category}</td>
      <td id="penalized_${id}">${penalized}</td>
      <td id="status_${id}">${status}</td>
      <td id="time_${id}">${participant.time}</td>`;

    if (this._page_type == 'results') {
      innerHtml += `<td id="time_final_${id}">${participant.time_final}</td>`;
    }

    tr.innerHTML = innerHtml;
    return tr;
  }

  restoreRow(id) {
    this.enableSelectTable();
    let participant = this._participants_data[id];

    let button1Td = document.getElementById(`button_1_${id}`);
    if (button1Td) {
    button1Td.innerHTML = `
      <button type="button" tooltip="${this._locale.race.tooltip_edit}" tooltip-position="bottom" onclick="clickOnEdit('${id}');"
              class="btn btn-primary btn-xs">
        <i class="fa fa-edit"> </i>
      </button>`;
    }

    let button2Td = document.getElementById(`button_2_${id}`);
    if (button2Td) {
      button2Td.innerHTML = `
      <button type="button" tooltip="${this._locale.race.tooltip_delete}" tooltip-position="bottom" onclick="clickOnDelete('${id}');"
              class="btn btn-danger btn-xs">
        <i class="fa fa-remove"> </i>
      </button>`;
    }

    try {    
    document.getElementById(`surnames_${id}`).innerHTML = participant.surnames;
    document.getElementById(`name_${id}`).innerHTML = participant.name;
    document.getElementById(`club_name_${id}`).innerHTML = participant.club_name;
    document.getElementById(`birthday_${id}`).innerHTML = participant.birthday;
    document.getElementById(`bib_number_${id}`).innerHTML = participant.bib_number;

    let penalized = '<span class="hidden">0</span>';
    if (participant.penalized == 1) {
      penalized = '<span class="glyphicon glyphicon-remove text-danger" /><span class="hidden">1</span>'
    }
    document.getElementById(`penalized_${id}`).innerHTML = penalized;

    document.getElementById(`status_${id}`).innerHTML = this.genRaceStatus(
      participant.disqualified, participant.not_arrived, participant.not_came_out);
    document.getElementById(`time_${id}`).innerHTML = participant.time;
    } catch {
      console.log('Not found ' + id);
    }
  }

  saveRow(id) {
    this.enableSelectTable();
    let elements = document.getElementsByName(`form_${id}`);

    for (let i = 0; i < elements.length; ++i) {
      elements[i].disabled = true;
    }

    let participant = this._participants_data[id];

    let club_select = document.getElementById(`form_club_${id}`);
    let status_select = document.getElementById(`form_status_${id}`);

    let status = status_select.options[status_select.selectedIndex].value;
    let disqualified;
    let not_arrived;
    let not_came_out;

    [disqualified, not_arrived, not_came_out] = this.splitStatus(status);

    let data = {
      participant_id: parseInt(participant.id),
      edition_id: parseInt(participant.edition_id),
      surnames: document.getElementById(`form_surnames_${id}`).value,
      name: document.getElementById(`form_name_${id}`).value,
      club_id: parseInt(club_select.options[club_select.selectedIndex].value),
      birthday: document.getElementById(`form_birthday_${id}`).value,
      bib_number: parseInt(document.getElementById(`form_bib_number_${id}`).value),
      penalized: document.getElementById(`form_penalized_${id}`).checked,
      disqualified: disqualified,
      not_arrived: not_arrived, 
      not_came_out: not_came_out,
      category: parseInt(document.getElementById(`category_${id}`).innerText),
      minutes: parseInt(document.getElementById(`time_minutes_${id}`).value),
      seconds: parseInt(document.getElementById(`time_seconds_${id}`).value),
      hundreds: parseInt(document.getElementById(`time_hundredths_${id}`).value)
    };

    Page.httpRequest({
      action: "update_participant",
      participant_data: data
    }, `/race/communicate`, ((participantId, participantData) => {
      return (response) => {
        Number.prototype.pad = function(size) {
          var s = String(this);
          while (s.length < (size || 2)) {s = "0" + s;}
          return s;
        }

        this._participants_data[id].surnames = participantData.surnames;
        this._participants_data[id].name = participantData.name;
        this._participants_data[id].club_id = participantData.club_id;
        this._participants_data[id].club_name = this._clubs_lut[participantData.club_id].name;
        this._participants_data[id].club_emblem = this._clubs_lut[participantData.club_id].emblem;
        this._participants_data[id].birthday = participantData.birthday;
        this._participants_data[id].bib_number = participantData.bib_number;
        this._participants_data[id].penalized = participantData.penalized;
        this._participants_data[id].disabled = participantData.disqualified;
        this._participants_data[id].not_arrived = participantData.not_arrived;
        this._participants_data[id].not_came_out = participantData.not_came_out;
        this._participants_data[id].category = participantData.category;
        this._participants_data[id].time = `${participantData.minutes.pad()}:${participantData.seconds.pad()}.${participantData.hundreds.pad()}`;
        Page.showSuccess(response.message);
        this.restoreRow(id)
      }
    })(id, data), (status, responseText) => {
      Page.showError(responseText);
      let elements = document.getElementsByName(`form_${id}`);
      for (let i = 0; i < elements.length; ++i) {
        elements[i].disabled = false;
      }
    });
  }

  editRow(id) {
    this.disableSelectTable();
    let participant = this._participants_data[id];

    let button1Td = document.getElementById(`button_1_${id}`);
    button1Td.innerHTML = `
    <button name="form_${id}" type="button" tooltip="${this._locale.race.tooltip_save}" tooltip-position="bottom" onclick="clickOnSave('${id}');"
      class="btn btn-success btn-xs">
      <i class="fa fa-save"> </i>
    </button>`;

    let button2Td = document.getElementById(`button_2_${id}`);
    button2Td.innerHTML = `
    <button name="form_${id}" type="button" tooltip="${this._locale.race.tooltip_cancel}" tooltip-position="bottom" onclick="clickOnCancel('${id}');"
      class="btn btn-warning btn-xs">
      <i class="fa fa-undo"> </i>
    </button>`;

    // SURNAMES
    let surnamesTd = document.getElementById(`surnames_${id}`);
    let surnamesValue = participant.surnames;
    surnamesTd.innerHTML = `
      <input name="form_${id}"
        value="${surnamesValue}"
        placeholder="${this._locale.race.place_holder_surnames}"
        id="form_surnames_${id}"
        class="form-control" style="width: 100%" data-validate-length-range="6"
        required="required" type="text">`;

    // NAME
    let nameTd = document.getElementById(`name_${id}`);
    let nameValue = participant.name;
    nameTd.innerHTML = `
      <input name="form_${id}"
        value=${nameValue}
        placeholder="${this._locale.race.place_holder_name}"
        id="form_name_${id}"
        class="form-control" style="width: 100%" data-validate-length-range="6"
        required="required" type="text">`;

    // CLUB NAME
    let clubTd = document.getElementById(`club_name_${id}`);
    let selectClub = document.createElement('select');
    selectClub.id = `form_club_${id}`;
    selectClub.name = `form_${id}`;
    selectClub.classList.add('form-control');
    selectClub.style.width = '100%';
    let currId = participant.club_id;
    this._clubs.forEach(element => {
      let option = document.createElement('option');
      option.value = element.id;
      option.text = element.name;

      if (element.id == currId) {
        option.selected = true;
      }

      selectClub.appendChild(option);
    });

    clubTd.innerHTML = "";
    clubTd.appendChild(selectClub);

    // BIRTHDAY
    let birthdayTd = document.getElementById(`birthday_${id}`);
    let birthdayValue = participant.birthday;
    birthdayTd.innerHTML = `
      <input name="form_${id}"
        value=${birthdayValue}
        placeholder="${this._locale.race.place_holder_birthday}"
        id="form_birthday_${id}"
        class="date-own form-control" style="width: 100px" data-validate-length-range="6"
        required="required" type="text">`;
    
    this.runOnReady(`form_birthday_${id}`, () => {
      $(`#form_birthday_${id}`).datepicker({
        minViewMode: 0,
        changeYear: true,
        format: 'yyyy-mm-dd',
        defaultDate: birthdayValue
      });

      $(`#form_birthday_${id}`).on('change', ()=>{
        let date = new Date($(`#form_birthday_${id}`).datepicker('getDate'));
        let year = date.getFullYear();
        let category = parseInt(this.editionYear) - parseInt(year);
        let categoryTd = document.getElementById(`category_${id}`);
        categoryTd.innerHTML = Math.max(1, category);
      });
    });

    // BIB NUMBER
    let bib_numberTd = document.getElementById(`bib_number_${id}`);
    let bib_numberValue = participant.bib_number;
    bib_numberTd.innerHTML = `
      <input name="form_${id}"
        value=${bib_numberValue}
        placeholder="${this._locale.race.place_holder_bib_number}"
        id="form_bib_number_${id}"
        class="form-control" style="width: 100%"
        required="required" type="number">`;

    // PENALIZED
    let penalized_Td = document.getElementById(`penalized_${id}`);
    penalized_Td.innerHTML = `
      <input name="form_${id}" id="form_penalized_${id}" type="checkbox" data-toggle="toggle"
      data-on="${ this._locale.race.yes }" data-off="${ this._locale.race.no }"
      data-onstyle="danger" data-offstyle="default" data-size="small">`;

    this.runOnReady(`form_penalized_${id}`, () => {
      let penalized = this._participants_data[id].penalized;

      if (penalized == '1') {
        $(`#form_penalized_${id}`).bootstrapToggle({
          width: '100%'
        });
        $(`#form_penalized_${id}`).bootstrapToggle('on');
      } else {
        $(`#form_penalized_${id}`).bootstrapToggle({
          width: '100%'
        });
        $(`#form_penalized_${id}`).bootstrapToggle('off');
      }
    });

    // STATUS
    let statusTd = document.getElementById(`status_${id}`);
    let selectStatus = document.createElement('select');
    selectStatus.id = `form_status_${id}`;
    selectStatus.name = `form_${id}`;
    selectStatus.classList.add('form-control');
    selectStatus.style.width = '125px';

    let currStatus = this.getStatus(
      participant.disqualified, participant.not_arrived, participant.not_came_out);

    let status = [
      this._locale.race.participant_ok, this._locale.race.participant_disqualified,
      this._locale.race.participant_not_arrived, this._locale.race.participant_not_came_out];

    status.forEach(element => {
      let option = document.createElement('option');
      option.text = element;

      if (currStatus == element) {
        option.selected = true;
      }

      selectStatus.appendChild(option);
    });

    statusTd.innerHTML = "";
    statusTd.appendChild(selectStatus);

    // TIME
    let timeTd = document.getElementById(`time_${id}`);
    let timeValue = participant.time;
    const regex = /^(\d\d):(\d\d).(\d\d)/gm;

    let m;
    let minutes = 0;
    let seconds = 0;
    let centesimal = 0;
    while ((m = regex.exec(timeValue)) !== null) {
      // This is necessary to avoid infinite loops with zero-width matches
      if (m.index === regex.lastIndex) {
          regex.lastIndex++;
      }
      
      // The result can be accessed through the `m`-variable.
      m.forEach((match, groupIndex) => {
        if (groupIndex == 1) {
          minutes = parseInt(match);
          if (minutes < 10) {
            minutes = '0' + minutes;
          }
        }

        if (groupIndex == 2) {
          seconds = parseInt(match);
          if (seconds < 10) {
            seconds = '0' + seconds;
          }
        }

        if (groupIndex == 3) {
          centesimal = parseInt(match);
          if (centesimal < 10) {
            centesimal = '0' + centesimal;
          }
        }
      });
    }

    timeTd.innerHTML = `<div class="div-time-small">
      <span tooltip="${this._locale.race.tooltip_minutes}" tooltip-position='bottom' class="input">
        <input name="form_${id}" id="time_minutes_${id}" type="number" min="0" max="59" value="${minutes}" placeholder="00" onfocus="this.select();" oninput="changeTime(this)" onchange="changeTime(this)">
      </span>:
      <span tooltip="${this._locale.race.tooltip_seconds}" tooltip-position='bottom' class="input">
        <input name="form_${id}" id="time_seconds_${id}" type="number" min="0" max="59" value="${seconds}"    placeholder="00" onfocus="this.select();" oninput="changeTime(this)" onchange="changeTime(this)">
      </span>.
      <span tooltip="${this._locale.race.tooltip_hundredths}" of a second' tooltip-position='bottom' class="input">
        <input name="form_${id}" id="time_hundredths_${id}" type="number" min="0" max="99" value="${centesimal}" placeholder="00" onfocus="this.select();" oninput="changeTime(this)" onchange="changeTime(this)">
      </span>
    </div>`;
  }

  clickOnDelete(id) {
    this._datatable.clickOnDelete(id);
  }
}

function changeTime(element) {
  let value = parseInt(element.value);

  let valueStr = value.toString();
  if (valueStr.length > 2) {
    valueStr = valueStr.substring(1, 3);
    value = parseInt(valueStr);
  }

  if (value > element.max) {
    value = element.min;
  }

  if (value < element.min) {
    value = element.min;
  }

  if (value < 10) {
    element.value = '0' + value.toString();
  } else {
    element.value = value.toString();
  }
}

function removeZerosTime(element) {
  let value = parseInt(element.value);
  element.value = value.toString();
}

function clickOnDelete(id) {
  row_participants.clickOnDelete(id);
}

function clickOnEdit(id) {
  row_participants.editRow(id);
}

function clickOnSave(id) {
  row_participants.saveRow(id);
}

function clickOnCancel(id) {
  row_participants.restoreRow(id);
}

function setupPage(locale, page_type) {
  row_participants = new ViewParticipantsPageRow(locale, page_type);
}