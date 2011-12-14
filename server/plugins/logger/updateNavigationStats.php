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

if (!abcCheck($_REQUEST)) {
    echo "";
    exit(0);
}

$dbh = pg_connect("host=" . MSP_DB_HOST . " dbname=" . MSP_DB_NAME . " user=" . MSP_DB_USER . " password=" . MSP_DB_PASSWORD);
if (!$dbh) {
    die("Error in connection: " . pg_last_error());
}

$action = isset($_REQUEST["action"]) ? $_REQUEST["action"] : "";
$tablename = isset($_REQUEST["tablename"]) ? $_REQUEST["tablename"] : "";
$zoom = 5;

if ($tablename != "worldgrid" && $tablename != "countries") {
    echo "You must specify a tablename : worldgrid or countries";
    pg_close($dbh);
    exit(0);
}

/**
 * Full update => clean stats values
 * and do a full reprocessing
 */
if ($action == "full") {

    /**
     * Unset visits counters
     */
    $query = "UPDATE " . $tablename . " SET visits = 0";
    $result = pg_query($dbh, $query) or die("Error in SQL query: " . pg_last_error());

    /**
     * Prepare a query on all logger entries
     */
    $query = "SELECT " . $tablename . ".gid FROM " . $tablename . ", logger WHERE logger.zoom > ".$zoom." AND logger.searchurl IS NULL AND st_intersects(logger.center," . $tablename . ".the_geom) order by " . $tablename . ".gid";
}
else if ($action == "incremental") {
    
    /**
     * Get the lastupdate value from the stats
     */
    $query = "SELECT lastupdate FROM stats WHERE tablename='" . $tablename . "'";
    $result = pg_query($dbh, $query) or die("Error in SQL query: " . pg_last_error());
    while($row = pg_fetch_row($result)) {
        $lastupdate = $row[0];
    }

    /**
     * Prepare a query on all logger entries
     * that occurs AFTER lastupdate
     */
    $query = "SELECT " . $tablename . ".gid FROM " . $tablename . ", logger WHERE logger.zoom > ".$zoom." AND logger.searchurl IS NULL AND logger.utc > '" . $lastupdate . "' AND st_intersects(logger.center," . $tablename . ".the_geom) order by " . $tablename . ".gid";

}
else {
    echo "You need to specify an action : full or incremental";
    pg_close($dbh);
    exit(0);
}

/**
 * Get intersections and update
 * visits on worldgrid cells
 */
$results = pg_query($dbh, $query) or die("Error in SQL query: " . pg_last_error());
$count = 0;
while ($row = pg_fetch_row($results)) {
    $query = "UPDATE " . $tablename . " SET visits = visits + 1 WHERE gid=" . $row[0];
    pg_query($dbh, $query) or die("Error in SQL query: " . pg_last_error());
    $count++;
}

/**
 * Update the stats values and
 * set the lastupdate to now()
 * (for further action="incremental"
 */
$query = "SELECT sum(visits), max(visits) FROM ". $tablename;
$result = pg_query($dbh, $query) or die("Error in SQL query: " . pg_last_error());
while ($row = pg_fetch_row($result)) {
    $query = "UPDATE stats SET sumvalue=" . $row[0] . ",maxvalue=" . $row[1] . ",lastupdate=now() WHERE tablename='" . $tablename . "'";
    pg_query($dbh, $query) or die("Error in SQL query: " . pg_last_error());
}

echo "Update : " . $count . " entries";
/**
 * Close the db connection
 */
pg_close($dbh);

?>
