class PageData {
  constructor() {
    this._clubs_lut = {};
    this._clubs = null;
  }
}

function setupPage(locale) {
  $(`#form_birthday`).datepicker({
    minViewMode: 0,
    changeYear: true,
    format: 'yyyy-mm-dd'
  });


  Page.httpRequest({
    action: "get_clubs",
  }, '/race/communicate', (response) => {
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

    let clubs = response.data;
    let clubs_str = []
    let clubs_lut = {};

    for (let i = 0; i < clubs.length; ++i) {
      clubs_lut[clubs[i].name] = clubs[i].id;
      clubs_str.push(clubs[i].name);
    }

    $('#club_id').val(clubs_lut['Independent']);

    $("#club_name_div .form-control").typeahead({
      hint: true,
      highlight: true,
      minLength: 1,
      autoselect: true
    }, {
      name: 'clubs',
      source: substringMatcher(clubs_str)
    }).on("typeahead:close", () => {
      if (clubs_lut[$('#club_name').val()] == undefined) {
        $('#club_name').val('');
        $('#club_id').val(clubs_lut['Independent']);
        return;
      }
      $('#club_id').val(clubs_lut[$('#club_name').val()]);
    });
  });
}