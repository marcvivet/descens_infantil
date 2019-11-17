class PageMoviesGallery extends PageRow {
    constructor(page, var_name) {
        super(null);

        this.var_name = var_name;
        this.offset = 0;
        this.limit = 50;
        this.page = 1;
        this.loaded = 0;
        this.to_load = 0;

        this.plus_button = true;
        this.main_page = page;

        this.div_gallery = document.createElement("div");
        this.div_gallery.classList.add('row-gallery');

        this.div_x_content.appendChild(this.div_gallery);

        this.images_ids = [];
        this.callback = null;
    }

    set loading(value) {
        if (this._loading != value) {
            var loading_rect = document.getElementById('load_more_plus');

            if (value) {
                if (loading_rect) {
                    loading_rect.classList.toggle("image_loading_more");
                    document.getElementById('loading_rect').classList.toggle("load_more_no_pointer");
                } else {
                    this.main_page.loading = true;
                }

                this._loading = true;
            } else {
                var loading_rect = document.getElementById('load_more_plus');

                if (loading_rect) {
                    loading_rect.classList.remove("image_loading_more");
                    document.getElementById('loading_rect').classList.remove("load_more_no_pointer");
                } 

                this.main_page.loading = false;
                this._loading = false;
            }
        }
    }

    get loading() {
        return this._loading;
    }

    deleteImage(image_id) {
        var id = 'gallery_' + image_id;
        var index = this.images_ids.indexOf(image_id);

        var new_ids = [];
        for (var i = 0; i < this.images_ids.length; ++i) {
            if (this.images_ids[i] != image_id) {
                new_ids.push(this.images_ids[i]);
            }
        }

        this.div_gallery.removeChild(document.getElementById(id));
        this.images_ids = new_ids;

        if (this.images_ids.length <= index) {
            return null;
        } else {
            return this.images_ids[index];
        }
    }

    performRequest(request, data, service_url, clear_page = True, callback = null) {
        this.loading = true;
        this.callback = callback;

        if (clear_page) {
            this.emptyPage();
        }

        data['request'] = request
        data['offset'] = this.offset;
        data['limit'] = this.limit;
        data['page'] = this.page;

        httpRequest(
            data, service_url, 
            (request) => { 
                this.loaded = 0;
                this.to_load = request.length;

                if ( request.length == 0 ) {
                    var loading_rect = document.getElementById('loading_rect');
                    if (loading_rect) {
                        this.div_gallery.removeChild(loading_rect);
                    }
                    this.loading = false;

                    if (this.images_ids.length == 0) {
                        this.emptyPage();
                    }

                    if (this.callback) {
                        this.callback();
                    }
                } else {
                    for( var i = 0; i < request.length; ++i) {
                        var poster = null;
                        if (request[i].poster_path) {
                            poster = 'https://image.tmdb.org/t/p/w185' + request[i].poster_path;
                        } else {
                            poster = '/static/images/none.jpg';
                        }

                        this.loadImage(request[i], poster);
                    }
                }
            }, 
            (status, message) => { // Error
                this.loading = false;
    
                if (status == 0 ) {
                    return;
                }
    
                if (status == 408) { // Timeout
                    Page.showError('Timeout reached, it was not possible to load the movies. :(');
                } else { // Other error
                    Page.showError('An error has been produced when trying to load more movies, with status: ' + status + ' and message: ' + message);
                }
            });
    }

    createStarRating(data_rating) {
        var valueFloat = parseFloat(data_rating) / 2.0;
        var valueInt = parseInt(valueFloat);
        var result = '';

        for (var i = 0; i < valueInt; ++i) {
            result += '<span class="fa fa-star"></span>';
        }

        valueFloat -= parseFloat(valueInt);

        if (valueFloat >= 0.5) {
            result += '<span class="fa fa-star-half-o"></span>';
            valueInt++;
        }

        for (var i = 0; i < 5 - valueInt; ++i) {
            result += '<span class="fa fa-star-o"></span>';
        }   

        return result;
    }

    createMovieBlock(image, data) {
        var htmlResponse = [
        /*  1 */    '  <div class="image_canvas" id="canvas_' + image.id + '">',
        /*  2 */    '    <svg class="image_svg_canvas" id="svg_' + image.id + '" viewBox="0 0 ' + image.width + ' ' + image.height + '" >',
        /*  3 */    '      <image onmousedown="onImageMouseDown(' + image.id + ');"',
        /*  4 */    '        href="' + image.src + '" width="100%" height="100%" x="0" y="0" preserveAspectRatio="xMidYMid slice"/>',
        /*  5 */    '      <rect class="image_svg_image_rect" fill="none"',
        /*  6 */    '        x="0" y="0" width="' + image.width + '" height="' + image.height + '"/>',
        /*  7 */    '    </svg>',
        /*  8 */    '    <div class="col-gallery-info-data image_svg_canvas">',
        /*  9 */    '        <h2>' + data.title + '</h2>',
        /* 10 */    '        <ul>',
        /* 11 */    '          <li><b>Vote Average:</b> ' + data.vote_average + '</li>',
        /* 12 */    '          <li><b>Release Date:</b> ' + data.release_date + '</li>',
        /* 13 */    '          <li><b>Overview:</b> ' + data.overview + '</li>',
        /* 14 */    '        </ul>',
        /* 15 */    '      </div>',
        /* 16 */    '    <div class="id-ribbon">' + this.createStarRating(data.vote_average) + '</div>',
        /* 17 */    '  </div>',
        /* 18 */    //'</div>'
        ];

            // fa-times-circle
        return htmlResponse;
    }

    loadMoreMovies() {
        throw new Error('Cannot call abstract method');
    }

    loadImage(data, poster) {
        var image = new Image();
               
        var div_image = document.createElement('div');
        div_image.classList.add('col-gallery-info');
        div_image.id = 'gallery_' + data.id;

        this.div_gallery.appendChild(div_image);

        image.id = data.id;
        image.src = poster;
        image.onload = ((imageParam, dataParam, divImageParam) => {
            return () => { this.imageLoaded(imageParam, dataParam, divImageParam); };
        })(image, data, div_image);      
    }

    imageLoaded(image, data, divImage) {
        var loading_rect = document.getElementById('loading_rect');
        if (loading_rect) {
            this.div_gallery.removeChild(loading_rect);
        }
       
        divImage.innerHTML += this.createMovieBlock(image, data).join('\n');

        this.images_ids.push(image.id);
    
        this.loaded += 1;
        
        if (this.loaded == this.to_load){
            this.loading = false;
    
            if (this.loaded == this.limit) {
                var htmlResponse = '';
                htmlResponse += '<div class="col-gallery-info" id="loading_rect">\n';
                htmlResponse += '  <div class="image_canvas">\n';
                htmlResponse += '    <svg class="image_svg_canvas">\n';
                htmlResponse += '      <rect class="image_svg_image_rect "/>\n';
                htmlResponse += '    </svg>\n';
                htmlResponse += '  </div>\n';
                htmlResponse += '  <div class="load_more" onclick="' + this.var_name + '.loadMoreMovies();">\n';
                htmlResponse += '    <i class="image_load_more fa fa-plus" id="load_more_plus"> </i>\n';
                htmlResponse += '  </div>\n';
                htmlResponse += '</div>\n';
    
                this.div_gallery.innerHTML += htmlResponse;
            }

            if (this.callback) {
                this.callback();
            }
        } else {
            if (loading_rect) {
                this.div_gallery.appendChild(loading_rect);
            }
        }
    }

    getNextImage(image_id) {
        if ( image_id == null ) {
            if (this.images_ids.length == 0) {
                return null;
            }

            return this.images_ids[0];
        }

        var indx = this.images_ids.indexOf(image_id);
        if ((indx + 1) < this.images_ids.length) {
            return this.images_ids[indx + 1];
        } 

        return null;
    }

    getPrevImage(image_id) {
        var indx = this.images_ids.indexOf(image_id);
        if ((indx - 1) >= 0) {
            return this.images_ids[indx - 1];
        } 

        return null;
    }

    emptyPage() {
        this.div_gallery.innerHTML = "<div class='x_content'></div>"
    }
}

class PageModalAnnotationDetails extends PageModal {
    constructor(page, var_name, style = 0) {
        super('details', 'Annotation details');

        this.main_page = page;
        this.var_name = var_name;

        this.loaded = 0;
        this.to_load = 0;
        this.image_id = 0;
        this.main_image_loaded = false;

        this.style = style;

        this.users = null;
        this.main_image = null;

        this.candidate_selected = [];
        this.candidate_url = [];
        this.candidate_info = [];

        this.div_review_main = document.createElement("div");
        this.div_review_main.classList.add('review-main');

        this.div_col_gallery_info = document.createElement("div");
        this.div_col_gallery_info.classList.add('col-gallery-info');

        this.div_review_separator = document.createElement("div");
        this.div_review_separator.classList.add('review-separator');

        this.div_review_selected = document.createElement("div");
        this.div_review_selected.classList.add('review-selected' + this.style);
        this.div_review_selected.id = 'review_selected';

        this.div_review_main.appendChild(this.div_col_gallery_info);
        this.div_review_main.appendChild(this.div_review_separator);
        this.div_review_main.appendChild(this.div_review_selected);

        this.div_candidates = document.createElement("div");
        this.div_modal_body.appendChild(this.div_review_main);
        this.div_modal_body.appendChild(this.div_candidates);

        this.div_review_selected.style.width = (window.innerWidth - 500) + 'px';

        ((element) => {
            if (this.style == 1) {
                function scrollHorizontally(e) {
                    e = window.event || e;
                    var delta = Math.max(-1, Math.min(1, (e.wheelDelta || -e.detail)));
                    element.scrollLeft -= (delta*40); // Multiplied by 40
                    e.preventDefault();
                }
                if (element.addEventListener) {
                    // IE9, Chrome, Safari, Opera
                    element.addEventListener("mousewheel", scrollHorizontally, false);
                    // Firefox
                    element.addEventListener("DOMMouseScroll", scrollHorizontally, false);
                } else {
                    // IE 6/7/8
                    element.attachEvent("onmousewheel", scrollHorizontally);
                }
            }

            window.onresize = function(event) {
                var dimensions = {
                    height: (event.srcElement || event.currentTarget).innerHeight,
                    width: (event.srcElement || event.currentTarget).innerWidth
                };

                element.style.width = (dimensions.width - 500) + 'px';
            };
        })(this.div_review_selected);

        this.addToolBoxButton('fa-angle-double-left', () => 
        { 
            var new_image_idx = this.var_name.getPrevImage(this.image_id);

            if (!new_image_idx) {
                Page.showInfo('You have reached the first image.');
            } else {
                this.showAnnotationsForImage(new_image_idx);
            }
        })
        this.addToolBoxButton('fa-angle-double-right', () => 
        { 
            var new_image_idx = this.var_name.getNextImage(this.image_id);

            if (!new_image_idx) {
                //Page.showInfo('You have reached the last image, more will be loaded. Please wait.');
                var_name.loadMoreMovies(() => {
                    var new_image_idx = this.var_name.getNextImage(this.image_id);

                    if (!new_image_idx) {
                        //Page.showInfo('You have reached the last image.');
                        this.hide();
                    } else {
                        this.showAnnotationsForImage(new_image_idx);
                    }
                });
                //this.hide();
            } else {
                this.showAnnotationsForImage(new_image_idx);
            }
        })
    }

    showAnnotationsForImage(image_id) {
        this.main_page.loading = true;
        //this.hide();
        this.image_id = image_id;
        this.div_candidates.innerHTML = '';
        this.div_review_selected.innerHTML = '';
        this.candidate_info = [];
        this.title = '<button type="button" class="btn btn-success" onclick="page_modal.requestUpdateData();">Update Data Base</button>&emsp;Annotation details for image ' + image_id;

        httpRequest(
            {
                request: 'get_annotations_by_image_id',
                image_id: image_id
            }, '/exact_match/communicate', 
            (request) => { 
                this.loaded = 0;
                this.to_load = request.candidates.length;
                this.main_image_loaded = false;
                

                this.users = request.users;
                this.loadMainImage(request.url);
                
                for( var i = 0; i < request.candidates.length; ++i) {
                    this.candidate_info.push(
                        {
                            id: i,
                            selected: false,
                            url: request.candidates[i].url,
                            width: null,
                            height: null,
                            users: [false, false]
                        }
                    );
                    this.loadCandidateImage(i, request.candidates[i]);
                }
            }, 
            (status, message) => { // Error
                this.main_page.loading = false;
    
                if (status == 0 ) {
                    return;
                }
    
                if (status == 408) { // Timeout
                    Page.showError('Timeout reached, it was not possible to retrieve the annotation for the image ' + this.image_id);
                } else { // Other error
                    Page.showError('An error has been produced when trying to load the annotations for the image ' + this.image_id + ' , with status: ' + status + ' and message: ' + message);
                }
            });
    }

    loadMainImage(url) {
        var image = new Image();
                
        image.id = "_main_image";
        image.src = url;
        image.onload = ((imageParam) => {
            return () => { this.mainImageLoaded(imageParam); };
        })(image);
    }

    loadCandidateImage(id, candidate) {
        var image = new Image();
                
        image.id = id;
        image.src = candidate.url;
        image.onload = ((imageParam, candidateParam) => {
            return () => { this.candidateImageLoaded(imageParam, candidateParam); };
        })(image, candidate);
    }

    requestUpdateData() {
        this.main_page.loading = true;
        var urls = [];
        for ( var i = 0; i < this.candidate_info.length; ++i ) {
            if (this.candidate_info[i].selected) {
                urls.push(this.candidate_info[i].url);
            }
        }

        httpRequest(
            {
                request: 'update_annotations',
                users: this.users,
                urls: urls,
            }, '/exact_match/communicate', 
            (request) => { 
                var new_image_idx = this.var_name.deleteImage(this.image_id);

                if (!new_image_idx) {
                    Page.showInfo('You have reached the last image, more will be loaded. Please wait.');
                    var_name.loadMoreMovies(() => {
                        var new_image_idx = this.var_name.getNextImage(null);
                        if (!new_image_idx) {
                            Page.showInfo('You have reached the last image.');
                            this.hide();
                            this.main_page.loading = false;
                        } else {
                            this.showAnnotationsForImage(new_image_idx);
                        }
                    });
                    //this.hide();
                } else {
                    this.showAnnotationsForImage(new_image_idx);
                }
            }, 
            (status, message) => { // Error
                this.main_page.loading = false;
    
                if (status == 0 ) {
                    return;
                }
    
                if (status == 408) { // Timeout
                    Page.showError('Timeout reached, it was not possible to update these annotations.');
                } else { // Other error
                    Page.showError('An error has been produced when trying to update the annotations, with status: ' + status + ' and message: ' + message);
                }
            });
    }

    mainImageLoaded(image) {
        var htmlResponse = '';

        htmlResponse += '    <div class="image_canvas">\n';
        htmlResponse += '      <svg class="image_svg_canvas_main" id="svg_' + image.id + '" viewBox="0 0 ' + image.width + ' ' + image.height + '" >\n';
        htmlResponse += '        <image href="' + image.src + '" width="100%" height="100%" x="0" y="0" preserveAspectRatio="xMidYMid slice"/>\n';
        htmlResponse += '        <rect\n';
        htmlResponse += '          class="image_svg_image_rect"\n'; 
        htmlResponse += '          fill="none" \n';
        htmlResponse += '          x="0" y="0" width="' + image.width + '" height="' + image.height + '"/>\n';
        htmlResponse += '      </svg>\n';
        
    
        htmlResponse += '      <div class="col-gallery-info-data image_user_main">\n';
        for (var i = 0; i < this.users.length; ++i ) {
            
            htmlResponse += '        <h2>User ' + (i + 1) + '&emsp;<i class="fa fa-user user-' + (i + 1) + '"></i></h2>\n';
            htmlResponse += '        <ul>\n';
            htmlResponse += '          <li><b>User Id:</b> ' + this.users[i].user_id + '</li>\n';
            htmlResponse += '          <li><b>Job Id:</b> ' + this.users[i].job_id + '</li>\n';
            htmlResponse += '          <li><b>Image Id:</b> ' + this.users[i].image_id + '</li>\n';
            htmlResponse += '          <li><b>Annotation Id:</b> ' + this.users[i].annotation_id + '</li>\n';
            htmlResponse += '          <li><b>Created At:</b> ' + this.users[i].created_at + '</li>\n';
            htmlResponse += '          <li><b>Score:</b> ' + this.users[i].score + '</li>\n';
            htmlResponse += '          <li><b>Status:</b> ' + this.users[i].status + '</li>\n';
            htmlResponse += '        </ul>\n';
            
        }
        htmlResponse += '      </div>\n';

        /*
        htmlResponse += '<div class="col-gallery-no-effects">\n';
        
        htmlResponse += '  <div class="image_user_buttons">\n';
        htmlResponse += '    <button type="button" class="btn btn-primary user-1-color" onclick="page_modal.requestUpdateData();">Update User 1</button>\n';
        htmlResponse += '    <button type="button" class="btn btn-danger user-2-color" onclick="page_modal.updateData(1);">Update User 2</button>\n';
        htmlResponse += '    <button type="button" class="btn btn-success" onclick="page_modal.requestUpdateData();">Update Data Base</button>\n';
        htmlResponse += '  </div>\n';
        htmlResponse += '</div>\n';
        */
        this.div_col_gallery_info.innerHTML = htmlResponse;
        this.main_image_loaded = true;

        if (this.loaded == this.to_load && this.main_image_loaded){
            this.show();
            this.main_page.loading = false;
            this.updateSelection();
        }
    }

    updateSelection() {
        /*
        for ( var i = 0; i < this.candidate_info.length; ++i ) {
            var element = document.getElementById('gallery_' + i);

            if (element) {
                element.classList.remove('image_selected');
                if (this.candidate_info[i].selected) {
                    element.classList.add('image_selected');
                }
            }
        }*/
    }

    onClick(image_id) {
        this.candidate_info[image_id].selected = !this.candidate_info[image_id].selected;
        
        if (!this.candidate_info[image_id].selected) {
            var canvas = document.getElementById('sel_canvas_' + image_id);
            canvas.style.width = '0px';

            var gallery = document.getElementById('sel_gallery_' + image_id);
            gallery.style.opacity = 0;
            gallery.style.margin = '0px';
            gallery.style.border = '0px';

            setTimeout(((paramId) => {
                return () => {
                    var gallery = document.getElementById('sel_gallery_' + image_id);
                    this.div_review_selected.removeChild(gallery);
                };
            })(image_id), 300);

            var gallery = document.getElementById('gallery_' + image_id);
            gallery.style.display = 'inline-block';

            setTimeout(((paramId) => {
                return () => {
                    var gallery = document.getElementById('gallery_' + image_id);
                    gallery.style.opacity = 1;
                    var canvas = document.getElementById('canvas_' + image_id);
                    canvas.style.width = '250px';
                };
            })(image_id), 30);
        } else {
            var canvas = document.getElementById('canvas_' + image_id);
            canvas.style.width = '0px';

            var gallery = document.getElementById('gallery_' + image_id);
            gallery.style.opacity = 0;

            setTimeout(((paramId) => {
                return () => {
                    var gallery = document.getElementById('gallery_' + image_id);
                    gallery.style.display = "none";
                    //this.div_candidates.removeChild(gallery);
                };
            })(image_id), 300); 

            var saveHtml = this.div_review_selected.innerHTML;
            var newCandiate = this.createCandidate(image_id);

            this.div_review_selected.innerHTML = newCandiate + saveHtml;

            var canvas = document.getElementById('sel_canvas_' + image_id);
            canvas.style.width = '0px';

            var gallery = document.getElementById('sel_gallery_' + image_id);
            gallery.style.opacity = 0;
            gallery.style.margin = '0px';
            gallery.style.border = '0px';

            setTimeout(((paramId, style) => {
                return () => {
                    var canvas = document.getElementById('sel_canvas_' + image_id);
                    canvas.style.width = 'var(--size_style_' + style + ')';

                    var gallery = document.getElementById('sel_gallery_' + image_id);
                    gallery.style.opacity = 1;
                    gallery.style.margin = '5px';
                    gallery.style.border = '1px solid #ddd';
                };
            })(image_id, this.style), 20); 
        }

        this.updateSelection();
    }

    createCandidate(image_id) {
        var htmlResponse = '';
        htmlResponse += '<div class="col-gallery" id="sel_gallery_' + image_id + '" onclick="page_modal.onClick(' + image_id + ');">\n';
        htmlResponse += '  <div class="image_svg_canvas_sel' + this.style + '" id="sel_canvas_' + image_id +'">\n';
        htmlResponse += '    <svg class="image_svg_canvas_candidates_sel' + this.style + '" id="sel_svg_' + image_id + '" viewBox="0 0 ' + this.candidate_info[image_id].width + ' ' + this.candidate_info[image_id].height + '" >\n';
        htmlResponse += '      <image href="' + this.candidate_info[image_id].url + '" width="100%" height="100%" x="0" y="0" preserveAspectRatio="xMidYMid slice" />\n';
        htmlResponse += '      <rect \n';
        htmlResponse += '        class="image_svg_image_rect"\n'; 
        htmlResponse += '        fill="none" \n';
        htmlResponse += '        x="0" y="0" width="' + this.candidate_info[image_id].width + '" height="' + this.candidate_info[image_id].height + '"/>\n';
        htmlResponse += '    </svg>\n';

        htmlResponse += '    <div class="fa mark-selected">\n';
        for (var i = 0; i < this.candidate_info[image_id].users.length; ++i) {
            if (this.candidate_info[image_id].users[i]) {
                htmlResponse += '    <i class="fa fa-user user-' + (i + 1) + '"> </i>\n';
            }
        }
        htmlResponse += '    </div>\n';

        htmlResponse += '  </div>\n';
        htmlResponse += '</div>\n';

        return htmlResponse;
    }

    candidateImageLoaded(image, candidate) {
        var selected = false
        for (var i = 0; i < candidate.similar_for.length; ++i) {
            selected = true;
        }

        var htmlResponse = '';
        
        if (selected) {
            htmlResponse += '<div class="col-gallery" style="opacity: 0; display: none;" id="gallery_' + image.id + '" onclick="page_modal.onClick(' + image.id + ');">\n';
            htmlResponse += '  <div class="image_svg_canvas" id="canvas_' + image.id +'" style="width: 0px;">\n';
        } else {
            htmlResponse += '<div class="col-gallery" id="gallery_' + image.id + '" onclick="page_modal.onClick(' + image.id + ');">\n';
            htmlResponse += '  <div class="image_svg_canvas" id="canvas_' + image.id +'">\n';
        }
        htmlResponse += '    <svg class="image_svg_canvas_candidates" id="svg_' + image.id + '" viewBox="0 0 ' + image.width + ' ' + image.height + '" >\n';
        htmlResponse += '      <image href="' + image.src + '" width="100%" height="100%" x="0" y="0" preserveAspectRatio="xMidYMid slice" />\n';
        htmlResponse += '      <rect \n';
        htmlResponse += '        class="image_svg_image_rect"\n'; 
        htmlResponse += '        fill="none" \n';
        htmlResponse += '        x="0" y="0" width="' + image.width + '" height="' + image.height + '"/>\n';
        htmlResponse += '    </svg>\n';

        htmlResponse += '    <div class="fa mark-selected">\n';
        for (var i = 0; i < candidate.similar_for.length; ++i) {
            htmlResponse += '    <i class="fa fa-user user-' + (candidate.similar_for[i] + 1) + '"> </i>\n';
            this.candidate_info[image.id].selected = true;
            this.candidate_info[image.id].users[candidate.similar_for[i]] = true;
        }
        htmlResponse += '    </div>\n';

        htmlResponse += '  </div>\n';
        htmlResponse += '</div>\n';
    
        this.div_candidates.innerHTML += htmlResponse;

        this.candidate_info[image.id].width = image.width;
        this.candidate_info[image.id].height = image.height;


        if ( this.candidate_info[image.id].selected ) {
            this.div_review_selected.innerHTML += this.createCandidate(image.id);
        }

        this.loaded += 1;
        
        if (this.loaded == this.to_load && this.main_image_loaded){
            this.show();
            this.main_page.loading = false;
            this.updateSelection();
        }
    }
}
