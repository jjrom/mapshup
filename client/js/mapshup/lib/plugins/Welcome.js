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
 * Plugin Welcome
 *
 * Display a welcome window on top of the map
 *
 *********************************************/
(function(msp) {
    
    msp.Plugins.Welcome = function() {
        
        /*
         * Only one Wikipedia object instance is created
         */
        if (msp.Plugins.Welcome._o) {
            return msp.Plugins.Welcome._o;
        }
        
        /*
         * Initialization
         */
        this.init = function (options) {

            var self = this;
            
            /*
             * init options
             */
            self.options = options || {};

            if (self.options.url) {

                var pn = new msp.Panel('s'), // Create new South panel
                    ctn = pn.add('<iframe class="frame" src="'+msp.Util.getAbsoluteUrl(self.options.url)+'" width="100%" height="100%"></iframe>'); // Add container within panel

                /*
                 * Set container content
                 */
                msp.activity.show();
                $('.frame', ctn.$d).load(function() {
                    msp.activity.hide();
                });

                /*
                 * Register open elevation action within Toolbar South south toolbar
                 */
                (new msp.Button({
                    tt:"Welcome",
                    tb:new msp.Toolbar('ss', 'h'),
                    title:msp.Util._("Welcome"),
                    container:ctn,
                    close:true,
                    activable:true,
                    scope:self,
                    /*
                     * On first load, recenter the map
                     */
                    onshow:function(btn) {
                        if (!btn._init) {
                            msp.Map.setCenter(msp.Map.Util.d2p(new OpenLayers.LonLat(msp.Map.initialLocation.lon,msp.Map.initialLocation.lat)), msp.Map.initialLocation.zoom, true);
                            btn._init = true;
                        }
                    }
                })).trigger();
                
            }
            else {
                return null;
            }

            return self;
            
        };
        
        /*
         * Set unique instance
         */
        msp.Plugins.Welcome._o = this;
        
        return this;
    };
})(window.msp);