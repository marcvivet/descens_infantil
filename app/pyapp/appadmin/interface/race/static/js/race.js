let row_participants = null;
let datatable = null;

class ViewParticipantsPageRow extends PageRow {

  constructor(locale_id) {
    super({
      title: "none",
      rowId: 'participants_row'
    });

    this._participants_data = null;
    this._template = document.getElementById('list').innerHTML;
    this._locale_id = locale_id;
    this._datatable = null;
    this._clubs = null;

    Page.httpRequest({
      action: "get_locale",
    }, `/race/communicate`, (response) => {
      this.setLocale(response.data)
    });

    Page.httpRequest({
      action: "get_clubs",
    }, `/race/communicate`, (response) => {
      this._clubs = response.data;
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
    this.title = this._locale.race.participants_for_edition + this.editionYear;
  }

  createTable(id) {
    let columnDefs = [{
        "targets": [0],
        "searchable": false,
        "sortable": false,
        "className": "center-element"
      },
      {
        "targets": [4, 5, 6, 7, 8, 9],
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
      //{"width": "125px"}  // 10 - final time
    ];

    let exportOptions = {
      columns: [1, 2, 5, 6, 7, 8, 9]
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
      [6, "asc"]
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

  getStatus(disqualified, not_arrived, not_come_out) {
    let status = `${this._locale.race.participant_ok}`;

    if (disqualified) {
      status = `${this._locale.race.participant_disqualified}`;
    }

    if (not_arrived) {
      status = `${this._locale.race.participant_not_arrived}`;
    }

    if (not_come_out) {
      status = `${this._locale.race.participant_not_come_out}`;
    }

    return status;
  }

  splitStatus(status) {
    let disqualified = false;
    let not_arrived = false;
    let not_come_out = false;

    if (status == `${this._locale.race.participant_disqualified}`) {
      disqualified = true;
    }

    if (status == `${this._locale.race.participant_not_arrived}`) {
      not_arrived = true;
    }

    if (status == `${this._locale.race.participant_not_come_out}`) {
      not_come_out = true;
    }

    return [disqualified, not_arrived, not_come_out];
  }

  genRaceStatus(disqualified, not_arrived, not_come_out) {
    let status = `<span class="label label-success">${this._locale.race.participant_ok}</span>`;

    if (disqualified) {
      status = `<span class="label label-danger">${this._locale.race.participant_disqualified}</span>`;
    }

    if (not_arrived) {
      status = `<span class="label label-danger">${this._locale.race.participant_not_arrived}</span>`;
    }

    if (not_come_out) {
      status = `<span class="label label-danger">${this._locale.race.participant_not_come_out}</span>`;
    }

    return status;
  }

  createTableRow(participant) {
    let id = `${participant.id}_${participant.edition_id}`
    let tr = document.createElement('tr');
    tr.id = 'table_row_' + id;

    this._participants_data[id] = participant;

    let status = this.genRaceStatus(
      participant.disqualified, participant.not_arrived, participant.not_come_out);


    let penalized = '<span class="hidden">0</span>';
    if (participant.penalized == 1) {
      penalized = '<span class="glyphicon glyphicon-remove text-danger" /><span class="hidden">1</span>'
    }

    let innerHtml = `<td>
        <table class="table-buttons" id="actions_${id}">
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
      </td>
      <td id="surnames_${id}">${participant.surnames}</td>
      <td id="name_${id}">${participant.name}</td>
      <td id="club_name_${id}">${participant.club_name}</td>
      <td id="birthday_${id}">${participant.birthday}</td>
      <td id="bib_number_${id}">${participant.bib_number}</td>
      <td id="category_${id}">${participant.category}</td>
      <td id="penalized_${id}">${penalized}</td>
      <td id="status_${id}">${status}</td>
      <td id="time_${id}">${participant.time}</td>
    `;

    //<!--<td id="time_final_${id}">${participant.time_final}</td>-->

    tr.innerHTML = innerHtml;
    return tr;
  }

  restoreRow(id) {
    let participant = this._participants_data[id];

    let button1Td = document.getElementById(`button_1_${id}`);
    button1Td.innerHTML = `
      <button type="button" tooltip="${this._locale.race.tooltip_edit}" tooltip-position="bottom" onclick="clickOnEdit('${id}');"
              class="btn btn-primary btn-xs">
        <i class="fa fa-edit"> </i>
      </button>`;

    let button2Td = document.getElementById(`button_2_${id}`);
    button2Td.innerHTML = `
    <button type="button" tooltip="${this._locale.race.tooltip_delete}" tooltip-position="bottom" onclick="clickOnDelete('${id}');"
            class="btn btn-danger btn-xs">
      <i class="fa fa-remove"> </i>
    </button>`;

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
      participant.disqualified, participant.not_arrived, participant.not_come_out);
    document.getElementById(`time_${id}`).innerHTML = participant.time;
  }

  saveRow(id) {
    let data = {
      surname: document.getElementById(`form_surnames_${id}`).value,
      name: document.getElementById(`form_name_${id}`).value/*,

      club_id: document.getElementById(`form_club_${id}`).innerHTML = participant.club_name;
    document.getElementById(`birthday_${id}`).innerHTML = participant.birthday;
    document.getElementById(`bib_number_${id}`).innerHTML = participant.bib_number;
     */
    };
  }

  editRow(id) {
    let participant = this._participants_data[id];

    let button1Td = document.getElementById(`button_1_${id}`);
    button1Td.innerHTML = `
    <button type="button" tooltip="${this._locale.race.tooltip_save}" tooltip-position="bottom" onclick="clickOnSave('${id}');"
      class="btn btn-success btn-xs">
      <i class="fa fa-save"> </i>
    </button>`;

    let button2Td = document.getElementById(`button_2_${id}`);
    button2Td.innerHTML = `
    <button type="button" tooltip="${this._locale.race.tooltip_cancel}" tooltip-position="bottom" onclick="clickOnCancel('${id}');"
      class="btn btn-warning btn-xs">
      <i class="fa fa-undo"> </i>
    </button>`;

    // SURNAMES
    let surnamesTd = document.getElementById(`surnames_${id}`);
    let surnamesValue = participant.surnames;
    surnamesTd.innerHTML = `
      <input
        value="${surnamesValue}"
        placeholder="${this._locale.race.place_holder_surnames}"
        id="form_surnames_${id}"
        class="form-control" style="width: 100%" data-validate-length-range="6"
        required="required" type="text">`;

    // NAME
    let nameTd = document.getElementById(`name_${id}`);
    let nameValue = participant.name;
    nameTd.innerHTML = `
      <input
        value=${nameValue}
        placeholder="${this._locale.race.place_holder_name}"
        id="form_name_${id}"
        class="form-control" style="width: 100%" data-validate-length-range="6"
        required="required" type="text">`;

    // CLUB NAME
    let clubTd = document.getElementById(`club_name_${id}`);
    let selectClub = document.createElement('select');
    selectClub.id = `form_club_${id}`;
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
      <input
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
      <input
        value=${bib_numberValue}
        placeholder="${this._locale.race.place_holder_bib_number}"
        id="form_bib_number_${id}"
        class="form-control" style="width: 100%"
        required="required" type="number">`;

    // PENALIZED
    let penalized_Td = document.getElementById(`penalized_${id}`);
    penalized_Td.innerHTML = `
      <input id="form_penalized_${id}" type="checkbox" data-toggle="toggle"
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
    selectStatus.classList.add('form-control');
    selectStatus.style.width = '125px';

    let currStatus = this.getStatus(
      participant.disqualified, participant.not_arrived, participant.not_come_out);

    console.log(currStatus);

    let status = [
      this._locale.race.participant_ok, this._locale.race.participant_disqualified,
      this._locale.race.participant_not_arrived, this._locale.race.participant_not_come_out];

    console.log(participant);

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
        <input id="time_minutes_${id}" type="number" min="0" max="59" value="${minutes}" placeholder="00" onfocus="this.select();" onkeypress="removeZerosTime(this)" onkeyup="changeTime(this)" onchange="changeTime(this)">
      </span>:
      <span tooltip="${this._locale.race.tooltip_seconds}" tooltip-position='bottom' class="input">
        <input id="time_seconds_${id}" type="number" min="0" max="59" value="${seconds}"    placeholder="00" onfocus="this.select();" onkeypress="removeZerosTime(this)" onkeyup="changeTime(this)" onchange="changeTime(this)">
      </span>.
      <span tooltip="${this._locale.race.tooltip_hundredths}" of a second' tooltip-position='bottom' class="input">
        <input id="time_hundredths_${id}" type="number" min="0" max="99" value="${centesimal}" placeholder="00" onfocus="this.select();" onkeypress="removeZerosTime(this)" onkeyup="changeTime(this)" onchange="changeTime(this)">
      </span>
    </div>`;
  }

  clickOnDelete(id) {
    this._datatable.clickOnDelete(id);
  }
}

function changeTime(element) {
  let value = parseInt(element.value);
  if (value > element.max) {
    value = element.max;
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

function setupPage(locale) {
  row_participants = new ViewParticipantsPageRow(locale);
}