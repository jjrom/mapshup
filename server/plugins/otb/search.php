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
$error = '"error":{"message":"Error : cannot connect to products catalog"}';

$dbh = pg_connect("host=localhost dbname=jeotb user=otb password=otb00") or die(pg_last_error());

$where = "";

/**
 * Optional input bbox
 */
if (isset($_REQUEST['bbox']) && $_REQUEST['bbox'] != "") {
    $where = " WHERE ST_intersects(footprint, GeomFromText('" . bboxToWKTExtent($_REQUEST['bbox']) . "', 4326))";
}

/*
 * Launch search query
 * 
 *  identifier        VARCHAR(250),
 *  acquisition       TIMESTAMP,
 *  archive           TEXT,
 *  creation          TIMESTAMP,
 *  description       TEXT,
 *  location          VARCHAR(250),
 *  metadata          TEXT,
 *  title             VARCHAR(250),
 *  type              VARCHAR(250),
 *  wms_layer         VARCHAR(250),
 *  wms_url           TEXT
 * 
 */
$query = "SELECT identifier, acquisition, archive, creation, description, location, metadata, title, type, wms_layer, wms_url, ST_AsGeoJSON(footprint) AS geojson FROM products" . $where;
$results = pg_query($dbh, $query) or die(pg_last_error());

/*
 * Initialize GeoJSON empty FeatureCollection
 */
$geojson = array(
    'type' => 'FeatureCollection',
    'features' => array()
);

/*
 * Retrieve each products
 */
while ($product = pg_fetch_assoc($results)) {

    $feature = array(
        'type' => 'Feature',
        'geometry' => json_decode($product['geojson'], true),
        'properties' => array(
            'identifier' => $product['identifier'],
            'title' => $product['title'],
            'description' => $product['description'],
            'location' => $product['location'],
            'type' => $product['type'],
            'acquisition' => $product['acquisition'],
            'metadata' => $product['metadata'],
            'archive' => $product['archive'],
            '_jadd' => array(
                'title' => "View full resolution product",
                'layer' => array(
                    'type' => 'WMS',
                    'title' => 'Product',
                    'url' => $product['wms_url'],
                    'layers' => $product['wms_layer'],
                    'srs' => 'EPSG:3857'
                )
            )
        )
    );

    // Add feature array to feature collection array
    array_push($geojson['features'], $feature);
}

/*
 * Close database connection
 */
pg_close($dbh);

/*
 * Return GeoJSON result
 */
echo json_encode($geojson);
?>
