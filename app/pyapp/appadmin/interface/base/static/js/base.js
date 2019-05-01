class Page {
    static _locale = null;
    static _loading = false;

    constructor(title) {
        this.title = title;
    }

    set title(value) {
        var page_title = document.getElementById('page_title');

        if (page_title) {
            page_title.innerHTML = value;
            this._title = value;
        }
    }

    get title() {
        return this._title;
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
        var page_content = document.getElementById('page_content');
        page_content.appendChild(pageRow.div_row);
    }

    addPageModal(pageModal) {
        var page_content = document.getElementById('page_content');
        page_content.appendChild(pageModal.div_modal);
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
        request.open("GET","/static/locale/base_" + locale + ".json", false);
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

        if ( async ) {
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
    constructor(title) {
        this.div_row = document.createElement("div");
        this.div_row.classList.add('row');

        this.div_col_md_12 = document.createElement("div");
        this.div_col_md_12.classList.add('col-md-12');

        this.div_x_panel = document.createElement("div");
        this.div_x_panel.classList.add('x_panel');

        if (title) {
            this.div_x_title = document.createElement("div");
            this.div_x_title.classList.add('x_title');

            this.h2_title = document.createElement("h2");

            this.ul_toolbox = document.createElement("ul");
            this.ul_toolbox.classList.add('nav');
            this.ul_toolbox.classList.add('navbar-right');
            this.ul_toolbox.classList.add('panel_toolbox');
            this.title = title;
        }

        this.div_x_content = document.createElement("div");
        this.div_x_content.classList.add('x_content');

        var div_clearfix = document.createElement("div");
        div_clearfix.classList.add('clearfix');

        this.div_row.appendChild(this.div_col_md_12);

        this.div_col_md_12.appendChild(this.div_x_panel);

        if (title) {
            this.div_x_panel.appendChild(this.div_x_title);
            this.div_x_title.appendChild(this.h2_title);
            this.div_x_title.appendChild(this.ul_toolbox);
            this.div_x_title.appendChild(div_clearfix);
        }
        this.div_x_panel.appendChild(this.div_x_content);
        this.div_x_panel.appendChild(div_clearfix);

        this.visible = true;
    }

    set title(value) {
        this.h2_title.innerHTML = value;
        this._title = value;
    }

    get title() {
        return this._title;
    }

    set visible(value) {
        if (!value) {
            this.div_row.style.visibility = "hidden";
            this.div_row.style.display = "none";
            this._visible = false;
        } else {
            this.div_row.style.visibility = "visible";
            this.div_row.style.display = "block";
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

        this.ul_toolbox.appendChild(li);
    }
}

class PageDialog {
    constructor(id, title, body) {
        this.div_modal = document.createElement("div");
        this.div_modal.classList.add('modal');
        this.div_modal.classList.add('fade');
        this.div_modal.setAttribute("tabindex", "-1");
        this.div_modal.setAttribute("role", "dialog");
        this.div_modal.setAttribute("aria-hidden", "true");
        this.div_modal.setAttribute("id", id);

        this.div_modal_dialog = document.createElement("div");
        this.div_modal_dialog.classList.add('modal-dialog');
        this.div_modal_dialog.classList.add('modal-dialog-centered')
        //this.div_modal_dialog.classList.add('modal-sm');

        this.div_modal_content = document.createElement("div");
        this.div_modal_content.classList.add('modal-content');

        this.div_modal_header = document.createElement("div");
        this.div_modal_header.classList.add('modal-header');

        this.button_close = document.createElement("a");
        this.button_close.classList.add('close');
        this.button_close.setAttribute("data-dismiss", "modal");
        this.button_close.innerHTML = '<span aria-hidden="true">×</span>';

        this.h4_title = document.createElement("h4");
        this.h4_title.classList.add('modal-title');

        this.div_modal_body = document.createElement("div");
        this.div_modal_body.classList.add('modal-body');

        this.div_modal_footer = document.createElement("div");
        this.div_modal_footer.classList.add('modal-footer');

        this.div_modal.appendChild(this.div_modal_dialog);
        this.div_modal_dialog.appendChild(this.div_modal_content);
        this.div_modal_content.appendChild(this.div_modal_header);
        this.div_modal_content.appendChild(this.div_modal_body);
        this.div_modal_content.appendChild(this.div_modal_footer);

        this.div_modal_header.appendChild(this.button_close);
        this.div_modal_header.appendChild(this.h4_title);

        this.button_close =document.createElement("button");
        this.button_close.setAttribute('type', 'button');
        this.button_close.setAttribute('class', 'btn btn-default');
        this.button_close.setAttribute('data-dismiss', 'modal');
        this.button_close.innerHTML = 'Close';

        this.div_modal_footer.appendChild(this.button_close);

        this.id = id;
        this.title = title;
        this.body = body;

        document.body.appendChild(this.div_modal);
    }

    set title(value) {
        this.h4_title.innerHTML = value;
        this._title = value;
    }

    get title() {
        return this._title;
    }

    set body(value) {
        this.div_modal_body.innerHTML = value;
    }

    get body() {
        return this.div_modal_body.innerHTML;
    }

    set close_button_name(value) {
        this.button_close.innerHTML = value;
    }

    get close_button_name() {
        return this.button_close.innerHTML;
    }

    show() {
        $("#" + this.id).modal("show");
        $("#" + this.id).css( 'pointer-events', 'inherit' );
    }

    hide() {
        $("#" + this.id).modal("hide");
        $("#" + this.id).css( 'pointer-events', 'none' );
    }

    addAcceptButton(name, action) {
        var button = document.createElement("button");
        button.setAttribute('type', 'button');
        button.setAttribute('class', 'btn btn-primary');
        button.onclick = action;
        button.innerHTML = name;

        this.div_modal_footer.appendChild(button);
    }
}

class PageModal {
    constructor(id, title) {
        this.div_modal = document.createElement("div");
        this.div_modal.classList.add('modal');
        this.div_modal.classList.add('fade');
        this.div_modal.setAttribute("tabindex", "-1");
        this.div_modal.setAttribute("role", "dialog");
        this.div_modal.setAttribute("aria-hidden", "true");
        this.div_modal.setAttribute("id", id);

        this.div_modal_dialog = document.createElement("div");
        this.div_modal_dialog.classList.add('modal-dialog');
        this.div_modal_dialog.classList.add('modal-lg');
        this.div_modal_dialog.classList.add('modal-dialog-base');
        this.div_modal_dialog.classList.add('modal-lg-base');

        this.div_modal_content = document.createElement("div");
        this.div_modal_content.classList.add('modal-content');

        this.div_modal_header = document.createElement("div");
        this.div_modal_header.classList.add('modal-header');

        this.button_close = document.createElement("a");
        this.button_close.classList.add('close');
        this.button_close.setAttribute("data-dismiss", "modal");
        this.button_close.innerHTML = '<span aria-hidden="true">×</span>';

        this.h4_title = document.createElement("h4");
        this.h4_title.classList.add('modal-title');

        this.div_modal_body = document.createElement("div");
        this.div_modal_body.classList.add('modal-body');

        this.div_modal.appendChild(this.div_modal_dialog);
        this.div_modal_dialog.appendChild(this.div_modal_content);
        this.div_modal_content.appendChild(this.div_modal_header);
        this.div_modal_content.appendChild(this.div_modal_body);

        this.div_modal_header.appendChild(this.button_close);
        this.div_modal_header.appendChild(this.h4_title);

        this.id = id;
        this.title = title;
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

        this.div_modal_header.appendChild(a);
    }

    set title(value) {
        this.h4_title.innerHTML = value;
        this._title = value;
    }

    get title() {
        return this._title;
    }

    show() {
        $("#" + this.id).modal("show");
        $("#" + this.id).css( 'pointer-events', 'inherit' );
    }

    hide() {
        $("#" + this.id).modal("hide");
        $("#" + this.id).css( 'pointer-events', 'none' );
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

    if ( async ) {
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
        this.div_x_content.appendChild(this.main_title);

        this.div_wizard = document.createElement('div');
        this.div_wizard.id = id;
        this.div_wizard.classList.add('form_wizard');
        this.div_wizard.classList.add('wizard_horizontal');

        this.ul_wizard_steps = document.createElement('ul');
        this.ul_wizard_steps.id = this._id + '_steps';
        this.ul_wizard_steps.classList.add('wizard_steps')

        this.div_wizard.appendChild(this.ul_wizard_steps);

        this.div_step_container = document.createElement('div');
        this.div_step_container.id = 'step_container';
        this.div_step_container.classList.add('stepContainer');
        this.div_step_container.style.height = '0px';
        this.div_step_container.style.overflowY = 'hidden';

        this.div_wizard.appendChild(this.div_step_container);

        this.div_x_content.appendChild(this.div_wizard);

        this.action_bar = document.createElement('div');
        this.action_bar.classList.add('actionBar');

        this.button_finish = document.createElement('a');
        this.button_finish.classList.add('buttonFinish');
        this.button_finish.classList.add('buttonDisabled');
        this.button_finish.classList.add('btn');
        this.button_finish.classList.add('btn-default');
        this.button_finish.innerHTML = 'Finish';
        this.button_finish.onclick = () => {
            this.onFinish();
        };

        this.button_next = document.createElement('a');
        this.button_next.classList.add('buttonFinish');
        this.button_next.classList.add('buttonDisabled');
        this.button_next.classList.add('btn');
        this.button_next.classList.add('btn-success');
        this.button_next.innerHTML = 'Next';
        this.button_next.onclick = () => {
            this.onNext();
        };

        this.button_previous = document.createElement('a');
        this.button_previous.classList.add('buttonFinish');
        this.button_previous.classList.add('buttonDisabled');
        this.button_previous.classList.add('btn');
        this.button_previous.classList.add('btn-primary');
        this.button_previous.innerHTML = 'Previous';
        this.button_previous.onclick = () => {
            this.onPrevious();
        };

        this.action_bar.appendChild(this.button_finish);
        this.action_bar.appendChild(this.button_next);
        this.action_bar.appendChild(this.button_previous);

        this.div_wizard.appendChild(this.action_bar);

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
            setTimeout(() => { this._resizeAfter(id); }, 100);
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
        this.ul_wizard_steps.appendChild(li);

        var div = document.createElement('div');
        div.id = 'step-' + this.step_count.toString();

        var inner_div = document.createElement('div');

        div.appendChild(inner_div);

        this.div_step_container.appendChild(div);
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

    setStepContents(num, divObject, clear=true) {
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
            this.button_next.classList.remove('buttonDisabled');
            this._nextEnabled = true;
        } else {
            this.button_next.classList.add('buttonDisabled');
            this._nextEnabled = false;
        }
    }

    get nextEnabled() {
        return this._nextEnabled;
    }

    set previousEnabled(value) {
        var boolVal = Boolean(value);
        if (boolVal) {
            this.button_previous.classList.remove('buttonDisabled');
            this._previousEnabled = true;
        } else {
            this.button_previous.classList.add('buttonDisabled');
            this._previousEnabled = false;
        }
    }

    get previousEnabled() {
        return this._previousEnabled;
    }

    set finishEnabled(value) {
        var boolVal = Boolean(value);
        if (boolVal) {
            this.button_finish.classList.remove('buttonDisabled');
            this._finishEnabled = true;
        } else {
            this.button_finish.classList.add('buttonDisabled');
            this._finishEnabled = false;
        }
    }

    get finishEnabled() {
        return this._finishEnabled;
    }
}
