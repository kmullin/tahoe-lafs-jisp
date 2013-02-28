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
}

function gen_unlink_button(filename, post_uri, return_to) {
  var html_form = new Array();
  html_form.push('<form action="' + post_uri +'" method="post">');
  html_form.push('<input type="hidden" name="t" value="unlink" />');
  html_form.push('<input type="hidden" name="name" value="' + filename + '" />');
  html_form.push('<input type="hidden" name="when_done" value="' + return_to + '" />');
  html_form.push('<input type="submit" name="unlink" value="unlink" />');
  html_form.push('</form>');
  return html_form.join('');
}

function make_directory_grid(currentId) {
  var child_rows = new Array();
  // make a call for json data at api uri
  $.getJSON(uri_map.dir_api + currentId, function(data) {
    var children = data[1].children;
    var filename = null;
    var size = null;
    var obj_uri = null;
    var type = null;
    var name_link = null;
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
      name_link = '<a href="' + escape(get_link(obj_uri) + filename) + '">' + name + '</a>';
      // add delete link if its not ro
      name_link += (currentId.substr(0,3) == "ro/") ? '' : gen_unlink_button(name, uri_map.dir_api + currentId, uri_map.dir_id + currentId);
      ctime = new Date(Math.round(child_d[1].metadata.tahoe.linkcrtime*1000));
      ctime = ctime.toISOString();
      ctime = '<abbr class="timeago" title="' + ctime + '">' + ctime + '</abbr>';
      child_rows.push([name_link, type, size, ctime]);
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
      $("abbr.timeago").timeago();
      if (currentId.substr(0,3) != "ro/")
        $("div.upload-form").show();
    }
  });
}

$(document).ready(function() {

  // dynamically create regex for matching view (dirs) uris
  var re = new RegExp("^" + uri_map.dir_id.replace(/([.?*+^$[\]\\(){}|-])/g, "\\$1") + "((?:ro/)?\\w{26}\\/\\w{52})\\/?$","g");
  var matched_id = re.exec(location.pathname);
  if ( matched_id != null ) {
    make_directory_grid(matched_id[1]);
  }

});
