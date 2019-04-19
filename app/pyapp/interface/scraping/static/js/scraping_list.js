class PageScrapedMoviesGallery extends PageMoviesGallery {
    constructor(page, var_name) {
        super(page, var_name);
        this.select_year = null;

        this.div_year = document.createElement("div");
        this.div_year.classList.add('form-group');

        this.year_label = document.createElement("label");
        this.year_label.classList.add('control-label');
        this.year_label.classList.add('col-md-9');
        this.year_label.classList.add('col-sm-9');
        this.year_label.classList.add('col-xs-12');
        this.year_label.style.textAlign = "right";
        this.year_label.innerHTML = "Show only movies from:";

        this.div_select = document.createElement("div");
        this.div_select.classList.add('control-label');
        this.div_select.classList.add('col-md-3');
        this.div_select.classList.add('col-sm-3');
        this.div_select.classList.add('col-xs-12');

        this.year_select = document.createElement("select");
        this.year_select.classList.add('form-control');
        this.year_select.onchange = () => this.onYearSelected();

        var option = document.createElement("option");
        option.text = 'All';
        this.year_select.add(option); 

        this.div_select.appendChild(this.year_select);
        this.div_year.appendChild(this.year_label);
        this.div_year.appendChild(this.div_select);

        this.div_x_content.insertBefore(this.div_year, this.div_x_content.firstChild);
    
        this.getYears();
        this.loadScrapedMovies();
    }

    onYearSelected() {
        if (this.year_select.selectedIndex == 0) {
            this.select_year = null;
        } else {
            this.select_year = parseInt(this.year_select.options[this.year_select.selectedIndex].text);
        }
        this.offset = 0;
        this.loadScrapedMovies();
    }

    getYears() {
        var data = {
            request: 'get_years'
        }

        this.loading = false;
        httpRequest(
            data, '/scraping/communicate', 
            (request) => { 
                if (request.length > 0) {
                    for (var i = 0; i < request.length; i++) {
                        var option = document.createElement("option");
                        option.text = request[i];
                        this.year_select.add(option); 
                    }
                } else {
                    this.div_year.innerHTML = '<p>No scraped movies to show.</p>';
                }
            }, 
            (status, message) => { // Error
                if (status == 0 ) {
                    return;
                }
    
                if (status == 408) { // Timeout
                    Page.showError('Timeout reached, it was not possible retrieve the years. :(');
                } else { // Other error
                    Page.showError('An error has been produced when trying to retrieve the years, with status: ' + status + ' and message: ' + message);
                }
            }, false);
    }

    deleteMovie(id) {
        var data = {
            request: 'delete_movie',
            id: id
        }

        var close_button = document.getElementById('close_' + id);
        close_button.onclick = "";

        this.loading = false;
        httpRequest(
            data, '/scraping/communicate', 
            (request) => { 
                var indx = this.images_ids.indexOf(id);
                this.images_ids.splice(indx, 1);

                var image = document.getElementById('gallery_' + id);
                image.classList.add('disappear');

                setTimeout(() => {
                    this.div_gallery.removeChild(image);
                }, 300);
            }, 
            (status, message) => { // Error
                if (status == 0 ) {
                    return;
                }
    
                if (status == 408) { // Timeout
                    Page.showError('Timeout reached, it was not possible to delete the movie. :(');
                } else { // Other error
                    Page.showError('An error has been produced when trying to delete the movie, with status: ' + status + ' and message: ' + message);
                }
            }, false);
    }


    createMovieBlock(image, data) {
        var htmlResponse = super.createMovieBlock(image, data)

        for (var i = 0; i < data.threads.length; i++) {
            var class_name = 'class="thread_new"';
            if (data.threads[i].visited) {
                class_name = 'class="thread_visited"';
            }
            htmlResponse.splice(10 + i, 0, '<li><a ' + class_name + ' href="open_link?movie_id=' + image.id + '&thread_id=' + data.threads[i].id + '&link=' + encodeURIComponent(data.threads[i].link) + '"><b>' + data.threads[i].format_name + '</b> - ' + data.threads[i].publish_date + '</a></li>');
        }

        htmlResponse.splice(7, 0, '    <div class="close"><a id="close_' + image.id + '" class="fa fa-times-circle" onclick="' + this.var_name + '.deleteMovie(\'' + image.id + '\');"></a></div>');

        return htmlResponse;
    }

    imageLoaded(image, data, divImage) {
        super.imageLoaded(image, data, divImage);
        if (data.visited) {
            divImage.classList.add('movie_visited');
        }
    }

    loadScrapedMovies(clear_page = true, callback = null) {
        var data = {
            select_year: this.select_year
        }

        this.performRequest('get_threads', data, '/scraping/communicate', clear_page, callback);
    }

    loadMoreMovies() {
        this.offset = this.images_ids.length;
        this.loadScrapedMovies(false);
    }
}

var main_page = null;
var page_row_gallery = null;

function initPage() {
    main_page = new Page('Show Scraped Movies');
    current_page = new PageScrapedMoviesGallery(main_page, 'current_page');

    main_page.addPageRow(current_page);
}