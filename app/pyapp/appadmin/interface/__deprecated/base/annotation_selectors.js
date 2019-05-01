var categories = [];
var user_count = [];
var total_count = [];
var difference_count = [];
var imagesPerPage = 50;

function drawPie(id_canvas, data_values, data_labels, title) {
    var ctx = document.getElementById(id_canvas).getContext('2d');
    var chart = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: data_labels,
            datasets: [{
                label: 'Number of Bboxes: ',
                data: data_values,
                backgroundColor: chroma.scale(['#26b99ae0','#3498dbe0']).mode('lch').colors(data_values.length)
            }]
        },
        options: {
            title:{
                display: true,
                text: title
            },
            legend: {
                display: false
            },
            tooltips: {
                enabled: true,
                callbacks: {
                    afterLabel: function(tooltipItem, data) {
                            var sum = data.datasets[0].data.reduce((sum, dat) => {
                            return sum + dat
                        }, 0);
                        var percent = data.datasets[tooltipItem.datasetIndex].data[tooltipItem.index] / sum * 100;
                        percent = percent.toFixed(2); // make a nice string
                        return 'Percentage: ' + percent + '%';
                    }
                }
            }
        }
    });
}

function drawMultiHorizontalBar(id_canvas, dataset_values, data_labels, title, on_click) {
    var ctx = document.getElementById(id_canvas).getContext('2d');
    var chart = new Chart(ctx, {
        type: 'horizontalBar',
        data: {
            labels: data_labels,
            datasets: dataset_values
        },
        options: {
            maintainAspectRatio: false,
            title:{
                display: true,
                text: title
            },
            scales:{
                xAxes: [{
                    stacked: true
                }],
                yAxes: [{
                    stacked: true
                }]
            },
            legend: {
                display: true
            },
            tooltips: {
                enabled: true,
                callbacks: {
                    afterLabel: function(tooltipItem, data) {
                            var sum = data.datasets.reduce((sum, dataset) => {
                                return sum + dataset.data[tooltipItem.index]
                            }, 0);
                        var percent = data.datasets[tooltipItem.datasetIndex].data[tooltipItem.index] / sum * 100;
                        percent = percent.toFixed(2); // make a nice string
                        return 'Percentage: ' + percent + '%';
                    }
                }
            },
            onClick: on_click
        }
    });
}

function fillBetweenTwoDates( date1, date2, value1, value2, data_labels, data_values ) {
    var diff_days = date2.diff(date1, 'days');
    data_labels.push(date1);
    data_values.push(value1);

    for ( var i = diff_days - 1; i > 0; --i ) {
        data_labels.push(date2.clone().subtract(i, 'days'));
        data_values.push(0);
    }

    data_labels.push(date2);
    data_values.push(value2);
}

function drawTimeSeries(id_canvas, data_labels_in, data_values_in) {
    var data_labels = [];
    var data_values = [];  

    var min_days = 30;

    var now_moment = moment();
    now_moment.set({hour:0,minute:0,second:0,millisecond:0});

    if (data_labels_in.length == 0) {
        for ( var i = min_days; i >= 0; --i ) {
            data_labels.push(now_moment.subtract(i, 'days').toDate());
            data_values.push(0);
        }        
    } else {
        var aux_data_labels = [];
        var aux_data_values = [];

        aux_data_labels.push(data_labels_in[0]);
        aux_data_values.push(data_values_in[0]);
        
        for ( var i = 0; i < data_labels_in.length - 1; ++i ) {
            var re_aux_data_labels = [];
            var re_aux_data_values = [];

            fillBetweenTwoDates( 
                data_labels_in[i], data_labels_in[i + 1], 
                data_values_in[i], data_values_in[i + 1], 
                re_aux_data_labels, re_aux_data_values );

            for ( j = 1; j < re_aux_data_labels.length; ++j ) {
                aux_data_labels.push(re_aux_data_labels[j]);
                aux_data_values.push(re_aux_data_values[j]);
            }
        }

        if (!aux_data_labels[aux_data_labels.length - 1].isSame(now_moment)) {
            var re_aux_data_labels = [];
            var re_aux_data_values = [];

            fillBetweenTwoDates( 
                aux_data_labels[aux_data_labels.length - 1], 
                now_moment, aux_data_values[aux_data_labels.length - 1], 0, 
                re_aux_data_labels, re_aux_data_values );

            for ( var j = 1; j < re_aux_data_labels.length; ++j ) {
                aux_data_labels.push(re_aux_data_labels[j]);
                aux_data_values.push(re_aux_data_values[j]);
            }
        }
 
        if (aux_data_labels.length < min_days) {
            for ( var i = min_days; i >= aux_data_labels.length; --i ) {
                data_labels.push(now_moment.clone().subtract(i, 'days').toDate());
                data_values.push(0);
            }            
        } 

        for ( var i = 0; i < aux_data_labels.length; ++i ) {
            data_labels.push(aux_data_labels[i].toDate());
            data_values.push(aux_data_values[i]);
        }
    }


    const ctx = document.getElementById(id_canvas).getContext('2d');  
    
    const data = {
        // Labels should be Date objects
        labels: data_labels,
        datasets: [{
            fill: false,
            label: 'Annotations',
            data: data_values,
            borderColor: '#26b99a',
            backgroundColor: '#26b99a',
            lineTension: 0,
        }]
    }
    const options = {
        type: 'line',
        data: data,
        options: {
            maintainAspectRatio: false,
            title:{
                display: true,
                text: 'Annotations per day'
            },
            fill: true,
            responsive: true,
            tooltips: {
                enabled: true,
                callbacks: {
                    title: function(tooltipItem, data) {
                        var res = tooltipItem[0].xLabel.toString().split(" 00:00:00");
                        return res[0]; 
                    }, 
                },
            },
            legend: {
                display: false
            },
            scales: {
                xAxes: [{
                    distribution: 'linear',
                    time: {
                        unit: 'day'
                    },
                    ticks: {
                        autoSkip:true,
                        maxTicksLimit:10,
                        source: 'auto',
                        stepSize: 1,
                        min: 0,
                    },
                    type: 'time',
                    display: true,
                    scaleLabel: {
                        display: true,
                        labelString: "Date",
                    }
                }],
                yAxes: [{
                    ticks: {
                        beginAtZero: true,
                    },
                    display: true,
                    scaleLabel: {
                        display: true,
                        labelString: "# of annotations",
                    }
                }]
            }
        }
    }
    const chart = new Chart(ctx, options);
}

function chartCategoriesOnClick(c, chart_data) {
    if (!chart_data[0]) return;

    var selected_index = 0;
    var category = this.data.labels[chart_data[selected_index]._index];

    var element = document.getElementById('cat_select');
    element.value = category;

    populateSelectPages('sel_page', category);
}   

function populateSelect(id, values, category) {
    var select = document.getElementById(id);

    for(index in values) {
        var option = document.createElement("option");
        option.text = values[index];
        select.add(option);
    }

    if (category != 'Not Set') {
        select.value = category;
    }

    updatePages(id, 'sel_page');
}

function goButtonCorrector(id) {
    var select = document.getElementById(id);
    var category = select.options[select.selectedIndex].text;

    window.location.href = encodeURI('/annotations/gallery?type=correct&category=' + category);
}

function goButtonRevise(id) {
    var select = document.getElementById(id);
    var category = select.options[select.selectedIndex].text;

    var sel_page = document.getElementById('sel_page');
    var page = sel_page.options[sel_page.selectedIndex].text;
    var max_pages = sel_page.options[sel_page.options.length - 1].text;

    window.location.href = encodeURI('/annotations/gallery?type=revise&category=' + category + '&page=' + page + '&max_pages=' + max_pages);
}

function adjustGraphicHeight(id, categories) {
    var numCat = categories.length;
    var div = document.getElementById(id);
    div.style.minHeight = (numCat * 20) + 'px';
}

function updatePages(id, id_pages) {
    var select = document.getElementById(id);
    if ( select ) {
        try {
            var category = select.options[select.selectedIndex].text;
            populateSelectPages(id_pages, category);
        } catch(err) {
            select.selectedIndex = 0;
        }
    }
}

function populateSelectPages(id, category) {
    var select = document.getElementById(id);

    if ( select ) {
        select.innerHTML = '';
        var idx = categories.indexOf(category);
        var currCounts = user_count[idx];
        var numPages = Math.floor((currCounts + imagesPerPage - 1) / imagesPerPage);

        for(i = 0; i < numPages; ++i) {
            var option = document.createElement("option");
            option.text = i + 1;
            select.add(option);
        }
    }
}