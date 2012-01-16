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
/*********************************************
 *
 * Plugin Flickr
 * Add a "flickr" search icon within the geonames menu
 * 
 * This plugin requires that the Geonames plugin
 * is loaded BEFORE this plugin
 *
 *********************************************/
(function(msp) {
    
    msp.Plugins.Flickr = function() {
        
        /*
         * Only one Flickr object instance is created
         */
        if (msp.Plugins.Flickr._o) {
            return msp.Plugins.Flickr._o;
        }
        
        /**
         * Init plugin
         */
        this.init = function(options) {
            
            /*
             * Init options
             */
            this.options = options || {};
            
            /*
             * Add a "Flickr" search action to the geonames menu
             * This action launch a flickr search limited to the map
             * view and constraint with the name
             */
            if (msp.Plugins.Geonames._o) {
                
                msp.Plugins.Geonames._o.add([{
                    id:msp.Util.getId(),
                    ic:"flickr.png",
                    ti:"Search for related images",
                    cb:function(toponym) {
                        msp.Map.addLayer({
                            type:"Flickr",
                            title:toponym.name+", "+toponym.countryName,
                            userID:"",
                            q:msp.Util.encode(toponym.name),
                            machineTags:""
                        });
                    }
                }]);
                
            }
            
            return this;
            
        };

        /*
         * Set unique instance
         */
        msp.Plugins.Flickr._o = this;
        
        return this;
        
    };
})(window.msp);