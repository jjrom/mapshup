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
 * Avoid proxy.php hacks :)
 * 
 * @param <type> $request
 * @return <type> bolean
 */
function abcCheck($request) {
    if (!isset($request["a"]) || !isset($request["b"]) || !isset($request["c"])) {
        return false;
    }
    $a = $request["a"];
    $b = $request["b"];
    $c = $request["c"];
    if (is_numeric($a) && is_numeric($b) && is_numeric($c)) {
        if ((intval($a) + 17) - 3 * (intval($b) - 2) == intval($c)) {
            return true;
        }
    }
    return false;
}

/**
 *
 * Return a random password
 * (code snippet from http://wiki.jumba.com.au/wiki/PHP_Generate_random_password)
 *
 * @param <integer> $length : length of the password
 * @return string : random password
 *
 */
function createPassword($length) {
    $chars = "123456789abcdefghijkmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
    $i = 0;
    $password = "";
    while ($i <= $length) {
        $password .= $chars{mt_rand(0, strlen($chars) - 1)};
        $i++;
    }
    return $password;
}

/**
 * Return an array of startDate and completionDate
 * in ISO8601 format from input date or date interval
 */
function getDatesFromInterval($interval) {
    
    /*
     * Nothing in input, set an array of
     * two null values
     */
    if (!isset($interval)) {
        return array(
            'startDate' => null,
            'completionDate' => null
        );
    }
    
    /*
     * Three cases are possible
     *   - YYYY-MM-DD or YYYY-MM-DD/ => only startDate is set
     *   - YYYY-MM-DD/YYYY-MM-DD => startDate and completionDate are set
     *   - /YYYY-MM-DD => only completionDate is set
     */
    $dates = preg_split('/\//', $interval);
    
    return array(
        'startDate'=> isset($dates[0]) && $dates[0] !== "" ? addTimeToDate(urldecode($dates[0])) : null,
        'completionDate'=> isset($dates[1]) && $dates[1] !== "" ? addTimeToDate(urldecode($dates[1])) : null,
    );
    
}

/**
 *
 * Return a random session id
 *
 */
function getSessionId() {
    return md5(createPassword(5) . date("Y-m-d H:i:s"));
}

/*
 * Add T00:00:00 to  date if not already specified
 */
function addTimeToDate($date) {
    
    if ($date) {
        if (!strrpos($date, "T")) {
            return $date."T00:00:00";
        }
    }
    
    return $date;
}


/*
 * Get gravatar icon url
 * 
 * See http://en.gravata.com
 * 
 * @param $email : valid email adress
 * @param $size : size of the returned icon (in milimeters - default 20) 
 */
function getGravatar($email, $size) {
   
    // If email is not specified, return the mistery man
    return "http://www.gravatar.com/avatar/" . ($email ? md5($email) : "") . "?d=mm" . (!$size || !is_numeric($size) ? "" : "&s=" . $size);
   
}


/**
 * Return a valid db connection if :
 *   - general parameters are set
 *   - optional checklist is defined
 * Else return null
 */
function getVerifiedConnection($request, $checklist, $check) {

    if ($check) {
        if (!abcCheck($request)) {
            return null;
        }
    }

    /**
     * No DB parameters - null
     */
    if (!MSP_DB_HOST && !MSP_DB_NAME && !MSP_DB_USER && !MSP_DB_PASSWORD) {
        return null;
    }

    /**
     * Unset variables on checklist - null
     */
    foreach ($checklist as $key) {
        if (!isset($key)) {
            return null;
        }
    }

    return pg_connect("host=" . MSP_DB_HOST . " dbname=" . MSP_DB_NAME . " user=" . MSP_DB_USER . " password=" . MSP_DB_PASSWORD);
}

/**
 * Get Remote data from url using curl
 * @param <String> $url : input url to send GET request
 * @param <String> $useragent : useragent modification
 * @param <boolean> $info : set to true to return transfert info
 *
 * @return either a stringarray containing data and info if $info is set to true
 */
function getRemoteData($url, $useragent, $info) {
    if (!empty($url)) {
        $curl = initCurl($url);
        curl_setopt($curl, CURLOPT_URL, $url);
        curl_setopt($curl, CURLOPT_RETURNTRANSFER, TRUE);
        curl_setopt($curl, CURLOPT_FOLLOWLOCATION, TRUE);
        if ($useragent != null) {
            curl_setopt($curl, CURLOPT_USERAGENT, $useragent);
        }
        $theData = curl_exec($curl);
        $info == true ? $theInfo = curl_getinfo($curl) : "";
        curl_close($curl);
        return $info == true ? array("data" => $theData, "info" => $theInfo) : $theData;
    }
    return $info == true ? array("data" => "", "info" => "") : "";
}

/**
 * Set the proxy if needed
 * @param <type> $url Input url to proxify
 */
function initCurl($url) {

    /**
     * Init curl
     */
    $curl = curl_init();

    /**
     * If url is on the same domain name server
     * as _msprowser application, it is accessed directly
     * (i.e. no use of CURL proxy)
     */
    if ((substr($url, 0, 16) != "http://localhost") && (stristr($url, MSP_DOMAIN) === FALSE)) {
        if (MSP_USE_PROXY) {
            curl_setopt($curl, CURLOPT_PROXY, MSP_PROXY_URL);
            curl_setopt($curl, CURLOPT_PROXYPORT, MSP_PROXY_PORT);
            curl_setopt($curl, CURLOPT_PROXYUSERPWD, MSP_PROXY_USER . ":" . MSP_PROXY_PASSWORD);
        }
    }

    return $curl;
}

/**
 * Get a YYYY-MM-DD date and return
 * its ISO8601 version i.e. YYYY-MM-DDTHH:MM:SS
 */
function ISO8601($date) {
    if (isset($date)) {
        return $date . (!strpos($date, 'T') ? "T00:00:00Z" : "");
    }
    
    return null;
}


/**
 * Return true if input date string is ISO 8601 formatted
 * i.e. in the form YYYY-MM-DDTHH:MM:SS
 */
function isISO8601($dateStr) {
    return preg_match( '/\d{4}-\d{2}-\d{2}T\d{2}\:\d{2}\:\d{2}\/i', $dateStr );
}

/**
 * Return an OWS Exception to JSON format
 */
function OWSExceptionToJSON($xmlData) {
    $doc = new DOMDocument;
    $doc->loadXML($xmlData);
    $error = null;
    foreach ($doc->getElementsByTagNameNS('http://www.opengis.net/ows', 'ExceptionReport') as $element) {
        $error = rawurlencode(trim($element->nodeValue));
        break;
    }
    if ($error == null) {
        return null;
    }
    return json_encode(array(
        'error' => array(
            'message' => $error
        )
    ));
}

/**
 * Get Remote data from url using curl
 * @param <String> $url
 */
function postRemoteData($url, $request, $setHeaders) {

    if (!empty($url)) {
        $curl = initCurl($url);
        curl_setopt($curl, CURLOPT_URL, $url);
        curl_setopt($curl, CURLOPT_RETURNTRANSFER, TRUE);
        if ($setHeaders) {
            
            // if $setHeaders is a boolean then add default HTTPHEADERS
            if (is_bool($setHeaders) === true) {
                curl_setopt($curl, CURLOPT_HTTPHEADER, array(
                    'POST HTTP/1.1',
                    'Content-type: text/xml;charset="UTF-8"',
                    'Accept: text/xml',
                    'Cache-Control: no-cache',
                    'Pragma: no-cache',
                    'Expect:'
                ));
            }
            // if $setHeaders is an array then set HTTPHEADERS with $setHeaders content
            else if (is_array($setHeaders) === true) {
                curl_setopt($curl, CURLOPT_HTTPHEADER, $setHeaders);
            }
        }
        curl_setopt($curl, CURLOPT_POSTFIELDS, $request);
        curl_setopt($curl, CURLOPT_POST, TRUE);
        curl_setopt($curl, CURLOPT_FOLLOWLOCATION, TRUE);
        $theData = curl_exec($curl);
        curl_close($curl);
        return $theData;
    }
    return "";
}

/**
 * Stream data into file and return the fileName
 * @param <String> $data : data to write on file
 * @param <String> $filePath : file path (with path)
 * @return <String> file path (i.e. fileName prefixed by MSP_UPLOAD_DIR)
 */
function saveFile($theData, $filePath) {

    $handle = fopen($filePath, 'w');
    if (!$handle) {
        return null;
    }
    fwrite($handle, $theData);
    fclose($handle);
    return $filePath;
}

?>