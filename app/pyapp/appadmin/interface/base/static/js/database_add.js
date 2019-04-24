class AddDatabasePageRowWizard extends PageRowWizard {
    constructor(page) {
        super(page, 'wizard',
            'This wizard will guide you to add a new scrapped database into this application.');

        this.addStep('Import type', 'Select the method to <br />import a database');
        this.addStep('Details', 'Fill <br />information');
        this.addStep('Check', 'Check database <br />integrity');

        this.import_methods_count = 0;
        this.selected_method = 1;
        this.files_uploaded = false;

        this._initStep1();
        this._initStep2();
        this._initStep3();

        this._addImportOption('Upload SQLite files', this._createMethod1());
        this._addImportOption('Setup a mySQL database', this._createMethod2());
        this._addImportOption('Scrap ExVagos', this._createMethod3());

        this._resizeAfter(this._id);
    }

    onFinish() {
        this.finishEnabled = false;
        this.nextEnabled = false;
        this.previousEnabled = false;

        var data = [];
        for (var j = 0; j < this.table.database_rows.length; ++j) {
            if (this.table.database_rows[j].status == 'checking') {
                this.finishEnabled = true;
                showError('Wait until all databases are checked!');
                return;
            }

            if (this.table.database_rows[j].status == 'succeed') {
                data.push(this.table.database_rows[j].id);
            }
        }

        this.main_page.loading = true;

        httpRequest({
                request: 'finish',
                data: data,
            }, '/databases/communicate',
            (request) => {
                this.main_page.loading = false;
                this.goToStep(1);
            });
    }

    onNext() {
        super.onNext();
        this.nextEnabled = false;
        this.finishEnabled = false;
        this.previousEnabled = true;

        if (this.current_step == 3 && this.selected_method == 2) {
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
    
            if (response.message != 'success') {
                showError(response.message);
            }
        }

        if (this.current_step == 2) {
            if (this.selected_method == 1) {
                if (!this.files_uploaded) {
                    this.nextEnabled = false;
                }
            } else {
                if (this.selected_method == 2) {
                    //
                } else {
                    this.nextEnabled = false;
                }
            }

            httpRequest({
                method: this.selected_method
            }, '/databases/communicate');
        }
    
        if (this.current_step == 3) {
            if (this.selected_method == 1) {
                this.previousEnabled = false;
            }

            this.table.fillTable(() => {
                this._resize();
            }, () => {
                this.finishEnabled = true;
            });
    
            if (this.selected_method == 2) {
                this.table.fillTable(() => {
                    this._resize();
                }, () => {
                    this.finishEnabled = true;
                });
            }
        }
    }

    onPrevious() {
        super.onPrevious();
        this.nextEnabled = false;
        this.finishEnabled = false;
        this.previousEnabled = false;

        if (this.current_step != 3) {
            this.nextEnabled = true;
        } 
    }

    _initStep1() {
        // Setup Step1
        var div_step1 = document.createElement('div');
        div_step1.id = 'first_step_id'
        div_step1.classList.add('form-horizontal');
        div_step1.classList.add('form-label-left');

        var div_form = document.createElement('div');
        div_form.classList.add('form-group');

        var label = document.createElement('label');
        label.classList.add('control-label');
        label.classList.add('col-md-3');
        label.classList.add('col-sm-3');
        label.classList.add('col-xs-12');
        label.innerHTML = 'Methods to<br />import a database';

        div_form.appendChild(label);

        this.options_step1 = document.createElement('div');
        this.options_step1.classList.add('col-md-6');
        this.options_step1.classList.add('col-sm-6');
        this.options_step1.classList.add('col-xs-12');

        div_form.appendChild(this.options_step1);

        div_step1.appendChild(div_form);
        this.setStepContents(1, div_step1);
    }

    _initStep2() {
    }

    _initStep3() {
        var div_step3 = document.createElement('div');
        
        var h2 = document.createElement('h2');
        h2.classList.add('StepTitle');
        h2.innerHTML = 'Checking integrity';
        
        var p = document.createElement('p');
        p.innerHTML = 'Checking the integrity of the given databases. Only the databases that passes this test will be added to the system.';
        
        div_step3.appendChild(h2);
        div_step3.appendChild(p);

        this.table = new IntegrityTable(div_step3);

        this.setStepContents(3, div_step3);
    }

    _addImportOption(title, step2Div) {
        this.import_methods_count++;
        var id = this.import_methods_count;
        var radio = document.createElement('div');
        radio.classList.add('radio');

        var label = document.createElement('label');

        var input = document.createElement('input');
        input.type = 'radio';
        input.value = id;
        input.id = 'step_1_' + id.toString();
        input.name = 'import_options';
        input.onclick = () => {
            this.selected_method = id;
            this.setStepContents(2, step2Div);
        }

        if (id == 1) {
            input.checked = true;
            this.setStepContents(2, step2Div);
        }

        var title_ = document.createTextNode(title);
        label.appendChild(input);
        label.appendChild(title_);
        radio.appendChild(label);
        this.options_step1.appendChild(radio);
    }

    _createMethod1() {
        var method = document.createElement('div');
        method.id = 'step2_method1';
        method.name = 'step_content';
        
        method.innerHTML = [
            '<h2 class="StepTitle">Import SQLite databases</h2>',
            '<p>',
            '    Drop the SQLite databases in the box below,',
            '    <b>names must be uniques</b>. The accepted file types are',
            '    <it>sqlite</it> or',
            '    <it>db</it>.',
            '</p>',
            '<form action="/databases/upload" class="dropzone" id="dropzone_method1"></form>',
            '<br />',
        ].join('\n');

        this.setupDropzone();

        return method;
    }

    _createMethod2() {
        var method = document.createElement('div');
        method.id = 'step2_method2';
        method.name = 'step_content';
        
        method.innerHTML = [
            '<h2 class="StepTitle">Setup a mySQL database</h2>',
            '<p>',
            '    Enter the mySQL database details.',
            '</p>',
            '<form class="form-horizontal form-label-left">',
            '    <div class="form-group">',
            '        <label class="control-label col-md-3 col-sm-3 col-xs-12" for="database-name_method2">Database Name',
            '            <span class="required">*</span>',
            '        </label>',
            '        <div class="col-md-6 col-sm-6 col-xs-12">',
            '            <input type="text" id="database-name_method2" placeholder="mySQL database name" name="database-name_method2" required="required" class="form-control col-md-7 col-xs-12">',
            '        </div>',
            '    </div>',
            '    <div class="form-group">',
            '        <label class="control-label col-md-3 col-sm-3 col-xs-12" for="database-host_method2">Host',
            '            <span class="required">*</span>',
            '        </label>',
            '        <div class="col-md-6 col-sm-6 col-xs-12">',
            '            <input type="text" id="database-host_method2" placeholder="mySQL host name" name="database-host_method2" required="required" class="form-control col-md-7 col-xs-12">',
            '        </div>',
            '    </div>',
            '    <div class="item form-group">',
            '        <label class="control-label col-md-3 col-sm-3 col-xs-12" for="username_method2">User name',
            '            <span class="required">*</span>',
            '        </label>',
            '        <div class="col-md-6 col-sm-6 col-xs-12">',
            '            <input id="username_method2" class="form-control col-md-7 col-xs-12" name="username_method2" placeholder="mySQL user name" required="required"',
            '                type="text">',
            '        </div>',
            '    </div>',
            '    <div class="item form-group">',
            '        <label for="password_method2" class="control-label col-md-3 col-sm-3 col-xs-12">Password',
            '            <span class="required">*</span>',
            '        </label>',
            '        <div class="col-md-6 col-sm-6 col-xs-12">',
            '            <input id="password_method2" type="password" name="password_method2" required="required" class="form-control col-md-7 col-xs-12">',
            '        </div>',
            '    </div>',
            '    <div class="item form-group">',
            '        <label for="password2_method2" class="control-label col-md-3 col-sm-3 col-xs-12">Repeat Password',
            '            <span class="required">*</span>',
            '        </label>',
            '        <div class="col-md-6 col-sm-6 col-xs-12">',
            '            <input id="password2_method2" type="password" name="password2_method2" required="required" data-validate-linked="password_method2" class="form-control col-md-7 col-xs-12">',
            '        </div>',
            '    </div>',
            '</form>',
        ].join('\n');

        return method;
    }

    _update_databases(request) {
        var select = document.getElementById('select_database');
        if (select) {
            for (var i = 0; i < request.length; ++i) {
                var option = document.createElement("option");
                option.text = request[i].name;
                option.value = request[i].id;
                select.add(option); 
            }

            this._updateDatePicker(request[0].date);

            var button = document.getElementById('scrap_button');
            button.onclick = () => {
                this._clickOnScrapButton();
            }

        } else {
            setTimeout(() => {
                this._update_databases(request);
            }, 100);
        }
    }

    _clickOnScrapButton() {
        console.log('click');

        var startDate = $('#reportrange_right').data('daterangepicker').startDate.format("YYYY-MM-DD hh:mm");
        var endDate = $('#reportrange_right').data('daterangepicker').endDate.format("YYYY-MM-DD hh:mm");

        var select = document.getElementById("select_database");
        var option = select.options[select.selectedIndex];

        console.log('option name: ' + option.text);
        console.log('option value: ' + option.value);

        console.log('Start Date: ' + startDate);
        console.log('End Date: ' + endDate);
    }

    _createMethod3() {
        var method = document.createElement('div');
        method.id = 'step3_method3';
        method.name = 'step_content';

        httpRequest({
            request: 'get_scraping_databases'
        }, '/databases/communicate', (request) => {
            this._update_databases(request);
        });
        
        method.innerHTML = [
            '<h2 class="StepTitle">Setup a mySQL database</h2>',
            '<p>',
            '    Enter the mySQL database details.',
            '</p>',
            '<form class="form-horizontal form-label-left">',
            '    <div class="form-group">',
            '        <label class="control-label col-md-3 col-sm-3 col-xs-12" for="database-name_method2">Interval',
            '        </label>',
            '        <div class="col-md-6 col-sm-6 col-xs-12">',
            '            <div id="reportrange_right" class="pull-left" style="background: #fff; cursor: pointer; padding: 5px 10px; border: 1px solid #ccc">',
            '                <i class="glyphicon glyphicon-calendar fa fa-calendar"></i>',
            '                <span>September 8, 2018 - October 7, 2018</span> <b class="caret"></b>',
            '            </div>',
            '        </div>',
            '    </div>',
            '    <div class="form-group">',
            '      <label class="control-label col-md-3 col-sm-3 col-xs-12">Add data to</label>',
            '      <div class="col-md-9 col-sm-9 col-xs-12">',
            '        <select class="form-control" id="select_database">',
            '          <option value=0>New Database</option>',
            '        </select>',
            '      </div>',
            '    </div>',
            '    <div class="form-group">',
            '        <label class="control-label col-md-3 col-sm-3 col-xs-12"></label>',
            '        <div class="col-md-9 col-sm-9 col-xs-12">',
            '            <span class="btn btn-primary" id="scrap_button">Scrap!</span>',
            '        </div>',
            '    </div>',
            '    <div class="form-group">',
            '       <textarea id="output" class="form-control col-md-1 col-sm-1 col-xs-12"',
            '           style="height: 300px; padding: 10px; margin-top: 10px"></textarea>',
            '    </div>',
            '</form>',
        ].join('\n');

        return method;
    }

    _updateDatePicker(date) {
        var datePicker = document.getElementById('reportrange_right');
        if (datePicker) {
            if( typeof ($.fn.daterangepicker) === 'undefined'){ return; }
            console.log('init_daterangepicker_right');
        
            var cb = function(start, end, label) {
                console.log(start.toISOString(), end.toISOString(), label);
                $('#reportrange_right span').html(start.format('MMMM D, YYYY') + ' - ' + end.format('MMMM D, YYYY'));
            };

            var startDate = moment(date, "YYYY-MM-DD hh:mm");
            var endDate = moment();

            var optionSet1 = {
                startDate: startDate,
                endDate: endDate,
                minDate: moment().subtract(3, 'month').startOf('month'),
                maxDate: moment(),
                dateLimit: {
                days: 60
                },
                showDropdowns: true,
                showWeekNumbers: false,
                timePicker: true,
                timePickerIncrement: 1,
                timePicker12Hour: false,
                ranges: {
                'Since Last Scrap': [startDate, endDate],
                'Today': [moment(), moment()],
                'Yesterday': [moment().subtract(1, 'days'), moment().subtract(1, 'days')],
                'Last 7 Days': [moment().subtract(6, 'days'), moment()],
                'Last 30 Days': [moment().subtract(29, 'days'), moment()],
                'This Month': [moment().startOf('month'), moment().endOf('month')],
                },
                opens: 'right',
                buttonClasses: ['btn btn-default'],
                applyClass: 'btn-small btn-primary',
                cancelClass: 'btn-small',
                format: 'DD/MM/YYYY',
                separator: ' to ',
                locale: {
                applyLabel: 'Submit',
                cancelLabel: 'Clear',
                fromLabel: 'From',
                toLabel: 'To',
                customRangeLabel: 'Custom',
                daysOfWeek: ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'],
                monthNames: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
                firstDay: 1
                }
            };

            $('#reportrange_right span').html(moment().subtract(29, 'days').format('MMMM D, YYYY') + ' - ' + moment().format('MMMM D, YYYY'));

            $('#reportrange_right').daterangepicker(optionSet1, cb);

            $('#reportrange_right').on('show.daterangepicker', function() {
                console.log("show event fired");
            });
            $('#reportrange_right').on('hide.daterangepicker', function() {
                console.log("hide event fired");
            });
            $('#reportrange_right').on('apply.daterangepicker', function(ev, picker) {
                console.log("apply event fired, start/end dates are " + picker.startDate.format('MMMM D, YYYY') + " to " + picker.endDate.format('MMMM D, YYYY'));
            });
            $('#reportrange_right').on('cancel.daterangepicker', function(ev, picker) {
                console.log("cancel event fired");
            });

            $('#options1').click(function() {
                $('#reportrange_right').data('daterangepicker').setOptions(optionSet1, cb);
            });

            $('#options2').click(function() {
                $('#reportrange_right').data('daterangepicker').setOptions(optionSet2, cb);
            });

            $('#destroy').click(function() {
                $('#reportrange_right').data('daterangepicker').remove();
            });
	   
        } else {
            setTimeout(() => {
                this._updateDatePicker();
            }, 100);
        }
    }

    setupDropzone() {
        Dropzone.options.dropzoneMethod1 = {
            paramName: "file", // The name that will be used to transfer the file
            maxFilesize: 4000, // MB
            acceptedFiles: '.sqlite, .db',
            addRemoveLinks: true,
            success: (file, done) => {
                showSuccess('Database ' + file.name + ' uploaded successfully.');
                this.nextEnabled = true;
                this.files_uploaded = true;
            },
            error: (file, message) => {
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
            removedfile: (file) => {
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
                    this.nextEnabled = false;
                    this.files_uploaded = false;
                }
    
                return this._updateMaxFilesReachedClass();
            }
        };
    }
}

var main_page = null;
var page_row_wizard = null;

function initPage() {
    main_page = new Page('Add Database');
    current_page = new AddDatabasePageRowWizard(main_page);
    main_page.addPageRow(current_page);
}


class IntegrityTable {
    constructor(mainDiv) {
        this.database_rows = [];
        this.integrity_tests = [];

        this.table = document.createElement('table');
        this.table.classList.add('table');
        this.table.classList.add('table-striped');
        this.table.classList.add('projects');
        this.table.id = 'table_integrity';

        var innerHTML = [
            '<thead>',
            '    <tr>',
            '        <th style="width: 15%;">Name</th>',
            '        <th style="width: 75px;">Type</th>',
            '        <th style="width: 300px;">Progress</th>',
            '        <th style="width: 75px;">Status</th>',
            '        <th>Result</th>',
            '    </tr>',
            '</thead>',
            '<tbody>',
            '    <tr>',
            '        <td>',
            '            <a>db1.sqlite</a>',
            '        </td>',
            '        <td>',
            '            <img src="/static/images/sql/mysql.jpg" class="avatar" alt="Avatar">',
            '        </td>',
            '        <td class="project_progress">',
            '            <div class="progress progress_sm">',
            '                <div class="progress-bar bg-green" role="progressbar" data-transitiongoal="25" style="width: 25%;" aria-valuenow="25"></div>',
            '            </div>',
            '            <small>25% Complete</small>',
            '        </td>',
            '        <td>',
            '            <div class="btn btn-success btn-xs">Success</div>',
            '        </td>',
            '        <td>',
            '            Problems found:',
            '            <br />',
            '            <ul>',
            '                <li>The problems found was bla bla bla</li>',
            '                <li>The problems found was bla bla bla</li>',
            '                <li>The problems found was bla bla bla</li>',
            '                <li>The problems found was bla bla bla</li>',
            '            </ul>',
            '        </td>',
            '    </tr>',
            '</tbody>',
        ].join('\n');

        this.table.innerHTML = innerHTML;
        mainDiv.appendChild(this.table);
    }

    _setProgress(test_count, test_total, action) {
        var progress = Math.round((test_count / test_total) * 1000) / 10;
    
        return '<div class="progress progress_sm"><div class="progress-bar bg-green" role="progressbar" data-transitiongoal="' + progress + '" style="width: ' + progress + '%;" aria-valuenow="' + progress + '"></div></div><small>' + progress + '% - ' + action + '</small>';
    }

    _setStatus(status) {
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

    _setResult(results) {
        if (results.length > 0) {
            var content = 'Problems found: <br /><ul>';
    
            for (i = 0; i < results.length; ++i) {
                content += '<li>' + results[i] + '</li>'
            }
    
            content += '</ul>';
        }
    
        return content;
    }

    _addRow(tableRef, rowData, total_tests) {
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
        progressCell.innerHTML = this._setProgress(0, total_tests, 'waiting ...');
        statusCell.innerHTML = this._setStatus('waiting');
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

    fillTable(resizeSteps, enableFinish) {
        this.database_rows = [];
        this.integrity_tests = [];
    
        var tableRef = document.getElementById('table_integrity');
        var rowCount = tableRef.rows.length;
        for (var x = rowCount - 1; x > 0; x--) {
            tableRef.deleteRow(x);
        }
    
        httpRequest({
            request: 'table_data'
        }, '/databases/communicate', (request) => {
            var tableRef = document.getElementById('table_integrity').getElementsByTagName('tbody')[0];
    
            this.integrity_tests = request.integrity_tests;
            var total_tests = this.integrity_tests.length;
    
            for (var i = 0; i < request.databases.length; ++i) {
                this.database_rows.push(this._addRow(tableRef, request.databases[i], total_tests));
            }
    
            resizeSteps();
    
            for (var j = 0; j < this.database_rows.length; ++j) {
                for (var i = 0; i < this.integrity_tests.length; ++i) {
                    httpRequest({
                            request: 'perform_test',
                            id: this.database_rows[j].id,
                            model: this.integrity_tests[i]
                        }, '/databases/communicate',
                        ((rowIndex, testIndex) => {
                            return (request) => {
                                var row = this.database_rows[rowIndex]
                                row.test_count += 1;
                                row.progressCell.innerHTML = this._setProgress(row.test_count, row.test_total, 'Table ' + this.integrity_tests[testIndex] + ' check ' + request.result);
    
                                if (request.result == 'fail') {
                                    row.results.push(request.info);
                                    row.resultCell.innerHTML = this._setResult(row.results);
    
                                    row.status = 'fail';
                                    row.statusCell.innerHTML = this._setStatus(row.status);
    
                                    resizeSteps();
                                }
    
                                if (row.test_count == row.test_total) {
                                    if (row.status != 'fail') {
                                        row.status = 'succeed';
                                        row.statusCell.innerHTML = this._setStatus(row.status);
                                        enableFinish();
                                    }
    
                                    row.progressCell.innerHTML = this._setProgress(row.test_count, row.test_total, 'Check completed');
                                } else {
                                    if (row.status != 'fail') {
                                        if (row.status != 'checking') {
                                            row.statusCell.innerHTML = this._setStatus('checking');
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
}
