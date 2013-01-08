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
 * WPS protocol reader implementation of OGC 05-007r7 and 08-091r6
 * 
 * See http://www.opengeospatial.org/standards/wps
 * 
 * @param {MapshupObject} M
 */
(function(M) {


    /*
     * Initialize M
     */
    M = M || {};

    /**
     * Initialize M.WPS
     * 
     * @param {String} url : WPS endpoint url
     */
    M.WPS = function(url) {


        /**
         * WPS Events manager reference
         */
        this.events = new M.WPS.Events();

        /**
         * WPS base url
         */
        this.url = url;

        /**
         * WPS Title - read from GetCapabilities document
         */
        this.title = null;

        /**
         * WPS Abstract - read from GetCapabilities document
         */
        this["abstract"] = null;

        /**
         * WPS Service version
         */
        this.version = "1.0.0";

        /**
         * WPS Service Provider information - read from GetCapabilities document
         */
        this.serviceProvider = {};

        /**
         * Hashtag of M.WPS.ProcessDescriptors objects stored by unique identifier
         */
        this.descriptors = [];

        /**
         * Initialize WPS class
         * 
         * @param {String} url : WPS service endpoint url
         */
        this.init = function(url) {
            this.url = url;
        };

        /**
         * Call GetCapabilities throught ajax request
         * and parse result
         */
        this.getCapabilities = function() {

            var url, self = this;

            /*
             * getcapabilities has been already called
             *  => no need to call it again !
             */
            if (this.title) {
                this.events.trigger("getcapabilities", this);
            }
            /*
             * Call GetCapabilities through ajax
             */
            else {

                /*
                 * Set GetCapabilities url
                 */
                url = M.Util.extendUrl(this.url, {
                    service: 'WPS',
                    version: self.version,
                    request: 'GetCapabilities'
                });

                /*
                 * Retrieve and parse GetCapabilities file
                 */
                M.Util.ajax({
                    url: M.Util.proxify(M.Util.repareUrl(url), "XML"),
                    async: true,
                    dataType: 'xml',
                    success: function(xml) {
                        self.parseCapabilities(xml);
                        self.events.trigger("getcapabilities", self);
                    },
                    error: function(e) {
                        M.Util.message(M.Util._("Error reading Capabilities file"));
                    }
                }, {
                    title: M.Util._("WPS") + " : " + M.Util._("Get capabilities"),
                    cancel: true
                });
            }

        };

        /**
         * Call DescribeProcess throught ajax request
         * and parse result
         * 
         * @param {Array} identifiers : array of Process unique identifiers
         * 
         */
        this.describeProcess = function(identifiers) {

            var url, descriptor, self = this;

            /*
             * Convert input to array if needed
             */
            if (!$.isArray(identifiers)) {
                identifiers = [identifiers];
            }

            /*
             * If describeProcess has been already called before,
             * refresh it but do not call service again
             */
            if (identifiers.length === 1) {
                descriptor = this.getProcessDescriptor(identifiers[0]);
                if (descriptor && descriptor.dataInputsDescription) {
                    self.events.trigger("describeprocess", [descriptor]);
                    return true;
                }
            }
            /*
             * Call DescribeProcess through ajax
             */
            url = M.Util.extendUrl(self.url, {
                service: 'WPS',
                version: self.version,
                request: 'DescribeProcess',
                identifier: identifiers.join(',')
            });

            /*
             * Retrieve and parse DescribeProcess file
             */
            M.Util.ajax({
                url: M.Util.proxify(M.Util.repareUrl(url), "XML"),
                async: true,
                dataType: 'xml',
                success: function(xml) {
                    var i, l, p, processDescriptions = self.parseDescribeProcess(xml), descriptors = [];
                    for (i = 0, l = processDescriptions.length; i < l; i++) {
                        p = new M.WPS.ProcessDescriptor(processDescriptions[i]);
                        self.addProcessDescriptor(p);
                        descriptors.push(p);
                    }
                    self.events.trigger("describeprocess", descriptors);
                },
                error: function(e) {
                    M.Util.message(M.Util._("Error reading DescribeProcess file"));
                }
            }, {
                title: identifiers.join(',') + " : " + M.Util._("Get DescribeProcess"),
                cancel: true
            });

            return true;

        };

        /**
         * Get an xml GetCapabilities object and return
         * a javascript object
         * 
         * GetCapabilities structure is :
         * 
         * <wps:Capabilities service="WPS" xml:lang="en-EN" version="1.0.0" updateSequence="1352815432361">
         *      <ows:ServiceIdentification>
         *          [...See Service Identification below...]
         *      </ows:ServiceIdentification>
         *      <ows:ServiceProvider>
         *          [...See Service Provider below...]
         *      </ows:ServiceProvider>
         *      <ows:OperationsMetadata>
         *          [...See Operations Metadata below...]
         *      </ows:OperationsMetadata>
         *      <wps:ProcessOfferings>
         *          [...See Process below...]
         *      </wps:ProcessOfferings>
         *      <wps:Languages>
         *          [...]
         *      </wps:Languages>
         *      <wps:WSDL xlink:href=""/>
         *  </wps:Capabilities>
         *  
         *  @param {XMLObject} xml
         * 
         */
        this.parseCapabilities = function(xml) {

            var self = this;

            /*
             * jquery 1.7+ query selector using find('*') and filter()
             * See http://www.steveworkman.com/html5-2/javascript/2011/improving-javascript-xml-node-finding-performance-by-2000/
             */
            $(xml).find('*').filter(function() {

                /*
                 * Service identification
                 * 
                 * GetCapabilities structure (version 1.0.0)
                 * 
                 * <ows:ServiceIdentification>
                 *      <ows:Title>WPS server</ows:Title>
                 *      <ows:Abstract>WPS server developed by XXX.</ows:Abstract>
                 *      <ows:Keywords>
                 *          <ows:Keyword>WPS</ows:Keyword>
                 *          <ows:Keyword>XXX</ows:Keyword>
                 *          <ows:Keyword>geoprocessing</ows:Keyword>
                 *      </ows:Keywords>
                 *      <ows:ServiceType>WPS</ows:ServiceType>
                 *      <ows:ServiceTypeVersion>1.0.0</ows:ServiceTypeVersion>
                 *      <ows:Fees>NONE</ows:Fees>
                 *      <ows:AccessConstraints>NONE</ows:AccessConstraints>
                 * </ows:ServiceIdentification>
                 * 
                 * Note that this function only store :
                 *      Title
                 *      Abstract
                 *      
                 */
                if (M.Util.stripNS(this.nodeName) === 'ServiceIdentification') {

                    $(this).children().filter(function() {
                        var nn = M.Util.stripNS(this.nodeName);
                        if (nn === 'Title' || nn === 'Abstract') {
                            self[M.Util.lowerFirstLetter(nn)] = $(this).text();
                        }
                    });
                }

                /*
                 * Service Provider
                 * 
                 * GetCapabilities structure (version 1.0.0)
                 * 
                 * <ows:ServiceProvider>
                 *      <ows:ProviderName>mapshup</ows:ProviderName>
                 *      <ows:ProviderSite xlink:href="http://www.geomatys.com/"/>
                 *      <ows:ServiceContact>
                 *              <ows:IndividualName>Jerome Gasperi</ows:IndividualName>
                 *              <ows:PositionName>CEO</ows:PositionName>
                 *              <ows:ContactInfo>
                 *                  <ows:Phone>
                 *                      <ows:Voice>06 00 00 00 00</ows:Voice>
                 *                      <ows:Facsimile/>
                 *                  </ows:Phone>
                 *                  <ows:Address>
                 *                      <ows:DeliveryPoint>Somewhere</ows:DeliveryPoint>
                 *                      <ows:City>TOULOUSE</ows:City>
                 *                      <ows:AdministrativeArea>Haute-Garonne</ows:AdministrativeArea>
                 *                      <ows:PostalCode>31000</ows:PostalCode>
                 *                      <ows:Country>France</ows:Country>
                 *                      <ows:ElectronicMailAddress>jerome.gasperi@gmail.com</ows:ElectronicMailAddress>
                 *                  </ows:Address>
                 *              </ows:ContactInfo>
                 *     </ows:ServiceContact>
                 * </ows:ServiceProvider>
                 * 
                 * Note that this function only store the following
                 *      
                 *      {
                 *          name
                 *          site
                 *          contact:{
                 *              name
                 *              position
                 *              phone
                 *              address:{
                 *              
                 *              }
                 *          }
                 *      }
                 *              
                 *      
                 */
                else if (M.Util.stripNS(this.nodeName) === 'ServiceProvider') {

                    var contact = {}, address = {}, phone = {};

                    /*
                     * Initialize serviceProvider
                     */
                    self.serviceProvider = {};

                    $(this).children().filter(function() {

                        switch (M.Util.stripNS(this.nodeName)) {
                            /* ServiceContact*/
                            case 'ServiceContact':
                                $(this).children().each(function() {
                                    switch (M.Util.stripNS(this.nodeName)) {
                                        /* ContactInfo*/
                                        case 'ContactInfo':
                                            $(this).children().each(function() {
                                                switch (M.Util.stripNS(this.nodeName)) {
                                                    /* Phone */
                                                    case 'Phone':
                                                        phone = self.parseLeaf($(this));
                                                        break;
                                                        /* Address */
                                                    case 'Address':
                                                        address = self.parseLeaf($(this));
                                                        break;
                                                }
                                            });
                                            break;
                                        default:
                                            contact[M.Util.lowerFirstLetter(M.Util.stripNS(this.nodeName))] = $(this).text();
                                            break;
                                    }
                                });
                                break;
                            default:
                                self.serviceProvider[M.Util.lowerFirstLetter(M.Util.stripNS(this.nodeName))] = $(this).text();
                                break;
                        }

                    });

                    self.serviceProvider.contact = contact || {};
                    self.serviceProvider.contact["phone"] = phone;
                    self.serviceProvider.contact["address"] = address;

                }

                /*
                 * Get individual process descriptor
                 * 
                 * GetCapabilities structure (version 1.0.0)
                 * 
                 * <wps:ProcessOfferings>
                 *      <wps:Process wps:processVersion="1.0.0">
                 *          <ows:Identifier>urn:ogc:cstl:wps:jts:intersection</ows:Identifier>
                 *          <ows:Title>Jts : Intersection</ows:Title>
                 *          <ows:Abstract>Computes a intersection Geometry between the source geometry (geom1) and the other (geom2).</ows:Abstract>
                 *      </wps:Process>
                 *      [...]
                 * </wps:ProcessOfferings>
                 * 
                 */
                else if (M.Util.stripNS(this.nodeName) === 'Process') {
                    self.addProcessDescriptor(new M.WPS.ProcessDescriptor(self.parseLeaf($(this))));
                }

            });

            return true;

        };

        /**
         * Get an xml DescribeProcess object and return a javascript object
         * 
         * DescribeProcess structure is :
         * 
         * <wps:ProcessDescriptions xmlns:gml="http://www.opengis.net/gml" xmlns:xlink="http://www.w3.org/1999/xlink" xmlns:mml="http://www.w3.org/1998/Math/MathML" xmlns:wps="http://www.opengis.net/wps/1.0.0" xmlns:ows="http://www.opengis.net/ows/1.1" service="WPS" version="1.0.0" xml:lang="en-EN">
         *      <ProcessDescription storeSupported="true" statusSupported="true" wps:processVersion="1.0.0">
         *          <ows:Identifier>urn:ogc:cstl:wps:jts:buffer</ows:Identifier>
         *          <ows:Title>Jts : Buffer</ows:Title>
         *          <ows:Abstract>Apply JTS buffer to a geometry.</ows:Abstract>
         *          <DataInputs>
         *              [...See DataInputs below...]
         *          </DataInputs>
         *          <ProcessOutputs>
         *              [...See DataOutputs below...]
         *          </ProcessOutputs>
         *      </ProcessDescription>
         *      [...]
         *  </wps:Capabilities>
         *  
         *  @param {XMLObject} xml
         * 
         */
        this.parseDescribeProcess = function(xml) {

            var self = this;

            /*
             * Initialize an empty process description
             */
            var processDescriptions = [];

            /*
             * jquery 1.7+ query selector using find('*') and filter()
             * See http://www.steveworkman.com/html5-2/javascript/2011/improving-javascript-xml-node-finding-performance-by-2000/
             */
            $(xml).find('*').filter(function() {

                /*
                 * Service identification
                 * 
                 * ProcessDescription structure
                 * 
                 * <ProcessDescription>
                 *      <ows:Identifier>urn:ogc:cstl:wps:jts:buffer</ows:Identifier>
                 *      <ows:Title>Jts : Buffer</ows:Title>
                 *      <ows:Abstract>Apply JTS buffer to a geometry.</ows:Abstract>
                 *      <DataInputs>
                 *          [...See DataInputs below...]
                 *      </DataInputs>
                 *      <ProcessOutputs>
                 *          [...See DataOutputs below...]
                 *      </ProcessOutputs>
                 * </ProcessDescription>
                 *      
                 */
                if (M.Util.stripNS(this.nodeName) === 'ProcessDescription') {


                    var nn, p = {};

                    /* Retrieve ProcessDescription attributes */
                    $.extend(p, M.Util.getAttributes($(this)));

                    $(this).children().filter(function() {
                        nn = M.Util.lowerFirstLetter(M.Util.stripNS(this.nodeName));
                        /* Process Inputs and Outupts*/
                        if (nn === 'dataInputs' || nn === 'processOutputs') {
                            p[nn + 'Description'] = self.parseDescribePuts($(this).children());
                        }
                        else if (nn === 'title' || nn === 'identifier' || nn === 'abstract') {
                            p[nn] = $(this).text();
                        }

                    });

                    processDescriptions.push(p);
                }

            });
            return processDescriptions;

        };


        /**
         * Parse DataInputs (or ProcessOutputs) of the DescribeProcess elements
         * 
         * @param {Object} $obj : jQuery object reference to list of 'Input' (or 'Output') elements
         */
        this.parseDescribePuts = function($obj) {

            var nn, self = this, puts = [];

            /*
             * Parse each 'Input' (or 'Output') elements
             */
            $obj.each(function() {

                var p = {};

                /* Get attributes - i.e. minOccurs and maxOccurs for Input */
                $.extend(p, M.Util.getAttributes($(this)));

                /*
                 * Parse each element from current element
                 */
                $(this).children().filter(function() {

                    nn = M.Util.lowerFirstLetter(M.Util.stripNS(this.nodeName));

                    if (nn === 'complexData' || nn === 'complexOutput') {
                        p[nn] = self.parseDescribeComplexPut($(this));
                    }
                    else if (nn === 'literalData' || nn === 'literalOutput') {
                        p[nn] = self.parseDescribeLiteralPut($(this));
                    }
                    else if (nn === 'boundingBoxData' || nn === 'boundingBoxOutput') {
                        p[nn] = self.parseDescribeBoundingBoxPut($(this));
                    }
                    else if (nn === 'title' || nn === 'identifier' || nn === 'abstract') {
                        p[nn] = $(this).text();
                    }

                });

                puts.push(p);
            });

            return puts;
        };

        /**
         * Parse ComplexData (or ComplexOutput) of the DescribeProcess elements
         * 
         * Structure :
         * 
         *   <ComplexData maximumMegabytes="100">
         *           <Default>
         *                <Format>
         *                    <MimeType>application/gml+xml</MimeType>
         *                    <Encoding>utf-8</Encoding>
         *                    <Schema>http://schemas.opengis.net/gml/3.1.1/base/gml.xsd</Schema>
         *                </Format>
         *            </Default>
         *            <Supported>
         *                <Format>
         *                    <MimeType>text/xml</MimeType>
         *                    <Encoding>utf-8</Encoding>
         *                    <Schema>http://schemas.opengis.net/gml/3.1.1/base/gml.xsd</Schema>
         *                </format>
         *                [...]
         *            </Supported>
         *   </ComplexData>
         * 
         * @param {Object} $obj : jQuery object reference to a ComplexData (or a ComplexOutput) element
         */
        this.parseDescribeComplexPut = function($obj) {

            var nn, self = this, p = {};

            /* Get attributes - i.e. minOccurs and maxOccurs for Input */
            $.extend(p, M.Util.getAttributes($obj));

            /*
             * Parse each ComplexData (or ComplexOutput) element
             */
            $obj.children().filter(function() {

                nn = M.Util.lowerFirstLetter(M.Util.stripNS(this.nodeName));

                if (nn === 'default') {
                    p[nn] = self.parseLeaf($(this).children());
                }
                else if (nn === 'supported') {
                    p[nn] = [];
                    $(this).children().filter(function() {
                        p[nn].push(self.parseLeaf($(this)));
                    });
                }

            });

            return p;

        };

        /**
         * Parse LiteralData (or LiteralOutput) of the DescribeProcess elements
         * 
         * @param {Object} $obj : jQuery object reference to a LiteralData (or a LiteralOutput) element
         */
        this.parseDescribeLiteralPut = function($obj) {

            var nn, p = {};

            /* Get attributes - i.e. minOccurs and maxOccurs for Input */
            $.extend(p, M.Util.getAttributes($obj));

            /*
             * Parse each LiteralData (or LiteralOutput) element
             */
            $obj.children().filter(function() {
                nn = M.Util.lowerFirstLetter(M.Util.stripNS(this.nodeName));

                /* Get DataType ows:reference */
                if (nn === 'dataType') {
                    $.extend(p, M.Util.getAttributes($(this)));
                }

                /*
                 * Unit Of Measure case
                 * 
                 *      <UOMs>
                 *          <Default>
                 *              <ows:UOM>m</ows:UOM>
                 *          </Default>
                 *          <Supported>
                 *              <ows:UOM>m</ows:UOM>
                 *              <ows:UOM>Ao</ows:UOM>
                 *              <ows:UOM>[mi_i]</ows:UOM>
                 *          </Supported>
                 *      </UOMs>
                 * 
                 * 
                 */
                if (nn === 'uOMs') {

                    p['UOMs'] = {};

                    $(this).children().filter(function() {

                        nn = M.Util.lowerFirstLetter(M.Util.stripNS(this.nodeName));

                        if (nn === 'default') {
                            p['UOMs']['default'] = $(this).children().text();
                        }
                        else if (nn === 'supported') {
                            p['UOMs']['supported'] = [];
                            $(this).children().filter(function() {
                                p['UOMs']['supported'].push($(this).text());
                            });
                        }
                    });
                }
                /*
                 * AllowedValues case
                 * 
                 *      <AllowedValues>
                 *          <Value>blabalbl</Value>
                 *          <Value>bliblibli</Value>
                 *          <Range>
                 *              <MinimumValue></MinimumValue>
                 *              <MaximumValue></MaximumValue>
                 *          </Range>
                 *      </AllowedValues>
                 *      
                 *      // TODO range
                 * 
                 */
                else if (nn === 'allowedValues') {

                    p['allowedValues'] = [];

                    $(this).children().filter(function() {

                        nn = M.Util.lowerFirstLetter(M.Util.stripNS(this.nodeName));

                        if (nn === 'value') {
                            p['allowedValues'].push({value: $(this).text()});
                        }
                        else if (nn === 'range') {
                            // TODO
                        }
                    });
                }
                else {
                    p[nn] = $(this).text();
                }

            });

            return p;

        };

        /**
         * Parse BoundingBoxData (or BoundingBoxOutput) of the DescribeProcess elements
         * 
         *   <BoundingBoxData>
         *       <Default>
         *           <CRS>urn:ogc:def:crs:EPSG:6.6:4326</CRS>
         *       </Default>
         *       <Supported>
         *           <CRSsType>
         *               <CRS>urn:ogc:def:crs:EPSG:6.6:4326</CRS>
         *               <CRS>urn:ogc:def:crs:EPSG:6.6:4979</CRS>
         *           </CRSsType>
         *       </Supported>
         *   </BoundingBoxData>
         * 
         * @param {Object} $obj : jQuery object reference to a BoundingBoxData (or a BoundingBoxOutput) element
         */
        this.parseDescribeBoundingBoxPut = function($obj) {

            var nn, p = {};

            /*
             * Parse each ComplexData (or ComplexOutput) element
             */
            $obj.children().filter(function() {

                nn = M.Util.lowerFirstLetter(M.Util.stripNS(this.nodeName));

                if (nn === 'default') {
                    p[nn] = $(this).children().text();
                }
                else if (nn === 'supported') {
                    p[nn] = [];
                    $(this).children().filter(function() {
                        p[nn].push($(this).text());
                    });
                }

            });

            return p;

        };

        /**
         * Retrun a json representation of a Leaf jQuery element
         * 
         * @param {Object} $obj : jQuery object reference to a Format element
         * @param {boolean} nolower : if true the javascript is not camel-cased
         */
        this.parseLeaf = function($obj, nolower) {

            var p = {};

            $obj.children().each(function() {
                p[nolower ? M.Util.stripNS(this.nodeName) : M.Util.lowerFirstLetter(M.Util.stripNS(this.nodeName))] = $(this).text();
            });

            return p;
        };


        /**
         * Request 'execute' service on process identified by identifier
         * 
         * @param {String} identifier : M.WPS.ProcessDescriptor object identifier
         * @param {Object} options : options to modify execution (optional)
         *                          {
         *                              storeExecute: // boolean (set to true to set asynchronous mode)
         *                              asReference: // boolean (set to true to have complexOutput resulte
         *                                              as an url instead of directly set within the executeResponse
         *                          }
         */
        this.execute = function(identifier, options) {

            var descriptor = this.getProcessDescriptor(identifier);

            /*
             * Paranoid mode
             */
            if (!descriptor) {
                return false;
            }

            return descriptor.execute(options);

        };

        /**
         * Add process descriptor to this.descriptors list
         *
         * @param {Object} descriptor : M.WPS.ProcessDescriptor object
         */
        this.addProcessDescriptor = function(descriptor) {

            /*
             * Paranoid mode
             */
            if (!descriptor) {
                return false;
            }

            /*
             * Effectively add a new process
             */
            $.extend(descriptor, {
                wps: this
            });

            this.descriptors[descriptor.identifier] = descriptor;

            return true;

        };

        /**
         * Get process from this.descriptors list based on its identifier
         *
         * @param {String} identifier : M.WPS.ProcessDescriptor object identifier
         */
        this.getProcessDescriptor = function(identifier) {
            if (!identifier) {
                return null;
            }
            return this.descriptors[identifier];
        };

        /**
         * Return WPS server info as an HTML string
         * 
         *      <div>
         *          <h1>wps.title</h1>
         *          <p>wps.abstract</p>
         *          <p>Version wps.version</p>
         *          <h2>Provided by <a href="wps.serviceProvider.providerSite" target="_blank">wps.serviceProvider.providerName</a></h2>
         *          <h2>Contact</h2>
         *          <p>
         *              wps.serviceProvider.contact.individualName
         *              wps.serviceProvider.contact.phone.voice
         *          </p>
         *      </div>
         * 
         */
        this.toHTML = function() {

            /*
             * Only process WPS when getCapabilities is read
             */
            if (!this.title) {
                return "";
            }

            return M.Util.parseTemplate(M.WPS.infoTemplate, {
                "title": this.title,
                "abstract": this["abstract"],
                "version": this.version,
                "providerSite": this.serviceProvider.providerSite,
                "providerName": this.serviceProvider.providerName
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
                type: "GeoJSON",
                title: this.title,
                clusterized: false, // Very important !
                editable: true,
                ol: {
                    styleMap: new OpenLayers.StyleMap({
                        'default': {
                            strokeColor: 'white',
                            strokeWidth: 1,
                            fillColor: 'red',
                            fillOpacity: 0.2,
                            pointRadius: 5
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
                data: data,
                layer: this.getLayer(),
                zoomOnNew: true
            });

        };

        this.init(url);

        return this;

    };

    /**
     * WPS ProcessDescriptor
     * 
     * @param {Object} options : WPS process initialization options
     * 
     *      {
     *          identifier: // process unique identifier
     *          title: // process title
     *          abstract: // process description
     *          wps: // reference to the M.WPS parent
     *      }
     */
    M.WPS.ProcessDescriptor = function(options) {

        /**
         * M.WPS object reference
         */
        this.wps = null;

        /**
         * Process unique identifier 
         */
        this.identifier = null;

        /**
         * Process title
         */
        this.title = null;

        /**
         * Process abstract
         */
        this["abstract"] = null;

        /**
         * DataInputs description read from describeDescription
         */
        this.dataInputsDescription = null;

        /**
         * OutputsProcess description read from describeDescription
         */
        this.outputsProcessDescription = null;

        /**
         * List of inputs (Set by M.Plugins.WPSClient for example)
         * 
         * Input stucture 
         *      {
         *          type: // 'LiteralData', 'ComplexData' or 'BoundingBoxData'  - MANDATORY
         *          identifier: // Unique Input identifier - MANDATORY
         *          data: // Data (e.g. value for LiteralData) - MANDATORY ?
         *          uom: // Unit Of Measure, for LiteralData only - OPTIONAL 
         *          format: // ??? - OPTIONAL
         *      }
         * 
         */
        this.inputs = [];

        /**
         * List of outputs (Set by M.Plugins.WPSClient for example)
         */
        this.outputs = [];

        /*
         * Process initialization
         * options structure :
         * 
         *      {
         *          identifier: // process unique identifier
         *          title: // process title
         *          abstract: // process description
         *          wps: // reference to the M.WPS parent
         *      }
         * 
         */
        this.init = function(options) {
            $.extend(this, options);
        };

        /**
         * Clear inputs and outputs list
         */
        this.clear = function() {
            this.clearInputs();
            this.clearOutputs();
        };

        /**
         * Clear inputs list
         */
        this.clearInputs = function() {
            this.inputs = [];
        };

        /**
         * Clear outputs list
         */
        this.clearOutputs = function() {
            this.outputs = [];
        };

        /**
         * Add an input
         * 
         * @param {Object} input (see input structure above in this.inputs comment)
         */
        this.addInput = function(input) {
            this.inputs.push(input);
        };

        /**
         * Add an output
         * 
         * @param {Object} output (see output structure above in this.outputs comment)
         */
        this.addOutput = function(output) {
            this.outputs.push(output);
        };

        /**
         * Create a child Process and launch 'execute' request 
         * 
         *  @param {Object} options : options to modify execution (optional)
         *                          {
         *                              storeExecute: // boolean (set to true to set asynchronous mode)
         *                              asReference: // boolean (set to true to have complexOutput resulte
         *                                              as an url instead of directly set within the executeResponse
         *                          }
         */
        this.execute = function(options) {
            var process = new M.WPS.Process({
                descriptor: this,
                inputs: M.Util.clone(this.inputs),
                outputs: M.Util.clone(this.outputs)
            });

            return process.execute(options);
        };

        this.init(options);

        return this;
    };

    /**
     * WPS Process
     * 
     * @param {Object} options : WPS process initialization options
     * 
     *      {
     *          descriptor: // reference to the M.WPS parent
     *      }
     */
    M.WPS.Process = function(options) {

        /**
         * M.WPS.ProcessDescriptor object reference
         */
        this.descriptor = null;

        /**
         * List of inputs
         * Same structure as M.WPS.ProcessDescriptor inputs
         */
        this.inputs = [];

        /**
         * List of outputs
         */
        this.outputs = [];

        /**
         * Process status abstract (i.e. text description under <wps:Status>)
         */
        this.statusAbstract = null;

        /**
         * Process statusLocation (set during execute)
         */
        this.statusLocation = null;

        /**
         * Process status. Could be one of the following :
         *      ProcessAccepted
         *      ProcessStarted
         *      ProcessPaused
         *      ProcessSucceeded
         *      ProcessFailed
         * 
         */
        this.status = null;

        /**
         * Result object read from executeResponse
         * 
         * Structure 
         *      [
         *          {
         *              identifier://
         *              data:{
         *                  value://
         *              }
         *          }
         *          ,
         *          ...
         *      ]
         * 
         */
        this.result = null;

        /**
         * Process initialization
         *
         * @param {Object} options
         * 
         */
        this.init = function(options) {
            $.extend(this, options);
        };

        /**
         * Launch WPS execute request
         * 
         * @param {Object} options : options to modify execution (optional)
         *                          {
         *                              storeExecute: // boolean (set to true to set asynchronous mode)
         *                              asReference: // boolean (set to true to have complexOutput resulte
         *                                              as an url instead of directly set within the executeResponse
         *                          }
         */
        this.execute = function(options) {

            var i, l, data, template, formatStr, put, outputs = "", inputs = "", self = this;

            /*
             * Paranoid mode
             */
            options = options || {};

            /*
             * executeResponse can only be stored if the server
             * support it
             */
            if (!this.descriptor.storeSupported) {
                options.storeExecute = false;
            }

            /*
             * If the first output is a ComplexOutput and its mimeType is not a
             * Geographical mimeType, then store executeResponse on server 
             * 
             * Note : this does not superseed the input storeExecute options
             */
            if (!options.hasOwnProperty("storeExecute")) {
                options.storeExecute = false;
                for (i = 0, l = this.outputs.length; i < l; i++) {
                    if (this.outputs[i].type === 'ComplexOutput') {
                        if (!M.Map.Util.getGeoType(this.outputs[i].mimeType)) {
                            options.storeExecute = true;
                            break;
                        }
                    }
                }
            }

            /*
             * Initialize process request
             */
            data = M.Util.parseTemplate(M.WPS.executeRequestTemplate, {
                identifier: this.descriptor.identifier,
                storeExecute: options.storeExecute,
                status: this.statusSupported || false
            });

            /*
             * Process Inputs
             */
            for (i = 0, l = this.inputs.length; i < l; i++) {
                put = this.inputs[i];
                template = "";
                formatStr = "";

                /*
                 * LiteralData
                 */
                if (put.type === "LiteralData" && put.data) {
                    template = M.Util.parseTemplate(M.WPS.literalDataInputTemplate, {
                        identifier: put.identifier,
                        data: put.data,
                        uom: put.uom || ""
                    });
                }
                else if (put.type === "ComplexData") {

                    /*
                     * Pass data by reference
                     */
                    if (put.fileUrl) {
                        template = M.Util.parseTemplate(M.WPS.complexDataInputReferenceTemplate, {
                            identifier: put.identifier,
                            reference: put.fileUrl.replace('&', '&#038;') // URIEncode should be better but not supported by Constellation server
                        });
                    }
                    /*
                     * Pass data within XML file
                     */
                    else if (put.data) {
                        template = M.Util.parseTemplate(M.WPS.complexDataInputTemplate, {
                            identifier: put.identifier,
                            data: put.data
                        });
                    }
                    if (put.format) {
                        if (put.format.mimeType) {
                            formatStr += " mimeType=\"" + put.format.mimeType + "\"";
                        }
                        if (put.format.schema) {
                            formatStr += " schema=\"" + put.format.schema + "\"";
                        }
                        if (put.format.encoding) {
                            formatStr += " encoding=\"" + put.format.encoding + "\"";
                        }
                    }
                    template = template.replace("$format$", formatStr);

                }
                /*       
                 else if (input.CLASS_NAME.search("BoundingBox") > -1) {
                 tmpl = OpenLayers.WPS.boundingBoxInputTemplate.replace("$DIMENSIONS$",input.dimensions);
                 tmpl = tmpl.replace("$CRS$",input.crs);
                 tmpl = tmpl.replace("$MINX$",input.value.minx);
                 tmpl = tmpl.replace("$MINY$",input.value.miny);
                 tmpl = tmpl.replace("$MAXX$",input.value.maxx);
                 tmpl = tmpl.replace("$MAXY$",input.value.maxy);
                 }
                 */
                inputs += template;
            }

            /*
             * Process Outputs
             */
            for (i = 0, l = this.outputs.length; i < l; i++) {
                put = this.outputs[i];
                template = "";
                formatStr = "";

                /*
                 * LiteralOutput
                 */
                if (put.type === "LiteralOutput") {
                    template = M.Util.parseTemplate(M.WPS.literalOutputTemplate, {
                        identifier: put.identifier
                    });
                }
                else if (put.type === "ComplexOutput") {

                    /*
                     * Detect if the output is streamed directly within
                     * the executeResponse or set as an url
                     * By default the result should be set as reference
                     */
                    if (!options.hasOwnProperty("asReference")) {
                        options.asReference = true;
                    }

                    if (put.mimeType) {
                        formatStr += " mimeType=\"" + put.mimeType + "\"";
                    }

                    /*
                     * If mimeType is not a Geographical mimeType, then request data
                     * as reference in any case
                     */
                    template = M.Util.parseTemplate(M.WPS.complexOutputTemplate, {
                        identifier: put.identifier,
                        asReference: M.Map.Util.getGeoType(put.mimeType) ? false : options.asReference,
                        format: formatStr
                    });
                }
                else if (put.type === "BoundingBoxOutput") {
                    template = M.Util.parseTemplate(M.WPS.boundingBoxOutputTemplate, {
                        identifier: put.identifier
                    });
                }
                outputs += template;
            }

            /*
             * Set Inputs and Outputs
             */
            data = M.Util.parseTemplate(data, {
                dataInputs: inputs,
                dataOutputs: outputs
            });

            /*
             * Launch execute request
             */
            M.Util.ajax({
                url: M.Util.proxify(M.Util.repareUrl(self.descriptor.wps.url), "XML"),
                async: true,
                type: "POST",
                dataType: "xml",
                contentType: "text/xml",
                data: data,
                success: function(xml) {

                    self.result = self.parseExecuteResponse(xml);

                    /*
                     * Result is null only if an ExceptionReport occured
                     */
                    if (self.result) {
                        self.descriptor.wps.events.trigger("execute", self);
                    }
                },
                error: function(e) {
                    M.Util.message(e);
                }
            }, {
                title: this.title + " : " + M.Util._("Execute"),
                cancel: true
            });

            return true;

        };

        /**
         * Get an xml executeResponse object and return a javascript object
         * 
         * executeResponse structure is :
         * 
         *      <wps:ExecuteResponse xmlns:gml="http://www.opengis.net/gml" xmlns:xlink="http://www.w3.org/1999/xlink" xmlns:mml="http://www.w3.org/1998/Math/MathML" xmlns:wps="http://www.opengis.net/wps/1.0.0" xmlns:ows="http://www.opengis.net/ows/1.1" serviceInstance="http://mywpsserver/?SERVICE=WPS&amp;REQUEST=GetCapabilities" statusLocation="http://mywpsserver/wps/output/d409fb4a-5131-4041-989e-c4de171d2881" service="WPS" version="1.0.0" xml:lang="en-EN">
         *          <wps:Process wps:processVersion="1.0.0">
         *              <ows:Identifier>urn:ogc:cstl:wps:math:add</ows:Identifier>
         *              <ows:Title>Add</ows:Title>
         *              <ows:Abstract>Adds two double.</ows:Abstract>
         *          </wps:Process>
         *          <wps:Status creationTime="2013-01-03T14:14:34.632Z">
         *              <wps:ProcessSucceeded>Process succeeded.</wps:ProcessSucceeded>
         *          </wps:Status>
         *          <wps:ProcessOutputs>
         *              <wps:Output>
         *                  <ows:Identifier>urn:ogc:cstl:wps:math:add:output:result</ows:Identifier>
         *                  <ows:Title>Result</ows:Title>
         *                  <ows:Abstract>Addition result</ows:Abstract>
         *                  <wps:Data>
         *                      <wps:LiteralData dataType="http://www.w3.org/TR/xmlschema-2/#double">46.0</wps:LiteralData>
         *                  </wps:Data>
         *              </wps:Output>
         *          </wps:ProcessOutputs>
         *      </wps:ExecuteResponse>
         *      
         *  Note : if "asReference" is set to true in the request, then the <wps:Data> element is replaced by 
         *  
         *     <wps:Reference href="http://constellation-wps.geomatys.com/cstl-wrapper/wps/output/8ef6ecdf-5f62-4bcd-b0ac-2cae2adcbb43" mimeType="image/png"></wps:Reference>
         *
         *
         * @param {XMLObject} xml
         * 
         */
        this.parseExecuteResponse = function(xml) {

            var sl, nn, result = [], $obj = $(xml), self = this;

            /*
             * Trap Exception
             */
            if (M.Util.stripNS($obj.children()[0].nodeName) === 'ExceptionReport') {
                this.parseException(xml);
                return null;
            }

            /*
             * Retrieve ExecuteResponse statusLocation attribute
             * 
             * Note : some server (e.g. Constellation Geomatys) does not set the statusLocation
             * within the message stored at statusLocation url. Thus we set the statusLocation
             * for the first request and do not update it if the response does not have a status location
             */
            sl = M.Util.getAttributes($obj.children())["statusLocation"];
            if (sl) {
                this.statusLocation = sl;
            }

            /*
             * Process <wps:ProcessOutputs> and <wps:Status> elements
             */
            $obj.children().children().filter(function() {

                /*
                 * Store status
                 */
                if (M.Util.stripNS(this.nodeName) === 'Status') {
                    self.status = M.Util.stripNS($(this).children()[0].nodeName);
                    self.statusAbstract = $(this).children().first().text();
                }

                /*
                 * ProcessOutputs
                 * 
                 * If Status value is "ProcessAccepted" (i.e. immediate answer of an asynchronous
                 * request), then the ProcessOutputs should not be set by server
                 */
                else if (M.Util.stripNS(this.nodeName) === 'ProcessOutputs') {

                    /*
                     * Process Output i.e. all <wps:Output> elements
                     */
                    $(this).children().each(function() {

                        var p = {};

                        $(this).children().each(function() {

                            nn = M.Util.lowerFirstLetter(M.Util.stripNS(this.nodeName));

                            /*
                             * Store identifier and data bloc
                             */
                            if (nn === 'identifier') {
                                p[nn] = $(this).text();
                            }
                            /*
                             * Execute request with asReference="false"
                             */
                            else if (nn === 'data') {

                                p['data'] = {};

                                /*
                                 * Parse result within <wps:Data> element
                                 */
                                $(this).children().filter(function() {

                                    nn = M.Util.stripNS(this.nodeName);

                                    if (nn === 'LiteralData') {
                                        p['data']['value'] = $(this).text();
                                    }
                                    else if (nn === 'ComplexData') {
                                        $.extend(p['data'], M.Util.getAttributes($(this)));
                                        p['data']['value'] = $(this).children();
                                    }
                                    else if (nn === 'BoundingBox') {
                                        // TODO    
                                    }
                                });

                            }
                            /*
                             * Execute request with asReference="true"
                             */
                            else if (nn === 'reference') {
                                p['reference'] = M.Util.getAttributes($(this));
                            }
                        });

                        result.push(p);

                    }); // End of process <wps:Output>

                } // End if (M.Util.stripNS(this.nodeName) === 'ProcessOutputs')

            });

            return result;

        };

        /**
         * Return a json representation of a WPS ows:ExceptionReport
         *
         * @param {Object} xml
         */
        this.parseException = function(xml) {
            M.Util.message("TODO - parse Exception");
        };

        this.init(options);

        return this;
    };

    /**
     * WPS Asynchronous Process Manager
     * 
     * The APM is used to store asynchronous processes and results
     * It is called by the WPSClientPlugin
     */
    M.WPS.asynchronousProcessManager = function() {

        /*
         * Unique identifier of the asynchronousProcessManager item 
         * within the UserManagement toolbar
         */
        this.tbID = M.Util.getId();

        /*
         * Reference to the UserManagement plugin instance
         */
        this.um = null;

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
            M.events.register("signin", this, function(scope, um) {

                /*
                 * Tell WPSClient that user is signed in
                 */
                scope._signedIn = true;

                /*
                 * Store the UserManagement plugin instance reference
                 */
                scope.um = um;

                /*
                 * Add a new entry in the UserManagement userBar
                 */
                scope.um.add([{
                        id: scope.tbID,
                        icon: M.Util.getImgUrl("execute.png"),
                        tt: "Processes",
                        onoff: true,
                        scope: scope,
                        onactivate: function(s, item) {
                            s.isVisible = true;
                            s.um.getPopup().show();
                            s.updateProcessesList();
                        },
                        ondeactivate: function(s, item) {
                            s.isVisible = false;
                            s.um.getPopup().hide();
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
         * Get an asynchronous process from its statusLocation
         * 
         * @param {String} statusLocation
         */
        this.get = function(statusLocation) {

            if (!statusLocation) {
                return null;
            }

            /*
             * Roll over items
             */
            for (var i = 0, l = this.items.length; i < l; i++) {
                if (this.items[i].statusLocation === statusLocation) {
                    return this.items[i];
                }
            }

            return null;
        };

        /**
         * Add a process to the list of asynchronous processes
         * 
         * @param {M.WPS.Process} process : Process
         * @param {Object} options : additional info used to reconstruct M.WPS and M.WPSDescriptor instance
         *                           from a context when user signed in
         *                           {
         *                              wpsUrl: // WPS endpoint url
         *                              identifier: // WPS ProcessDescriptor unique identifier
         *                           }
         */
        this.add = function(process, options) {

            var self = this;

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
            if (!self.get(process.statusLocation)) {

                /*
                 * Great news for user :)
                 */
                M.Util.message('<span class="status">' + process.descriptor.title + " : " + M.Util._("Process accepted and running") + '</span>');

                /*
                 * Add an entry within the running process hashmap
                 */
                self.items.push({
                    id: M.Util.getId(),
                    statusLocation: process.statusLocation,
                    time: (new Date()).toISOString(),
                    process: process,
                    /*
                     * Periodically check the Process Status (every 5 seconds) 
                     */
                    fn: setTimeout(function() {

                        /*
                         * Background execute request
                         */
                        $.ajax({
                            url: M.Util.proxify(process.statusLocation, "XML"),
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
                                    process.descriptor.wps.events.trigger("execute", process);
                                }

                            },
                            error: function(e) {
                                M.Util.message(e);
                            }
                        });

                    }, 5000)

                });

                /*
                 * Update user bar 
                 */
                self.updateProcessesList();

            }
        };

        /**
         * Update a process when it is over (i.e. status is "ProcessSuceeded")
         * 
         * @param {M.WPS.Process} process : Process
         */
        this.update = function(process) {

            /*
             * Paranoid mode
             */
            if (!process) {
                return false;
            }

            this.updateProcessesList();

        };

        /**
         * Remove a process from the list of asynchronous processes
         * 
         * @param {String} statusLocation : statusLocation url (should be unique)
         * 
         */
        this.remove = function(statusLocation) {

            if (!statusLocation) {
                return false;
            }

            /*
             * Roll over items
             */
            for (var i = 0, l = this.items.length; i < l; i++) {

                /*
                 * Remove item with corresponding statusLocation
                 * A clean remove means imperatively to first clear the TimeOut function !
                 */
                if (this.items[i].statusLocation === statusLocation) {

                    clearTimeout(this.items[i].fn);
                    this.items.splice(i, 1);

                    /*
                     * Display processes list
                     */
                    this.updateProcessesList();

                    return true;
                }
            }

            return false;

        };

        /**
         * Update processes list
         * 
         * The process list is displayed within the UserManagement shared popup
         */
        this.updateProcessesList = function() {

            /*
             * Display Process list
             */
            var $tbody, i, l = this.items.length, item = this.um.tb.get(this.tbID), p = this.um.getPopup();

            /*
             * Set a nice running processes counter
             */
            if (l === 0) {
                $('.counter', item.$d).remove();
            }
            else {
                item.$d.append('<span class="counter">' + l + '</span>');
            }

            /*
             * Only update userBar if Processes list is visible
             */
            if (!this.isVisible) {
                return false;
            }

            /*
             * Set UserManagement popup header
             */
            p.$h.html(M.Util._("Running processes"));

            /*
             * The very-easy-to-manage no process case 
             */
            if (l === 0) {
                p.$b.html("No running process");
            }
            /*
             * For each process set an entry with the following actions/infos
             * 
             *  Status  identifier  result  remove
             */
            else {

                /*
                 * Initialize <table> container
                 */
                p.$b.html('<table style="width:100%"><tbody></tbody></table>');
                $tbody = $('tbody', p.$b);

                /*
                 * Process order is first in - first out   
                 */
                for (i = l; i--; ) {
                    (function(item, self) {

                        var j, result, $status, $info, $result, id = item.id;

                        /*
                         * Add entry
                         */
                        $tbody.append('<tr><td id="' + id + 'status" style="width:20px">&nbsp;&nbsp;</td><td>&nbsp;</td><td id="' + id + 'info" class="clickable" jtitle="' + item.process.descriptor.identifier + ' : ' + item.time + '">' + M.Util.shorten(item.process.descriptor.identifier, 10) + '</td><td id="' + id + 'result" ></td><td class="clickable remove" id="' + item.id + 'rm"><img class="middle" src="' + M.Util.getImgUrl("trash2.png") + '"/></td></tr>');
                        $status = $('#' + id + 'status');
                        $info = $('#' + id + 'info');
                        $result = $('#' + id + 'result');
                        M.tooltip.add($info, 'n');
                        
                        /*
                         * Complete Process info depending on status
                         */
                        switch (item.process.status) {

                            /*
                             * Process succeeded
                             */
                            case "ProcessSucceeded":

                                /*
                                 * Update status
                                 */
                                $status.css({
                                    'background-color': 'olivedrab'
                                });

                                /*
                                 * Update Result
                                 */

                                /* 
                                 * No result = nothing to update
                                 */
                                if (!$.isArray(item.process.result)) {
                                    return false;
                                }

                                /*
                                 * Update each element that are identified in the process.result array
                                 */
                                for (j = item.process.result.length; j--; ) {

                                    result = item.process.result[j];

                                    /*
                                     * Two cases : data is directly accessible within the result,
                                     * or data is accessible through an url (reference)
                                     */
                                    if (result.data) {

                                        /*
                                         * Simple value => display result
                                         */
                                        if (typeof result.data.value !== "object") {
                                            $result.html(result.data.value);
                                        }
                                        /*
                                         * Complex output
                                         */
                                        else {

                                            /*
                                             * Result display requires a specific user action
                                             */
                                            (function(result, process) {
                                                $result.html(M.Util._("Display")).addClass("button clickable").click(function(e) {
                                                    
                                                    /*
                                                     * Remove click event
                                                     */
                                                    e.preventDefault();
                                                    $(this).off('click');
                                                    
                                                    var geoType = M.Map.Util.getGeoType(result.data["mimeType"]);
                                                    if (geoType === 'GML') {
                                                        item.process.descriptor.wps.load(M.Map.Util.GML.toGeoJSON(result.data.value, {
                                                            title: process.descriptor.title,
                                                            processid: process.descriptor.identifier,
                                                            description: process.descriptor["abstract"],
                                                            time: (new Date()).toISOString()
                                                        }));
                                                    }
                                                });
                                            })(result, item.process);

                                        }
                                    }
                                    /*
                                     * Reference result
                                     */
                                    else if (result.reference) {

                                        /*
                                         * Result display requires a specific user action
                                         */
                                        (function(result) {
                                            $result.html(M.Util._("Download")).addClass("button clickable").click(function() {
                                                window.open(result.reference.href);
                                            });
                                        })(result);

                                    }

                                }

                                break;
                            case "ProcessFailed":

                                /*
                                 * Update status
                                 */
                                $status.css({
                                    'background-color': 'red'
                                });

                                /*
                                 * Update result
                                 */
                                M.tooltip.add($result.html(M.Util._("Error")).addClass("clickable").attr('jtitle', item.process.statusAbstract), 'n');
                                break;
                            default:

                                /*
                                 * Update status
                                 */
                                $status.css({
                                    'background-color': 'orange'
                                });

                                $result.html('<img src="' + M.Util.getImgUrl("loading.gif") + '" class="middle"/>');

                        }
                        ;

                        /*
                         * Remove process
                         */
                        $('#' + item.id + 'rm').click(function() {
                            self.remove(item.statusLocation);
                            return false;
                        });

                    })(this.items[i], this);
                }
            }

            return true;
        };

        return this.init();
    };

    /**
     * WPS events
     */
    M.WPS.Events = function() {

        /*
         * Set events hashtable
         */
        this.events = {
            /*
             * Array containing handlers to be call after
             * a successfull GetCapabilities
             */
            getcapabilities: [],
            /*
             * Array containing handlers to be call after
             * a successfull DescribeProcess
             */
            describeprocess: [],
            /*
             * Array containing handlers to be call after
             * a successfull execute process
             */
            execute: []

        };

        /*
         * Register an event for WPS
         *
         * @param <String> eventname : Event name => 'getcapabilities'
         * @param <function> handler : handler attached to this event
         */
        this.register = function(eventname, scope, handler) {

            if (this.events[eventname]) {
                this.events[eventname].push({
                    scope: scope,
                    handler: handler
                });
            }

        };

        /*
         * Unregister event
         */
        this.unRegister = function(scope) {

            var a, i, key, l;

            for (key in this.events) {
                a = this.events[key];
                for (i = 0, l = a.length; i < l; i++) {
                    if (a[i].scope === scope) {
                        a.splice(i, 1);
                        break;
                    }
                }
            }
        };

        /*
         * Trigger handlers related to an event
         *
         * @param <String> eventname : Event name => 'getcapabilities'
         * @param <Object> extra : object i.e.
         *                              - M.WPS for a 'getcapabilities' event name
         *                              - M.WPS.Process for a 'describeprocess' event name
         *                              - M.WPS.Process for an 'execute' event name
         *                              
         */
        this.trigger = function(eventname, obj) {

            var i, a = this.events[eventname];

            /*
             * Trigger event to each handlers
             */
            if (a) {
                for (i = a.length; i--; ) {
                    a[i].handler(a[i].scope, obj);
                }
            }
        };

        return this;

    };

    /**
     * 
     * HTML template to display WPS server information
     * Used by toHTML() function
     *      <div>
     *          <h1>title</h1>
     *          <p>abstract</p>
     *          <p>Version version</p>
     *          <h2>Provided by <a href="providerSite" target="_blank">providerName</a></h2>
     *      </div>
     */
    M.WPS.infoTemplate = '<div>' +
            '<h1>$title$</h1>' +
            '<p>$abstract$</p>' +
            '<p>Version $version$</p>' +
            '<h2>Provided by <a href="$providerSite$" target="_blank">$providerName$</a></h2>' +
            '</div>';

    /**
     * XML POST template for WPS execute request
     * 
     *  Template keys :
     *      $identifier$ : process identifier
     *      $dataInputs$ : data inputs (see *PutsTemplate)
     *      $dataOutputs$ : data outputs (see *PutsTemplate)
     *      $status$ : status ??
     * 
     */
    M.WPS.executeRequestTemplate = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
            '<wps:Execute service="WPS" version="1.0.0" ' +
            'xmlns:wps="http://www.opengis.net/wps/1.0.0" ' +
            'xmlns:ows="http://www.opengis.net/ows/1.1" ' +
            'xmlns:xlink="http://www.w3.org/1999/xlink" ' +
            'xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" ' +
            'xsi:schemaLocation="http://www.opengis.net/wps/1.0.0/wpsExecute_request.xsd">' +
            '<ows:Identifier>$identifier$</ows:Identifier>' +
            '<wps:DataInputs>$dataInputs$</wps:DataInputs>' +
            '<wps:ResponseForm>' +
            '<wps:ResponseDocument wps:lineage="false" ' +
            'storeExecuteResponse="$storeExecute$" ' +
            'status="$status$">$dataOutputs$</wps:ResponseDocument>' +
            '</wps:ResponseForm>' +
            '</wps:Execute>';

    /**
     * LiteralDataInput template
     *   
     *   Template keys :
     *      $identifier$ : Input identifier
     *      $uom$: unit of measure
     *      $data$ : value
     *    
     */
    M.WPS.literalDataInputTemplate = '<wps:Input>' +
            '<ows:Identifier>$identifier$</ows:Identifier>' +
            '<wps:Data>' +
            '<wps:LiteralData uom="$uom$">$data$</wps:LiteralData>' +
            '</wps:Data>' +
            '</wps:Input>';

    /**
     * ComplexDataInput reference template
     *   
     *   Template keys :
     *      $identifier$ : Input identifier
     *      $reference$ : url reference to get input data
     *      $format$ : Input data format
     *      
     */
    M.WPS.complexDataInputReferenceTemplate = '<wps:Input>' +
            '<ows:Identifier>$identifier$</ows:Identifier>' +
            '<wps:Reference xlink:href="$reference$" $format$/>' +
            '</wps:Input>';

    /**
     * ComplexDataInput data template
     *   
     *   Template keys :
     *      $identifier$ : Input identifier
     *      $format$ : Input data format
     *      $data$ : ???
     *      
     */
    M.WPS.complexDataInputTemplate = '<wps:Input>' +
            '<ows:Identifier>$identifier$</ows:Identifier>' +
            '<wps:Data>' +
            '<wps:ComplexData $format$>$data$</wps:ComplexData>' +
            '</wps:Data>' +
            '</wps:Input>';


    /**
     * BoundingBoxDataInput template
     *   
     *   Template keys :
     *      $identifier$ : Input identifier
     *      $dimension$ : dimension of the BoundingBox (generally ???)
     *      $crs$ : CRS (Coordinates Reference System) for the bounding box 
     *      $minx$ $miny$ $maxx$ $maxy$ : Bounding Box coordinates expressed in {crs} coordinates
     *      
     *
     */
    M.WPS.boundingBoxDataInputTemplate = '<wps:Input>' +
            '<ows:Identifier>$identifier$</ows:Identifier>' +
            '<wps:Data>' +
            '<wps:BoundingBoxData ows:dimensions="$dimension$" ows:crs="$crs$">' +
            '<ows:LowerCorner>$minx$ $miny$</ows:LowerCorner>' +
            '<ows:UpperCorner>$maxx$ $maxy$</ows:UpperCorner>' +
            '</wps:BoundingBoxData>' +
            '</wps:Data>' +
            '</wps:Input>';

    /**
     * ComplexOutput template
     * 
     *   Template keys :
     *      $asReference$ : ???
     *      $identifier$ : Output identifier
     *  
     */
    M.WPS.complexOutputTemplate = '<wps:Output asReference="$asReference$" $format$>' +
            '<ows:Identifier>$identifier$</ows:Identifier>' +
            '</wps:Output>';


    /**
     * LiteralOutput template
     * 
     *   Template keys :
     *      $identifier$ : Output identifier
     * 
     */
    M.WPS.literalOutputTemplate = '<wps:Output asReference="false">' +
            '<ows:Identifier>$identifier$</ows:Identifier>' +
            '</wps:Output>';

    /**
     * BoundingBoxOutpput template
     */
    M.WPS.boundingBoxOutputTemplate = M.WPS.literalOutputTemplate;


})(window.M);