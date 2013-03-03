var uri_map = {
  dir_id: '/d/',
  file_id: '/f/',
  dir_api: '/a/dir/'
};

var link_map = {
  "URI:CHK:": uri_map.file_id,
  "URI:DIR2:": uri_map.dir_id,
  "URI:DIR2-RO:": uri_map.dir_id + 'ro/'
};

function get_link(lafs_uri) {
  for (var k in link_map) {
    if (lafs_uri.substr(0, k.length) == k)
      return link_map[k] + lafs_uri.substr(k.length).replace(/:/g, '/');
  }
  return '';
}

function gen_unlink_button(filename, post_uri, return_to) {
  var link_a = new Array();
  link_a.push('<a href="" class="unlink_button text-error" data-return-to="' + return_to + '"');
  link_a.push(' data-filename="' + filename + '"');
  link_a.push(' data-post-uri="' + post_uri + '"');
  link_a.push('>delete</a>');
  return ' ' + link_a.join('');
}

function readablizeBytes(bytes) {
  // stolen from http://stackoverflow.com/a/10469752
  var s = ['bytes', 'kB', 'MB', 'GB', 'TB', 'PB'];
  var e = Math.floor(Math.log(bytes) / Math.log(1024));
  return (bytes / Math.pow(1024, Math.floor(e))).toFixed(2) + " " + s[e];
}

function fill_grid_rows(children, currentId) {
  var file_uri = null;
  var size = null;
  var obj_uri = null;
  var type = null;
  var name_link = null;
  var ctime = null;
  var child_rows = new Array;
  // for each filenode or dirnode fill Array with rows
  $.each(children, function(name, child_d) {
    size = child_d[1].size;
    if (size == null)
      size = 0;
    else
      size = readablizeBytes(size);
    obj_uri = child_d[1].rw_uri;
    if (obj_uri == null)
      obj_uri = child_d[1].ro_uri;
    file_uri = '';
    if (child_d[0] == 'filenode')
      file_uri = '/' + name;
    type = (child_d[0] == 'filenode') ? 'file' : 'directory';
    name_link = '<a class="' + type + '" title="' + ((child_d[0] == 'filenode') ? name : 'Directory: ' + child_d[1].verify_uri.substr(18, 5)) + '" href="' + escape(get_link(obj_uri) + file_uri) + '">' + name + '</a>';
    ctime = new Date(Math.round(child_d[1].metadata.tahoe.linkcrtime*1000));
    ctime = ctime.toISOString();
    ctime = '<abbr class="timeago" title="' + ctime + '">' + ctime + '</abbr>';
    // add delete link if its not ro
    if (currentId.substr(0,3) == "ro/") {
      child_rows.push([name_link, type, size, ctime]);
    }
    else {
      child_rows.push([name_link, type, size, ctime, gen_unlink_button(name, uri_map.dir_api + currentId, uri_map.dir_id + currentId)]);
    }
  });
  return child_rows;
}

function light_up_table(child_rows, currentId) {
  var table_config = {
    "sDom": "firt",
    "aaData": child_rows,
    "aoColumns": [
      { "sTitle": "Filename", "sWidth": "70%" },
      { "sTitle": "Type", "sClass": "text-right" },
      { "sTitle": "Size", "sClass": "text-right", "sWidth": "15%" },
      { "sTitle": "Created", "sClass": "text-right" }
    ],
    "aLengthMenu": [
      [25, 50, 100, 200, -1],
      [25, 50, 100, 200, "All"]
    ],
    "iDisplayLength" : -1,
    "aoColumnDefs": []
  };
  if (currentId.substr(0,3) != "ro/") {
    // options for additional column in datatable
    table_config.aoColumns.push({"sTitle": "Options"});
    table_config.aoColumnDefs.push({ "bSortable": false, "aTargets": [ -1 ] });
    table_config.aoColumnDefs.push({ "bSearchable": false, "aTargets": [ -1 ] });
    table_config.aoColumnDefs.push({ "sClass": 'text-right', "aTargets": [ -1 ] });
  }
  // init table and form attributes
  $("table.directory").dataTable(table_config);
  return true;
}

function make_directory_grid(currentId) {
  // make a call for json data at api uri
  $.getJSON(uri_map.dir_api + currentId, function(data) {
    var child_rows = fill_grid_rows(data[1].children, currentId);
    // if nothing in array dont make table or show upload stuffs
    if (child_rows.index != 0) {
      var title = 'Directory: ' + data[1].verify_uri.substr(18, 5);
      title += (currentId.substr(0,3) == 'ro/') ? ' (ro)' : '';
      document.title = title;
      $("h3.heading").text(title).show();
      light_up_table(child_rows, currentId); // init table
      $("form").attr("action", uri_map.dir_api + currentId);
      $("input.return_to").attr("value", location.pathname);
      $("abbr.timeago").timeago();
      var ro_link = get_link(data[1].ro_uri);
      $("a.current-ro-link").attr("href", ro_link);
      // do stuff with non-read only links after table is generated
      if (currentId.substr(0,3) != "ro/") {
        $("a.unlink_button").click(function() {
          var post_data = {};
          post_data.t = 'unlink';
          post_data.name = $(this).attr("data-filename");
          post_data.when_done = $(this).attr("data-return-to");
          $.post($(this).attr("data-post-uri"), post_data, function(data) {
            window.location.href = post_data.when_done;
          });
        });
        // dont need to show upload form if ro link
        $("div.upload-form").show();
      }
    }
  });
  return true;
}

$(document).ready(function() {

  // dynamically create regex for matching view (dirs) uris
  var re = new RegExp("^" + uri_map.dir_id.replace(/([.?*+^$[\]\\(){}|-])/g, "\\$1") + "((?:ro/)?\\w{26}\\/\\w{52})\\/?$","g");
  var matched_id = re.exec(location.pathname);
  if ( matched_id != null ) {
    make_directory_grid(matched_id[1]);
  }

});
