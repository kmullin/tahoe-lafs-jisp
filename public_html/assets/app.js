var uri_map = {
  dir_id: '/d/',
  file_id: '/f/',
  dir_api: '/a/dir/'
};

function get_link(lafs_uri) {
  var link = '';
  if (lafs_uri.substr(0, 8) == "URI:CHK:") {
    // file ro-cap
    link = uri_map.file_id + lafs_uri.substr(8);
  }
  else if (lafs_uri.substr(0, 9) == "URI:DIR2:") {
    // dir rw-cap
    link = uri_map.dir_id + lafs_uri.substr(9);
  }
  return link.replace(/:/g, '/');
}

function make_directory_grid(currentId) {
  var child_rows = new Array();
  // make a call for json data at api uri
  $.getJSON(uri_map.dir_api + currentId, function(data) {
    var children = data[1]['children'];
    var filename = null;
    var size = null;
    var obj_uri = null;
    var type = null;
    var ctime = new Date();
    // for each filenode or dirnode fill Array with rows
    $.each(children, function(name, child_d) {
      size = child_d[1].size;
      if (size == null)
        size = 0;
      obj_uri = child_d[1].rw_uri;
      if (obj_uri == null)
        obj_uri = child_d[1].ro_uri;
      filename = '';
      if (child_d[0] == 'filenode')
        filename = '/' + name;
      type = (child_d[0] == 'filenode') ? 'file' : 'directory';
      name = '<a href="' + escape(get_link(obj_uri) + filename) + '">' + name + '</a>';
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
      $("form").attr("action", uri_map.dir_api + currentId);
      $("input.return_to").attr("value", location.pathname);
      $("div.upload-form").show();
      $("abbr.timeago").timeago();
    }
  });
}

$(document).ready(function() {

  // dynamically create regex for matching api uris
  var re = new RegExp("^" + uri_map.dir_id.replace(/([.?*+^$[\]\\(){}|-])/g, "\\$1") + "\\w{26}\\/\\w{52}\\/?$","g");
  if ( re.test(location.pathname) ) {
    // if directory
    make_directory_grid(location.pathname.replace(uri_map.dir_id, ''));
  }

});
