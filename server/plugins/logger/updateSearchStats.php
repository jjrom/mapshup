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

/**
 * Full update => clean stats values
 * and do a full reprocessing
 */
if ($action == "full") {

    /**
     * Unset keywords
     */
    $query = "DELETE FROM keywords";
    $result = pg_query($dbh, $query) or die("Error in SQL query: " . pg_last_error());

    /**
     * Prepare a query on all logger entries
     * with a non null searchterms entry
     */
    $query = "SELECT searchterms FROM logger WHERE logger.searchterms IS NOT NULL";
} else if ($action == "incremental") {

    /**
     * Get the lastupdate value from the stats
     */
    $query = "SELECT lastupdate FROM stats WHERE tablename='keywords'";
    $result = pg_query($dbh, $query) or die("Error in SQL query: " . pg_last_error());
    while ($row = pg_fetch_row($result)) {
        $lastupdate = $row[0];
    }

    /**
     * Prepare a query on all logger entries
     * that occurs AFTER lastupdate
     */
    $query = "SELECT searchterms FROM logger WHERE searchterms IS NOT NULL AND utc > '" . $lastupdate . "'";
} else {
    echo "You need to specify an action : full or incremental";
    pg_close($dbh);
    exit(0);
}

/**
 * Get all keywords
 */
$results = pg_query($dbh, $query) or die("Error in SQL query: " . pg_last_error());
$countUpdate = 0;
$countNew = 0;
while ($row = pg_fetch_row($results)) {

    /**
     * row[0] is the comma separated keywords string
     */
    $keywords = preg_split('/,/', $row[0]);
    $length = count($keywords);
    for ($i = 0; $i < $length; $i++) {
        $query = "SELECT count(*) FROM keywords WHERE keyword='" . $keywords[$i] . "'";
        $result = pg_query($dbh, $query) or die("Error in SQL query: " . pg_last_error());
        while ($keywordcount = pg_fetch_row($result)) {

            /**
             * Keyword already exist => update hits
             * else add a new entry in keywords
             */
            if ($keywordcount[0] > 0) {
                $query = "UPDATE keywords SET hits = hits + 1 WHERE keyword='" . $keywords[$i] . "'";
                pg_query($dbh, $query) or die("Error in SQL query: " . pg_last_error());
                $countUpdate++;
            } else {
                $query = "INSERT INTO keywords (keyword,hits) VALUES('" . $keywords[$i] . "', 1)";
                pg_query($dbh, $query) or die("Error in SQL query: " . pg_last_error());
                $countNew++;
            }
        }
    }
}
/**
 * Update the stats values and
 * set the lastupdate to now()
 * (for further action="incremental"
 */
$query = "UPDATE stats SET sumvalue= -1, maxvalue= -1,lastupdate=now() WHERE tablename='keywords'";
pg_query($dbh, $query) or die("Error in SQL query: " . pg_last_error());

echo "New : " . $countNew . " entries -- ";
echo "Update : " . $countUpdate . " entries";
pg_close($dbh);
?>
