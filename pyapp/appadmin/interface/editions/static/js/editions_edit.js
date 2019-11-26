function setupPage(locale, isEdit) {
    $('#year').datepicker({
        minViewMode: 2,
        changeYear: true,
        format: 'yyyy',
        defaultDate: '2020-01-01'
    });

    if (!isEdit) {
        Page.httpRequest({
            action: "get_next_edition",
        }, '/editions/communicate', (response) => {
            $('#edition').val(response.message);
        });

        Page.httpRequest({
            action: "get_next_year",
        }, '/editions/communicate', (response) => {
            $('#year').val(response.message);
        });
    }

    Page.httpRequest({
        action: "get_organizers",
    }, '/editions/communicate', (response) => {
        var substringMatcher = function (strs) {
            return function findMatches(q, cb) {
                var matches, substringRegex;
    
                // an array that will be populated with substring matches
                matches = [];
    
                // regex used to determine if a string contains the substring `q`
                substrRegex = new RegExp(q, 'i');
    
                // iterate through the pool of strings and for any string that
                // contains the substring `q`, add it to the `matches` array
                $.each(strs, function (i, str) {
                    if (substrRegex.test(str)) {
                        matches.push(str);
                    }
                });
    
                cb(matches);
            };
        };

        $("#chief_of_course_div .form-control").typeahead({
            hint: true,
            highlight: true,
            minLength: 1
        }, {
            name: 'organizers',
            source: substringMatcher(response.message)
        });

        $("#start_referee_div .form-control").typeahead({
            hint: true,
            highlight: true,
            minLength: 1
        }, {
            name: 'organizers',
            source: substringMatcher(response.message)
        });

        $("#finish_referee_div .form-control").typeahead({
            hint: true,
            highlight: true,
            minLength: 1
        }, {
            name: 'organizers',
            source: substringMatcher(response.message)
        });

        $("#send").on('click', () => {
            Page.setLoading(true);
        });
    });
}