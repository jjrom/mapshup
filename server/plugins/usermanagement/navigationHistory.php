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

/**
 * This script returns GeoJSON
 */
header("Pragma: no-cache");
header("Expires: 0");
header("Last-Modified: " . gmdate("D, d M Y H:i:s") . " GMT");
header("Cache-Control: no-cache, must-revalidate");
header("Content-type: application/json; charset=utf-8");

/**
 * Database connection
 */
$dbh = getVerifiedConnection($_REQUEST, array($_REQUEST["userid"]), false) or die ('{"error":{"message":"Problem on database connection"}}');

/**
 * Get userid and check for validity
 * Note : userid -1 is not allowed
 */
$userid = isset($_REQUEST["userid"]) ? $_REQUEST["userid"] : -1;
$perpage = isset($_REQUEST["perpage"]) ? $_REQUEST["perpage"] : 5;
$page = isset($_REQUEST["page"]) ? $_REQUEST["page"] : 1;
if (!is_numeric($perpage)) {
    $perpage = 5;
}
if (!is_numeric($page)) {
    $page = 1;
}   
if (!is_numeric($userid) || $userid == -1) {
    die('{"error":{"message":"Invalid userid"}}');
}

/**
 * Get navigation history from userid
 */
$query = "SELECT count(*) FROM logger WHERE userid=" . $userid;
$result = pg_query($dbh, $query) or die("Error in SQL query: " . pg_last_error());
$total = 0;
while ($row = pg_fetch_row($result)) {
    $total = $row[0];
}
$query = "SELECT gid,utc,location,astext(center),zoom FROM logger WHERE userid=" . $userid . " ORDER by gid DESC LIMIT " .$perpage." OFFSET ".($perpage*($page - 1));
$results = pg_query($dbh, $query) or die("Error in SQL query: " . pg_last_error());
$entries = array();
$json = "";
$count = 0;
$tbr = array("POINT(",")");

while ($row = pg_fetch_row($results)) {
    $center = str_replace($tbr, "", $row[3]);
    $props = array('gid' => $row[0],
        'utc' => $row[1],
        'location' => $row[2],
        'center' => $center,
        'zoom' => $row[4]);
    if ($count > 0) {
        $json .= ',';
    }
    $json .= json_encode($props);
    $count++;
}
echo '{"total":"' . $total . '","page":' . $page . ', "perpage":' . $perpage . ',"items":[' . $json . ']}';
pg_close($dbh);
?>
