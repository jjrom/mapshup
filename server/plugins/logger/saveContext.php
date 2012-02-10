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
 * This script returns JSON
 */
header("Pragma: no-cache");
header("Expires: 0");
header("Last-Modified: " . gmdate("D, d M Y H:i:s") . " GMT");
header("Cache-Control: no-cache, must-revalidate");
header("Content-type: application/json; charset=utf-8");

/**
 * Database connection
 */
$dbh = getVerifiedConnection($_REQUEST, array($_POST["bbox"], $_POST["context"]), true) or die('{"error":{"message":"Error : cannot save context"}}');

/**
 * Get the bbox from input parameters.
 * bbox=lonMin,latMin,lonMax,latMax
 */
$wktCenter = bboxToWKTCenter($_POST["bbox"]);
$context = $_POST["context"];

$error = '{"error":{"message":"Error : cannot save context"}}';

/*
 * No context
 */
if ($context == "") {
    echo $error;
    exit(0);
}

/*
 * userid is not mandatory
 */
$userid = -1;
if (isset($_POST["userid"])) {
    $userid = $_POST["userid"];
}

/*
 * Compute a crc identifier from context
 */
$uid = md5($context);

/**
 * Get the search location name
 * relative to countries table
 */
$query = "SELECT cntry_name FROM countries WHERE st_intersects(GeomFromText('" . $wktCenter . "',4326),the_geom)";
$result = pg_query($dbh, $query) or die($error);
$location = "Somewhere";
while ($row = pg_fetch_row($result)) {
    $location = $row[0];
}

/**
 * Insert new entry within contexts table
 */
$fields = "(userid, location, context, uid)";
$values = "(" . pg_escape_string($userid) . ",'" . pg_escape_string($location) . "','" . pg_escape_string($context) . "','" . pg_escape_string($uid) . "')";
$query = "INSERT INTO contexts " . $fields . " VALUES " . $values . " RETURNING utc";
$result = pg_query($dbh, $query) or die($error);
while ($row = pg_fetch_row($result)) {
    $utc = $row[0];
}

pg_close($dbh);

echo '{"result":[{"uid":"' . $uid . '","location":"' . $location . '","utc":"' . $utc . '"}]}';
?>
