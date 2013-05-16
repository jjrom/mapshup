mapshup
=======
(See installation at the end of the README file)

Project info
------------

* [Download the sources](https://github.com/jjrom/mapshup)
* [Try the demo](http://engine.mapshup.info)
* See [mapshup in video](http://vimeo.com/45164288) or take a look at the [Keynote](https://speakerdeck.com/jjrom/mapshup)
* Follow [mapshup on Twitter](https://twitter.com/mapshup)

What is mapshup ?
-----------------
Mapshup provides an innovative and efficient access to Geospatial web services.
It brings on an unique map a mashup of different services - Earth Observation data catalogs,
OpenStreetMap/Bing/Google maps services, news feed, wikipedia articles, photos and videos from social networks,
etc. - to easily build a comprehensive "information context" and help decision making for end users.

![mapshup](https://raw.github.com/jjrom/mapshup/master/utils/stuff/2012.11.23%20-%20mapshup.004.jpg)

Mapshup is based on standard web technologies  (i.e. javascript/css/HTML5). The user interface is designed to
work both on desktop and on touch devices through a web browser.

It is able to connect to a large range of services including : OpenStreetMap/Bing/Google maps, OGC services
(WMS, WFS, CSW and WPS), Earth Observation catalogs (ESA G-Pod catalog, ESA HMA catalogs, OpenSearch catalogs),
Google Earth plugin, Google Streetview, Google Elevation, Flickr API, Youtube API, Wikipedia API, Geonames,
RSS and Atom feeds, MapBox mbtiles, Pléiades metadata, Sentinel 2 metadata.

Out of the box functionalities include : auto-detection of data layers through drag&drop of files and/or urls to the
map, 2D and 3D support, content creation, context saving and sharing through email/facebook/twitter.

The user interface is "map centric". All information is displayed within the map wich represents 100% of the view
excepted for the top header bar wich contains generic actions (a free text search input form, the map backgrounds
switcher, the share button, the help button, the login information).

The user interface is designed to be easy to use on touch devices. As a consequence every functionality is
accessible through one single touch and "hidden" menu are avoided as possible, making the user experience very
intuitive

Architecture
------------
![mapshup architecture](https://raw.github.com/jjrom/mapshup/master/utils/stuff/2012.11.23%20-%20mapshup.008.jpg)

Installation
------------

Note: the following scripts only work on Linux or Mac OS X

Before installing, you need to double check that the following packages are installed :
* Apache server
* PHP > 5.0
* PHP Curl
* PostgreSQL > 8.3 (optional - for UserManagement and context sharing only)
* PostGIS > 1.5 (optional - for UserManagement and context sharing only)
* Mapserver > 5.0 (optional - for on the fly WMS reprojection only)

Note: to get these packages installed you can take a look at https://github.com/jjrom/GisOnOsX/blob/master/README.md (Mac OS X) or at https://github.com/jjrom/InstallALinuxServerForMapshup/blob/master/README.md (Linux)
In the following, we suppose that
* $MAPSHUP_SRC is the directory where mapshup sources will be installed
* $MAPSHUP_HOME is the directory where mapshup will be installed. This directory should be under Apache root directory

Retrieve sources

    git clone https://github.com/jjrom/mapshup.git $MAPSHUP_SRC
    
Compile mapshup

    /bin/rm -Rf $MAPSHUP_HOME
    $MAPSHUP_SRC/utils/packer/pack.sh $MAPSHUP_SRC $MAPSHUP_HOME blacker $MAPSHUP_SRC/client/js/mapshup/config/example.js 0 0

Database installation (optional - for UserManagement and context sharing only)

Edit install_mapshupdb.sh to put the right postgis paths if needed
See $MAPSHUP_HOME/s/README_INSTALL.txt  
    
    cd $MAPSHUP_HOME/s/_installdb
    ./install_mapshupdb.sh

Clean installation files

    rm -Rf $MAPSHUP_HOME/s/README_INSTALL.txt
    rm -Rf $MAPSHUP_HOME/s/_installdb

Configuration

Edit $MAPSHUP_HOME/s/config.php
Note : the current build suppose that mapshup directory is accessible through http://localhot/mapshup. If it is not the case, change it within $MAPSHUP_HOME/js/mapshup/config/example.js 
