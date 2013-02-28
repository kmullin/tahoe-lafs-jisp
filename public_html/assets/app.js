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
    var filename = null;
    var size = null;
    var link = null;
    var ftype = null;
    var ctime = new Date();
    // for each child make fill Array with rows for each file
    $.each(children, function(name, child_d) {
      filename = '';
      size = child_d[1].size;
      link = child_d[1].rw_uri;
      type = (child_d[0] == 'filenode') ? 'file' : 'directory';
      if (size == null)
          size = 0;
      if (link == null)
          link = child_d[1].ro_uri;
      if (child_d[0] == 'filenode')
          filename = '/' + name;
      name = '<a href="' + escape(get_link(link) + filename) + '">' + name + '</a>';
      ctime = new Date(Math.round(child_d[1].metadata.tahoe.linkcrtime*1000));
      ctime = ctime.toISOString();
      ctime = '<abbr class="timeago" title="' + ctime + '">' + ctime + '</abbr>';
      child_rows.push([name, type, size, ctime]);
    });
    // if nothing in array dont make table or show upload stuffs
    if (child_rows.index != 0) {
      $("table.directory").dataTable({
          "aaData": child_rows,
          "aoColumns": [
            { "sTitle": "Filename" },
            { "sTitle": "Type" },
            { "sTitle": "Size" },
            { "sTitle": "Created" },
          ],
          "aLengthMenu": [
            [25, 50, 100, 200, -1],
            [25, 50, 100, 200, "All"]
          ],
          "iDisplayLength" : -1
      });
      $("form").attr("action", "/a/dir/" + currentId);
      $("input.return_to").attr("value", location.pathname);
      $("div.upload-form").show();
      $("abbr.timeago").timeago();
    }
  });
}

$(document).ready(function() {

  if (location.pathname.substring(0, 3) == '/d/') {
    make_directory_grid();
  }
});
