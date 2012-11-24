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
 * Define mapshup events
 */
(function (M) {
   
    M.Events = function() {

        /*
         * Only one Events object instance is created
         */
        if (M.Events._o) {
            return M.Events._o;
        }
        
        /*
         * Set events hashtable
         */
        this.events = {
            
            /*
             * Array containing handlers to be call after
             * a map resize
             */
            resizeend:[]
        };
        
        

        /*
         * Register an event to jMap
         *
         * @input <String> eventname : Event name => 'resizeend'
         * @input <function> handler : handler attached to this event
         */
        this.register = function(eventname , scope, handler) {
            
            if (this.events[eventname]) {
                this.events[eventname].push({
                    scope:scope,
                    handler:handler
                });
            }
            
        };

        /*
         * Unregister event
         */
        this.unRegister = function(scope) {
            
            var arr,
                i,
                key,
                l;
                
            for (key in this.events) {
                arr = this.events[key];
                for (i = 0, l = arr.length; i < l; i++) {
                    if (arr[i].scope === scope) {
                        arr.splice(i,1);
                        break;
                    }
                }
            }
        };
        
        /*
         * Trigger handlers related to an event
         *
         * @input <String> eventname : Event name => 'resizeend'
         */
        this.trigger = function(eventname) {
            
            var i,
                l,
                arr = this.events[eventname];
            
            /*
             * Trigger resizeend to each handlers
             */
            if (arr) {
                for (i = 0, l = arr.length; i < l; i++) {
                    arr[i].handler(arr[i].scope);
                }
            }
        }
        
        /*
         * Create unique object instance
         */
        M.Events._o = this;
        
        return this;

    }
})(window.M);
