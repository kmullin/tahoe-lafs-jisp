function get_link(uri) {

  var prefix = null;
  if (uri.substring(0, 8) == "URI:CHK:") {
    uri = uri.substring(8);
    prefix = '/f/';
  }
  else if (uri.substring(0, 9) == "URI:DIR2:") {
    uri = uri.substring(9);
    prefix = '/d/';
  }

  return prefix + uri.replace(/:/g, '/');
}

function make_directory_grid() {
  // get current uri
  var currentId = location.pathname.substring(3);
  var child_rows = new Array();
  // make a call for json data at api uri
  $.getJSON('/a/dir/' + currentId, function(data) {
    var children = data[1]['children'];
    var filename = '';
    var size = '';
    var link = '';
    // for each child make fill Array with rows for each file
    $.each(children, function(name, child_d) {
      filename = '';
      size = child_d[1].size;
      link = child_d[1].rw_uri;
      if (size == null)
          size = 0;
      if (link == null)
          link = child_d[1].ro_uri;
      if (child_d[0] == 'filenode')
          filename = '/' + name;
      name = '<a href="' + escape(get_link(link) + filename) + '">' + name + '</a>';
      child_rows.push([name, child_d[0], size]);
    });
    // if nothing in array dont make table or show upload stuffs
    if (child_rows.index != 0) {
      $("table.directory").dataTable({
          "aaData": child_rows,
          "aoColumns": [
            { "sTitle": "Filename" },
            { "sTitle": "Type" },
            { "sTitle": "Size" },
          ]
      });
      $("form").attr("action", "/a/dir/" + currentId);
      $("input.return_to").attr("value", location.pathname);
      $("div.upload-form").show();
    }
  });
}

$(document).ready(function() {

  if (location.pathname.substring(0, 3) == '/d/') {
    make_directory_grid();
  }
});
