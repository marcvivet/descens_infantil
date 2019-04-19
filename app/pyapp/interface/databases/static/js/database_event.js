$(document).ready(function(){
    //connect to the socket server.
    var socket = io.connect('http://' + document.domain + ':' + location.port + '/test');
    var lines_received = [];

    //receive details from server
    socket.on('scraping_output', function(msg) {
        data = JSON.parse(msg);

        console.log("Received: " + data.output);

        lines_received.push(data.output);

        if (lines_received.length >= 5){
            lines_received.shift()
        }  

        $('#log').html(lines_received.join('<br>'));
    });

});