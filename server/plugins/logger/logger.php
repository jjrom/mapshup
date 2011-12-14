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

include_once '../../config.php';
include_once '../../functions/general.php';
include_once '../../functions/geometry.php';

/**
 * This script returns nothing
 */
header("Pragma: no-cache");
header("Expires: 0");
header("Last-Modified: " . gmdate("D, d M Y H:i:s") . " GMT");
header("Cache-Control: no-cache, must-revalidate");
header("Content-type: text/plain; charset=utf-8");

/**
 * Set TimeZone
 */
date_default_timezone_set(MSP_TIMEZONE);

/**
 * Database connection
 */
$dbh = getVerifiedConnection($_REQUEST, array($_REQUEST["bbox"]), false) or die("");

/**
 * Get the bbox from input parameters.
 * bbox=lonMin,latMin,lonMax,latMax
 */
$wktExtent = bboxToWKTExtent($_REQUEST["bbox"]);
$wktCenter = bboxToWKTCenter($_REQUEST["bbox"]);

$utc = date('Y-m-d\TH:i:s\Z', $_SERVER["REQUEST_TIME"]);
$ip = $_SERVER["REMOTE_ADDR"];
$userid = isset($_REQUEST["userid"]) ? $_REQUEST["userid"] : "none";
$zoom = isset($_REQUEST["zoom"]) ? $_REQUEST["zoom"] : -1;
$location = "";

/**
 * Get the search location name
 * relative to countries table
 */
$query = "SELECT cntry_name FROM countries WHERE st_intersects(GeomFromText('" . $wktCenter . "',4326),the_geom)";
$result = pg_query($dbh, $query) or die("Error in SQL query: " . pg_last_error());
while ($row = pg_fetch_row($result)) {
    $location = $row[0];
}

/**
 * Insert new entry within logger table
 * and return newly created astext(center) within
 * the $result variable
 */
$fields = "(ip,utc,bbox,center,location,zoom";
$values = "('" . $ip . "','" . $utc . "',GeomFromText('" . $wktExtent . "',4326),GeomFromText('" . $wktCenter . "',4326),'".pg_escape_string($dbh, $location)."',".$zoom;
if (isset($_REQUEST["searchterms"])) {
    $fields .= ",searchterms";
    $values .= ",'" . pg_escape_string($dbh, $_REQUEST["searchterms"]) . "'";
}
if (isset($_REQUEST["searchurl"])) {
    $fields .= ",searchurl";
    $values .= ",'" . pg_escape_string($dbh, $_REQUEST["searchurl"]) . "'";
}
if (isset($_REQUEST["searchservice"])) {
    $fields .= ",searchservice";
    $values .= ",'" . pg_escape_string($dbh, $_REQUEST["searchservice"]) . "'";
}
if (is_numeric($userid)) {
    $fields .= ",userid";
    $values .= "," . $userid . "";
}
$fields .= ")";
$values .= ")";

$query = "INSERT INTO logger " . $fields . " VALUES " . $values . " RETURNING st_astext(center)";
$point = pg_query($dbh, $query) or die("Error in SQL query: " . pg_last_error());

/**
 * If realtime is set to true,
 * logs on countries are processed
 * on the fly
 */
if (isset($_REQUEST["realtime"]) && $zoom > 5) {

    /**
     * Get the max and sum values from countries visits
     */
    $query = "SELECT maxValue,sumValue FROM stats WHERE tableName='countries'";
    $stats = pg_query($dbh, $query) or die("Error in SQL query: " . pg_last_error());
    while ($stat = pg_fetch_row($stats)) {
        $max = $stat[0];
        $sum = $stat[1];
    }
    $count = 0;

    /**
     * Compute intersection between
     * new entry and :
     *  - the countries table
     *  - the worldgrid table
     */
    while ($row = pg_fetch_row($point)) {

        $count++;

        /** Table countries */
        $query = "UPDATE countries SET visits = visits + 1 WHERE st_intersects(GeomFromText('" . $row[0] . "',4326),the_geom) RETURNING visits";
        $visit = pg_query($dbh, $query) or die("Error in SQL query: " . pg_last_error());
        while ($stat = pg_fetch_row($visit)) {
            if ($stat[0] > $max) {
                $max = $stat[0];
            }
        }
    }

    /**
     * Update stats table
     */
    $query = "UPDATE stats SET maxValue=" . $max . ",sumValue=" . ($sum + $count) . ", lastupdate=now() WHERE tableName='countries'";
    pg_query($dbh, $query) or die("Error in SQL query: " . pg_last_error());
}
echo "";
pg_close($dbh);
?>
