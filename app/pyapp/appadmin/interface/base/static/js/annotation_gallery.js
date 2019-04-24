var gallery_info = {};
var bbox_stroke = 1.5;
var bbox_corners_width = 5;
var bbox_stroke_dasharray = 5;
var default_category = '';
var current_gallery_size = 350;

var gallery_active_item = 0;
var gallery_ids = [];

window.addEventListener('mouseup', function(e) {
    for (var key in gallery_info){
        gallery_info[key]['state_info']['selected'] = false;
    }   
}, false);

function addGalleryElement(id, category_proposals, category_proposals_ids, bbox_proposals, bbox_proposals_ids, selected_category, selected_bbox) {
    var state_info = {};
    var category_info = {};
    var svg_info = {};
    var bbox_info = {};
    var current_info = {};

    state_info['type'] = 'move';
    state_info['selected'] = false;
    state_info['last_x'] = -1;
    state_info['last_y'] = -1;
    state_info['zoom'] = 1.0;
    state_info['zoom_x'] = 0;
    state_info['zoom_y'] = 0;
    state_info['deleted'] = false;
    state_info['id'] = gallery_ids.length;
    gallery_ids.push(id);

    category_info['proposals'] = category_proposals;
    category_info['selected'] = selected_category;
    category_info['default'] = selected_category;
    category_info['category'] = category_info['proposals'][category_info['selected']];
    category_info['proposals_ids'] = category_proposals_ids;

    var svg = document.getElementById('svg' + id);
    var svg_bbox = svg.getBBox();
    var svg_rect = svg.getBoundingClientRect();

    // SVG id
    svg_info['id'] = 'svg' + id;

    // Position of the SVG ViewBox in image coordinates
    svg_info['view_box_x'] = Number(svg_bbox.x);
    svg_info['view_box_y'] = Number(svg_bbox.y);

    // Size of the SVG ViewBox in image coordinates
    svg_info['view_box_width'] = Number(svg_bbox.width);
    svg_info['view_box_height'] = Number(svg_bbox.height);

    // Image size
    svg_info['width'] = Number(svg_bbox.width);
    svg_info['height'] = Number(svg_bbox.height);

    // Image container size (the DIV size)
    svg_info['rect_width'] = Number(svg_rect.width);
    svg_info['rect_height'] = Number(svg_rect.height);

    // Factor to draw the lines with the same width
    svg_info['factor'] = Math.max(svg_info['width'], svg_info['height']) / Math.max(svg_info['rect_width'], svg_info['rect_height']);

    bbox_info['palette'] = chroma.scale(['green', 'gold', 'blue']).mode('lch').colors(bbox_proposals.length);
    bbox_info['proposals'] = bbox_proposals;
    bbox_info['clusters'] = [];
    bbox_info['clusters_palette'] = [];
    bbox_info['selected'] = selected_bbox;
    bbox_info['default'] = selected_bbox;
    bbox_info['interact_id'] = 'bbox' + id;
    bbox_info['proposals_ids'] = bbox_proposals_ids;

    bbox_info['bbox'] = bbox_proposals[selected_bbox].slice();

    var check = document.getElementById('bbox_check_' + id + '_' + selected_bbox);
    if(check){
        check.checked = true;
    } 

    current_info['svg_info'] = svg_info;
    current_info['bbox_info'] = bbox_info;
    current_info['state_info'] = state_info;
    current_info['category_info'] = category_info;

    gallery_info[id] = current_info;

    createProposals(id);
    initializeBboxControl(id);
    setCategoryByIndex(id, category_info['default']);
}

function updateFactor(id, size) {
    gallery_info[id]['svg_info']['rect_width'] = size;
    gallery_info[id]['svg_info']['rect_height'] = size;

    var new_width = gallery_info[id]['svg_info']['view_box_width'];
    var new_height = gallery_info[id]['svg_info']['view_box_height'];

    var canvas_width = gallery_info[id]['svg_info']['rect_width'];
    var canvas_height = gallery_info[id]['svg_info']['rect_height'];

    var new_factor = Math.max(new_width, new_height) / Math.max(canvas_width, canvas_height);

    gallery_info[id]['svg_info']['factor'] = new_factor;

    updateInteractBbox(id);
}

function initSelection() {
    document.onkeydown = onKeyPress;
    container = document.getElementById('gallery' + gallery_ids[gallery_active_item]);
    container.classList.toggle('container_selected');
}

function initializeBboxControl(id) {
    var svg = document.getElementById('svg' + id);

    var factor = gallery_info[id]['svg_info']['factor'];
    var bbox = gallery_info[id]['bbox_info']['bbox'];
    
    var xmlns = "http://www.w3.org/2000/svg";

    edit_bbox = document.createElementNS(xmlns, 'rect');
    edit_bbox.setAttributeNS(null, "id", 'bbox' + id);
    edit_bbox.setAttributeNS(null, "x", bbox[0]);
    edit_bbox.setAttributeNS(null, "y", bbox[1]);
    edit_bbox.setAttributeNS(null, "width", bbox[2]);
    edit_bbox.setAttributeNS(null, "height", bbox[3]);
    edit_bbox.setAttributeNS(null, "class", 'image_svg_bbox');
    edit_bbox.setAttributeNS(null, "style", "stroke-width: " + bbox_stroke * factor + ";" );
    edit_bbox.setAttributeNS(null, "onmousedown", 'onMouseDown(evt, "' + id + '", "move");');
    edit_bbox.setAttributeNS(null, "onwheel", 'onMouseWheel(evt, "' + id + '");');
    edit_bbox.setAttributeNS(null, "onmousemove", 'onMouseMove(evt, "' + id + '");');

    svg.appendChild(edit_bbox);

    createEditControls(id);
}

function createProposals(id) {
    for ( index in gallery_info[id]['bbox_info']['proposals']) {
        addProposal(id, index);
    }
}

function updateProposals(id) {
    var factor = gallery_info[id]['svg_info']['factor'];
    for ( index in gallery_info[id]['bbox_info']['proposals']) {
        var color = gallery_info[id]['bbox_info']['palette'][index];
        var proposal_bbox = document.getElementById('bbox_proposal_' + id + '_' + index);
        proposal_bbox.setAttributeNS(null, "style", "stroke-width: " + bbox_stroke * factor + "; stroke: " + color + "; stroke-dasharray: " + bbox_stroke_dasharray * factor + " " + bbox_stroke_dasharray * factor * 0.5 +";");
    }

    for ( index in gallery_info[id]['bbox_info']['clusters']) {
        var color = gallery_info[id]['bbox_info']['clusters_palette'][index];
        var proposal_bbox = document.getElementById('bbox_cluster_' + id + '_' + index);
        proposal_bbox.setAttributeNS(null, "style", "stroke-width: " + bbox_stroke * factor + "; stroke: " + color + "; stroke-dasharray: " + bbox_stroke_dasharray * factor + " " + bbox_stroke_dasharray * factor * 0.5 +";");
    }
}

function deleteClusters(id) {
    if ( id == null ) return;

    var num_clusters = gallery_info[id]['bbox_info']['clusters'].length;
    var svg = document.getElementById('svg' + id);
    for ( var i = 0; i < num_clusters; ++i ) {
        rect_id = 'bbox_cluster_' + id + '_' + i;
        rect = document.getElementById(rect_id);
        svg.removeChild(rect);
    }

    gallery_info[id]['bbox_info']['clusters'] = [];
    gallery_info[id]['bbox_info']['clusters_palette'] = [];
}

function addProposal(id, index, cluster=null, color=null) {
    var svg = document.getElementById('svg' + id);

    var factor = gallery_info[id]['svg_info']['factor'];

    var bbox;
    var color;
    var rect_id;
    if (index == -1) {
        bbox = cluster;
        color = color;

        index = gallery_info[id]['bbox_info']['clusters_palette'].indexOf(color);

        if (index < 0) {
            gallery_info[id]['bbox_info']['clusters'].push(bbox);
            gallery_info[id]['bbox_info']['clusters_palette'].push(color);
            index = gallery_info[id]['bbox_info']['clusters'].length - 1;
            rect_id = 'bbox_cluster_' + id + '_' + index;
        } else {
            return 'bbox_cluster_' + id + '_' + index;
        }
    } else {
        bbox = gallery_info[id]['bbox_info']['proposals'][index];
        color = gallery_info[id]['bbox_info']['palette'][index];
        rect_id = 'bbox_proposal_' + id + '_' + index;
    }
    
    var xmlns = "http://www.w3.org/2000/svg";

    proposal_bbox = document.createElementNS(xmlns, 'rect');
    proposal_bbox.setAttributeNS(null, "id", rect_id);
    proposal_bbox.setAttributeNS(null, "x", bbox[0]);
    proposal_bbox.setAttributeNS(null, "y", bbox[1]);
    proposal_bbox.setAttributeNS(null, "width", bbox[2]);
    proposal_bbox.setAttributeNS(null, "height", bbox[3]);
    proposal_bbox.setAttributeNS(null, "class", 'image_svg_bbox_proposal');
    proposal_bbox.setAttributeNS(null, "style", "stroke-width: " + bbox_stroke * factor + "; stroke: " + color + "; stroke-dasharray: " + bbox_stroke_dasharray * factor + " " + bbox_stroke_dasharray * factor * 0.5 +";");

    svg.appendChild(proposal_bbox);

    return rect_id;
}

function setCategory(id, category) {
    var idx = gallery_info[id]['category_info']['proposals'].indexOf(category);

    if ( idx >= 0) {
        var check = document.getElementById('cat_check_' + id + '_' + idx);
        check.checked = true;
    } else {
        var check_sel = document.getElementById('cat_check_' + id + '_category_sel');
        check_sel.checked = true;

        var sel = document.getElementById('cat_select_' + id);
        sel.value = category;
    }

    gallery_info[id]['category_info']['category'] = category;
}

function setCategoryByIndex(id, index) {
    if ( index >= 0 ) {
        var check = document.getElementById('cat_check_' + id + '_' + index);
        check.checked = true;
        gallery_info[id]['category_info']['category'] = gallery_info[id]['category_info']['proposals'][index]
    } else {
        var check = document.getElementById('cat_check_' + id + '_category_sel');
        check.checked = true;

        var sel = document.getElementById('cat_select_' + id);
        var category = sel.value;
        gallery_info[id]['category_info']['category'] = category;
    }

    gallery_info[id]['category_info']['selected'] = index;   
}

function updateSelectedCategory(id) {
    var index = gallery_info[id]['category_info']['selected'];
    var max_index = gallery_info[id]['category_info']['proposals'].length - 1;

    if ( index < 0 ) {
        index = max_index;
    } 

    if ( index > max_index ) {
        index = 0;
    }

    setCategoryByIndex(id, index);
}

function updateSelectedBbox(id) {
    var index = gallery_info[id]['bbox_info']['selected'];
    var max_index = gallery_info[id]['bbox_info']['proposals'].length - 1;

    if ( index < 0 ) {
        index = max_index;
    } 

    if ( index > max_index ) {
        index = 0;
    }

    setBboxByIndex(id, index);
}

function setBboxByIndex(id, index) {
    if ( index < 0 ) {
        setBboxCheckCustom(id);
        return;
    }

    var check = document.getElementById('bbox_check_' + id + '_' + index);
    if(check){
        check.checked = true;
    } 

    gallery_info[id]['bbox_info']['selected'] = index;
    var bbox = gallery_info[id]['bbox_info']['proposals'][index];
    setBbox(id, bbox)
}

function setBbox(id, bbox) {
    gallery_info[id]['bbox_info']['bbox'] = bbox.slice();
    updateInteractBbox(id);
}

function setBboxCustom(id, bbox) {
    gallery_info[id]['bbox_info']['bbox'] = bbox.slice();
    updateInteractBbox(id);
    setBboxCheckCustom(id);
}

function setBboxCheckCustom(id) {
    var check = document.getElementById('bbox_check_' + id + '_custom');
    if(check){
        check.checked = true;
    } 

    gallery_info[id]['bbox_info']['selected'] = -1;
}

function createEditControl(id, type, x, y, width) {
    var xmlns = "http://www.w3.org/2000/svg";

    corner = document.createElementNS(xmlns, 'rect');
    corner.setAttributeNS(null, "id", id + type);
    corner.setAttributeNS(null, "x", x - (width / 2));
    corner.setAttributeNS(null, "y", y - (width / 2));
    corner.setAttributeNS(null, "width", width);
    corner.setAttributeNS(null, "height", width);
    corner.setAttributeNS(null, "class", 'image_svg_edit_' + type);
    corner.setAttributeNS(null, "onmousedown", 'onMouseDown(evt, "' + id + '", "' + type + '");');
    corner.setAttributeNS(null, "onwheel", 'onMouseWheel(evt, "' + id + '");');

    return corner;
}

function createEditControls(id) {
    
    var svg = document.getElementById('svg' + id);

    var factor = gallery_info[id]['svg_info']['factor'];
    var bbox = gallery_info[id]['bbox_info']['bbox'];

    var width = factor * bbox_corners_width;

    svg.appendChild(createEditControl(id, 'top_left', bbox[0], bbox[1], width));
    svg.appendChild(createEditControl(id, 'bottom_left', bbox[0], bbox[1] + bbox[3], width));
    svg.appendChild(createEditControl(id, 'top_right', bbox[0] + bbox[2], bbox[1], width));
    svg.appendChild(createEditControl(id, 'bottom_right', bbox[0] + bbox[2], bbox[1] + bbox[3], width));
}

function updateEditControls(id) {
    document.getElementById(id + 'top_left').remove();
    document.getElementById(id + 'bottom_left').remove();
    document.getElementById(id + 'top_right').remove();
    document.getElementById(id + 'bottom_right').remove();

    createEditControls(id);
}

function printObject(o) {
    var out = '';
    for (var p in o) {
        console.log(p + ': ' + o[p]);
    }
}

function updateInteractBbox(id) {
    var box = document.getElementById(gallery_info[id]['bbox_info']['interact_id']);
    
    box.setAttribute("x", gallery_info[id]['bbox_info']['bbox'][0] + "px");
    box.setAttribute("y", gallery_info[id]['bbox_info']['bbox'][1] + "px");
    box.setAttribute("width", gallery_info[id]['bbox_info']['bbox'][2] + "px");
    box.setAttribute("height", gallery_info[id]['bbox_info']['bbox'][3] + "px");

    var factor = gallery_info[id]['svg_info']['factor'];
    box.setAttribute("style", "stroke-width: " + bbox_stroke * factor + ";" );

    updateEditControls(id);
}

function correctBbox(id) {
    bbox = gallery_info[id]['bbox_info']['bbox'];

    width = gallery_info[id]['svg_info']['width']
    height = gallery_info[id]['svg_info']['height']

    if (bbox[2] < 10) {
        bbox[2] = 10;
    }

    if (bbox[3] < 10) {
        bbox[3] = 10;
    }

    if (bbox[2] > width) {
        bbox[2] = width;
    }

    if (bbox[3] > height) {
        bbox[3] = height;
    }

    if ( bbox[0] < 0 ) {
        bbox[0] = 0;
    }

    if ( bbox[1] < 0) {
        bbox[1] = 0;
    }

    if ((bbox[0] + bbox[2]) > width ) {
        bbox[0] = width - bbox[2];
    }

    if ((bbox[1] + bbox[3]) > height ) {
        bbox[1] = height - bbox[3];
    }

    gallery_info[id]['bbox_info']['bbox'] = bbox;
}

function onMouseMove(event, id) {
    var e = event || window.event;
    if ( id in gallery_info) {
        var x = Math.round(e.clientX);
        var y = Math.round(e.clientY);

        var offset_x = x - gallery_info[id]['state_info']['last_x'];
        var offset_y = y - gallery_info[id]['state_info']['last_y'];

        gallery_info[id]['state_info']['last_x'] = x;
        gallery_info[id]['state_info']['last_y'] = y;

        type = gallery_info[id]['state_info']['type'];

        var inc_x = Math.round(offset_x * gallery_info[id]['svg_info']['factor']);
        var inc_y = Math.round(offset_y * gallery_info[id]['svg_info']['factor']);
        
        if (gallery_info[id]['state_info']['selected']) {
            if ( type == 'move' ) {
                gallery_info[id]['bbox_info']['bbox'][0] += inc_x;
                gallery_info[id]['bbox_info']['bbox'][1] += inc_y;
            }

            if ( type == 'top_left') {
                gallery_info[id]['bbox_info']['bbox'][0] += inc_x;
                gallery_info[id]['bbox_info']['bbox'][1] += inc_y;
                gallery_info[id]['bbox_info']['bbox'][2] -= inc_x;
                gallery_info[id]['bbox_info']['bbox'][3] -= inc_y;
            }

            if ( type == 'bottom_left') {
                gallery_info[id]['bbox_info']['bbox'][0] += inc_x;
                gallery_info[id]['bbox_info']['bbox'][2] -= inc_x;
                gallery_info[id]['bbox_info']['bbox'][3] += inc_y;
            }

            if ( type == 'top_right') {
                gallery_info[id]['bbox_info']['bbox'][1] += inc_y;
                gallery_info[id]['bbox_info']['bbox'][2] += inc_x;
                gallery_info[id]['bbox_info']['bbox'][3] -= inc_y;
            }

            if ( type == 'bottom_right') {
                gallery_info[id]['bbox_info']['bbox'][2] += inc_x;
                gallery_info[id]['bbox_info']['bbox'][3] += inc_y;
            }

            if ( type == 'canvas' ) {
                moveViewBox(id, inc_x, inc_y);    
            } else {
                setBboxCheckCustom(id);
                correctBbox(id);
                updateInteractBbox(id);
            }
        }
    }

    e.preventDefault();
    return false;
}

function onMouseDown(event, id, type) {
    var e = event || window.event;
    if ( id in gallery_info) {
        if (!gallery_info[id]['state_info']['selected']) {
            setFocus(id);

            var x = Math.round(e.clientX);
            var y = Math.round(e.clientY);

            gallery_info[id]['state_info']['last_x'] = x;
            gallery_info[id]['state_info']['last_y'] = y;
            gallery_info[id]['state_info']['type'] = type;
            gallery_info[id]['state_info']['selected'] = true;
        }
    }

    e.preventDefault();
    return false;
}

function updateViewBox(id) {
    var width = gallery_info[id]['svg_info']['width'];
    var height = gallery_info[id]['svg_info']['height'];

    var vb_x = gallery_info[id]['svg_info']['view_box_x'];
    var vb_y = gallery_info[id]['svg_info']['view_box_y'];
    var vb_width = gallery_info[id]['svg_info']['view_box_width'];
    var vb_height = gallery_info[id]['svg_info']['view_box_height'];

    if (vb_x < 0) {
        vb_x = 0;
    }

    if (vb_y < 0) {
        vb_y = 0;
    }

    if ( vb_x + vb_width > width) {
        vb_x = width - vb_width;
    }

    if ( vb_y + vb_height > height) {
        vb_y = height - vb_height;
    }

    var svg = document.getElementById('svg' + id);
    svg.setAttribute("viewBox", vb_x + " " + vb_y + " " + vb_width  + " " + vb_height);

    gallery_info[id]['svg_info']['view_box_x'] = vb_x;
    gallery_info[id]['svg_info']['view_box_y'] = vb_y;
    gallery_info[id]['svg_info']['view_box_width'] = vb_width;
    gallery_info[id]['svg_info']['view_box_height'] = vb_height;

    updateProposals(id);
}

function moveViewBox(id, inc_x, inc_y) {
    gallery_info[id]['svg_info']['view_box_x'] -= inc_x;
    gallery_info[id]['svg_info']['view_box_y'] -= inc_y;

    updateViewBox(id);
}

function performZoom(id) {
    var zoom = gallery_info[id]['state_info']['zoom'];
    var factor = gallery_info[id]['svg_info']['factor'];

    var width = gallery_info[id]['svg_info']['width'];
    var height = gallery_info[id]['svg_info']['height'];

    var canvas_width = gallery_info[id]['svg_info']['rect_width'];
    var canvas_height = gallery_info[id]['svg_info']['rect_height'];
    
    var vb_x = gallery_info[id]['svg_info']['view_box_x'];
    var vb_y = gallery_info[id]['svg_info']['view_box_y'];

    var vb_width = gallery_info[id]['svg_info']['view_box_width'];
    var vb_height = gallery_info[id]['svg_info']['view_box_height'];

    var zoom_x = gallery_info[id]['state_info']['zoom_x'];
    var zoom_y = gallery_info[id]['state_info']['zoom_y'];

    var center_x = (zoom_x * factor);
    var center_y = (zoom_y * factor);

    var new_width = width / zoom;
    var new_height = height / zoom;
    
    var new_factor = Math.max(new_width, new_height) / Math.max(canvas_width, canvas_height);

    var prop_x = (center_x - vb_x) / vb_width;
    var prop_y = (center_y - vb_y) / vb_height;
    
    var new_x = center_x - new_width * prop_x;
    var new_y = center_y - new_height * prop_y;

    gallery_info[id]['svg_info']['view_box_x'] = new_x;
    gallery_info[id]['svg_info']['view_box_y'] = new_y;
    gallery_info[id]['svg_info']['view_box_width'] = new_width;
    gallery_info[id]['svg_info']['view_box_height'] = new_height;

    gallery_info[id]['svg_info']['factor'] = new_factor;

    updateInteractBbox(id);
    updateViewBox(id);
}

function onMouseWheel(event, id, type) {
    var e = event || window.event;

    if ( id in gallery_info) {
        var factor = 1.2;

        var delta = e.wheelDelta;
        if (!delta) {
            // Firefox
            delta = -e.deltaY;
        }

        if(delta > 0) {
            gallery_info[id]['state_info']['zoom'] *= 1.2;
        } else {
            gallery_info[id]['state_info']['zoom'] /= 1.2;
        }

        if (gallery_info[id]['state_info']['zoom'] < 1 ) {
            gallery_info[id]['state_info']['zoom'] = 1;
        }

        if (gallery_info[id]['state_info']['zoom'] > 30 ) {
            gallery_info[id]['state_info']['zoom'] = 30;
        }

        var image_rect = document.getElementById(id);
        var dim = image_rect.getBoundingClientRect();

        var center_x = (e.clientX - dim.left);
        var center_y = (e.clientY - dim.top);

        gallery_info[id]['state_info']['zoom_x'] = center_x;
        gallery_info[id]['state_info']['zoom_y'] = center_y;

        performZoom(id);
    }

    e.preventDefault();
    return false;
}

function zoomToggle(id, forceIn = false, forceOut = false) {
    var width = gallery_info[id]['svg_info']['width'];
    var height = gallery_info[id]['svg_info']['height'];
        
    if ( (gallery_info[id]['state_info']['zoom'] != 1 && !forceIn) || forceOut) {
        var new_factor =  Math.max(width, height) / Math.max(gallery_info[id]['svg_info']['rect_width'], gallery_info[id]['svg_info']['rect_height']);

        gallery_info[id]['state_info']['zoom'] = 1.0;

        gallery_info[id]['svg_info']['factor'] = new_factor;

        gallery_info[id]['svg_info']['view_box_x'] = 0;
        gallery_info[id]['svg_info']['view_box_y'] = 0;
        gallery_info[id]['svg_info']['view_box_width'] = width;
        gallery_info[id]['svg_info']['view_box_height'] = height;
    } else {
        var min_x = gallery_info[id]['bbox_info']['bbox'][0];
        var min_y = gallery_info[id]['bbox_info']['bbox'][1];
        var max_x = min_x + gallery_info[id]['bbox_info']['bbox'][2] - 1;
        var max_y = min_y + gallery_info[id]['bbox_info']['bbox'][3] - 1;
        
        for ( index in gallery_info[id]['bbox_info']['proposals'] ) {
            var prop_act = gallery_info[id]['bbox_info']['proposals'][index];

            if ( prop_act[0] < min_x ) {
                min_x = prop_act[0];
            }

            if ( prop_act[1] < min_y ) {
                min_y = prop_act[1];
            }

            var x = prop_act[0] + prop_act[2] - 1;
            var y = prop_act[1] + prop_act[3] - 1;

            if ( x > max_x ) {
                max_x = x;
            }

            if ( y > max_y ) {
                max_y = y;
            }
        } 

        var new_width = max_x - min_x + 1;
        var new_height = max_y - min_y + 1;
        var zoom = Math.max(width, height) / Math.max(new_width, new_height);
        
        gallery_info[id]['state_info']['zoom'] = zoom;

        var canvas_width = gallery_info[id]['svg_info']['rect_width'];
        var canvas_height = gallery_info[id]['svg_info']['rect_height'];

        var new_factor = Math.max(new_width, new_height) / Math.max(canvas_width, canvas_height);

        gallery_info[id]['svg_info']['factor'] = new_factor;

        gallery_info[id]['svg_info']['view_box_x'] = min_x;
        gallery_info[id]['svg_info']['view_box_y'] = min_y;
        gallery_info[id]['svg_info']['view_box_width'] = new_width;
        gallery_info[id]['svg_info']['view_box_height'] = new_height;
    }

    updateInteractBbox(id);
    updateViewBox(id);
}

var zoomToggleKeepVar = true;

function zoomToggleAll() {
    for ( id in gallery_info) {
        zoomToggle(id, zoomToggleKeepVar, !zoomToggleKeepVar);
    }

    zoomToggleKeepVar = !zoomToggleKeepVar;
}

function markToDelete(id) {
    gallery_info[id]['state_info']['deleted'] = !gallery_info[id]['state_info']['deleted'];

    var disabled = gallery_info[id]['state_info']['deleted'];

    var ima_container = document.getElementById('main' + id);
    ima_container.classList.toggle('container_remove');

    var button_names = ['undo', 'details', 'zoom'];
    for (var idx in button_names) {
        var button = document.getElementById(button_names[idx] + id);
        button.classList.toggle('container_remove');
        button.disabled = disabled;
    }

    var radio_names = ['cat_check_', 'bbox_check_'];
    for (var idx in radio_names) {
        var radios = document.getElementsByName( radio_names[idx] + id );
        for( i = 0; i < radios.length; i++ ) {
            radios[i].disabled = disabled;
        }
    }

    var sel_cat = document.getElementById('cat_select_' + id);
    sel_cat.disabled = disabled;

    var del_button = document.getElementById('delete' + id); 
    if (disabled) {
        del_button.innerHTML = '<i class="fa fa-plus"> </i> Delete';
    } else {
        del_button.innerHTML = '<i class="fa fa-remove"> </i> Delete';
    }
}

function resetAnnotation(id) {
    setBboxByIndex(id, gallery_info[id]['bbox_info']['default']);
    setCategoryByIndex(id, gallery_info[id]['category_info']['default']);
}

function toggleProposals(id) {
    for ( index in gallery_info[id]['bbox_info']['proposals']) {
        var proposal_bbox = document.getElementById('bbox_proposal_' + id + '_' + index);
        proposal_bbox.classList.toggle('image_svg_bbox_proposal_show');
    }
}

function toggleProposalsAll () {
    for ( id in gallery_info) {
        toggleProposals(id);
    }
}

function updateAllFactors (size) {
    for ( id in gallery_info) {
        updateFactor(id, size);
    }
}

function setFocus(id) {
    var in_active = gallery_active_item;
    var id_in = gallery_ids[in_active];
    var container_in = document.getElementById('gallery' + id_in);

    if ( id_in != id ) {
        var container_out = document.getElementById('gallery' + id);

        container_in.classList.toggle('container_selected');
        container_out.classList.toggle('container_selected');

        gallery_active_item = gallery_info[id]['state_info']['id'];
    }
}

function onKeyPress(e) {
    e = e || window.event;

    if ((e.keyCode == '38') || (e.keyCode == '40') || (e.keyCode == '32') ||
        (e.keyCode == '37') || (e.keyCode == '39') || (e.keyCode == '46') ||
        (e.keyCode == '8')) {

        var in_active = gallery_active_item;
        var id_in = gallery_ids[in_active];
        var container_in = document.getElementById('gallery' + id_in);

        isShift = !!e.shiftKey;
        isCtrl = !!e.ctrlKey;

        var inc = 1;

        if (e.keyCode == '38') {
            // up arrow
            if ( isCtrl ) {
                var factor = gallery_info[id_in]['svg_info']['factor'];

                gallery_info[id_in]['bbox_info']['bbox'][1] -= factor * inc;
                correctBbox(id_in);
                updateInteractBbox(id_in);
            } else if ( isShift ) {
                var factor = gallery_info[id_in]['svg_info']['factor'];

                gallery_info[id_in]['bbox_info']['bbox'][1] -= factor * inc;
                //gallery_info[id]['bbox_info']['bbox'][1] += inc_y;
                gallery_info[id_in]['bbox_info']['bbox'][3] += factor * inc * 2;
                //gallery_info[id]['bbox_info']['bbox'][3] -= inc_y;
                correctBbox(id_in);
                updateInteractBbox(id_in);
            } else {
                gallery_info[id_in]['category_info']['selected'] += 1;
                updateSelectedCategory(id_in);
            }
        } else if (e.keyCode == '40') {
            // down arrow
            if ( isCtrl ) {
                var factor = gallery_info[id_in]['svg_info']['factor'];

                gallery_info[id_in]['bbox_info']['bbox'][1] += factor * inc;
                correctBbox(id_in);
                updateInteractBbox(id_in);
            } else if ( isShift ) {
                var factor = gallery_info[id_in]['svg_info']['factor'];

                gallery_info[id_in]['bbox_info']['bbox'][1] += factor * inc;
                //gallery_info[id]['bbox_info']['bbox'][1] += inc_y;
                gallery_info[id_in]['bbox_info']['bbox'][3] -= factor * inc * 2;
                //gallery_info[id]['bbox_info']['bbox'][3] -= inc_y;
                correctBbox(id_in);
                updateInteractBbox(id_in);
            } else {
                gallery_info[id_in]['bbox_info']['selected'] += 1;
                updateSelectedBbox(id_in);
            }
        } else if (e.keyCode == '37') {
            // left arrow
            if ( isCtrl ) {
                var factor = gallery_info[id_in]['svg_info']['factor'];

                gallery_info[id_in]['bbox_info']['bbox'][0] -= factor * inc;
                correctBbox(id_in);
                updateInteractBbox(id_in);
            } else if ( isShift ) {
                var factor = gallery_info[id_in]['svg_info']['factor'];

                gallery_info[id_in]['bbox_info']['bbox'][0] += factor * inc;
                gallery_info[id_in]['bbox_info']['bbox'][2] -= factor * inc * 2;
                correctBbox(id_in);
                updateInteractBbox(id_in);
            } else {
                gallery_active_item -= 1;
            }
        } else if (e.keyCode == '39') {
            // right arrow
            if ( isCtrl ) {
                var factor = gallery_info[id_in]['svg_info']['factor'];

                gallery_info[id_in]['bbox_info']['bbox'][0] += factor * inc;
                correctBbox(id_in);
                updateInteractBbox(id_in);
            } else if ( isShift ) {
                var factor = gallery_info[id_in]['svg_info']['factor'];

                gallery_info[id_in]['bbox_info']['bbox'][0] -= factor * inc;
                gallery_info[id_in]['bbox_info']['bbox'][2] += factor * inc * 2;
                correctBbox(id_in);
                updateInteractBbox(id_in);
            } else {
                gallery_active_item += 1;
            }
        } else if (e.keyCode == '32') {
            // space bar
            zoomToggle(id_in);
        } else if (e.keyCode == '46' || e.keyCode == '8') {
            // space bar
            markToDelete(id_in);
        }

        if ( gallery_active_item < 0 ) {
            gallery_active_item = 0;
        }

        if ( gallery_active_item >= gallery_ids.length) {
            gallery_active_item = gallery_ids.length - 1;
        }

        if ( in_active != gallery_active_item ) {
            var id_out = gallery_ids[gallery_active_item];
            var container_out = document.getElementById('gallery' + id_out);

            container_in.classList.toggle('container_selected');
            container_out.classList.toggle('container_selected');

            var doc = document.documentElement;
            var top = (window.pageYOffset || doc.scrollTop) - (doc.clientTop || 0);
            bbox = container_out.getBoundingClientRect();

            var scroll_to = doc.scrollTop + bbox.top - 10;
            if ( scroll_to < bbox.width ) {
                scroll_to = 0;
            }

            window.scrollTo(0, scroll_to);
        }

        e.preventDefault();
    }
}

function sendData(type){
    var xmlhttp;
    if (window.XMLHttpRequest) {
        // code for IE7+, Firefox, Chrome, Opera, Safari
        xmlhttp = new XMLHttpRequest();
    } else {
        // code for IE6, IE5
        xmlhttp = new ActiveXObject("Microsoft.XMLHTTP");
    }

    xmlhttp.timeout = 40000; // Set timeout to 40 seconds (40000 milliseconds)
    xmlhttp.ontimeout = function () { 
        new PNotify({
            title: 'Error!',
            text: 'Timeout reached ...',
            type: 'error',
            styling: 'bootstrap3'
          });
    }
    xmlhttp.onreadystatechange = function() {
        if (xmlhttp.readyState === 4 ) {
            if(xmlhttp.status === 200){
                try {
                    var response = JSON.parse(xmlhttp.responseText);
                    window.location=encodeURI(response['url']);
                } catch(err) {
                    new PNotify({
                        title: 'Error!',
                        text:  err.message,
                        type: 'error',
                        styling: 'bootstrap3'
                      });

                      console.log(xmlhttp.responseText);
                }
            }
            else if(xmlhttp.status === 400) {
                new PNotify({
                    title: 'Error!',
                    text: 'There was an error 400',
                    type: 'error',
                    styling: 'bootstrap3'
                  });
                console.log(xmlhttp.responseText)
            }
            else {
                var response = JSON.parse(xmlhttp.responseText);
                new PNotify({
                    title: 'Error!',
                    text: response['message'],
                    type: 'error',
                    styling: 'bootstrap3'
                  });
            }
        }
    }

    xmlhttp.open("POST", encodeURI(window.location.href));
    xmlhttp.setRequestHeader('Content-Type', 'application/json');
    xmlhttp.send(JSON.stringify(gallery_info));
}

function changeGallerySize(factor) {
    var all = document.getElementsByClassName('image_svg_canvas');
    current_gallery_size *= factor;
    if ( current_gallery_size < 350 ) {
        current_gallery_size = 350;
    }
    for (var i = 0; i < all.length; i++) {
        all[i].style.width = current_gallery_size + 'px';
        all[i].style.height = current_gallery_size + 'px';
    }

    updateAllFactors(current_gallery_size);
}


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

var current_modal_id = null;
var masonry_cluster = null;
var original_main_details = null;
var clusters = null;
var tool_boxes = {};

function showDetails(id) {
    $('.annotation_info').on('hidden.bs.modal', function (e) {
        closeShowDetails();
    })

    showLoading();
    httpRequest(
        {
            request: 'clusters',
            id: id
        }, '/annotations/communicate',
        function (request) {
            
            tool_boxes = {};

            var main_details = document.getElementById('annotation_detail_main');
            original_main_details = main_details.innerHTML;

            var imageSelected = document.getElementById('gallery' + id);
            var modalImage = document.getElementById('gallery_modal');

            current_modal_data = imageSelected.innerHTML;
            modalImage.innerHTML = current_modal_data;

            var image_canvas = modalImage.getElementsByClassName('image_svg_canvas');
            image_canvas[0].style.width = '600px';
            image_canvas[0].style.height = '600px';

            zoomToggle(id, false, true);
            updateFactor(id, 600);

            for ( i = 0; i < 4; ++i ) {
                var button = document.getElementById('button_1_' + id)

                button.classList.add('col-sm-4');
                button.classList.remove('col-sm-3');
            }

            var button_delete = document.getElementById('delete' + id)
            button_delete.classList.add('btn-sm');
            button_delete.classList.remove('btn-xs');

            var button_zoom = document.getElementById('zoom' + id)
            button_zoom.classList.add('btn-sm');
            button_zoom.classList.remove('btn-xs');

            var button_reset = document.getElementById('undo' + id)
            button_reset.classList.add('btn-sm');
            button_reset.classList.remove('btn-xs');

            var button_details = modalImage.querySelector('#details' + id);
            button_details.style.visibility = "hidden";

            current_modal_id = id;

            // Populate cluster information
            clusters = request['clusters'];
            color_counter = request['color_counter'];
            for (cluster_index = 0; cluster_index < clusters.length; ++cluster_index ) {
                var div = document.createElement('div');
                div.setAttribute('class', 'product_window');
                div.setAttribute('name', 'cluster');
                div.setAttribute('style', 'opacity: 0;');

                div.innerHTML = createClusterDiv(id, clusters[cluster_index], color_counter);

                main_details.appendChild(div);
            }
            setCategory(id, gallery_info[id]['category_info']['category']);
            setBboxByIndex(id, gallery_info[id]['bbox_info']['selected']);

            $('.product_window_image').css('width', '620px');

            var container = document.querySelector('#annotation_detail_main');
            masonry_cluster = new Masonry( container, {
                columnWidth: 10,
                itemSelector: '.product_window'
            });   

            updateToolBox();
            $('.annotation_info').modal('toggle');
            setTimeout(updateClustersWindow, 500);
            
            hideLoading();
        });

}

function updateClustersWindow() {
    updateToolBox();

    for ( i = 0; i < clusters.length; ++i ) {
        swapCollapse('cluster_' + clusters[i]['id']);
        
        if (i > 3 ) {
            swapCollapse('cluster_' + clusters[i]['id']);
        } 
    }

    var clusters_divs = document.getElementsByName('cluster');
    for ( i = 0; i < clusters_divs.length; ++i ) {
        clusters_divs[i].style.opacity = 1;
    }
}

function closeShowDetails() {
    if (current_modal_id == null) return;

    deleteClusters(current_modal_id);

    var imageSelected = document.getElementById('gallery' + current_modal_id);
    var modalImage = document.getElementById('gallery_modal');

    var image_canvas = modalImage.getElementsByClassName('image_svg_canvas');
    image_canvas[0].style.width = current_gallery_size + 'px';
    image_canvas[0].style.height = current_gallery_size + 'px';

    var button_bar = modalImage.getElementsByClassName('col-sm-4');

    for ( i = 0; i < 4; ++i ) {
        var button = document.getElementById('button_1_' + current_modal_id)

        button.classList.add('col-sm-3');
        button.classList.remove('col-sm-4');
    }

    var button_delete = document.getElementById('delete' + current_modal_id)
    button_delete.classList.add('btn-xs');
    button_delete.classList.remove('btn-sm');

    var button_zoom = document.getElementById('zoom' + current_modal_id)
    button_zoom.classList.add('btn-xs');
    button_zoom.classList.remove('btn-sm');

    var button_reset = document.getElementById('undo' + current_modal_id)
    button_reset.classList.add('btn-xs');
    button_reset.classList.remove('btn-sm');

    var button_details = modalImage.querySelector('#details' + current_modal_id);        
    button_details.style.visibility = "visible";

    imageSelected.innerHTML = modalImage.innerHTML;
    modalImage.innerHTML = '';

    var main_details = document.getElementById('annotation_detail_main');
    main_details.innerHTML = original_main_details;

    zoomToggle(current_modal_id, false, true);
    updateFactor(current_modal_id, current_gallery_size);
    setCategory(current_modal_id, gallery_info[current_modal_id]['category_info']['category']);
    setBboxByIndex(current_modal_id, gallery_info[current_modal_id]['bbox_info']['selected']);

    current_modal_id = null;
}

function createClusterDiv(id, cluster, color_counter) {
    if (cluster['is_max']) {
        product_tool_box_title_max = ' product_tool_box_title_max';
        product_tool_box_button_max = ' product_tool_box_button_max';
    } else {
        product_tool_box_title_max = '';
        product_tool_box_button_max = '';
    }

    product_tool_box_title_max
    var html_output = '';
    //html_output += '<div class="product_window" name="cluster" style="opacity: 0;">\n';
    html_output += '    <div class="product_tool_box_auto" id=\'cluster_' + cluster['id'] + '\'>\n';
    html_output += '        <div class="product_tool_box_title' + product_tool_box_title_max + '">Cluster ' + cluster['id'] + '\n';
    html_output += '            <button class="product_tool_box_button' + product_tool_box_button_max + '" onclick="swapCollapse(\'cluster_' + cluster['id'] + '\');"><i class="fa fa-minus-square"></i></button>\n';
    html_output += '        </div>\n';
    html_output += '        <div class="product_tool_box_body">\n';
    html_output += '            <div class="product_tool_box_section">\n';
    html_output += '                <div class="product_tool_box_section_title">Information</div>\n';
    html_output += '                <div class="product_tool_box_section_body">\n';
    html_output += '                    <div class="product_divTable">\n';
    html_output += '                        <div class="product_divTableBody">\n';
    html_output += '                            <div class="product_divTableRow">\n';
    html_output += '                                <div class="product_divTableCellAt">is max: </div>\n';
    html_output += '                                <div class="product_divTableCell">';
    
    if (cluster['is_max']) {
        html_output += 'true';
    } else {
        html_output += 'false';
    }

    html_output += '</div>\n';
    html_output += '                            </div>\n';
    html_output += '                            <div class="product_divTableRow">\n';
    html_output += '                                <div class="product_divTableCellAt">score: </div>\n';
    html_output += '                                <div class="product_divTableCell">' + parseFloat(Math.round(parseFloat(cluster['score']) * 100) / 100).toFixed(4) + '</div>\n';
    html_output += '                            </div>\n';
    html_output += '                            <div class="product_divTableRow">\n';
    html_output += '                                <div class="product_divTableCellAt">count: </div>\n';
    html_output += '                                <div class="product_divTableCell">' + cluster ['count'] + '</div>\n';
    html_output += '                            </div>\n';
    html_output += '                            <div class="product_divTableRow">\n';
    html_output += '                                <div class="product_divTableCellAt">nscore: </div>\n';
    html_output += '                                <div class="product_divTableCell">' + parseFloat(Math.round(parseFloat(cluster['nscore']) * 100) / 100).toFixed(4) + '</div>\n';
    html_output += '                            </div>\n';
    html_output += '                            <div class="product_divTableRow">\n';
    html_output += '                                <div class="product_divTableCellAt">detectors: </div>\n';
    html_output += '                                <div class="product_divTableCell">\n';
    html_output += '                                    ' + cluster['detectors'][0];
    
    for (i = 1; i < cluster['detectors'].length; ++i ) {
        html_output += ', ' + cluster['detectors'][i];
    }
    html_output += '\n';

    html_output += '                                </div>\n';
    html_output += '                            </div>\n';
    html_output += '                        </div>\n';
    html_output += '                    </div>\n';
    html_output += '                </div>\n';
    html_output += '            </div>\n';
    html_output += '        </div>\n';

    html_output += '        <div class="product_tool_box_body">\n';
    html_output += '            <div class="product_tool_box_section">\n';
    html_output += '                <div class="product_tool_box_section_title">Proposed</div>\n';
    html_output += '                <div class="product_tool_box_section_body">\n';
    html_output += '                    <button class="btn btn-default btn-xs btn-category" type="button" onclick="setBboxCustom(\'' + id + '\', [' + cluster['bbox'] + ']);setCategory(\'' + id + '\', \'' + cluster ['categories'][0]['name'] + '\');">' + cluster['categories'][0]['name'] + '</button>\n';
    html_output += '                    <div class="show_rect_check" id=\'check' + cluster['color_id'] + '\'>\n';
    html_output += '                        <input class="product_tool_box_checkbox_element" type="checkbox" onclick="showRectangle(\'' + id + '\', [' + cluster['bbox'] + '], ' + gallery_info[id]['svg_info']['width'] + ', ' + gallery_info[id]['svg_info']['height'] + ', ' + cluster['color_id'] + ', ' + color_counter + ');"></input>\n';
    html_output += '                    </div>\n';
    html_output += '                </div>\n';
    html_output += '            </div>\n';
    html_output += '        </div>\n';
    html_output += '        <div class="product_tool_box_body">\n';
    html_output += '            <div class="product_tool_box_section">\n';
    html_output += '                <div class="product_tool_box_section_title">Categories</div>\n';

    for (i = 0; i < cluster['categories'].length; ++ i) {
        cat_data = cluster['categories'][i];
    
        html_output += '                <div class="product_tool_box_section_body">\n';
        html_output += '                    <button class="btn btn-default btn-xs btn-category" type="button" type="button" onclick="setBboxCustom(\'' + id + '\', [' + cat_data['bbox'] + ']);setCategory(\'' + id + '\', \'' + cat_data['name'] + '\');">' + cat_data['name']+ '</button>\n';
        html_output += '                    <div class="show_rect_check" id=\'check' + cat_data['color_id'] + '\'>\n';
        html_output += '                        <input class="product_tool_box_checkbox_element" type="checkbox" onclick="showRectangle(\'' + id + '\', [' + cat_data['bbox'] + '], ' + gallery_info[id]['svg_info']['width'] + ', ' + gallery_info[id]['svg_info']['height'] + ', ' + cat_data['color_id'] + ', ' + color_counter + ');"></input>\n';
        html_output += '                    </div>\n';
        html_output += '                    <div class="product_divTable">\n';
        html_output += '                        <div class="product_divTableBody">\n';
        html_output += '                            <div class="product_divTableRow">\n';
        html_output += '                                <div class="product_divTableCellAt">score: </div>\n';
        html_output += '                                <div class="product_divTableCell">' + parseFloat(Math.round(parseFloat(cat_data['score']) * 100) / 100).toFixed(4) + '</div>\n';
        html_output += '                            </div>\n';
        html_output += '                            <div class="product_divTableRow">\n';
        html_output += '                                <div class="product_divTableCellAt">count: </div>\n';
        html_output += '                                <div class="product_divTableCell">' + cat_data['count'] + '</div>\n';
        html_output += '                            </div>\n';
        html_output += '                            <div class="product_divTableRow">\n';
        html_output += '                                <div class="product_divTableCellAt">nscore: </div>\n';
        html_output += '                                <div class="product_divTableCell">' + parseFloat(Math.round(parseFloat(cat_data['nscore']) * 100) / 100).toFixed(4) + '</div>\n';
        html_output += '                            </div>\n';
        html_output += '                            <div class="product_divTableRow">\n';
        html_output += '                                <div class="product_divTableCellAt">detectors: </div>\n';
        html_output += '                                <div class="product_divTableCell">\n';
        html_output += '                                    ' + cat_data ['detectors'][0]['name'];
        
        for (j = 1; j < cat_data['detectors'].length; ++j) {
            html_output += ', ' + cat_data ['detectors'][j]['name'];
        }
        html_output += '\n';
        html_output += '                                </div>\n';
        html_output += '                            </div>\n';
        html_output += '                            <div class="product_divTableRow">\n';
        html_output += '                                <div class="product_divTableCellAt">&nbsp;</div>\n';
        html_output += '                                <div class="product_divTableCell">&nbsp;</div>\n';
        html_output += '                            </div>\n';
        html_output += '                        </div>\n';
        html_output += '                    </div>\n';
        html_output += '                </div>\n';
    }

    html_output += '            </div>\n';
    html_output += '        </div>\n';
    html_output += '    </div>\n';
    //html_output += '</div>\n';

    return html_output;
}

function swapCollapse(id) {
    var element = document.getElementById(id);

    if (!(id in tool_boxes)) {
        tool_boxes[id] = {};
        tool_boxes[id]['collapse_state'] = true;
        tool_boxes[id]['height'] = element.clientHeight;

        element.classList.add('product_tool_box');
        element.style.height = tool_boxes[id]['height'];
    }

    tool_boxes[id]['collapse_state'] = !tool_boxes[id]['collapse_state'];

    if (tool_boxes[id]['collapse_state'] === true) { 
        element.style.height = '48px';
    }
    else 
    { 
        element.style.height = tool_boxes[id]['height'] + 'px';
    }

    setTimeout(updateToolBox, 500)
}

function updateToolBox() {
    masonry_cluster.layout();
}

function showRectangle(id, rect, imWidth, imHeight, color_index, total_colors) {                           
    var palette = chroma.scale(['green', 'gold', 'red', 'pink', 'blue']).mode('lch').colors(total_colors)

    var id_cluster = addProposal(id, -1, cluster=rect, color=palette[color_index]);
    var id_rect = document.getElementById(id_cluster);
    id_rect.classList.toggle('image_svg_bbox_proposal_show');

    var checkbox=document.getElementById("check" + color_index);

    if (checkbox.style.backgroundColor == palette[color_index]) {
        checkbox.style.backgroundColor =  'white';
    } else {
        checkbox.style.backgroundColor = palette[color_index];
    }
}