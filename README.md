# Tahoe-LAFS Javascript Interface and Secure Proxy

A Javascript frontend to [Tahoe-LAFS](https://tahoe-lafs.org/) for web-friendlier URLs, powered by [Nginx](http://nginx.org/).


## What?

In order for one to turn the *ugly* looking URIs generated from Tahoe into prettier web-safe URLs more suitable
to distribute, one would need two things:

* A webserver capable of URL rewriting in front of the Tahoe webui gateway (aka. reverse proxy)
* Some Javascript to interact with the webapi of Tahoe

Ive provided the javascript, and an Nginx configuration sample to get you up and running.


## Why?

Because Tahoe-LAFS is so freaking cool...

but the URIs aren't very web-friendly, and the default Tahoe-LAFS webui is too open and exposed.


## How?

First, you've gotta have:

* [Tahoe-LAFS](https://tahoe-lafs.org/trac/tahoe-lafs/wiki/Installation) either [run your own](https://tahoe-lafs.org/trac/tahoe-lafs/browser/trunk/docs/quickstart.rst)
grid, or connect to [some](https://tahoe-lafs.org/trac/tahoe-lafs/wiki/TestGrid) [community](http://www.bigpig.org/) grids
* [Nginx](http://nginx.org/en/download.html) >= `1.0.0` preferably compiled with the --with-http_ssl_module option, as you'll probably want to do SSL/TLS

Everything else is included:

#### bin/

* `url_gen.sh` simple helper script, generates compatible URLs from standard Tahoe-LAFS URIs, for easy copy and paste

#### config/

I've created an Nginx server config file to put in front of your Tahoe webui gateways.
The config is tuned for security, disallowing all access to the normal webapi of
Tahoe, unless you know a valid RW directory URI. I've also commented all the things, so you ~~won't~~ shouldn't be lost
trying to figure out what/why something is, or how to change it.

* `nginx_vhost.conf` you might want to edit a few things to make it work:
  * `reverse_uris` reverse the uris so the common portion of the Tahoe URI is at the beginning of URL (true by default). uncomment/comment the appropriate lines
  * `server_name` domain name/ip you're hosting it on
  * `ssl_certificate*` SSL certificate and key locations
  * `root` where is the `public_html/` directory, or just some empty dir if you're going to host all of it from a Tahoe directory
  * `client_max_body_size` max file upload limit
  * `proxy_pass` defaults to default tahoe webui:port, but you might want to change it

Afterwards just include it in your nginx `http { }` block like so:
```nginx
http {

  # ... SNIP ...

  # include Tahoe gateway config
  include /path_to_edited_nginx_vhost.conf;
}
```

#### public_html/

This is the public_html folder, duh. This is what gets served to users. You can keep it on
the gateway servers themselves or upload all of it to a Tahoe Directory and serve it from there.

* `index.html` some simple markup, needed for now, will eventually move to javascript only.
* `assets/app.js` the bread and butter of the URL generation, and directory display. Generates web-friendly links from Tahoe webapi JSON data.
  * `reverse_uris` set this to false if you dont want to have the common portion of the Tahoe URI at the beginning.
needs to be the same as in your nginx config.
* `assets/vendor/` jquery/bootstrap and a few other third-party libraries with various licenses.


### Other Info

If you wanted to host this frontend (or any static webpage) on Tahoe-LAFS and wanted to have links look *normal*, I've included some commented
sections in the nginx config file to show you how to do it. You'd do something like this:

```nginx
# Main landing page will be requested from Tahoe <RO DIRCAP>/index.html
location = / {
  rewrite ^ /uri/URI:DIR2-RO:gdfys4rrb421cqprha46tu3edm:wwyfx52w7fre7ujbczcny6dy374ozihwarwjwkgpy77ymxcwkita/index.html break;
  proxy_pass http://127.0.0.1:3456;
}

# serve assets with max expire times (public content)
location ^~ /assets/ {
  add_header Cache-Control public;
  expires max;

  # this will send all requests for /assets/ and to Tahoe <RO DIRCAP>/assets/
  rewrite ^ /uri/URI:DIR2-RO:gdfys4rrb421cqprha46tu3edm:wwyfx52w7fre7ujbczcny6dy374ozihwarwjwkgpy77ymxcwkita$uri break;
  proxy_pass http://127.0.0.1:3456;
}
```

With this example, requests for `example.com` (and subsequent requests for anything under `/assets/`) would be fetched
from the RO dircap provided, the visitor will never see the ugly Tahoe URI, as its being rewritten inside of the webserver.

Since every request fetches the static content from Tahoe, you could optimize this by utilizing Nginx's built-in `proxy_cache`
which will have nginx save the static content to disk for a certain duration of time, which gives extremely quick access.

First you need to add a single line to your global nginx config, inside the `http { }` block:
```nginx
# Set a place to save the cached content
# limit it to 10 megs, and make content last
# 1 day in the cache if unrequested
proxy_cache_path proxy_cache/tahoe keys_zone=tahoe:10m inactive=1d;
```

Then just use `proxy_cache tahoe;` under all the locations you wanted to cache content from Tahoe:

```nginx
# cache any 200 response for 1 day
# (only valid where proxy_cache tahoe is specified)
proxy_cache_valid 200 1d;

location = / {
  proxy_cache tahoe; # cache the index.html page
  rewrite ^ /uri/URI:DIR2-RO:gdfys4rrb421cqprha46tu3edm:wwyfx52w7fre7ujbczcny6dy374ozihwarwjwkgpy77ymxcwkita/index.html break;
  proxy_pass http://127.0.0.1:3456;
}
```

### Screenshots

Here are some screenshots of what it looks like.

**Directory:**
![Directory Interface Screenshot](https://raw.github.com/kmullin/tahoe-lafs-jisp/master/misc/screenshot_1.png)

**Read-only Directory:**
![Read-only Directory Interface Screenshot](https://raw.github.com/kmullin/tahoe-lafs-jisp/master/misc/screenshot_2.png)



## FAQ

#### Why do you have the `reverse_uris` option?

Tahoe capability URIs contain a common portion, for the web I think it makes more sense to have URLs which somewhat identify
the hierarchical resources provided, so take the URIs for a single Tahoe directory:

```json
"rw_uri": "URI:DIR2:cy5uyz4oxhm2uh2pblpfi1j43u:wwyfx52w7fre7ujbczcny6dy374ozihwarwjwkgpy77ymxcwkita",
"verify_uri": "URI:DIR2-Verifier:zs3wufxnuzy471pc5dlrcum7ja:wwyfx52w7fre7ujbczcny6dy374ozihwarwjwkgpy77ymxcwkita",
"ro_uri": "URI:DIR2-RO:gdfys4rrb421cqprha46tu3edm:wwyfx52w7fre7ujbczcny6dy374ozihwarwjwkgpy77ymxcwkita"
```

The common portion is: `wwyfx52w7fre7ujbczcny6dy374ozihwarwjwkgpy77ymxcwkita` so we put that first to indicate a similar resource.
So we have:

```
RO: /d/ro/wwyfx52w7fre7ujbczcny6dy374ozihwarwjwkgpy77ymxcwkita/gdfys4rrb421cqprha46tu3edm/
RW:    /d/wwyfx52w7fre7ujbczcny6dy374ozihwarwjwkgpy77ymxcwkita/cy5uyz4oxhm2uh2pblpfi1j43u/
```

Instead of:

```
RO: /d/ro/gdfys4rrb421cqprha46tu3edm/wwyfx52w7fre7ujbczcny6dy374ozihwarwjwkgpy77ymxcwkita/
RW:    /d/cy5uyz4oxhm2uh2pblpfi1j43u/wwyfx52w7fre7ujbczcny6dy374ozihwarwjwkgpy77ymxcwkita/
```

You can see that the only difference is the two different keys to unlock the different capabilities of Tahoe-LAFS:

* RO: `gdfys4rrb421cqprha46tu3edm`
* RW: `cy5uyz4oxhm2uh2pblpfi1j43u`

You can easily set `reverse_uris` to false and uncomment the right lines in the nginx config to change this default behavior. I
simply thought it looked better reversed, it is only turned on for aesthetic purposes.

#### Why aren't the URLs shorter?

To shorten the URIs from Tahoe, you need to store part of it somewhere to lookup later.
You could definitely store part (or all) of a URI inside the nginx config, we do that
above with `/assets/` and `index.html`. Or you can always use a URL shortening service.


## Credits

* Tahoe-LAFS developers: Thank you for making such a wonderful piece of software!
* [lafs-rpg](https://bitbucket.org/nejucomo/lafs-rpg): Thanks for the initial idea of making a restrictive proxy gateway for tahoe.
