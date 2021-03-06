var reverse_uris = true;

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
  var buffer = null;
  for (var k in link_map) {
    if (lafs_uri.substr(0, k.length) == k) {
      buffer = lafs_uri.substr(k.length);
      if (reverse_uris) {
        buffer = buffer.split(':');
        var swap = buffer[0];
        buffer[0] = buffer[1];
        buffer[1] = swap;
        buffer = buffer.join(':');
      }
      return link_map[k] + buffer.replace(/:/g, '/');
    }
  }
  return '';
}

function rename_form() {
  var ren_form = new Array();
  ren_form.push('<form action="." class="rename" method="post" enctype="multipart/form-data">');
  ren_form.push('<fieldset>');
  ren_form.push('<input type="hidden" name="t" value="rename" />');
  ren_form.push('<input type="hidden" name="when_done" value="." />');
  ren_form.push('<input type="text" readonly="true" name="from_name" value="" />');
  ren_form.push('<input type="text" name="to_name" />');
  ren_form.push('<input type="submit" value="rename" />');
  ren_form.push('</fieldset></form>');
  return ren_form.join('');
}

function gen_buttons(filename, post_uri, return_to) {
  var link_a = new Array();
  $.each(['unlink', 'rename'], function(i, type) {
    link_a.push('<button class="btn btn-' + (type == 'unlink' ? 'danger' : 'primary' ) + ' btn-mini ' + type + '-button"');
    link_a.push(' data-return-to="' + return_to + '"');
    link_a.push(' data-filename="' + filename + '"');
    link_a.push(' data-post-uri="' + post_uri + '"');
    link_a.push('>' + (type == 'unlink' ? 'delete' : type) + '</button> ');
  })
  return ' ' + link_a.join('');
}

function readablizeBytes(bytes) {
  // stolen from http://stackoverflow.com/a/10469752
  var s = ['bytes', 'kB', 'MB', 'GB', 'TB', 'PB'];
  var e = Math.floor(Math.log(bytes) / Math.log(1024));
  return (bytes / Math.pow(1024, Math.floor(e))).toFixed(2) + " " + s[e];
}

function fill_grid_rows(children) {
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
      child_rows.push([name_link, type, size, ctime, gen_buttons(name, uri_map.dir_api + currentId, uri_map.dir_id + currentId)]);
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
    table_config.aoColumns.push({"sTitle": "Options", "sWidth": "15%"});
    table_config.aoColumnDefs.push({ "bSortable": false, "aTargets": [ -1 ] });
    table_config.aoColumnDefs.push({ "bSearchable": false, "aTargets": [ -1 ] });
    table_config.aoColumnDefs.push({ "sClass": 'text-right', "aTargets": [ -1 ] });
  }
  // init table and form attributes
  $("table.directory").dataTable(table_config);
  return true;
}

function make_directory_grid() {
  // make a call for json data at api uri
  $.getJSON(uri_map.dir_api + currentId, function(data) {
    var child_rows = fill_grid_rows(data[1].children);
    // if nothing in array dont make table or show upload stuffs
    if (child_rows.index != 0) {
      var title = 'Directory: ' + data[1].verify_uri.substr(18, 5);
      title += (currentId.substr(0,3) == 'ro/') ? ' (ro)' : '';
      document.title = title;
      $("a.current-dir").text(title);
      light_up_table(child_rows, currentId); // init table
      $("abbr.timeago").timeago();
      // do stuff with non-read only links after table is generated
      if (currentId.substr(0,3) != "ro/") {
        $("form").attr("action", uri_map.dir_api + currentId);
        $("input.return_to").attr("value", location.pathname);
        $("a.current-ro-link").attr("href", get_link(data[1].ro_uri));
        $("button.unlink-button").click(function() {
          var post_data = {};
          post_data.t = 'unlink';
          post_data.name = $(this).attr("data-filename");
          post_data.when_done = $(this).attr("data-return-to");
          $.post($(this).attr("data-post-uri"), post_data, function(data) {
            window.location.href = post_data.when_done;
          });
        });
        $("button.rename-button").popover({
          "html": true,
          "title": "Rename",
          "content": rename_form,
          "placement": "left",
          "trigger": "manual"
        });
        $("button.rename-button").click(function() {
          $(this).popover('toggle');
          $("form.rename").attr("action", $(this).attr("data-post-uri"));
          $("form.rename input[name='from_name']").attr("value", $(this).attr("data-filename"));
          $("form.rename input[name='when_done']").attr("value", $(this).attr("data-return-to"));
        });
        // dont need to show upload form if ro link
        $("div.upload-form").show();
      }
    }
  });
  return true;
}

// our currentId global
var currentId = null;
$(document).ready(function() {

  // dynamically create regex for matching view (dirs) uris
  var re = "((?:ro/)?";
  re += reverse_uris ? "\\w{52}\\/\\w{26}" : "\\w{26}\\/\\w{52}";
  re += ")\\/?$";
  re = new RegExp("^" + uri_map.dir_id.replace(/([.?*+^$[\]\\(){}|-])/g, "\\$1") + re,"g");
  var matched_id = re.exec(location.pathname);
  if ( matched_id != null ) {
    currentId = matched_id[1];
    make_directory_grid();
  }

});
