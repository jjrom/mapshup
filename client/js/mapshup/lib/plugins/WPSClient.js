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
 * Plugin WPSClient
 *
 * Assisted Classification of eArth observation ImAges
 *
 *********************************************/
(function(msp) {
    
    msp.Plugins.WPSClient = function() {
        
        /*
         * Only one WPSClient object instance is created
         */
        if (msp.Plugins.WPSClient._o) {
            return msp.Plugins.WPSClient._o;
        }
        
        /*
         * Hasmap of WPS sources items store by WPS endpoint url
         * 
         * Structure of an item 
         *      {
         *          panelItem: // reference to panelItem
         *          $d: // reference to the panel jquery container
         *          wps: // reference to a WPS object
         *      }
         */
        this.items = [];
        
        /*
         * Initialization
         */
        this.init = function (options) {

            var self = this;
            
            /*
             * init options
             */
            self.options = options || {};
            
            /*
             * If url are set - Retrieve GetCapabilities
             */
            if (self.options.urls) {
                if (!$.isArray(self.options.urls)) {
                    self.add(self.options.urls);
                }
                else {
                    for (var i = 0, l = self.options.urls.length; i < l; i++) {
                        self.add(self.options.urls[i]);
                    }
                }
                
            }
            
            return self;
            
        };
        
        /*
         * Add a wps source from url
         */
        this.add = function(url) {
            
            var wps;
            
            /*
             * If url is set - Retrieve GetCapabilities
             */
            if (url) {
                
                /*
                 * Create a wps object
                 */
                wps = new msp.WPS(url);
                
                /*
                * Register WPS events
                */
                wps.events.register("getcapabilities", this, function(scope, wps) {
                    
                    /*
                     * Avoid multiple getcapabilities respawn
                     */
                    if (!scope.items[url]) {
                        
                        /*
                         * Create a panel for this WPS
                         */
                        var panelItem = msp.sp.add({
                            id:msp.Util.getId(),
                            icon:msp.Util.getImgUrl('configure.png'),
                            title:wps.title,
                            classes:"wpsclient",
                            html:'<div style="float:left;width:40%;"><div class="info"></div><div class="processes"></div></div><div style="float:right;width:60%;"><div class="describe">'+msp.Util._("No process selected")+'</div><form method="POST" action="#"><div class="inputs"></div></form><div class="outputs"></div></div>'
                        });

                        /*
                         * Add a wps item to WPSClient
                         * with input url as the hash key
                         */
                        scope.items[url] = {
                            $d:panelItem.$content,
                            panelItem:panelItem,
                            wps:wps
                        };
                    
                        /*
                        * Tell user that a new WPS panel is created
                        */
                        msp.Util.message(msp.Util._("WPS server successfully added"));
                        msp.sp.show(panelItem);
                     
                    }   
                    
                    scope.updateCapabilitiesContent(scope.items[url]);
                    
                });
                
                wps.events.register("describeprocess", this, function(scope, processes) {
                    if ($.isArray(processes) && processes[0]) {
                        scope.updateDescribeProcessContent(processes[0]);
                    }
                });
            
                /*
                 * Retrieve capabilities
                 */
                wps.getCapabilities();
            }
            
        };
        
        /*
         * Update content of input item.panelItem with GetCapabilities information 
         *           
         * Container structure 
         * 
         *      <div class="pnsi wpsclient">
         *          <div style='float:left'>
         *              <div class="info">
         *                  <div class="title"></div>
         *                  <div class="description"></div>
         *              </div>
         *              <div class="processes">
         *                  // Contains Processes list
         *              </div>
         *          </div>
         *          <div style='float:right'>
         *              <div class="describe">
         *                  // Contains description of selected process
         *              </div>
         *              <form>
         *                  <div class="inputs">
         *                      // Display interactive InputsData
         *                  </div>
         *              </form>
         *          </div>
         *          
         *  @param {Object} item
         */
        this.updateCapabilitiesContent = function(item) {
            
            var id = msp.Util.getId(), process, identifier, $processes;
            
            /*
             * Set '.info' div
             * 
             * Display WPS server title and abstract.
             * Add a clickable action to display full GetCapabilities contact info within
             * a mapshup message popup
             * 
             */
            $('.info', item.$d).html('<h1><a href="'+item.wps.url+'" title="'+item.wps.url+'" target="_blank">'+item.wps.title+'</a></h1><p>'+item.wps["abstract"]+' <a href="#" id="'+id+'" class="button inline">&nbsp;+&nbsp;</a></p><br/><h1>'+msp.Util._('Processes')+'</h1>');
            $('#'+id).click(function(){
                msp.Util.message(item.wps.toHTML(), -1);
                return false;
            });
            
            /*
             * Set '.processes' div
             * 
             * Add a clickable button for each process within the GetCapabilities description
             * A click on a button launch the corresponding DescribeProcess and display it
             * 
             */
            $processes = $('.processes', item.$d);
            for (identifier in item.wps.processes) {
                id = msp.Util.getId();
                process = item.wps.processes[identifier];
                $processes.append('<a href="#" jtitle="'+process['abstract']+'" id="'+id+'" class="button inline">'+process.title+'</a> ');
                (function(process,$id, item) {
                    $id.click(function() {
                        $('a', $(this).parent()).removeClass('active');
                        $(this).addClass('active');
                        item.wps.describeProcess(process.identifier);
                        return false;
                    });
                    msp.tooltip.add($id, 'w');
                })(process,$('#'+id), item);
            }
            
            /*
             * Add a nice scrollbar :)
             */
            $processes.mCustomScrollbar();
            
        };
        
        /*
         * Update content of process description panel contained
         * within 'describe' CSS class
         * 
         *  @param {Object} process : msp.WPS.Process 
         */
        this.updateDescribeProcessContent = function(process) {
            
            var i, l, id, $id, $inputsList, input, item = this.items[process.wps.url];
            
            //console.log(process.dataInputsDescription);
            
            /*
             * Set '.info' div
             * 
             * Display Process title and abstract.
             */
            $('.describe', item.$d).html('<h1 title="'+process.identifier+'">'+process.title+'</h1><p>'+process["abstract"]+'</p>');
            
            /*
             * Set '.inputs' div
             * 
             * Entering the awfully complicated part of the code :D
             * 
             * Three types of InputsData exist :
             *  
             *      - complexData : basically something to upload to the WPS server
             *      
             *      - boundingBoxData : an input bbox (i.e. a geometry)
             *      
             *      - literalData : basically an input text form containing one of
             *                      the supported dataType
             * 
             * 
             * HTML structure :
             *      <div class="inputs">
             *          <div class="list">
             *              <div id="id">
             *                  <span class="title paddedright">Title (or identifier if title is null)</span>
             *              </p>
             *          </div>
             *      </div>
             * 
             */
            $('.inputs', item.$d).html('<h1>'+msp.Util._('Inputs')+'</h1><div class="list"></div>');
            $inputsList = $('.list', $('.inputs', item.$d));
            
            /*
             * Roll over dataInputs
             */
            for (i = 0, l = process.dataInputsDescription.length; i < l; i++) {
                
                input = process.dataInputsDescription[i];
                id = msp.Util.getId();
                
                /*
                 * Create Input div with a CSS 'input' class.
                 * The 'input' class is necessary since the pre-execute function
                 * will roll over each div with class 'input' to construct the
                 * execute query.
                 * 
                 */
                $inputsList.append('<div id="'+id+'" class="input"><span class="title paddedright" jtitle="'+input['abstract']+'">'+(input['title'] || input['identifier'])+' :</span></div>');
                
                /*
                 * Attach Input identifier to the 'input' div
                 * This is done by using the jQuery .data() function
                 */
                $id = $("#"+id).data('identifier', input['identifier']);
                
                /*
                 * Add a tooltip on the input title
                 * This tooltip contains input abstract
                 */
                msp.tooltip.add($(".title", $id), 'w');
                
                /*
                 * The hard part...
                 */
                if (input.literalData) {
                    this.displayLiteralData(process, input, $id);
                }
                else if (input.complexData) {
                    $id.append("// TODO");
                }
                else if (input.boundingBoxData) {
                    $id.append("// TODO");
                }
            }
            
            /*
             * Add a nice scrollbar :)
             */
            $inputsList.mCustomScrollbar();
            
            
        /*
             * Launch process button
             *
            $('.inputs', item.$d).append('<a href="#" id="'+id+'" class="button inline"><img src="'+msp.Util.getImgUrl('configure.png')+'"/>&nbsp;'+msp.Util._('Execute')+'</a>');
            $('#'+id).click(function(){
                msp.Util.message(item.wps.url);
                return false;
            });
            */
        };
        
        
        /*
         * Append form for LiteralData within $parent container 
         * 
         *  Structure of LiteralData
         * 
         *      {
         *          anyValue: // ???
         *          dataType: // dataType (mandatory)
	 *          defaultValue: // default value set in the input text box
         *          reference: // reference url for the dataType (display as link for dataType)
         *          UOMs:{
         *              default: // default Unit of Measure
         *              supported:[] // array of supported Units of Measure
         *      }
         *      
         *   Append the following structure to $parent
         *   
         *      <span id="idt" class="hilite">literalData.defaultValue</span>
         *      
         *   
         *   IMPORTANT : jQuery .data() is used to store addtionnal information on value
         *   (for example UOM if specified)
         *   
         *   @param {Object} process : msp.WPS.Process
         *   @param {Object} input : Input object containing LiteralData
         *   @param {Object} $parent
         *      
         */
        this.displayLiteralData = function(process, input, $parent) {
            
            var literalData = input.literalData, id = msp.Util.getId(), $id, $uom, self = this;
            
           /*
            * Set content i.e. add a 'Set value' action
            */
            $parent.append('<span id="'+id+'" class="hover" title="'+msp.Util._("Change value")+'">'+(literalData.defaultValue || msp.Util._("Not set"))+'</span>');
            $id = $('#'+id);
            
            /*
             * Set the Units of Measure if specified
             */
            if (literalData.UOMs) {
                
                /*
                 * Create a <select> form
                 */
                $parent.append('<span class="paddedleft"><select id="'+id+'uom"></select></span>');
                
               /*
                * Store UOM value for parent $parent on change selection within .data() store
                */
                $uom = $('#'+id+'uom').change(function(){
                    $parent.data('uom', $(this).val());
                    self.setInputs(process);
                });
                     
                for (var i = 0, l = literalData.UOMs.supported.length; i< l; i++) {
                    (function($uom, v, d) {
                        
                        /*
                         * Add a new option in the select form
                         */
                        $uom.append('<option value="'+v+'">'+v+'</option>');
                        
                        /*
                         * The default UOM is selected within the list of possible UOMs
                         */
                        if (v === d) {
                            $('option:last-child', $uom).attr("selected", "selected").change();
                        }
                        
                    })($uom, literalData.UOMs.supported[i], literalData.UOMs["default"]);
                }
                
            }
            
           /*
            * Switch between hilite and warning classes depending
            * if input literealData has a default value or not
            */
            if (!literalData.defaultValue) {
                $id.removeClass('hilite').addClass('warning');
            }
            else {
                $id.addClass('hilite').removeClass('warning');
                $parent.data('data', literalData.defaultValue);
                self.setInputs(process);
            }

            /*
             * Ask for value on click
             */
            $id.click(function(e) {

                msp.Util.askFor({
                    title:input.title,
                    content:msp.Util._("Enter a valid")+' <a href="'+literalData.reference+'" target="_blank">'+literalData.dataType+'</a>',
                    dataType:literalData.dataType,
                    /* TODO */
                    bounds:literalData.bounds,
                    size:5,
                    value:$id.text(),
                    callback:function(v){
                    
                        /*
                         * Value is set
                         */
                         if (v) {

                            /*
                             * Update link content text with
                             * the new set value
                             */
                             $id.html(v).addClass('hilite').removeClass('warning');

                             /*
                              * Store new value and update process accordingly
                              */
                             $parent.data('data', v);
                             self.setInputs(process);
                         }
                    }
                });
                
                return false;
            });
            
        };
        
        /**
         * Update inputs list for process
         * 
         * @param {Object} process
         *
         */
        this.setInputs = function(process) {
            
            /*
             * Clear process inputs list
             */
            process.clearInputs();
            
            /*
             * Populate process inputs list with
             * the .data() content of each process Input
             * identified by 'input' CSS class
             */
            $('.input', this.items[process.wps.url].$d).each(function(){
                process.addInput($(this).data());
            });
            
        };
        
        /*
         * Set unique instance
         */
        msp.Plugins.WPSClient._o = this;
        
        return this;
    };
})(window.msp);