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
 * Plugin WPSClient
 *
 * @param {MapshupObject} M
 *
 */
(function(M) {
    
    M.Plugins.WPSClient = function() {
        
        /*
         * Only one WPSClient object instance is created
         */
        if (M.Plugins.WPSClient._o) {
            return M.Plugins.WPSClient._o;
        }
        
        /*
         * Hashmap of WPS sources items store by WPS endpoint url
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
         * Asynchronous Process Manager reference
         */
        this.apm = null;
        
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
            
            /*
             * Set Asynchronous Processes Manager
             */
            self.apm = new M.Plugins.WPSClient.asynchronousProcessManager(self);
            
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
                wps = new M.WPS(url);
                
                /*
                * Register GetCapabilites event
                */
                wps.events.register("getcapabilities", this, function(scope, wps) {
                    
                    /*
                     * Verify that WPS is really set
                     */
                    if (!wps.title) {
                        M.Util.message(wps.url + " : " + M.Util._("not available"));
                        return false;
                    }
                
                    /*
                     * Avoid multiple getcapabilities respawn
                     */
                    if (!scope.items[url]) {
                        
                        var id = M.Util.getId();
                        
                        /*
                         * Create a panel for this WPS
                         */
                        var panelItem = M.southPanel.add({
                            id:id,
                            icon:M.Util.getImgUrl('execute.png'),
                            title:wps.title,
                            classes:"wpsclient",
                            mask:true,
                            html:'<div style="float:left;width:40%;"><div class="info"></div><div class="processes nano"><div class="content"></div></div></div><div style="float:right;width:60%;"><div class="describe">'+M.Util._("No process selected")+'</div><form method="POST" action="#"><div class="puts"></div></form><div class="outputs"></div></div>'
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
                        M.Util.message(M.Util._("WPS server successfully added"));
                        M.southPanel.show(panelItem);
                     
                    }   
                    
                    scope.updateCapabilitiesContent(scope.items[url]);
                    
                    return true;
                    
                });
                
                /*
                * Register DescribeProcess event
                */
                wps.events.register("describeprocess", this, function(scope, processes) {
                    if ($.isArray(processes) && processes[0]) {
                        scope.updateDescribeProcessContent(processes[0]);
                    }
                });
            
                /*
                * Register Execute event
                */
                wps.events.register("execute", this, function(scope, process) {
                    scope.updateOutputContent(process);
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
         *                  <div class="execute">
         *                      // Execute process button
         *                  </div>
         *              </div>
         *              <form>
         *                  <div class="puts">
         *                      // Display interactive InputsData and OutputsData
         *                  </div>
         *              </form>
         *          </div>
         *          
         *  @param {Object} item
         */
        this.updateCapabilitiesContent = function(item) {
            
            var id = M.Util.getId(), process, identifier, $processes;
            
            /*
             * Set '.info' div
             * 
             * Display WPS server title and abstract.
             * Add a clickable action to display full GetCapabilities contact info within
             * a mapshup message popup
             * 
             */
            $('.info', item.$d).html('<h1><a href="'+item.wps.url+'" title="'+item.wps.url+'" target="_blank">'+item.wps.title+'</a></h1><p>'+M.Util.shorten(item.wps["abstract"], 100, true)+' [<a href="#" id="'+id+'">&nbsp;'+M.Util._("more")+'&nbsp;</a>]</p><br/><h1>'+M.Util._('Processes')+'</h1>');
            $('#'+id).click(function(){
                M.Util.message(item.wps.toHTML(), -1);
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
                id = M.Util.getId();
                process = item.wps.processes[identifier];
                $('.content', $processes).append('<a href="#" id="'+id+'" class="button inline">'+process.title+'</a> ');
                (function(process,$id, item) {
                    $id.click(function() {
                        $('a', $(this).parent()).removeClass('active');
                        $(this).addClass('active');
                        item.wps.describeProcess(process.identifier);
                        return false;
                    });
                
                    /*
                     * Add tooltip with abstract 
                     */
                    if (process['abstract']) {
                        $id.attr('jtitle', process['abstract']);
                        M.tooltip.add($id, 's');
                    }
                
                })(process,$('#'+id), item);
            }
            
            /*
             * Add a nice scrollbar :)
             */
            $processes.nanoScroller();
            
        };
        
        /*
         * Update content of process description panel contained
         * within 'describe' CSS class
         * 
         *  @param {Object} process : M.WPS.Process 
         */
        this.updateDescribeProcessContent = function(process) {
            
            var type, putsDescription, i, j, l, id, $id, put, $list, executeId = M.Util.getId(), executeBgId, item = this.items[process.wps.url], abstract = process["abstract"];
            
            /*
             * Set '.info' div
             * 
             * Display Process title and abstract.
             */
            $('.describe', item.$d).html('<h1 title="'+process.identifier+'">'+process.title+'</h1><p>' + (abstract ? abstract : '') + '</p><div class="execute"><img src="'+M.Util.getImgUrl('execute.png')+'" id="'+executeId+'" class="button inline" jtitle="'+M.Util._("Execute process")+'"/></div>');
            
            /*
             * Set execute button
             */
            M.tooltip.add($('#' + executeId).click(function() {
                process.execute();
                return false;
            }), 'n', 20);
            
            /*
             * If user is signedIn also add an "Execute in background" button
             */
            if (this.apm._signedIn) {
                executeBgId = M.Util.getId();
                $('.execute', $('.describe', item.$d)).append('&nbsp;<img src="'+M.Util.getImgUrl('sleep.png')+'" id="'+executeBgId+'" class="button inline" jtitle="'+M.Util._("Execute process in background")+'"/>');
                M.tooltip.add($('#' + executeBgId).click(function() {
                    process.execute({storeExecute: true});
                    return false;
                }), 'n', 20);
            }
            
            /*
             * Set '.puts' div
             * 
             * Entering the awfully complicated part of the code :D
             * 
             * Three types of InputsData (OutputsData) exist :
             *  
             *      - complexData (complexOuput) : basically something to upload to the WPS server
             *                                     This could be an image, a geometry, etc.
             *                                     Since most implementation support only reference to 
             *                                     uploaded data, mapshup first upload drag&drop file
             *                                     to the mapshup server and then send back an url
             *                                     to the uploaded file that is referenced within
             *                                     the TODO
             *                                     
             *      
             *      - boundingBoxData (boundingBoxOutput) : an input bbox (i.e. a geometry)
             *      
             *      - literalData (literalOutput) : basically an input text form containing one of
             *                                      the supported dataType (Double, String, etc.)
             * 
             * 
             * HTML structures :
             *      <div class="puts">
             *          <div class="list nano">
             *              <span id="id">
             *                  <span class="title paddedright">Title (or identifier if title is null)</span>
             *              </span>
             *          </div>
             *      </div>      
             * 
             */
            $list = $('.list', $('.puts', item.$d).html('<h1>'+M.Util._('Set inputs')+'</h1><div class="list nano"><div class="content"></div></div>'));
            
            /*
             * Roll over dataInputs and processOutputs
             */
            type = 'input';
            putsDescription = process.dataInputsDescription;
            for (j = 0; j < 2; j++) {
                
                if (j === 1) {
                    type = 'output';
                    putsDescription = process.processOutputsDescription;
                }
                
                for (i = 0, l = putsDescription.length; i < l; i++) {

                    put = putsDescription[i];
                    id = M.Util.getId();

                    /*
                     * Create Input or Output div with a CSS 'input' class.
                     * The 'input' (or 'output') class is necessary since the pre-execute function
                     * will roll over each div with class 'input' (or 'output') to construct the
                     * execute query.
                     * 
                     */
                    $('.content', $list).append('<span id="'+id+'" class="'+type+'"><span class="title" jtitle="'+put['abstract']+'">'+(put['title'] || put['identifier'])+'&nbsp;:&nbsp;</span></span> ');

                    /*
                     * Attach Input identifier to the 'input' div
                     * This is done by using the jQuery .data() function
                     */
                    $id = $("#"+id).data('identifier', put['identifier']);

                    /*
                     * Add a tooltip on the input title
                     * This tooltip contains input abstract
                     */
                    M.tooltip.add($(".title", $id), 's');

                    /*
                     * The hard part...
                     */
                    if (put.literalData) {
                        this.displayLiteralData(process, put, $id);
                    }
                    else if (put.literalOutput) {
                        this.displayLiteralOutput(process, put, $id);
                    }
                    else if (put.complexData) {
                        this.displayComplexData(process, put, $id);
                    }
                    else if (put.complexOutput) {
                        this.displayComplexOutput(process, put, $id);
                    }
                    else if (put.boundingBoxData) {
                        this.displayBoundingBoxData(process, put, $id);
                    }

                }
            }
            
            /*
             * Add nice scrollbars :)
             */
            $list.nanoScroller();
        
        };
        
        /**
         * Update Output content
         * 
         * The Process Status is used to determine if the result
         * is synchronous or asynchronous 
         * 
         * Process status could be one of the following :
         * 
         *      ProcessAccepted
         *      ProcessStarted
         *      ProcessPaused
         *      ProcessSucceeded
         *      ProcessFailed
         * 
         * If the process is asynchronous (i.e. storeExecute = true) then
         * the Status should be in nominal mode "ProcessAccepted"
         * 
         * If the process is synchronous (i.e. storeExecute = false) then
         * the Status should be "ProcessSucceeded" if every ran good or
         * "ProcessFailed" in case of error
         * 
         * @param {Object} process
         * 
         */
        this.updateOutputContent = function(process) {
            
            var i, l, geoType, result, item = this.items[process.wps.url], $outputsList = $('.output', item.$d), location = process.statusLocation;
            
            /*
             * Process failed - the very easy part :)
             */
            if (process.status === "ProcessFailed") {
                M.Util.message(process.title + " : " + M.Util._("Process failed") + " - " + process.statusAbstract);
                return false;
            }
            /*
             * Asynchronous case
             * 
             * The result is available at the url defined in the process "statusLocation"
             * A TimeOut function is set to check periodically the status of the process
             * 
             * When the process is finished, the user is notified and the TimeOut function is removed
             */
            else if (process.status === "ProcessAccepted" && location) {
                
                /*
                 * Add a new process to the asynchronous manager
                 */
                return this.apm.add(process.wps.url, process.identifier, location);
                
            }
            /*
             * Synchronous case
             */
            else if (process.status === "ProcessSucceeded") {
                
                /*
                 * An important task : remove asynchronous process if any !
                 */
                this.apm.remove(location);
                
                /*
                 * No result = nothing to update
                 */
                if (!$.isArray(process.result)) {
                    return false;
                }
        
                /*
                 * Update each Output DOM element that are identified in the process.result array
                 */
                for (i = 0, l = process.result.length; i < l; i++) {

                    result = process.result[i];

                    /*
                     * Two cases : data is directly accessible within the result,
                     * or data is accessible through an url (reference)
                     */
                    if (result.data) {

                        /*
                         * Searh within jQuery data('identifier')
                         */
                        $outputsList.each(function(){
                            if ($(this).data('identifier') === result.identifier && result.data) {
                                $('#'+$(this).attr('id')+'v').html(result.data.value);
                            }
                        });

                        /*
                         * Add new features within WPSClient layer
                         */
                        geoType = M.Map.Util.getGeoType(result.data["mimeType"]);
                        if (geoType === 'GML') {
                            this.load(M.Map.Util.GML.toGeoJSON(result.data.value,{
                                title:process.title,
                                processid:process.identifier,
                                description:process["abstract"],
                                time:(new Date()).toISOString()
                            }));
                        }

                    }
                    /*
                     * Reference result
                     */
                    else if (result.reference) {
                        var id = M.Util.getId(),
                            popup = new M.Popup({
                            modal:false,
                            noHeader:true,
                            autoSize:true,
                            body:process.title + ' <a id="'+id+'" href="'+result.reference.href+'" class="button inline colored paddedright" target="_blank">'+ M.Util._("Download result") + '</a>'
                        }).show();
                        $('#'+id).click(function(){
                            popup.hide();
                        });

                    }

                }
            
            } // End of synchronous case
            
            return true;
            
        };
        
        /**
         * Append form for LiteralData within $parent container
         * 
         * Structure of LiteralData
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
         *      <span id="id" class="hilite">literalData.defaultValue</span>
         *      
         *   
         *   IMPORTANT : jQuery .data() is used to store addtionnal information on value
         *   (for example UOM if specified)
         *   
         *   @param {Object} process : M.WPS.Process
         *   @param {Object} put : Input object containing LiteralData
         *   @param {Object} $parent
         *      
         */
        this.displayLiteralData = function(process, put, $parent) {
            
            var type = 'input', data = put.literalData, id = M.Util.getId(), $id, $uom, $av, i, l, self = this;
            
            /*
             * Store Input type within $parent.data()
             */
            $parent.data('type', 'LiteralData');
            
            /*
            * Set content i.e. add a 'Set value' action except if allowedValues is set.
            * In this case, set a select box with a finite list of elements
            */
            if (data.allowedValues) {
                
                /*
                 * Create a <select> form
                 */
                $parent.append('<span class="paddedleft"><select id="'+id+'av"></select></span>');
                
                /*
                * Store allowedValues value for parent $parent on change selection within .data() store
                */
                $av = $('#'+id+'av').change(function(){
                    $parent.data('data', $(this).val());
                    self.setPuts(process, type);
                });
                     
                for (i = 0, l = data.allowedValues.length; i< l; i++) {
                    (function($av, v, d) {
                        
                        /*
                         * Add a new option in the select form
                         */
                        $av.append('<option value="'+v+'">'+v+'</option>');
                        
                        /*
                         * The default UOM is selected within the list of possible UOMs
                         */
                        if (v === d) {
                            $('option:last-child', $av).attr("selected", "selected").change();
                        }
                        
                    })($av, data.allowedValues[i].value, data.defaultValue);
                }
                $av.trigger('change');
            }
            else {
                $parent.append('<span id="'+id+'" class="hover" title="'+M.Util._("Change value")+'">'+(data.defaultValue || M.Util._("Not set"))+'</span>');
                $id = $('#'+id);
            }
            
            /*
             * Set the Units of Measure if specified
             */
            if (data.UOMs) {
                
                /*
                 * Create a <select> form
                 */
                $parent.append('<span class="paddedleft"><select id="'+id+'uom"></select></span>');
                
                /*
                * Store UOM value for parent $parent on change selection within .data() store
                */
                $uom = $('#'+id+'uom').change(function(){
                    $parent.data('uom', $(this).val());
                    self.setPuts(process, type);
                });
                     
                for (i = 0, l = data.UOMs.supported.length; i< l; i++) {
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
                        
                    })($uom, data.UOMs.supported[i], data.UOMs["default"]);
                }
                
            }
            
            /*
             * This only make sense if $id is set (i.e. if there are no allowedValues select)
             */
            if ($id) {
                
                /*
                * Switch between hilite and warning classes depending
                * if input literealData has a default value or not
                */
                if (!data.defaultValue) {
                    $id.removeClass('hilite').addClass('warning');
                }
                else {
                    $id.addClass('hilite').removeClass('warning');
                    $parent.data('data', data.defaultValue);
                    self.setPuts(process, type);
                }

                /*
                 * Ask for value on click
                 */
                $id.click(function(e) {

                    M.Util.askFor({
                        title:put.title,
                        content:put["abstract"] + '<br/><br/>' + M.Util._("Enter a valid")+' <a href="'+data.reference+'" target="_blank">'+data.dataType+'</a>',
                        dataType:data.dataType,
                        /* TODO */
                        bounds:data.bounds,
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
                                self.setPuts(process, type);
                            }
                        }
                    });

                    return false;
                });
            
            }
            
        };
       
        /**
         * Append form for LiteralOutput within $parent container 
         * 
         *   Structure of LiteralOuput
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
         *   @param {Object} process : M.WPS.Process
         *   @param {Object} put : Input or Output object containing LiteralData
         *   @param {Object} $parent
         *      
         */
        this.displayLiteralOutput = function(process, put, $parent) {
            
            var type = 'output', data = put.literalOutput, id = $parent.attr('id'), $uom, self = this;
            
            /*
             * Store Input type within $parent.data()
             */
            $parent.data('type', 'LiteralOutput');
            
            /*
            * Set content i.e. add a 'Set value' action
            */
            $parent.append('<span id="'+id+'v" class="bold">---</span>');
            
            /*
             * Add output to process
             */
            self.setPuts(process, type);
            
            /*
             * Set the Units of Measure if specified
             */
            if (data.UOMs) {
                
                /*
                 * Create a <select> form
                 */
                $parent.append('<span class="paddedleft"><select id="'+id+'vuom"></select></span>');
                
                /*
                * Store UOM value for parent $parent on change selection within .data() store
                */
                $uom = $('#'+id+'vuom').change(function(){
                    $parent.data('uom', $(this).val());
                    self.setPuts(process, type);
                });
                     
                for (var i = 0, l = data.UOMs.supported.length; i< l; i++) {
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
                        
                    })($uom, data.UOMs.supported[i], data.UOMs["default"]);
                }
                
            }

        };
        
        /**
         * Append form for ComplexData within $parent container 
         * 
         *  Structure of ComplexData 
         * 
         *      {
         *          maximumMegabytes: // ???
         *          default:{
         *              mimeType: //
         *              encoding: //
         *              schema: //
         *          },
         *          supported[
         *              {
         *                  mimeType: //
         *                  encoding: //
         *                  schema: //
         *              },
         *              ...
         *          ]
         *      }
         *  
         *   Append the following structure to $parent
         *   
         *      <span id="id" class="hilite">Not set</span>
         *      
         *   
         *   IMPORTANT : jQuery .data() is used to store addtionnal information on value
         *   (for example UOM if specified)
         *   
         *   @param {Object} process : M.WPS.Process
         *   @param {Object} put : Input object containing ComplexData
         *   @param {Object} $parent
         *      
         */
        this.displayComplexData = function(process, put, $parent) {
            
            var type = 'input',
                    data = put.complexData,
                    id = M.Util.getId(),
                    idgeoselect = M.Util.getId(),
                    idgeodraw = M.Util.getId(),
                    drawText = M.Util._("Draw feature on Map"),
                    selectText = M.Util._("Select feature on Map"),
                    uploadText = M.Util._("Upload"),
                    self = this;
            
            /*
             * Store Input type within $parent.data()
             */
            $parent.data('type', 'ComplexData');
            
            /*
            * Set content i.e. add an 'Upload' action
            */
            $parent.append('<img class="hover middle" src="'+M.Util.getImgUrl('upload.png')+'" id="'+id+'" title="'+uploadText+'"/>');
            
            /*
             * Ask for value on click
             */
            $('#'+id)
            .removeClass('hilite')
            .addClass('warning')
            .click(function(e) {

                M.Util.askFor({
                    title:put.title,
                    dataType:"complexData",
                    defaultFormat:data["default"],
                    maximumMegabytes:data.maximumMegabytes,
                    supportedFormats:data.supported,
                    file:$parent.data('file'),
                    fileUrl:$parent.data('fileUrl'),
                    upload:true, // Upload data to server to get a fileURL
                    callback:function(data){
                       
                        /*
                         * Data can be either a File object or an url
                         * Note that if upload is set to true in askFor parameter,
                         * then data should only be a fileUrl
                         */
                        if (data.file || data.fileUrl) {
                            
                            /*
                             * Update link content 
                             */
                            $('#'+id).attr('title', data.file ? data.file.name : data.fileUrl).addClass('hilite').removeClass('warning');
                            $('#'+idgeoselect).attr('title',selectText).removeClass('hilite').addClass('warning');
                            $('#'+idgeodraw).attr('title',drawText).removeClass('hilite').addClass('warning');
                            
                            /*
                             * Store file or fileUrl within parent data cache
                             */
                            data.file ? $parent.removeData('fileUrl').data('file', data.file) : $parent.removeData('file').data('fileUrl', data.fileUrl);
                            
                            self.setPuts(process, type);
                            
                        }
                        
                    }
                });
                
                return false;
            });
            
            /*
             * Special case of Geometries 
             * 
             * If the mimeType of the ComplexData is one of the geographical
             * mimeTypes, then use can also choose one feature within the map :)
             * 
             */
            if (data["default"] && M.Map.Util.getGeoType(data["default"].mimeType)) {
                
                var drawingPlugin = M.Plugins.Drawing && M.Plugins.Drawing._o ? M.Plugins.Drawing._o : null;
                
                $parent.append(' <img src="'+M.Util.getImgUrl('earth.png')+'" id="'+idgeoselect+'" class="hover middle" title="'+selectText+'"/>');
                
                /*
                 * Select geometry within the map
                 */
                $('#'+idgeoselect)
                .removeClass('hilite')
                .addClass('warning')
                .click(function(e) {
                    
                    var $mask = self.items[process.wps.url].panelItem.$mask;
                    
                    /*
                     * Set a callback function on FeatureInfo
                     */
                    M.Map.featureInfo.bypassCallback = function(feature) {
                        
                        /*
                         * Hide mask
                         */
                        $mask.hide();
                        M.Map.featureInfo.bypassCallback = null;
                        
                        /*
                         * Update "Select on map" action display and store feature in the .data() cache
                         */
                        if (feature) {
                            
                            $('#'+id).attr('title',uploadText).removeClass('hilite').addClass('warning');
                            $('#'+idgeodraw).attr('title',drawText).removeClass('hilite').addClass('warning');
                            $('#'+idgeoselect).attr('title',M.Map.Util.Feature.getTitle(feature)).addClass('hilite').removeClass('warning');
                            
                            /*
                             * Store file or fileUrl within parent data cache
                             */
                            $parent
                            .removeData('fileUrl')
                            .data('data', M.Map.Util.Feature.toGeo(feature, data["default"]))
                            .data('format', data["default"]);
                            self.setPuts(process, type);
                            
                        }
                    };
                    
                    /*
                     * Show mask
                     */
                    $mask
                    .html('<div class="content">'+selectText+' (<a href="#" class="cancel">'+M.Util._("Cancel")+'<a/>)</div>')
                    .show();
                    
                    /*
                     * Add a cancel action
                     */
                    $('.cancel', $mask).click(function(e) {
                        M.Map.featureInfo.bypassCallback = null;
                        $mask.hide();
                    });
                    
                    return false;
                });
                
                /*
                 * Directly draw geometry on map
                 */
                if (drawingPlugin) {
                
                    $parent.append(' <img src="'+M.Util.getImgUrl('drawing.png')+'" id="'+idgeodraw+'" class="hover middle" title="'+drawText+'"/>');
                    
                    var $mask = self.items[process.wps.url].panelItem.$mask;
                    
                    /*
                     * Draw geometry within the map
                     */
                    $('#'+idgeodraw)
                    .removeClass('hilite')
                    .addClass('warning')
                    .click(function(e) {

                        /*
                        * Show mask
                        */
                       $mask
                       .html('<div class="content">'+drawText+' (<a href="#" class="cancel">'+M.Util._("Cancel")+'<a/>)</div>')
                       .show();

                       /*
                        * Add a cancel action
                        */
                       $('.cancel', $mask).click(function(e) {
                           M.Map.resetControl();
                           if (drawingPlugin.askPopup) {
                               drawingPlugin.askPopup.hide();
                           }
                           $mask.hide();
                       });
                   
                        /*
                         * Trigger Drawing plugin 
                         * Set the bypassOnFeatureAdded
                         */
                        drawingPlugin.bypass(function(event) {
                            
                            /*
                             * Update "Select on map" action display and store feature in the .data() cache
                             */
                            if (event.feature) {

                                $('#' + id).attr('title', uploadText).removeClass('hilite').addClass('warning');
                                $('#'+idgeoselect).attr('title', selectText).removeClass('hilite').addClass('warning');
                                $('#' + idgeodraw).attr('title', M.Map.Util.Feature.getTitle(event.feature)).addClass('hilite').removeClass('warning');

                                /*
                                 * Store file or fileUrl within parent data cache
                                 */
                                $parent.removeData('fileUrl').data('data', M.Map.Util.Feature.toGeo(event.feature, data["default"])).data('format', data["default"]);
                                self.setPuts(process, type);

                            }
                        
                            $mask.hide();
                            
                        });
                    
                        drawingPlugin.askType(true);
                        
                    });
                
                }
                
            }
            
        };
    
        /**
         * Append form for BoundingBoxData within $parent container 
         * 
         *  Structure of BoundingBoxData 
         * 
         *      {
         *          default:CRS1
         *          supported[CRS1, CRS2, CRS...]
         *      }
         *   
         *   @param {Object} process : M.WPS.Process
         *   @param {Object} put : Input object containing ComplexData
         *   @param {Object} $parent
         *      
         */
        this.displayBoundingBoxData = function(process, put, $parent) {
            
            var type = 'input', data = put.complexData, idgeoselect = M.Util.getId(), idgeodraw = M.Util.getId(), self = this;
            var drawboxPlugin = M.Plugins.DrawBox && M.Plugins.DrawBox._o ? M.Plugins.DrawBox._o : null;
                        
            /*
             * Store Input type within $parent.data()
             */
            $parent.data('type', 'BoundingBoxData');
            $parent.append(' <img src="' + M.Util.getImgUrl('earth.png') + '" id="' + idgeoselect + '" class="hover middle" title="' + M.Util._("Set bounding box to map view") + '"/>');

            /*
             * Select map view as the bounding box
             */
            $('#' + idgeoselect).removeClass('hilite').addClass('warning').click(function(e) {
                
                $('#' + idgeodraw).removeClass('hilite').addClass('warning');
                $('#' + idgeoselect).addClass('hilite').removeClass('warning');

                /*
                 * Store BoundingBox within parent data cache
                 */
                alert('TODO');
                //$parent.data('data', M.Map.Util.Feature.toGeo(event.feature, data["default"])).data('format', data["default"]);
                //self.setPuts(process, type);
            });
            
            /*
             * DrawBox on map
             */
            if (drawboxPlugin) {

                $parent.append(' <img src="' + M.Util.getImgUrl('drawing.png') + '" id="' + idgeodraw + '" class="hover middle" title="' + M.Util._("Draw bounding box on map") + '"/>');

                /*
                 * Draw bounding box within the map
                 */
                $('#' + idgeodraw).removeClass('hilite').addClass('warning').click(function(e) {

                    var $mask = self.items[process.wps.url].panelItem.$mask;

                    /*
                     * Show mask
                     */
                    $mask.html('<div class="content">' + M.Util._("Draw a bounding box on map") + ' (<a href="#" class="cancel">' + M.Util._("Cancel") + '<a/>)</div>').show();

                    drawboxPlugin.draw(function(feature, bbox){
                        alert(bbox);
                    });

                    /*
                     * Add a cancel action
                     */
                    $('.cancel', $mask).click(function(e) {
                        M.Map.resetControl();
                        $mask.hide();
                    });

                    return false;

                });

            }
            
        };
        
        /**
         * Append form for complexOutput within $parent container 
         * 
         *   Structure of ComplexOuput
         * 
         *      {
         *          default: // default mimeType
         *          supported:[] // array of supported mimeType
         *      }
         *      
         *   Append the following structure to $parent for non geometrical output
         *   
         *      <span id="idv" class="hilite">---</span>
         *   
         *   For geometrical output (i.e. M.Map.Util.getGeoType(data["default"].mimeType) is not null)
         *   then nothing is appended to $parent container, since geometrical results are directly
         *   displayed within the map
         *   
         *   IMPORTANT : jQuery .data() is used to store additionnal information on value
         *   (for example UOM if specified)
         *   
         *   @param {Object} process : M.WPS.Process
         *   @param {Object} put : Input or Output object containing ComplexOutput
         *   @param {Object} $parent
         *      
         */
        this.displayComplexOutput = function(process, put, $parent) {
            
            var type = 'output', data = put.complexOutput, id = $parent.attr('id'), self = this;
            
            /*
             * In any case store parent type and mimeType
             */
            $parent.data('mimeType', data["default"].mimeType)
            .data('type', 'ComplexOutput');
            
            /*
             * Geometrical output options are not displayed within $parent
             */
            if (M.Map.Util.getGeoType(data["default"].mimeType)){
                self.setPuts(process, type);
                $parent.hide();
            }
            else {
           
                /*
                 * Add output to process
                 */
                self.setPuts(process, type);

                /*
                 * Create a <select> form
                 */
                $parent.append('<span class="paddedleft"><select id="'+id+'vmtype"></select></span>');

                /*
                * Store mimeType value for parent $parent on change selection within .data() store
                */
                $mtype = $('#'+id+'vmtype').change(function(){
                    $parent.data('mimeType', $(this).val());
                    self.setPuts(process, type);
                });

                for (var i = 0, l = data.supported.length; i< l; i++) {
                    (function($mtype, v, d) {

                        /*
                         * Add a new option in the select form
                         */
                        $mtype.append('<option value="'+v+'">'+v+'</option>');

                        /*
                         * The default mimeType is selected within the list of possible mimeTypes
                         */
                        if (v === d) {
                            $('option:last-child', $mtype).attr("selected", "selected").change();
                        }

                    })($mtype, data.supported[i].mimeType, data["default"].mimeType);
                }
            }
        };
        
        
        /**
         * Update inputs or outputs list for process
         * 
         * @param {Object} process
         * @param {String} type : 'input' or 'output'
         *
         */
        this.setPuts = function(process, type) {
            type === 'input' ? this.setInputs(process) : this.setOutputs(process);
        };
        
        /**
         * Update inputs list for process
         * 
         * @param {Object} process
         *
         */
        this.setInputs = function(process) {
            
            /*
             * Clear process list
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
        
        /**
         * Update outputs list for process
         * 
         * @param {Object} process
         *
         */
        this.setOutputs = function(process) {
            
            /*
             * Clear process list
             */
            process.clearOutputs();
            
            /*
             * Populate process outputs list with
             * the .data() content of each process Input
             * identified by 'input' CSS class
             */
            $('.output', this.items[process.wps.url].$d).each(function(){
                process.addOutput($(this).data());
            });
            
        };
        
        /*
         * Return layer to display Geometries results
         */
        this.getLayer = function() {
            
            if (this._layer) {
                return this._layer;
            }
            
            this._layer = M.Map.addLayer({
                type:"GeoJSON",
                title:"WPS results",
                clusterized:false, // Very important !
                editable:true,
                ol:{
                    styleMap: new OpenLayers.StyleMap({
                        'default':{
                            strokeColor:'white',
                            strokeWidth: 1,
                            fillColor:'red',
                            fillOpacity: 0.2,
                            pointRadius:5
                        }
                    })
                }
            });
            
            return this._layer;
        };
        
        /*
         * Add GeoJSON features within WPS result layer
         * 
         * @param {String} data : a GeoJSON string
         */
        this.load = function(data) {
            
            /*
             * Add new feature(s) and center on it
             */
            M.Map.layerTypes["GeoJSON"].load({
                data:data,
                layer:this.getLayer(),
                zoomOnNew:true
            });
            
        };
        
        /*
         * Set unique instance
         */
        M.Plugins.WPSClient._o = this;
        
        return this;
    };
    
    /**
     * WPSClient Asynchronous Process Manager
     * 
     * @param {WPSClientObject} wpsclient : WPSClient plugin instance reference
     */
    M.Plugins.WPSClient.asynchronousProcessManager = function(wpsclient) {
        
        /*
         * Reference to the parent WPSClient instance
         */
        this.parent = wpsclient;
        
        /*
         * Hashmap of running asynchronous processes stored by statusLocation url
         * 
         * Structure
         *      {
         *          process: // Running WPS Process reference
         *          fn: // TimeOut function periodically called to update status
         *      }
         */
        this.items = [];
        
        /**
         * Initialize manager
         */
        this.init = function() {
            
            /*
             * Register to user signIn and signOut events for
             * background processes 
             */
            M.events.register("signin", this, function(scope, lm) {

                /*
                 * Tell WPSClient that user is signed in
                 */
                scope._signedIn = true;

                /*
                 * Add a new entry in the UserManagement userBar
                 */
                lm.add([{
                        id: '#WPSClientPlugin',
                        icon: M.Util.getImgUrl("execute.png"),
                        title: "Processes",
                        callback: function(scope) {
                            //console.log(scope);
                        }
                    }]);

            });

            M.events.register("signout", this, function(scope) {

                /*
                 * Tell WPSClient that user is signed out
                 */
                scope._signedIn = false;

            });

            return this;
            
        };
    
        /**
         * Add a process to the list of asynchronous processes
         * 
         * @param {String} wpsUrl : WPS url endpoint
         * @param {String} processId : Process identifier (should be unique within WPS getCapabilities)
         * @param {String} location : statusLocation url (should be unique)
         */
        this.add = function(wpsUrl, processId, location) {
           
           var parentItem = this.parent.items[wpsUrl], process;
           
           /*
            * Paranoid mode
            */
           if (!parentItem || !parentItem.wps) {
               return false;
           }
           
           /*
            * Get process reference
            */
           process = parentItem.wps.processes[processId];
           
           /*
            * Paranoid mode
            */
           if (!process) {
               return false;
           }
       
           /*
            * Be sure to avoid multiple registry of the same running process
            * The unicity is guaranted by the statusLocation which is unique for a given
            * process
            */
            if (!this.items[location]) {

                /*
                 * Great news for user :)
                 */
                M.Util.message('<span class="status">' + process.title + " : " + M.Util._("Process accepted and running") + '</span>');

                /*
                 * Add an entry within the running process hashmap
                 */
                this.items[location] = {
                    
                    process: process,
                            
                    /*
                     * Periodically check the Process Status (every 5 seconds) 
                     */
                    fn: setTimeout(function() {

                        /*
                         * Background execute request
                         */
                        $.ajax({
                            url: M.Util.proxify(location, "XML"),
                            async: true,
                            type: "GET",
                            dataType: "xml",
                            contentType: "text/xml",
                            success: function(xml) {

                                process.result = process.parseExecuteResponse(xml);

                                /*
                                 * Result is null only if an ExceptionReport occured
                                 */
                                if (process.result) {
                                    process.wps.events.trigger("execute", process);
                                }

                            },
                            error: function(e) {
                                M.Util.message(e);
                            }
                        });

                    }, 5000)

                };

            }
                  
        };
    
        /**
         * Remove a process from the list of asynchronous processes
         * 
         * @param {String} location : statusLocation url (should be unique)
         * 
         */
        this.remove = function(location) {
            
            var item = this.items[location];
            
            /*
             * A clean remove means imperatively to first clear the TimeOut function !
             */
            if (item) {
                clearTimeout(item.fn);
                $('.status', item.message).html(item.process.title + " : " + M.Util._("Process finished"));
                delete this.items[location];
            }
            
        };
        
        return this.init();
    };

})(window.M);