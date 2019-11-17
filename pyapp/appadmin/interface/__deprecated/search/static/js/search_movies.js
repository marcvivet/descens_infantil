class PageSearchMoviesGallery extends PageMoviesGallery {
    constructor(page, var_name) {
        super(page, var_name);

        this.div_search = document.createElement("div");
        this.div_search.classList.add('form-group');

        var innerHtml = '';
        innerHtml += '<div class="input-group">\n';
        innerHtml += '  <input type="text" class="form-control" id="search_movie_title">\n';
        innerHtml += '  <span class="input-group-btn">\n';
        innerHtml += '      <button type="button" id="button_go" class="btn btn-primary" onclick="searchMovie();">Go!</button>\n';
        innerHtml += '  </span>\n';
        innerHtml += '</div>\n';

        this.div_search.innerHTML = innerHtml;
        this.div_x_content.insertBefore(this.div_search, this.div_x_content.firstChild);
    }

    searchMovie(title, callback = null) {
        var data = {
            movie_title: title,
        }

        this.performRequest('search_movie', data, '/search/communicate', callback);
    }
}

function searchMovie() {
    movie_title = document.getElementById('search_movie_title').value;
    current_page.searchMovie(movie_title)
}

var main_page = null;
var current_page = null;

function initPage() {
    main_page = new Page('Search Movies');
    current_page = new PageSearchMoviesGallery(main_page, 'current_page');

    main_page.addPageRow(current_page);
    var input = document.getElementById("search_movie_title");

    input.addEventListener("keyup", function(event) {
    // Cancel the default action, if needed
        event.preventDefault();
        // Number 13 is the "Enter" key on the keyboard
        if (event.keyCode === 13) {
            // Trigger the button element with a click
            document.getElementById("button_go").click();
        }
    });
}