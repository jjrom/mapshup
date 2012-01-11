<?php
/*
 * mapshup - Webmapping made easy
 * http://mapshup.info
 *
 * Copyright Jérôme Gasperi, 2011.12.08
 *
 * jerome[dot]gasperi[at]gmail[dot]com
 *
 * This software is a computer program whose purpose is a webmapping application
 * to display and manipulate geographical data.
 *
 * This software is governed by the CeCILL-B license under French law and
 * abiding by the rules of distribution of free software.  You can  use,
 * modify and/ or redistribute the software under the terms of the CeCILL-B
 * license as circulated by CEA, CNRS and INRIA at the following URL
 * "http://www.cecill.info".
 *
 * As a counterpart to the access to the source code and  rights to copy,
 * modify and redistribute granted by the license, users are provided only
 * with a limited warranty  and the software's author,  the holder of the
 * economic rights,  and the successive licensors  have only  limited
 * liability.
 *
 * In this respect, the user's attention is drawn to the risks associated
 * with loading,  using,  modifying and/or developing or reproducing the
 * software by the user in light of its specific status of free software,
 * that may mean  that it is complicated to manipulate,  and  that  also
 * therefore means  that it is reserved for developers  and  experienced
 * professionals having in-depth computer knowledge. Users are therefore
 * encouraged to load and test the software's suitability as regards their
 * requirements in conditions enabling the security of their systems and/or
 * data to be ensured and,  more generally, to use and operate it in the
 * same conditions as regards security.
 *
 * The fact that you are presently reading this means that you have had
 * knowledge of the CeCILL-B license and that you accept its terms.
 */

/**
 * mapshup Server Domain name
 * (Usually = localhost)
 */
define("MSP_DOMAIN","132.149");

/**
 * Valid admin email adress (for registering)
 */
define("MSP_ADMIN_EMAIL","jrom@localhost");

/**
 * Flickr API key (for API search through mapshup)
 */
define("MSP_FLICKR_KEY","");

/**
 * gdal_translate path
 */
define("MSP_GDAL_TRANSLATE_PATH","/Library/Frameworks/GDAL.framework/Programs/gdal_translate");

/**
 * gdal_merge.py path
 */
define("MSP_GDAL_MERGE_PATH","/Library/Frameworks/GDAL.framework/Programs/gdal_merge.py");

/**
 * Log directory : should be writable by webserver user
 * but not accessible from the Webserver (for security reasons)
 * !! Trailing "/" is MANDATORY !!
 */
define("MSP_LOG_DIR", "/Users/jrom/Documents/Devel/mercurial/mapshup/_logs/");

/**
 * Mapserver Url
 * (use for reprojection)
 */
define("MSP_MAPSERVER_URL", "http://localhost/cgi-bin/mapserv");

/**
 * Mapserver fontset file
 */
define("MSP_MAPSERVER_FONTSET", "/Users/jrom/Documents/Devel/mercurial/mapshup/server/mapserver/font.list");

/**
 * Mapserver symbolset file
 */
define("MSP_MAPSERVER_SYMBOLSET", "/Users/jrom/Documents/Devel/mercurial/mapshup/server/mapserver/reference.sym");

/**
 * Mapfile directory : should be writable by webserver user
 * but not accessible from the Webserver (for security reasons)
 * !! Trailing "/" is MANDATORY !!
 */
define("MSP_MAPFILE_DIR", "/Users/jrom/Documents/Devel/_mapshuplogs/");

/**
 * mbtiles directory (see http://www.mbtiles.org) : should be writable by webserver user
 * but not accessible from the Webserver (for security reasons)
 * !! Trailing "/" is MANDATORY !!
 */
define("MSP_MBTILES_DIR", "/Users/jrom/Documents/Devel/_mapshupdata/");

/**
 * mapshup Server Domain name
 * (Usually = localhost)
 */
define("MSP_OGRINFO_PATH","/Library/Frameworks/GDAL.framework/Programs/ogrinfo");

/**
 * Upload directory : should be writable by webserver user
 * but not accessible from the Webserver (to allow user to get the data)
 * !! Trailing "/" is MANDATORY !!
 */
define("MSP_UPLOAD_DIR", "/Users/jrom/Documents/Devel/_mapshuplogs/");

/**
 * Url to the getFile service
 */
define("MSP_GETFILE_URL", "http://localhost/mspsrv/utilities/getFile.php?file=");

/**
 * Url to the getKml service
 */
define("MSP_GETKML_URL", "http://localhost/mspsrv/utilities/getKML.php?kml=");

/**
 * Default number of results per page
 */
define("MSP_RESULTS_PER_PAGE", 20);

/**
 * Default TimeZone for date computation
 */
define("MSP_TIMEZONE","Europe/Paris");

/**
 * If your webserver is behind a proxy set MSP_USE_PROXY to true
 * The MSP_PROXY_* parameters are only used if MSP_USE_PROXY
 * is set to true
 */
define("MSP_USE_PROXY", false);
define("MSP_PROXY_URL", "");
define("MSP_PROXY_PORT", "");
define("MSP_PROXY_USER", "");
define("MSP_PROXY_PASSWORD", "");

/**
 * Database connexion parameters for Logger plugin
 */
define("MSP_DB_HOST", "localhost");
define("MSP_DB_NAME", "");
define("MSP_DB_USER", "");
define("MSP_DB_PASSWORD", "");

?>