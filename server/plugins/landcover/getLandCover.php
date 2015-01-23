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

/*
 * This script returns json
 */
header("Pragma: no-cache");
header("Expires: 0");
header("Last-Modified: " . gmdate("D, d M Y H:i:s") . " GMT");
header("Cache-Control: no-cache, must-revalidate");
header("Content-type: application/json; charset=utf-8");

/*
 * Get input json
 */
$json = isset($_POST["json"]) ? json_decode($_POST["json"]) : NULL;

/*
 * Check abc
 */
if (abcCheck($_REQUEST) && $json != NULL) {

    /*
     * The tile Bing pattern :
     * http://ecn.t3.tiles.virtualearth.net/tiles/a02.jpeg?g=687&mkt={culture}
     *
     * The urls are sent as a serialized json string :
     *
     * {tiles: [[item1, item2, etc.],[itemn, itemm, etc.],..,[itemy, itemz, etc.]]}
     *             line 1              line 2                 line n
     *
     * where items are objects with the following properties
     * {
     *      url:
     *      srs:
     *      bounds:{
     *          bottom:
     *          top:
     *          left:
     *          right:
     *      }
     *  }
     */
    foreach ($json->tiles as $row) {
        foreach ($row as $tile) {
            $arr = explode('/', $tile->url);
            $arr = explode('\.', $arr[count($arr) - 1]);
            $name = $arr[0];

            /*
             * If file exists, no need to upload it again !
             */
            if (!file_exists(MSP_UPLOAD_DIR . $name . ".tif")) {
                saveFile(getRemoteData($tile->url, null, false), MSP_UPLOAD_DIR . $name . ".jpeg");
                exec(MSP_GDAL_TRANSLATE_PATH . ' -of GTiff -a_srs ' . $tile->srs . ' -a_ullr ' . $tile->bounds->left . ' ' . $tile->bounds->top . ' ' . $tile->bounds->right . ' ' . $tile->bounds->bottom . ' '. MSP_UPLOAD_DIR . $name . '.jpeg '. MSP_UPLOAD_DIR . $name . '.tif');
            }
            $unique .= $name;
            $inputs .= " " . MSP_UPLOAD_DIR . $name . ".tif";
        }
    }

    /*
     * Generate the mosaic if it not already exists
     */
    $unique = md5($unique) . ".tif";
    if (!file_exists(MSP_UPLOAD_DIR . $unique)) {
        exec(MSP_GDAL_MERGE_PATH . ' -o ' . MSP_UPLOAD_DIR . $unique . $inputs);
    }

    $json = array(
        'success' => true,
        'url' => MSP_GETFILE_URL . $unique . "&stream=true"
    );

    echo json_encode($json);
} else {
    echo '{"success":false, "error":"Error : cannot perform action"}';
}
?>