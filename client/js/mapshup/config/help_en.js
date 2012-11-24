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
 * Help configuration file for english
 */
(function(c) {
    
    c["help"] = {
        items:[
        // Map
        {
            html:'<h1>Map</h1><p>Use the <span class="hilite">mouse wheel</span> to zoom in or zoom out within the map. To zoom on a specific area, you can <span class="hilite">define a box with SHIFT+click</span>.</p><p>If you press the mouse left button for more than 200ms, a <span class="hilite">contextual menu</span> will open on release. This menu gives you access to actions like distance measurement, layer drawing, etc.</p><p>You can <span class="hilite">drag&amp;drop</span> a file or a url directly on the map. If you do so, mapshup will analyse the dropped object and try to add it as a new layer (if it makes sense :). Supported format are WMS, WFS, CSW, GeoJSON, GPS file (.gpx), GeoRSS, Atom feed, KML and image file (GPS positionning information are read from jpeg file).</p>',
            position:{
                top:'50%',
                left:'450px'
            }
        },
        // Search bar
        {
            html:'<h1>Search bar</h1><p>Type <span class="hilite">keywords</span> (e.g. Toulouse,France) to launch a search. A popup will open and ask you which ressource to search for.</p><p>Add a <span class="hilite">prefix</span> to your search to directly search for a particular ressource. Supported prefixes are : "<span class="hilite">p:</span>" to search for photos; "<span class="hilite">t:</span>" to search for <span class="hilite">toponyms</span>; "<span class="hilite">v:</span>" to search for <span class="hilite">videos</span>; "<span class="hilite">w:</span>" to search for <span class="hilite">wikipedia articles</span>. For instance, if you want to search for photos of Toulouse, type "p:toulouse".</p></p>Enter a <span class="hilite">couple of latitude longitude coordinates</span> in decimal degrees to center the map on these coordinates (e.g. "43.6 1.43").</p><p>Enter an <span class="hilite">url</span> to <span class="hilite">add a layer on the map</span>. The adding processus is exactly the same as if you <span class="hilite">drag&amp;drop</span> the url within the map.</p>',
            position:{
                top:'50px',
                left:'30px'
            }
        },
        // Header
        {
            html:'<h1>Header</h1><p>Click on one of the <span class="hilite">capital letter</span> right to the search bar <span class="hilite">to change the map background</span> accordingly.</p><p>Click the share button <img class="middle" src="'+M.Util.getImgUrl("share.png")+'"/> to save the current context and <span class="hilite">share the map</span> through <span class="hilite">facebook, twitter or by email</span>.</p><p>If you are <span class="hilite">logged</span> to the application, your map <span class="hilite">context will be automatically saved</span> when the browser is closed. Thus, when you reconnect to the application, you will get your context back !</p>',
            position:{
                top:'50px',
                left:'450px',
                maxWidth:'400px'
            }
        },
        // Toolbar
        {
            html:'<h1>Navigation toolbar</h1><p>The left toolbar contains navigation tools to navigate within the map.</p>',
            position:{
                top:'150px',
                right:'50px',
                maxWidth:'250px'
            }
        },
        // South bar
        {
            html:'<h1>Applications panel</h1><p>Click on a tab name to open (or close) the corresponding application</p>',
            position:{
                bottom:'50px',
                left:'30px'
            }
        }
        ]
    };
    
})(window.M.Config);