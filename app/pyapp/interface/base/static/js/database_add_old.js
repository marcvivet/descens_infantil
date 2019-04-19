class PageRowWizard extends PageRow {
    constructor(page, id, main_title) {
        super(null);

        this.main_title = document.createElement("p");
        this.main_title.innerHTML = main_title;
        this.div_x_content.appendChild(this.main_title);

        this.div_wizard = document.createElement('div');
        this.div_wizard.id = id;
        this.div_wizard.classList.add('form_wizard');
        this.div_wizard.classList.add('wizard_horizontal');

        this.ul_wizard_steps = document.createElement('ul');
        this.ul_wizard_steps.id = 'wizard_steps';

        this.div_wizard.appendChild(this.ul_wizard_steps);
        this.div_x_content.appendChild(this.div_wizard);

        this.step_count = 0;
        this.step_contends = []

        $('#' + id).smartWizard({
            transitionEffect: 'fade',
            onShowStep: showAStepCallback,
            onFinish: onFinishCallback,
            onLeaveStep: leaveAStepCallback
        });
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

        if (this.step_contends != 1) {
            inner_div.classList.add('hide_content');
        }

        this.div_wizard.appendChild(div);
        this.step_contends.push(inner_div);
    }

}

var main_page = null;
var page_row_wizard = null;

function initPage() {
    main_page = new Page('Add Database');
    current_page = new PageRowWizard(
        main_page, 'wizard2', 'This wizard will guide you to add a new scrapped database into this application.');


    current_page.addStep('Import type', 'Select the method to <br />import a database');

    main_page.addPageRow(current_page);
}

var selected_method = 'method1';
var files_uploaded = false;
var current_step = '1';

function showLoading() {
    loading = document.getElementById('loading_div');
    loading.style.opacity = 1;
    loading.style.pointerEvents = 'auto';
}

function hideLoading() {
    loading = document.getElementById('loading_div');
    loading.style.opacity = 0;
    loading.style.pointerEvents = 'none';
}

function enableNextButton() {
    var $actionBar = $('.actionBar');
    $('.buttonNext', $actionBar).removeClass('buttonDisabled')
        .bind('click', function () {
            $('#wizard').smartWizard('goForward');
            return false;
        });
}

function disableNextButton() {
    var $actionBar = $('.actionBar');
    $('.buttonNext', $actionBar).addClass('buttonDisabled')
        .bind('click', function () {
            return false;
        });
}

function enablePreviousButton() {
    var $actionBar = $('.actionBar');
    $('.buttonPrevious', $actionBar).removeClass('buttonDisabled')
}

function disablePreviousButton() {
    var $actionBar = $('.actionBar');
    $('.buttonPrevious', $actionBar).addClass('buttonDisabled')
}

function enableFinishButton() {
    var $actionBar = $('.actionBar');
    $('.buttonFinish', $actionBar).removeClass('buttonDisabled');
}

function disableFinishButton() {
    var $actionBar = $('.actionBar');
    $('.buttonFinish', $actionBar).addClass('buttonDisabled');
}

function showAStepCallback(obj) {
    var currentStep = obj.attr('rel');
    disableFinishButton();

    if (currentStep != '1') {
        if (selected_method == 'method1') {
            if (!files_uploaded) {
                disableNextButton();
            }
        } else {
            if (selected_method == 'method2') {
                //
            } else {
                disableNextButton();
            }
        }
    }

    if (currentStep == '3') {
        if (selected_method == 'method1') {
            disablePreviousButton();
            fillTable();
        }

        if (selected_method == 'method2') {
            //disablePreviousButton();
            fillTable();
        }
    }

    current_step = currentStep;
    resizeJquerySteps();
}

function leaveAStepCallback(obj, context) {
    var currentStep = obj.attr('rel');

    if (currentStep == '2' && selected_method == 'method2' && context.fromStep == 2 && context.toStep == 3) {
        var data = {
            request: 'check_form_method2',
            data_base_name: $('#database-name_method2').val(),
            host: $('#database-host_method2').val(),
            user: $('#username_method2').val(),
            password: $('#password_method2').val(),
        };

        var response = JSON.parse($.ajax({
            type: 'POST',
            data: JSON.stringify(data),
            url: '/databases/communicate',
            async: false,
            contentType: "application/json",
            dataType: 'json'
        }).responseText);

        console.log('response: ' + response);

        if (response.message == 'success') {
            return true;
        } else {
            showError(response.message);
            return false;
        }
    }

    return true;
}

function setProgress(test_count, test_total, action) {
    progress = Math.round((test_count / test_total) * 1000) / 10;

    return '<div class="progress progress_sm"><div class="progress-bar bg-green" role="progressbar" data-transitiongoal="' + progress + '" style="width: ' + progress + '%;" aria-valuenow="' + progress + '"></div></div><small>' + progress + '% - ' + action + '</small>';
}

function setStatus(status) {
    if (status == 'waiting') {
        return '<div class="btn btn-default btn-xs">waiting</div>';
    }

    if (status == 'checking') {
        return '<div class="btn btn-info btn-xs">checking</div>';
    }

    if (status == 'succeed') {
        return '<div class="btn btn-success btn-xs">success</div>';
    }

    if (status == 'fail') {
        return '<div class="btn btn-danger btn-xs">fail</div>';
    }
}

function setResult(results) {
    if (results.length > 0) {
        var content = 'Problems found: <br /><ul>';

        for (i = 0; i < results.length; ++i) {
            content += '<li>' + results[i] + '</li>'
        }

        content += '</ul>';
    }

    return content;
}

function addRow(tableRef, rowData, total_tests) {
    var newRow = tableRef.insertRow(tableRef.rows.length);

    var nameCell = newRow.insertCell(0);
    var typeCell = newRow.insertCell(1);
    var progressCell = newRow.insertCell(2);
    var statusCell = newRow.insertCell(3);
    var resultCell = newRow.insertCell(4);

    nameCell.innerHTML = '<a>' + rowData['name'] + '</a>';

    if (rowData['type'] == 'mySQL') {
        typeCell.innerHTML = '<img src="/static/images/sql/mysql.jpg" class="avatar" alt="Avatar">';
    } else {
        typeCell.innerHTML = '<img src="/static/images/sql/sqlite.jpg" class="avatar" alt="Avatar">';
    }

    progressCell.classList.add('project_progress');
    progressCell.innerHTML = setProgress(0, total_tests, 'waiting ...');
    statusCell.innerHTML = setStatus('waiting');
    resultCell.innerHTML = '';

    rowData = {
        nameCell: nameCell,
        typeCell: typeCell,
        progressCell: progressCell,
        statusCell: statusCell,
        resultCell: resultCell,
        test_count: 0,
        test_total: total_tests,
        results: [],
        status: 'waiting',
        id: rowData['id']
    };

    return rowData;
}

var database_rows = [];
var integrity_tests = [];

function fillTable() {
    database_rows = [];
    integrity_tests = [];

    var tableRef = document.getElementById('table_integrity');
    var rowCount = tableRef.rows.length;
    for (var x = rowCount - 1; x > 0; x--) {
        tableRef.deleteRow(x);
    }

    httpRequest({
        request: 'table_data'
    }, '/databases/communicate', function (request) {
        var tableRef = document.getElementById('table_integrity').getElementsByTagName('tbody')[0];

        integrity_tests = request.integrity_tests;
        var total_tests = integrity_tests.length;

        for (i = 0; i < request.databases.length; ++i) {
            database_rows.push(addRow(tableRef, request.databases[i], total_tests));
        }

        resizeJquerySteps();

        for (j = 0; j < database_rows.length; ++j) {
            for (i = 0; i < integrity_tests.length; ++i) {
                httpRequest({
                        request: 'perform_test',
                        id: database_rows[j].id,
                        model: integrity_tests[i]
                    }, '/databases/communicate',
                    (function (rowIndex, testIndex) {
                        return function (request) {
                            row = database_rows[rowIndex]
                            row.test_count += 1;
                            row.progressCell.innerHTML = setProgress(row.test_count, row.test_total, 'Table ' + integrity_tests[testIndex] + ' check ' + request.result);

                            if (request.result == 'fail') {
                                row.results.push(request.info);
                                row.resultCell.innerHTML = setResult(row.results);

                                row.status = 'fail';
                                row.statusCell.innerHTML = setStatus(row.status);

                                resizeJquerySteps();
                            }

                            if (row.test_count == row.test_total) {
                                if (row.status != 'fail') {
                                    row.status = 'succeed';
                                    row.statusCell.innerHTML = setStatus(row.status);
                                    enableFinishButton();
                                }

                                row.progressCell.innerHTML = setProgress(row.test_count, row.test_total, 'Check completed');
                            } else {
                                if (row.status != 'fail') {
                                    if (row.status != 'checking') {
                                        row.statusCell.innerHTML = setStatus('checking');
                                        row.status = 'checking';
                                    }
                                }
                            }
                        };
                    })(j, i));
            }
        }
    });
}

function onFinishCallback(objs, context) {
    disableFinishButton();
    data = [];
    for (j = 0; j < database_rows.length; ++j) {
        if (database_rows[j].status == 'checking') {
            enableFinishButton();
            showError('Wait until all databases are checked!');
            return;
        }

        if (database_rows[j].status == 'succeed') {
            data.push(database_rows[j].id);
        }
    }

    showLoading();

    httpRequest({
            request: 'finish',
            data: data,
        }, '/databases/communicate',
        function (request) {
            hideLoading();
            $('#wizard').smartWizard('goToStep', '1');
        });
}

function setupSmartWizard() {
    $('#wizard').smartWizard({
        transitionEffect: 'fade',
        onShowStep: showAStepCallback,
        onFinish: onFinishCallback,
        onLeaveStep: leaveAStepCallback
    });



    //$("#wizard").smartWizard('showMessage', 'Hello, World!');
}

function setupDropzone() {
    Dropzone.options.dropzoneMethod1 = {
        paramName: "file", // The name that will be used to transfer the file
        maxFilesize: 4000, // MB
        acceptedFiles: '.sqlite, .db',
        addRemoveLinks: true,
        success: function (file, done) {
            showSuccess('Database ' + file.name + ' uploaded successfully.');
            enableNextButton();
            files_uploaded = true;
        },
        error: function (file, message) {
            showError('An error occurred when trying to upload the database ' + file.name + '. ' + message);
            var node, _i, _len, _ref, _results;
            if (file.previewElement) {
                file.previewElement.classList.add("dz-error");
                if (typeof message !== "String" && message.error) {
                    message = message.error;
                }
                _ref = file.previewElement.querySelectorAll("[data-dz-errormessage]");
                _results = [];
                for (_i = 0, _len = _ref.length; _i < _len; _i++) {
                    node = _ref[_i];
                    _results.push(node.textContent = message);
                }
                return _results;
            }
        },
        removedfile: function (file) {
            if (file.status == "success") {
                httpRequest({
                    remove: file.name
                }, '/databases/communicate');
            }

            var _ref;
            if (file.previewElement) {
                if ((_ref = file.previewElement) != null) {
                    _ref.parentNode.removeChild(file.previewElement);
                }
            }

            var booldisableNextButton = true;
            for (i = 0; i < this.files.length; ++i) {
                if (this.files[i].status == "success") {
                    booldisableNextButton = false;
                    break;
                }
            }

            if (booldisableNextButton) {
                disableNextButton();
                files_uploaded = false;
            }

            return this._updateMaxFilesReachedClass();
        }
    };
}

function stepCheckSelected(method) {
    step_contends = document.getElementsByName('step_content');

    for (i = 0; i < step_contends.length; i++) {
        step_contends[i].classList.add('hide_content');
    }

    document.getElementById('step2_' + method).classList.toggle('hide_content');

    if (method == 'method1' || method == 'method2') {
        document.getElementById('step3_method12').classList.toggle('hide_content');
    }

    selected_method = method;
    httpRequest({
        method: method
    }, '/databases/communicate');
}

function resizeJquerySteps() {
    $('.stepContainer').animate({
        height: $('#step-' + current_step).outerHeight() + 50
    }, "slow");
}