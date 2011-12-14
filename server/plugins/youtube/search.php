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

/* ==================================== FUNCTIONS ================================ */
//============== FUNCTIONS ===========================
/*
 * Example of response
 *
  <entry>
  <id>http://gdata.youtube.com/feeds/api/videos/xIGp6N19Vrw</id>
  <published>2009-06-16T18:08:07.000Z</published>
  <updated>2010-10-17T21:37:29.000Z</updated>
  <category scheme='http://schemas.google.com/g/2005#kind' term='http://gdata.youtube.com/schemas/2007#video'/>
  <category scheme='http://gdata.youtube.com/schemas/2007/categories.cat' term='Music' label='Musique'/>
  <category scheme='http://gdata.youtube.com/schemas/2007/keywords.cat' term='Jimmy'/>
  <category scheme='http://gdata.youtube.com/schemas/2007/keywords.cat' term='Buffett'/>
  <category scheme='http://gdata.youtube.com/schemas/2007/keywords.cat' term='Live'/>
  <category scheme='http://gdata.youtube.com/schemas/2007/keywords.cat' term='surfing'/>
  <category scheme='http://gdata.youtube.com/schemas/2007/keywords.cat' term='surfin&apos;'/>
  <category scheme='http://gdata.youtube.com/schemas/2007/keywords.cat' term='hurricane'/>
  <category scheme='http://gdata.youtube.com/schemas/2007/keywords.cat' term='concord'/>
  <title type='text'>Surfing in a Hurricane Jimmy Buffett LIVE! Concord CA</title>
  <content type='text'>Update....Nov.21...This is Jimmy's first surfing song and I WAS THERE! ....Was so EXCELLENT! Captured the audio from XM Radio Ch 55 Radio Margaritaville. Whole concert rocked and recorded really well. Can't wait for the album Dec. 8. Odd to know a song so well before it's even released.</content>
  <link rel='alternate' type='text/html' href='http://www.youtube.com/watch?v=xIGp6N19Vrw&amp;feature=youtube_gdata'/>
  <link rel='http://gdata.youtube.com/schemas/2007#video.responses' type='application/atom+xml' href='http://gdata.youtube.com/feeds/api/videos/xIGp6N19Vrw/responses'/>
  <link rel='http://gdata.youtube.com/schemas/2007#video.related' type='application/atom+xml' href='http://gdata.youtube.com/feeds/api/videos/xIGp6N19Vrw/related'/>
  <link rel='http://gdata.youtube.com/schemas/2007#mobile' type='text/html' href='http://m.youtube.com/details?v=xIGp6N19Vrw'/>
  <link rel='self' type='application/atom+xml' href='http://gdata.youtube.com/feeds/api/videos/xIGp6N19Vrw'/>
  <author>
  <name>beniciasteve</name>
  <uri>http://gdata.youtube.com/feeds/api/users/beniciasteve</uri>
  </author>
  <gd:comments>
  <gd:feedLink href='http://gdata.youtube.com/feeds/api/videos/xIGp6N19Vrw/comments' countHint='5'/>
  </gd:comments>
  <georss:where>
  <gml:Point>
  <gml:pos>37.95962905883789 -121.93965911865234</gml:pos>
  </gml:Point>
  </georss:where>
  <media:group>
  <media:category label='Musique' scheme='http://gdata.youtube.com/schemas/2007/categories.cat'>Music</media:category>
  <media:content url='http://www.youtube.com/v/xIGp6N19Vrw?f=videos&amp;app=youtube_gdata' type='application/x-shockwave-flash' medium='video' isDefault='true' expression='full' duration='241' yt:format='5'/>
  <media:content url='rtsp://v4.cache7.c.youtube.com/CiILENy73wIaGQm8Vn3d6KmBxBMYDSANFEgGUgZ2aWRlb3MM/0/0/0/video.3gp' type='video/3gpp' medium='video' expression='full' duration='241' yt:format='1'/>
  <media:content url='rtsp://v4.cache6.c.youtube.com/CiILENy73wIaGQm8Vn3d6KmBxBMYESARFEgGUgZ2aWRlb3MM/0/0/0/video.3gp' type='video/3gpp' medium='video' expression='full' duration='241' yt:format='6'/>
  <media:description type='plain'>Update....Nov.21...This is Jimmy's first surfing song and I WAS THERE! ....Was so EXCELLENT! Captured the audio from XM Radio Ch 55 Radio Margaritaville. Whole concert rocked and recorded really well. Can't wait for the album Dec. 8. Odd to know a song so well before it's even released.</media:description>
  <media:keywords>Jimmy, Buffett, Live, surfing, surfin', hurricane, concord</media:keywords>
  <media:player url='http://www.youtube.com/watch?v=xIGp6N19Vrw&amp;feature=youtube_gdata_player'/>
  <media:thumbnail url='http://i.ytimg.com/vi/xIGp6N19Vrw/2.jpg' height='90' width='120' time='00:02:00.500'/>
  <media:thumbnail url='http://i.ytimg.com/vi/xIGp6N19Vrw/1.jpg' height='90' width='120' time='00:01:00.250'/>
  <media:thumbnail url='http://i.ytimg.com/vi/xIGp6N19Vrw/3.jpg' height='90' width='120' time='00:03:00.750'/>
  <media:thumbnail url='http://i.ytimg.com/vi/xIGp6N19Vrw/0.jpg' height='240' width='320' time='00:02:00.500'/>
  <media:title type='plain'>Surfing in a Hurricane Jimmy Buffett LIVE! Concord CA</media:title>
  <yt:duration seconds='241'/>
  </media:group>
  <gd:rating average='4.75' max='5' min='1' numRaters='4' rel='http://schemas.google.com/g/2005#overall'/>
  <yt:recorded>2009-05-19</yt:recorded>
  <yt:statistics favoriteCount='13' viewCount='3575'/>
  </entry>
 *
 */
function toGeoJSON($resultFileURI) {

    $doc = new DOMDocument();

    /*
     * Load error => return an empty GeoJSON
     */
    if (@$doc->load($resultFileURI) === false) {
        $geojson = array(
            'type' => 'FeatureCollection',
            'features' => array()
        );
        return json_encode($geojson);
    }

    $entries = $doc->getElementsByTagname('entry');

    /*
     * No SearchResult => return an empty GeoJSON
     */
    if ($entries->item(0) == null) {
        $geojson = array(
            'type' => 'FeatureCollection',
            'features' => array()
        );
        return json_encode($geojson);
    }

    /*
     * GeoJSON
     */
    $geojson = array(
        'type' => 'FeatureCollection',
        'features' => array()
    );

    foreach ($entries as $entry) {
        $pos = $entry->getElementsByTagName('pos')->item(0)->nodeValue;
        if ($pos) {

            /**
             * Order of $coord = lat,lon
             */
            $coords = explode(" ", $pos);

            /**
             * Add feature
             */
            $feature = array(
                'type' => 'Feature',
                'geometry' => pointToGeoJSONGeometry($coords[1], $coords[0]),
                'properties' => array(
                    'name' => $entry->getElementsByTagName('title')->item(0)->nodeValue,
                    'description' => $entry->getElementsByTagName('description')->item(0)->nodeValue,
                    'url' => $entry->getElementsByTagName('player')->item(0)->getAttribute('url'),
                    'thumbnail' => $entry->getElementsByTagName('thumbnail')->item(0)->getAttribute('url')
                )
            );

            // Add feature array to feature collection array
            array_push($geojson['features'], $feature);
        }
    }

    return json_encode($geojson);
}
/* ================================== END FUNCTIONS ============================== */

/**
 * This script returns JSON
 */
header("Pragma: no-cache");
header("Expires: 0");
header("Last-Modified: " . gmdate("D, d M Y H:i:s") . " GMT");
header("Cache-Control: no-cache, must-revalidate");
header("Content-type: application/json; charset=utf-8");

/*
 * Youtube endpoint
 *
 * Request example :
 * http://gdata.youtube.com/feeds/api/videos?q=test&location=lon,lat&location-radius=200km
 *
 */

/*
 * Search terms
 */
$q = str_replace(" ", ",", isset($_REQUEST["q"]) ? $_REQUEST["q"] : "");

$url = 'http://gdata.youtube.com/feeds/api/videos?' . "q=" . $q;
if (isset($_REQUEST['bbox'])) {
    $bbox = preg_split('/,/', $_REQUEST['bbox']);
    $lon = ($bbox[0] + $bbox[2]) / 2;
    $lat = ($bbox[1] + $bbox[3]) / 2;
    $oneDegreeInKm = 111 * cos(deg2rad($lat));
    /**
     * Location-radius cannot be greater than 1000 km
     * See Google API :
     * http://code.google.com/intl/fr/apis/youtube/2.0/developers_guide_protocol.html#location-radiussp
     *
     */
    $locationradius = max(round($oneDegreeInKm * (($bbox[3] - $bbox[1]) / 2)), 999);
    $url .= '&location=' . $lat . ',' . $lon . '&location-radius=' . $locationradius . 'km';
}

/**
 * Get the data from youtube
 */
echo toGeoJSON(saveFile(getRemoteData($url, null, false), MSP_UPLOAD_DIR . "youtube_" . createPassword(10) . ".xml"));
?>