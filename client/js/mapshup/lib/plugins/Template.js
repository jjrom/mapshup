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
 * PLUGIN: Template
 *
 * This plugin does nothing
 * It is an exhaustive template that should be
 * used for plugin creation
 *********************************************/

/**
 * Plugin "Template" will be loaded by msp if :
 *  1. the entry "Template" exists within the plugins list in
 *     msp configuration file
 *        plugins:[
 *           {...},
 *           {
 *               name:"Template",
 *               options:{
 *                   useCSS:true
 *                   // Your options here
 *               }
 *           },
 *           {...}
 *        ]
 *   2. the plugin "Template" is valid
 *
 * Plugin "Template" is valid if and only if :
 *   1. the plugin filename is "Template.js"
 *   2. the plugin file is put within js/msp/plugins directory
 *   3. the plugin describe all mandatories methods
 *
 * Best practice : if the plugin "Template" needs specific CSS, the CSS file should
 * be named "Template.css" and appended to the plugins directory. In this case,
 * the plugin options property "useCSS" should be set to true (see msp configuration file)
 *
 */
msp.plugins["Template"] = {

    /**
     * Initialize plugin
     *
     * This is MANDATORY
     */
    init: function(options) {

        /**
         * Best practice : init options
         */
        this.options = options || {};

        // Define your default options values here

        /*
         * If the plugin needs plugin "Parent" to work,
         * the plugin name should be "Template_Parent"
         * and not "Template".
         *
         * First check if the "Parent" plugin is loaded.
         * If it is not loaded, then the "Template_Parent"
         * should not be loaded (i.e. returns false)
         *
         *
         *      var parent = msp.plugins["Parent"];
         *      if (!parent || !parent.isLoaded) {
         *          return false;
         *      }
         *
         */
        
        // Write your code here

        /*
         * VERY IMPORTANT : if return value is false, the plugin will
         * not be added to msp
         */
        return true;
    },

    /**
     * This method is called during msp.plugins["Geonames"] initialisation
     * It should be used to add items to the Geonames menu
     */
    getGeonamesMenuItems: function(toponym) {
        return {
            id:msp.Util.getId(),
            icon:msp.Util.getImgUrl("template.png"), // Replace with your code
            title:"My template", // Replace with your code
            description:"My template description", // Replace with your code
            javascript:function() {
                // Write your code here
                return false;
            }

        }
    },

    /**
     * This method is called by LayersManager plugin
     * It should be used to add items to the Geonames menu
     */
    getLayersManagerMenuItems: function(layer,li) {
        return {
            id:msp.Util.getId(),
            icon:msp.Util.getImgUrl("template.png"), // Replace with your code
            title:"Template", // Replace with your code
            javascript:function() {
                // Your code here
                return false;
            }
        }
    },

    /**
     * This method is called during msp.menu initialisation
     * It should be used to add items to the menu
     */
    getMenuItems: function() {
        return {
            id:msp.Util.getId(),
            icon:msp.Util.getImgUrl("template.png"), // Replace with your code
            title:"My template", // Replace with your code
            description:"",
            javascript:function() {
                // Write your code here
                msp.menu.hide();
                return false;
            }
        }
    },

    /**
     * This method is triggered after msp.Map.map.layers changed
     * (i.e. successfull addLayer or removeLayer)
     * 
     * @input action : "add", "remove", "update" or "features"
     * @input layer : added or removed layer - undefined for "init" action
     */
    onLayersEnd: function(action, layer, scope) {
        // Write your code here
    },

    /**
     * This method is triggered by msp.Map objectafter a "moveend" event call
     */
    onMoveEnd: function(map, scope) {
        // Write your code here
    },

    /**
     * This method is triggered by msp.Map object after a changeSize() call
     */
    onResizeEnd: function(scope) {
        // Write your code here
    }

};
