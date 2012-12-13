/**
 * jQRangeSlider
 * A javascript slider selector that supports dates
 *
 * Copyright (C) Guillaume Gautreau 2012
 * Dual licensed under the MIT or GPL Version 2 licenses.
 *
 * Modified for mapshup -  (C) Jerome Gasperi 2012
 * Licensed under the CeCILL-B licence
 */
/*
 * Override of jQRangeSlider class for mapshup :
 *  - override _create() function
 *  - override _initWidth() function
 *  - add _getScaleValue() function
 *  - add _getScalePosition() function
 *  - add _positionScaleRight() function
 *  - add _createScale() function
 *  - add _positionBars() function
 *
 */
(function ($, undefined) {
    "use strict";
	
    $.widget("ui.dateRangeSlider", $.ui.rangeSlider, {
        options: {
            bounds: {
                min: new Date(2000,0,1), 
                max: new Date(2012,0,1)
            },
            defaultValues: {
                min: new Date(2011,0,1), 
                max: new Date(2012,0,1)
            }
        },
        
        /* START mapshup */
        scaleBar:null,
        leftBar:null,
        rightBar:null,
        /* END mapshup */

        /*
         * Override jQRangeSlider _create function to support mapshup Date slider
         * This function add an implicit scaleBar
         */
        _create: function(){
            $.ui.rangeSlider.prototype._create.apply(this);

            /* Add scaleBar within the inner bar */
            this.scaleBar = $("<div class='ui-rangeSlider-scaleBar' />");
            this.innerBar.append(this.scaleBar);
            
            /* Add leftBar within the inner bar */
            this.leftBar = $("<div class='ui-rangeSlider-mask' />");
            this.innerBar.append(this.leftBar);

            /* Add rightBar within the inner bar */
            this.rightBar = $("<div class='ui-rangeSlider-mask' />");
            this.innerBar.append(this.rightBar);
            
            /* Get Range slider bar */
            this.element.addClass("ui-dateRangeSlider");
        },

        destroy: function(){
            this.element.removeClass("ui-dateRangeSlider");
            $.ui.rangeSlider.prototype.destroy.apply(this);
        },
       
        _setOption: function(key, value){
            if ((key === "defaultValues" || key === "bounds") && typeof value !== "undefined" && value !== null && typeof value.min !== "undefined" && typeof value.max !== "undefined" && value.min instanceof Date && value.max instanceof Date){
                $.ui.rangeSlider.prototype._setOption.apply(this, [key, {
                    min:value.min.valueOf(), 
                    max:value.max.valueOf()
                }]);
            }else{
                $.ui.rangeSlider.prototype._setOption.apply(this, this._toArray(arguments));
            }
        },

        _handleType: function(){
            return "dateRangeSliderHandle";
        },

        option: function(key, value){
            if (key === "bounds" || key === "defaultValues"){
                var result = $.ui.rangeSlider.prototype.option.apply(this, arguments);

                return {
                    min:new Date(result.min), 
                    max:new Date(result.max)
                };
            }

            return $.ui.rangeSlider.prototype.option.apply(this, this._toArray(arguments));
        },

        _defaultFormatter: function(value){
            var month = value.getMonth() + 1,
            day = value.getDate();

            return "" + value.getFullYear() + "-" + (month < 10 ? "0" + month : month) + "-" + (day < 10 ? "0" + day : day);
        },

        _getFormatter: function(){
            var formatter = this.options.formatter;

            if (this.options.formatter === false || this.options.formatter === null){
                formatter = this._defaultFormatter;
            }

            return (function(formatter){
                return function(value){
                    return formatter(new Date(value));
                }
            })(formatter);
        },
        
        /*
         * Override jQRangeSlider initWidth function to force initialisation
         * of mapshup scale bar
         */
        _initWidth: function(){
            $.ui.rangeSlider.prototype._initWidth.apply(this);
            this._createScale();
        },

        values: function(min, max){
            var values = null;
			
            if (typeof min !== "undefined" && typeof max !== "undefined" && min instanceof Date && max instanceof Date)
            {
                values = $.ui.rangeSlider.prototype.values.apply(this, [min.valueOf(), max.valueOf()]);
            }else{
                values = $.ui.rangeSlider.prototype.values.apply(this, this._toArray(arguments));
            }
            
            this._positionBars();
            
            return {
                min: new Date(values.min), 
                max: new Date(values.max)
            };
        },

        min: function(min){
            if (typeof min !== "undefined" && min instanceof Date){
                return new Date($.ui.rangeSlider.prototype.min.apply(this, [min.valueOf()]));
            }

            return new Date($.ui.rangeSlider.prototype.min.apply(this));
        },

        max: function(max){
            if (typeof max !== "undefined" && max instanceof Date){
                return new Date($.ui.rangeSlider.prototype.max.apply(this, [max.valueOf()]));
            }

            return new Date($.ui.rangeSlider.prototype.max.apply(this));
        },
		
        _toArray: function(argsObject){
            return Array.prototype.slice.call(argsObject);
        },
        
        /* START mashup */
        _getScaleValue: function(position){
            return (position *  (this.options.bounds.max.getTime() - this.options.bounds.min.getTime()) / (this.scaleBar.width() - 1)) + this.options.bounds.min.getTime();
        },
        
        _getScalePosition: function(value){
            return (value.getTime() - this.options.bounds.min.getTime()) * (this.scaleBar.width() - 1) / (this.options.bounds.max.getTime() - this.options.bounds.min.getTime());
        },
       
        /*
         * Create a numerical scale with dates
         * The scale extends from min to max bounds
         * 
         */
        _createScale: function(){

            /* clear old scale */
            this.scaleBar.empty();
            
            /*
             * Cursor value goes from 0 to scaleBar width
             */
            var i, j, p1, w, m, mSteps,
            scaleUnit = "",
            minWidthPerYear = 150,
            scaleWidth = this.innerBar.width(),
            y1 = this.options.bounds.min.getFullYear(),
            y2 = this.options.bounds.max.getFullYear(),
            ySteps = ((((y2 - y1) * minWidthPerYear) / scaleWidth)|0) + 1;
            
            this.scaleBar.css("width", scaleWidth);

            /*
             * Create scaleUnit html
             * Do not use jQuery append to speed up things
             * 
             * First compute years
             */
            for (i = y1; i <= y2; i++) {
                
                /*
                 * Get date position
                 */
                p1 = this._getScalePosition(new Date(i, 0, 1));
                
                /*
                 * Compute year width
                 */
                w = this._getScalePosition(new Date(i+1, 0, 1)) - p1;
                
                /*
                 * Alternate background each year
                 */
                scaleUnit += '<span class="ui-rangeSlider-bgy" style="left:'+p1+'px;width:'+w+'px;background-color:rgba(255,255,255,'+(i % 2 === 0 ? "0" : "0.2")+');"></span>';
                
                /*
                 * Only display one year per ySteps
                 */
                if ((i / ySteps) % 1 === 0) {
                    scaleUnit += '<span class="ui-rangeSlider-bigScaleUnit" style="left:'+p1+'px;">'+i+'</span>';
                }
                
                /*
                 * Compute months
                 */
                for (j = 0; j < 12; j++) {
                    
                   /*
                    * Get month position
                    */
                    p1 = this._getScalePosition(new Date(i, j, 1));
                    
                    
                   /*
                    * Get month width
                    */
                    w = this._getScalePosition(new Date(i, j + 1, 1)) - p1;
                    
                    
                   /*
                    * Alternate background each month
                    */
                    scaleUnit += '<span class="ui-rangeSlider-bgm" style="left:'+p1+'px;width:'+w+'px;background-color:rgba(0,0,0,'+(j % 2 === 0 ? "0.1" : "0.2")+');"></span>';

                   /*
                    * Write month from 01 (january) to 12 (december)
                    */
                    m = j + 1 < 10 ? "0" + (j + 1) : j + 1;
                    mSteps = (((minWidthPerYear) / (12 * w))|0) + 1;
                    
                   /*
                    * Only display one month per mSteps
                    */
                    if ((j / mSteps) % 1 === 0) {
                        scaleUnit += '<span class="ui-rangeSlider-scaleUnit" style="left:'+p1+'px;">'+m+'</span>';
                    }
                }
                
            }
            
            /* One big append is better than several small ones :) */
            this.scaleBar.append(scaleUnit);
            
        },
            
        _positionBars:function() {
            var sliderBar = $('.ui-rangeSlider-bar', this.element),
                left = this.innerBar.offset().left,
                right = sliderBar.offset().left + sliderBar.width();
            this.leftBar.offset({left:left}).css('width', sliderBar.offset().left - left);
            this.rightBar.offset({left:right}).css('width', this.innerBar.width() + this.innerBar.offset().left - right);
        },
         
        /*
         * Override bounds public method
         */
        bounds: function(min, max){
            var result;

            if (typeof min !== "undefined" && min instanceof Date
                && typeof max !== "undefined" && max instanceof Date) {
                result = $.ui.rangeSlider.prototype.bounds.apply(this, [min.valueOf(), max.valueOf()]);
            } else {
                result = $.ui.rangeSlider.prototype.bounds.apply(this, this._toArray(arguments));
            }

            this._setBounds(min, max);
            this._initWidth();
            this._changed(true);

            return {
                min: new Date(result.min), 
                max: new Date(result.max)
            };
        }
    /* END mapshup */
        
    });
})(jQuery);