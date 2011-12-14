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
 * PLUGIN: UserManagement_SearchHistory
 *
 * Add Search history capability to UserManagement panel
 *
 *********************************************/

msp.plugins["UserManagement_SearchHistory"] = {

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
        this.options.historyUrl = this.options.historyUrl || "/plugins/usermanagement/searchHistory.php?";
        this.options.trendsUrl = this.options.trendsUrl || "/plugins/usermanagement/searchTrends.php?";

        /**
         * Be sure that UserManagement plugin
         * was successfully loaded
         */
        var UMPlugin = msp.plugins["UserManagement"];
        if (!UMPlugin || !UMPlugin.isLoaded) {
            return false;
        }

        UMPlugin.add({
            plugin:this,
            title:msp.Util._("My searches"),
            linkTitle:msp.Util._("Search history"),
            linkImage:msp.Util.getImgUrl("search.png")
            });
        return true;
    },

    /**
     * Get search history
     * &input <div> container : UserManagement container div (i.e. $('#jUserManagementPanelMain'))
     * @input <int> page : number of history page to retrieve
     */
    getData:function(container, page) {

        page = page || 1;

        var userid = getCookie("userid");
        if (!userid) {
            $('.content', container).html('<div class="left"><h1>'+msp.Util._("You're not connected")+'</div>');
            return;
        }
        
        /**
         * Initialize values
         */
        $('.content', '#jUserManagementPanelMain').html('<div class="left navigation"><h1>'+msp.Util._("Search history")+'</h1></div><div class="left trends"><h1>'+msp.Util._("Trends")+'</h1></div>');

        /**
         * Get history from server
         */
        msp.Util.ajax({
            dataType:"json",
            type:"POST",
            url:msp.Util.getAbsoluteUrl(msp.repareUrl(this.options.historyUrl)+"userid="+userid),
            data:msp.abc+"&page="+page,
            success: function(data){

                /**
                 * We already get a unique id
                 */
                var id = this.id

                /**
                 * Success !
                 */
                if (data.items) {
                    
                    var plugin = msp.plugins["UserManagement_SearchHistory"];

                    /**
                     * Set Navigation title
                     */
                    var div = $('.content', '#jUserManagementPanelMain');
                    var location = "";
                    var coords,lonlat,numberOfPages;

                    /**
                     * Roll over items result.
                     * Each item contains the following information
                     *  - "gid": unique identifier (e.g. "1680"),
                     *  - "utc": date of action (e.g. "2010-11-29 20:06:50"),
                     *  - "location": location of extent center (e.g. "Vietnam"),
                     *  - "center": extent center (e.g. "106.87499999574 11.719560713295"),
                     *  - "zoom": zoom level (e.g. "3"),
                     *  - "searchterms": search terms,
                     *  - "searchurl": exact search url
                     */
                    for (var i = 0, l = data.items.length; i < l; i++) {
                        location = data.items[i].location === "" ? "" : " [ " + msp.Util._(data.items[i].location) + " ]";
                        $('.navigation',div).append('<p><a href="#" searchurl="'+data.items[i].searchurl+'" center="'+data.items[i].center+'" class="'+id+'">'+data.items[i].utc+'</a>'+" "+msp.Util._("search")+" "+data.items[i].searchterms+location+'</p>');
                        (function(zoom,div) {
                            div.click(function(){
                                coords = $(this).attr('center').split(" ");
                                lonlat = (new OpenLayers.LonLat(coords[0],coords[1])).transform(msp.Map.epsg4326, msp.Map.map.projection);
                                /**
                                 * !! Warning !!
                                 * Call to Map.setCenter (and not Map.map.setCenter)
                                 * to force msp to not log the history extent
                                 * as a new extent (avoid re-recording of visited extent)
                                 */
                                msp.Map.setCenter(lonlat,zoom,true);
                                
                            });
                        })(data.items[i].zoom,$('a.'+id, div));
                    }

                    /**
                     * Paging management
                     */
                    numberOfPages = data.total % data.perpage === 0 ? data.total / data.perpage : parseInt(data.total / data.perpage, 10) + 1;
                    $('.navigation',div).append(msp.Util._("Page")+" "+data.page+" "+msp.Util._("on")+" "+numberOfPages);

                    /**
                     * If the page number is greater that the total number of pages
                     *  => add a "previous" button
                     */
                    if (data.page > 1) {
                        $('.navigation',div).append('<a href="#" class="previous '+id+'">Previous</a>');
                        $('a.'+id, div).click(function(){
                            plugin.getData(container,data.page - 1);
                        });
                    }

                    /**
                     * If the page number is lower that the total number of pages
                     *  => add a "next" button
                     */
                    if (data.page < numberOfPages) {
                        $('.navigation',div).append('<a href="#" class="next '+id+'">Next</a>');
                        $('a.'+id, div).click(function(){
                            plugin.getData(container,data.page + 1);
                        });
                    }
                }
                else {
                    msp.Util.message(data.error["message"]);
                }
               
            }
        },{
            title:msp.Util._("Get search history"),
            cancel:true
        });

        /**
         * Get Trends from server
         */
        msp.Util.ajax({
            dataType:"json",
            type:"POST",
            url:msp.Util.getAbsoluteUrl(this.options.trendsUrl),
            data:msp.abc+"&page="+page,
            success: function(data){

                /**
                 * Success !
                 */
                if (data.items) {

                    /**
                     * Set Navigation title
                     */
                    var div = $('.content', '#jUserManagementPanelMain');
                    
                    /**
                     * Roll over items result.
                     * Each item contains the following information
                     *  - "hits"
                     *  - "keyword"
                     */
                    for (var i = 0, l = data.items.length; i < l; i++) {
                        var id = msp.Util.getId();
                        $('.trends',div).append('<a href="#" class="'+id+'">'+data.items[i].keyword+'</a>'+ " ");
                    }
                }
                else {
                    msp.displayError(data.error);
                }
            }
        },{
            title:msp.Util._("Get search history"),
            cancel:true
        });

    }
};
