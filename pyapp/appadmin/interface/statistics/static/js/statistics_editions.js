Page.httpRequest({
    action: "get_locale",
}, '/statistics/communicate', (response) => {
    let locale = response.message;

    Page.httpRequest({
        action: "get_number_of_participants_per_edition",
    }, '/statistics/communicate', (response) => {
        console.log(response);

        var ctx = document.getElementById("number_of_participants");

        var lineChart = new Chart(ctx, {
            type: 'line',
            options: {
                legend: {
                    hide: true,
                    display: false,
                    labels: {
                        fontColor: 'rgb(255, 99, 132)'
                    }
                },
                scales: {
                    yAxes: [{
                        scaleLabel: {
                            display: true,
                            labelString: locale.number_participants
                        },
                        ticks: {
                            beginAtZero: true
                        }
                    }],
                    xAxes: [{
                        scaleLabel: {
                            display: true,
                            labelString: locale.year
                        }
                    }]
                }
            },
            data: {
                labels: response.message.years,
                datasets: [{
                    backgroundColor: "rgba(38, 185, 154, 0.31)",
                    borderColor: "rgba(38, 185, 154, 0.7)",
                    pointBorderColor: "rgba(38, 185, 154, 0.7)",
                    pointBackgroundColor: "rgba(38, 185, 154, 0.7)",
                    pointHoverBackgroundColor: "#fff",
                    pointHoverBorderColor: "rgba(220,220,220,1)",
                    pointBorderWidth: 1,
                    data: response.message.participants
                }]
            },
        });
    });

    Page.httpRequest({
        action: "get_number_of_clubs_per_edition",
    }, '/statistics/communicate', (response) => {
        console.log(response);

        var ctx = document.getElementById("number_of_clubs");

        var lineChart = new Chart(ctx, {
            type: 'line',
            options: {
                legend: {
                    hide: true,
                    display: false,
                    labels: {
                        fontColor: 'rgb(255, 99, 132)'
                    }
                },
                scales: {
                    yAxes: [{
                        scaleLabel: {
                            display: true,
                            labelString: locale.number_clubs
                        },
                        ticks: {
                            beginAtZero: true
                        }
                    }],
                    xAxes: [{
                        scaleLabel: {
                            display: true,
                            labelString: locale.year
                        }
                    }]
                }
            },
            data: {
                labels: response.message.years,
                datasets: [{
                    backgroundColor: "rgba(38, 185, 154, 0.31)",
                    borderColor: "rgba(38, 185, 154, 0.7)",
                    pointBorderColor: "rgba(38, 185, 154, 0.7)",
                    pointBackgroundColor: "rgba(38, 185, 154, 0.7)",
                    pointHoverBackgroundColor: "#fff",
                    pointHoverBorderColor: "rgba(220,220,220,1)",
                    pointBorderWidth: 1,
                    data: response.message.clubs
                }]
            },
        });
    });
});