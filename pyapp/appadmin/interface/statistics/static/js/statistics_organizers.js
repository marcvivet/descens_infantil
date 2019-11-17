Page.httpRequest({
    action: "get_locale",
}, '/statistics/communicate', (response) => {
    let locale = response.message;

    Page.httpRequest({
        action: "get_times_as_chief_of_course",
    }, '/statistics/communicate', (response) => {

        var ctx = document.getElementById("times_as_chief_of_course");

        var pieChart = new Chart(ctx, {
            type: 'pie',
            options: {
                responsive: true
            },
            data: {
                labels: response.message.organizer,
                datasets: [{
                    backgroundColor: response.message.colors,
                    data: response.message.count
                }]
            },
        });
    });

    Page.httpRequest({
        action: "get_times_as_start_referee",
    }, '/statistics/communicate', (response) => {

        var ctx = document.getElementById("times_as_start_referee");

        var pieChart = new Chart(ctx, {
            type: 'pie',
            options: {
                responsive: true
            },
            data: {
                labels: response.message.organizer,
                datasets: [{
                    backgroundColor: response.message.colors,
                    data: response.message.count
                }]
            },
        });
    });

    Page.httpRequest({
        action: "get_times_as_finish_referee",
    }, '/statistics/communicate', (response) => {

        var ctx = document.getElementById("times_as_finish_referee");

        var pieChart = new Chart(ctx, {
            type: 'pie',
            options: {
                responsive: true
            },
            data: {
                labels: response.message.organizer,
                datasets: [{
                    backgroundColor: response.message.colors,
                    data: response.message.count
                }]
            },
        });
    });

});