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
 * Set TimeZone
 */
date_default_timezone_set("Europe/Paris");

/*
 * This application can only be called from a shell (not from a webserver)
 */
if (empty($_SERVER['SHELL'])) {
    exit;
}

/*
 * Get file path from command line first argument
 */
$file = $_SERVER['argv'][1];

/*
 * Input xml product descriptor is mandatory
 */
if (empty($file)) {
    echo "\n    Usage : " . $_SERVER['argv'][0] . " path_to_product.xml" . "\n\n";
    exit;
}

/*
 * Input xml product must exist
 */
if (!file_exists($file)) {
    echo "\n    ERROR : " . $file . " does not exists" . "\n\n";
    exit;
}

/*
 * Input xml product descriptor must exist and be a valid XML document
 */
$doc = new DOMDocument();
$doc->load($file);

if ($doc->getElementsByTagname('OTBProduct')->item(0) == NULL) {
    echo "\n    ERROR : " . $file . " is not a valid jeotb product descriptor" . "\n\n";
    exit;
}

/**
 * Database connection
 */
$dbh = pg_connect("host=localhost dbname=jeotb user=otb password=otb00") or die("Database connection error");

/**
 * Insert new entry within logger table
 * and return newly created astext(center) within
 * the $result variable
 */
$fields = "(identifier,acquisition,archive,creation,description,location,metadata,title,type,wms_layer,wms_url,footprint)";
$values = "'"
        . pg_escape_string($doc->getElementsByTagName('identifier')->item(0)->nodeValue) . "','"
        . pg_escape_string($doc->getElementsByTagName('acquisition')->item(0)->nodeValue) . "','"
        . pg_escape_string($doc->getElementsByTagName('archive')->item(0)->nodeValue) . "','"
        . date('Y-m-d\TH:i:s\Z', $_SERVER["REQUEST_TIME"]) . "','"
        . pg_escape_string($doc->getElementsByTagName('description')->item(0)->nodeValue) . "','"
        . pg_escape_string($doc->getElementsByTagName('town')->item(0)->nodeValue) . ", " . $doc->getElementsByTagName('country')->item(0)->nodeValue . "','"
        . pg_escape_string($doc->getElementsByTagName('metadata')->item(0)->nodeValue) . "','"
        . pg_escape_string($doc->getElementsByTagName('title')->item(0)->nodeValue) . "','"
        . pg_escape_string($doc->getElementsByTagName('type')->item(0)->nodeValue) . "','"
        . pg_escape_string($doc->getElementsByTagName('layer')->item(0)->nodeValue) . "','"
        . pg_escape_string($doc->getElementsByTagName('url')->item(0)->nodeValue) . "',"
        . "GeomFromText('" . $doc->getElementsByTagName('footprint')->item(0)->nodeValue . "',4326)";

$query = "INSERT INTO products " . $fields . " VALUES (" . $values . ")";
pg_query($dbh, $query) or die("Error in SQL query: " . pg_last_error());
pg_close($dbh);
?>
