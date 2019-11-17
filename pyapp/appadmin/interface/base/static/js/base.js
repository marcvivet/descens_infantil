class Page {
  static _locale = null;
  static _loading = false;

  constructor(config = null) {
    this._main_page = document.getElementById('main_div');
    this._title_left = document.getElementById('title_left');
    this._title_right = document.getElementById('title_right');
    this._page_rows = document.getElementById('page_rows');
    this._page_content = document.getElementById('page_content');

    if (config != null) {
      if (config.title !== undefined) {
        this.title = config.title;
      }
    }
  }

  show() {
    if (this._main_page) {
      this._main_page.style.opacity = 1;
    }
  }

  set title(value) {
    this._title_left.innerHTML = value;
  }

  get title() {
    return this._title_left.innerHTML;
  }

  set titleRight(value) {
    this._title_right.innerHTML = value;
  }

  get titleRight() {
    return this._title_right.innerHTML;
  }

  static setLoading(value) {
    var page_loading = document.getElementById('page_loading');

    if (value) {
      if (page_loading) {
        page_loading.style.opacity = 1;
        page_loading.style.pointerEvents = 'auto';
      }

      Page._loading = true;
    } else {
      if (page_loading) {
        page_loading.style.opacity = 0;
        page_loading.style.pointerEvents = 'none';
      }

      Page._loading = false;
    }
  }

  set loading(value) {
    Page.setLoading(value);
  }

  get loading() {
    return this._loading;
  }

  addPageRow(pageRow) {
    this._page_rows.appendChild(pageRow._div_row);
  }

  addPageModal(pageModal) {
    this._page_content.appendChild(pageModal._div_modal);
  }

  static showSuccess(message) {
    if (Page._locale == null) {
      Page.setLocale();
    }

    new PNotify({
      title: Page._locale.success,
      text: message,
      type: 'success',
      styling: 'bootstrap3'
    });
  }

  static showInfo(message) {
    if (Page._locale == null) {
      Page.setLocale();
    }

    new PNotify({
      title: Page._locale.information,
      text: message,
      type: 'info',
      styling: 'bootstrap3'
    });
  }

  static showError(message) {
    if (Page._locale == null) {
      Page.setLocale();
    }

    new PNotify({
      title: Page._locale.error,
      text: message,
      type: 'error',
      styling: 'bootstrap3'
    });

    console.log(message);
  }

  static setLocale(locale = "ca") {
    var request = new XMLHttpRequest();
    request.open("GET", "/static/locale/base_" + locale + ".json", false);
    request.send(null);
    Page._locale = JSON.parse(request.responseText);
  }

  /**
   * Performs an asynchronous request.
   * @param {dict} data Data that needs to be transmitted.
   * @param {str} url URL of the web service.
   * @param {function} callback Function that will be called after receiving the response.
   * @param {function} callback_error Function that will be called if an error is produced.
   * @param {boolean} async If false the operations is done synchronously.
   */
  static httpRequest(data, url, callback = null, callback_error = null, async = true) {
    if (Page._locale == null) {
      Page.setLocale();
    }

    var xmlhttp;
    if (window.XMLHttpRequest) {
      // code for IE7+, Firefox, Chrome, Opera, Safari
      xmlhttp = new XMLHttpRequest();
    } else {
      // code for IE6, IE5
      xmlhttp = new ActiveXObject("Microsoft.XMLHTTP");
    }

    if (async) {
      xmlhttp.timeout = 10000; // Set timeout to 10 seconds (10000 milliseconds)
      xmlhttp.ontimeout = (function (paramCallback_timeout) {
        return function () {
          if (paramCallback_timeout) {
            paramCallback_timeout(408, Page._locale.error_timeout);
          } else {
            Page.showError(Page._locale.error_timeout);
          }
        };
      })(callback_error);
    }
    xmlhttp.onreadystatechange = (function (paramxmlhttp, paramCallback, paramCallbackError) {
      return function () {
        if (paramxmlhttp.readyState === 4) {
          if (paramxmlhttp.status === 200) {
            try {
              var response = JSON.parse(paramxmlhttp.responseText);

              if (paramCallback) {
                paramCallback(response);
              }
            } catch (err) {
              Page.showError(err);
            }
          } else {
            if (paramCallbackError) {
              paramCallbackError(paramxmlhttp.status, paramxmlhttp.responseText);
            } else {
              Page.showError(paramxmlhttp.responseText);
            }
          }
        }
      }
    })(xmlhttp, callback, callback_error);

    xmlhttp.open("POST", encodeURI(url), async);
    xmlhttp.setRequestHeader('Content-Type', 'application/json');
    xmlhttp.send(JSON.stringify(data));
  }
}

class PageRow {
  constructor(config) {
    let title = config.title;
    let rowId = config.rowId;

    this._div_clearfix = document.createElement("div");
    this._div_clearfix.classList.add('clearfix');

    if (rowId !== undefined) {
      this._div_row = document.getElementById(rowId);
      this._div_col_md_12 = this._div_row.children[0];
      this._div_x_panel = this._div_col_md_12.children[0];

    } else {
      this._div_row = document.createElement("div");
      this._div_row.classList.add('row');

      this._div_col_md_12 = document.createElement("div");
      this._div_col_md_12.classList.add('col-md-12');
      this._div_col_md_12.classList.add('col-sm-12');
      this._div_col_md_12.classList.add('col-xs-12');

      this._div_x_panel = document.createElement("div");
      this._div_x_panel.classList.add('x_panel');

      this._div_row.appendChild(this._div_col_md_12);
      this._div_col_md_12.appendChild(this._div_x_panel);
    }

    if (title !== undefined) {
      if (rowId !== undefined) {
        this._div_x_title = this._div_x_panel.children[0];
        this._h2_title = this._div_x_title.children[0];
        this._ul_toolbox = this._div_x_title.children[1];
      } else {
        this._div_x_title = document.createElement("div");
        this._div_x_title.classList.add('x_title');

        this._h2_title = document.createElement("h2");

        this._ul_toolbox = document.createElement("ul");
        this._ul_toolbox.classList.add('nav');
        this._ul_toolbox.classList.add('navbar-right');
        this._ul_toolbox.classList.add('panel_toolbox');

        this._div_x_panel.appendChild(this._div_x_title);
        this._div_x_title.appendChild(this._h2_title);
        this._div_x_title.appendChild(this._ul_toolbox);
        this._div_x_title.appendChild(this._div_clearfix.cloneNode(true));
      }
      this.title = title;
    }

    this._div_x_content = [];

    if (rowId !== undefined && this._div_x_panel.children.length > 1) {
      for (let i = 1; i < this._div_x_panel.children.length; ++i) {
        this._div_x_content.push(this._div_x_panel.children[i]);
      }
    } else {
      this._div_x_content.push(document.createElement("div"));
      this._div_x_content[0].classList.add('x_content');
      this._div_x_panel.appendChild(this._div_x_content[0]);
      this._div_x_panel.appendChild(this._div_clearfix.cloneNode(true));
    }

    this.visible = true;
  }

  set title(value) {
    this._h2_title.innerHTML = value;
    this._title = value;
  }

  get title() {
    return this._title;
  }

  set visible(value) {
    if (!value) {
      this._div_row.style.visibility = "hidden";
      this._div_row.style.display = "none";
      this._visible = false;
    } else {
      this._div_row.style.visibility = "visible";
      this._div_row.style.display = "block";
      this._visible = true;
    }
  }

  get visible() {
    return this._visible;
  }

  addToolBoxButton(icon, func) {
    var li = document.createElement("li");
    var a = document.createElement("a");
    var i = document.createElement("i");

    a.onclick = func;
    i.classList.add('fa');
    i.classList.add(icon);

    a.appendChild(i);
    li.appendChild(a);

    this._ul_toolbox.appendChild(li);
  }
}

class PageDialog {
  constructor(id, title, body) {
    this._div_modal = document.createElement("div");
    this._div_modal.classList.add('modal');
    this._div_modal.classList.add('fade');
    this._div_modal.setAttribute("tabindex", "-1");
    this._div_modal.setAttribute("role", "dialog");
    this._div_modal.setAttribute("aria-hidden", "true");
    this._div_modal.setAttribute("id", id);

    this._div_modal_dialog = document.createElement("div");
    this._div_modal_dialog.classList.add('modal-dialog');
    this._div_modal_dialog.classList.add('modal-dialog-centered')
    //this._div_modal_dialog.classList.add('modal-sm');

    this._div_modal_content = document.createElement("div");
    this._div_modal_content.classList.add('modal-content');

    this._div_modal_header = document.createElement("div");
    this._div_modal_header.classList.add('modal-header');

    this._button_close = document.createElement("a");
    this._button_close.classList.add('close');
    this._button_close.setAttribute("data-dismiss", "modal");
    this._button_close.innerHTML = '<span aria-hidden="true">×</span>';

    this._h4_title = document.createElement("h4");
    this._h4_title.classList.add('modal-title');

    this._div_modal_body = document.createElement("div");
    this._div_modal_body.classList.add('modal-body');

    this._div_modal_footer = document.createElement("div");
    this._div_modal_footer.classList.add('modal-footer');

    this._div_modal.appendChild(this._div_modal_dialog);
    this._div_modal_dialog.appendChild(this._div_modal_content);
    this._div_modal_content.appendChild(this._div_modal_header);
    this._div_modal_content.appendChild(this._div_modal_body);
    this._div_modal_content.appendChild(this._div_modal_footer);

    this._div_modal_header.appendChild(this._button_close);
    this._div_modal_header.appendChild(this._h4_title);

    this._button_close = document.createElement("button");
    this._button_close.setAttribute('type', 'button');
    this._button_close.setAttribute('class', 'btn btn-default');
    this._button_close.setAttribute('data-dismiss', 'modal');
    this._button_close.onclick = () => {
      if (this._event_display != null) {
        this._event_display(false);
      }
    };
    this._button_close.innerHTML = 'Close';

    this._div_modal_footer.appendChild(this._button_close);

    this.id = id;
    this.title = title;
    this.body = body;
    this._event_display = null;

    document.body.appendChild(this._div_modal);
  }

  set title(value) {
    this._h4_title.innerHTML = value;
    this._title = value;
  }

  get title() {
    return this._title;
  }

  set body(value) {
    this._div_modal_body.innerHTML = value;
  }

  get body() {
    return this._div_modal_body.innerHTML;
  }

  set close_button_name(value) {
    this._button_close.innerHTML = value;
  }

  get close_button_name() {
    return this._button_close.innerHTML;
  }

  show() {
    if (this._event_display != null) {
      this._event_display(true);
    }

    $("#" + this.id).modal("show");
    $("#" + this.id).css('pointer-events', 'inherit');
  }

  hide() {
    if (this._event_display != null) {
      this._event_display(false);
    }

    $("#" + this.id).modal("hide");
    $("#" + this.id).css('pointer-events', 'none');
  }

  addAcceptButton(name, action) {
    var button = document.createElement("button");
    button.setAttribute('type', 'button');
    button.setAttribute('class', 'btn btn-primary');
    button.onclick = action;
    button.innerHTML = name;

    this._div_modal_footer.appendChild(button);
  }
}

class PageModal {
  constructor(id, title) {
    this._div_modal = document.createElement("div");
    this._div_modal.classList.add('modal');
    this._div_modal.classList.add('fade');
    this._div_modal.setAttribute("tabindex", "-1");
    this._div_modal.setAttribute("role", "dialog");
    this._div_modal.setAttribute("aria-hidden", "true");
    this._div_modal.setAttribute("id", id);

    this._div_modal_dialog = document.createElement("div");
    this._div_modal_dialog.classList.add('modal-dialog');
    this._div_modal_dialog.classList.add('modal-lg');
    this._div_modal_dialog.classList.add('modal-dialog-base');
    this._div_modal_dialog.classList.add('modal-lg-base');

    this._div_modal_content = document.createElement("div");
    this._div_modal_content.classList.add('modal-content');

    this._div_modal_header = document.createElement("div");
    this._div_modal_header.classList.add('modal-header');

    this._button_close = document.createElement("a");
    this._button_close.classList.add('close');
    this._button_close.setAttribute("data-dismiss", "modal");
    this._button_close.innerHTML = '<span aria-hidden="true">×</span>';
    this._button_close.onclick = () => {
      if (this._event_display != null) {
        this._event_display(false);
      }
    };

    this._h4_title = document.createElement("h4");
    this._h4_title.classList.add('modal-title');

    this._div_modal_body = document.createElement("div");
    this._div_modal_body.classList.add('modal-body');

    this._div_modal.appendChild(this._div_modal_dialog);
    this._div_modal_dialog.appendChild(this._div_modal_content);
    this._div_modal_content.appendChild(this._div_modal_header);
    this._div_modal_content.appendChild(this._div_modal_body);

    this._div_modal_header.appendChild(this._button_close);
    this._div_modal_header.appendChild(this._h4_title);

    this.id = id;
    this.title = title;
    this._event_display = null;
  }

  addToolBoxButton(icon, func) {
    var a = document.createElement("a");
    var i = document.createElement("i");

    a.onclick = func;
    a.classList.add('close');
    a.classList.add('close_tool');
    i.classList.add('fa');
    i.classList.add(icon);

    a.appendChild(i);

    this._div_modal_header.appendChild(a);
  }

  set title(value) {
    this._h4_title.innerHTML = value;
    this._title = value;
  }

  get title() {
    return this._title;
  }

  show() {
    if (this._event_display != null) {
      this._event_display(true);
    }

    $("#" + this.id).modal("show");
    $("#" + this.id).css('pointer-events', 'inherit');
  }

  hide() {
    if (this._event_display != null) {
      this._event_display(false);
    }

    $("#" + this.id).modal("hide");
    $("#" + this.id).css('pointer-events', 'none');
  }
}

function showSuccess(message) {
  Page.showSuccess(message);
}

function showError(message) {
  Page.showError(message);
}

function httpRequest(data, url, callback = null, callback_error = null, async = true) {
  var xmlhttp;
  if (window.XMLHttpRequest) {
    // code for IE7+, Firefox, Chrome, Opera, Safari
    xmlhttp = new XMLHttpRequest();
  } else {
    // code for IE6, IE5
    xmlhttp = new ActiveXObject("Microsoft.XMLHTTP");
  }

  if (async) {
    xmlhttp.timeout = 10000; // Set timeout to 10 seconds (10000 milliseconds)
    xmlhttp.ontimeout = (function (paramCallback_timeout) {
      return function () {
        if (paramCallback_timeout) {
          paramCallback_timeout(408, 'Timeout reached.');
        } else {
          showError('Timeout reached ...');
        }
      };
    })(callback_error);
  }
  xmlhttp.onreadystatechange = (function (paramxmlhttp, paramCallback, paramCallbackError) {
    return function () {
      if (paramxmlhttp.readyState === 4) {
        if (paramxmlhttp.status === 200) {
          try {
            var response = JSON.parse(paramxmlhttp.responseText);

            if (response['message'] != null) {
              showSuccess(response['message']);
            }

            if (paramCallback) {
              paramCallback(response['request']);
            }
          } catch (err) {
            document.write(paramxmlhttp.responseText);
          }
        } else {
          if (paramCallbackError) {
            paramCallbackError(paramxmlhttp.status, paramxmlhttp.responseText);
          } else {
            showError(paramxmlhttp.responseText);
          }
        }
      }
    }
  })(xmlhttp, callback, callback_error);

  xmlhttp.open("POST", encodeURI(url), async);
  xmlhttp.setRequestHeader('Content-Type', 'application/json');
  xmlhttp.send(JSON.stringify(data));
}

class PageRowWizard extends PageRow {
  constructor(page, id, main_title) {
    super(null);

    this.main_page = page;
    this._id = id;
    this.main_title = document.createElement("p");
    this.main_title.innerHTML = main_title;
    this._div_x_content.appendChild(this.main_title);

    this._div_wizard = document.createElement('div');
    this._div_wizard.id = id;
    this._div_wizard.classList.add('form_wizard');
    this._div_wizard.classList.add('wizard_horizontal');

    this._ul_wizard_steps = document.createElement('ul');
    this._ul_wizard_steps.id = this._id + '_steps';
    this._ul_wizard_steps.classList.add('wizard_steps')

    this._div_wizard.appendChild(this._ul_wizard_steps);

    this._div_step_container = document.createElement('div');
    this._div_step_container.id = 'step_container';
    this._div_step_container.classList.add('stepContainer');
    this._div_step_container.style.height = '0px';
    this._div_step_container.style.overflowY = 'hidden';

    this._div_wizard.appendChild(this._div_step_container);

    this._div_x_content.appendChild(this._div_wizard);

    this.action_bar = document.createElement('div');
    this.action_bar.classList.add('actionBar');

    this._button_finish = document.createElement('a');
    this._button_finish.classList.add('buttonFinish');
    this._button_finish.classList.add('buttonDisabled');
    this._button_finish.classList.add('btn');
    this._button_finish.classList.add('btn-default');
    this._button_finish.innerHTML = 'Finish';
    this._button_finish.onclick = () => {
      this.onFinish();
    };

    this._button_next = document.createElement('a');
    this._button_next.classList.add('buttonFinish');
    this._button_next.classList.add('buttonDisabled');
    this._button_next.classList.add('btn');
    this._button_next.classList.add('btn-success');
    this._button_next.innerHTML = 'Next';
    this._button_next.onclick = () => {
      this.onNext();
    };

    this._button_previous = document.createElement('a');
    this._button_previous.classList.add('buttonFinish');
    this._button_previous.classList.add('buttonDisabled');
    this._button_previous.classList.add('btn');
    this._button_previous.classList.add('btn-primary');
    this._button_previous.innerHTML = 'Previous';
    this._button_previous.onclick = () => {
      this.onPrevious();
    };

    this.action_bar.appendChild(this._button_finish);
    this.action_bar.appendChild(this._button_next);
    this.action_bar.appendChild(this._button_previous);

    this._div_wizard.appendChild(this.action_bar);

    this.step_count = 0;
    this.current_step = 1;
    // Steps starts with 1 (not 0)
    this.step_contends = [null]
    this.nextEnabled = true;
    this.previousEnabled = false;
    this.finishEnabled = false;
  }

  _resizeAfter(id) {
    var element = document.getElementById(id);
    if (element) {
      console.log('resize');
      this._resize();
    } else {
      console.log('timeout');
      setTimeout(() => {
        this._resizeAfter(id);
      }, 100);
    }
  }

  addStep(title, subTitle) {
    this.step_count++;
    var li = document.createElement('li');

    var a = document.createElement('a');
    a.href = '#step-' + this.step_count.toString();

    var step_no = document.createElement('span');
    step_no.classList.add('step_no');
    step_no.innerHTML = this.step_count;
    a.appendChild(step_no);

    var step_title = document.createElement('span');
    step_title.classList.add('step_descr');
    step_title.innerHTML = title + '<br /><small>' + subTitle + '</small>';
    a.appendChild(step_title);

    li.appendChild(a);
    this._ul_wizard_steps.appendChild(li);

    var div = document.createElement('div');
    div.id = 'step-' + this.step_count.toString();

    var inner_div = document.createElement('div');

    div.appendChild(inner_div);

    this._div_step_container.appendChild(div);
    this.step_contends.push({
      header: a,
      content: inner_div
    });

    this._updateWizard();
  }

  goToStep(num) {
    this.current_step = num;
    this._updateWizard();
  }

  _updateWizard() {
    for (var i = 1; i <= this.step_count; ++i) {
      var current = this.step_contends[i];
      current.header.classList.remove('selected');
      current.header.classList.remove('disabled');
      current.header.classList.remove('done');

      current.content.classList.remove('hide_content');
      current.content.classList.remove('hide_content');
      current.content.classList.remove('hide_content');

      if (this.current_step == i) {
        current.header.classList.add('selected');
        continue;
      }

      current.content.classList.add('hide_content');

      if (this.current_step > i) {
        current.header.classList.add('done');
        continue;
      }

      current.header.classList.add('disabled');
    }

    if (this.current_step == this.step_count) {
      this.nextEnabled = false;
      this.finishEnabled = true;
    } else {
      this.nextEnabled = true;
      this.finishEnabled = false;
    }

    if (this.current_step == 1) {
      this.previousEnabled = false;
    } else {
      this.previousEnabled = true;
    }

    this._resize();
  }

  setStepContents(num, divObject, clear = true) {
    // Steps starts with 1 (not 0)
    if (clear) {
      while (this.step_contends[num].content.firstChild) {
        this.step_contends[num].content.removeChild(this.step_contends[num].content.firstChild);
      }
    }
    this.step_contends[num].content.appendChild(divObject);
  }

  _resize() {
    var container = document.getElementById('step_container');

    if (container) {
      var step = document.getElementById('step-' + this.current_step);

      if (step) {
        $('.stepContainer').animate({
          height: $('#step-' + this.current_step).outerHeight()
        }, "slow");
      } else {
        setTimeout(this._resize, 100);
      }
    }
  }

  onFinish() {

  }

  onNext() {
    this.current_step++;
    this._updateWizard();
  }

  onPrevious() {
    this.current_step--;
    this._updateWizard();
  }

  set nextEnabled(value) {
    var boolVal = Boolean(value);
    if (boolVal) {
      this._button_next.classList.remove('buttonDisabled');
      this._nextEnabled = true;
    } else {
      this._button_next.classList.add('buttonDisabled');
      this._nextEnabled = false;
    }
  }

  get nextEnabled() {
    return this._nextEnabled;
  }

  set previousEnabled(value) {
    var boolVal = Boolean(value);
    if (boolVal) {
      this._button_previous.classList.remove('buttonDisabled');
      this._previousEnabled = true;
    } else {
      this._button_previous.classList.add('buttonDisabled');
      this._previousEnabled = false;
    }
  }

  get previousEnabled() {
    return this._previousEnabled;
  }

  set finishEnabled(value) {
    var boolVal = Boolean(value);
    if (boolVal) {
      this._button_finish.classList.remove('buttonDisabled');
      this._finishEnabled = true;
    } else {
      this._button_finish.classList.add('buttonDisabled');
      this._finishEnabled = false;
    }
  }

  get finishEnabled() {
    return this._finishEnabled;
  }
}