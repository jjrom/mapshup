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
 * Plugin Template
 *
 * This plugin does nothing
 * 
 * It is an exhaustive template that should be used by
 * developers to start a fresh plugin.
 * 
 * The name "Template" is given as an exemple. In the following you should
 * replace every occurence of "Template" by your plugin name.
 * 
 * 
 *  The plugin "Template" should match the following rules :
 * 
 *  1. the entry "Template" exists within the plugins list in
 *     the configuration file (see client/js/mapshup/config/default.js)
 *        plugins:[
 *           {...},
 *           {
 *               name:"Template",
 *               options:{
 *                   // Your options here
 *               }
 *           },
 *           {...}
 *        ]
 *        
 *   2. the plugin description (i.e. this file) is called "Template.js" and
 *   stored under the client/js/mapshup/lib/plugins directory 
 *   
 *   3. If the plugin "Template" needs specific CSS, the dedicated css file should
 *   be names "Template.css" and stored under the plugins directory of each theme
 *   (i.e. under client/js/mapshup/theme/.../plugins
 *   
 *   4. For developpement, both Template.js and Template.css files should be declared
 *   within the index.html file
 *   
 *   5. For operational site (see utils/packer/pack.sh), both Template.js and Template.css
 *   files should be declared within the client/js/mapshup/buildfile.txt file
 */

/*
 * Always use a closure to describe a plugin
 *
 * The closure should take only one argument which is
 * the reference to the mapshup object, i.e. window.M 
 *
 */
(function(M) {
    
    /*
     * Start defining a "M.Plugins.Template" object
     */
    M.Plugins.Template = function() {
        
        /*
         * Only one plugin object instance should be created.
         * 
         * To ensure this, we initialize a unique M.Plugins.Template._o
         * object instance on first call (see the end of this file)
         * 
         * If another instance of this object is requested, then the 
         * reference of the first object instance is returned instead of creating
         * a new object instance
         * 
         */
        if (M.Plugins.Template._o) {
            return M.Plugins.Template._o;
        }
        
        /**
         * The init(options) function is mandatory
         * 
         * It is called during mapshup initialization
         * If everything is fine, the init function should return
         * the reference of the created plugin (i.e. returns this)
         * 
         * Otherwise it should returns null. In this case, the plugin
         * is considered to be invalid and it is discarded by mapshup
         */
        this.init = function(options) {

            /*
             * It is cleaner to set a local 'self' 
             * variable referencing this plugin
             */
            var self = this;
            
            /*
             * The object options property is an object initialized from input options
             * i.e. initialized from the options object defined in the plugin description
             * within the configuration file
             */
            self.options = options || {};

            /*
             * To set default options, best practice is to use the $.extend() function from jquery
             */
            $.extend(self.options, {
                myFirstOption:self.options.myFirstOption || 'myFirstOption default value',
                mySecondOption:self.options.mySecondOption || 'mySecondOption default value'
                /*
                 * ... and so on
                 */
            });
            
            
            /*
             * This part of code should only be used if your plugin needs to have
             * one or more entries in the main menu (i.e. the circular menu that pops up when
             * you click on the map)
             */
            if (M.menu) {
                M.menu.add([
                    {
                        id:M.Util.getId(),
                        /*
                         * The name of the template icon.
                         * This icon should be put under each theme img directory,
                         * i.e. under each client/js/mapshup/theme/.../img/
                         */
                        ic:"template.png",
                        /*
                         * The title of the template action displayed on the menu
                         */
                        ti:"My template action",
                        /*
                         * The callback function called when user click on the template
                         * action in the menu.
                         */
                        cb:function() {
                            // Put your code here
                        }
                    }
                ]);
            }
            
            /*
             * This code should only be used if your plugin needs to have a button set
             * in one of the available toolbar
             * 
             * In the following example, the Template set a button in the
             * "North East Vertical" toolbar
             */
            var tb = new M.Toolbar('ne', 'v');
            var btn = new M.Button({
                tb:tb,
                icon:"template.png",
                tt:"My template button name",
                container:(new M.Panel('e',{tb:tb})).add(), //  AddLayer plugin is displayed within an East M.Panel
                activable:true,
                scope:self
            });
            
            /**
             * Register changebaselayer
             */
            M.Map.map.events.register('changebaselayer', M.Map.map, function(e){
                var btn = scope.tb.get(M.Util.encode(e.layer.id));
                if (btn) {
                    btn.activate(true);
                }
            });

            /*
             * Register events
             * 
             * Here are the list of masphup available events
             */
            
            /* Called after map has been resized */
            M.Map.events.register("resizeend", self, function(scope){
                // Your code here
            });

            /* Called after map extent changed */
            M.Map.events.register("moveend", self, function(scope){
                // Your code here
            });
            
            /* Called after a layer is added, removed or updated */
            M.Map.events.register("layersend", self, function(layer, scope) {
                // Your code here
            });
            
            /* Called after a layer starts loading */
            M.Map.events.register("loadstart", self, function(layer, scope) {
                // Your code here
            });
            
            /* Called after a layer ends loading */
            M.Map.events.register("loadend", self, function(layer, scope) {
                // Your code here
            });
            
            /* Called after a layer visibility changed */
            M.Map.events.register("visibilitychanged", self, function(layer, scope) {
                // Your code here
            });
            
            /* Called after a layer z-index changed */
            M.Map.events.register("indexchanged", self, function(layer,scope){
                // Your code here
            });
            
            /*
             * Initialize a unique M.Plugins.Template._o
             */
            M.Plugins.Template._o = this;

            return this;
        }
    };
})(window.M); // The closure should only references the mapshup object, i.e. window.M