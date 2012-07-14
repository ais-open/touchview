// All portions Copyright (c) 2012 Applied Information Sciences, Inc.,
// except the DetectZoom object, Copyright (c) 2011 Yonathan Randolph.
//
// http://www.appliedis.com 
//	
// Permission is hereby granted, free of charge, to any person obtaining
// a copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to
// permit persons to whom the Software is furnished to do so, subject to
// the following conditions:
//	
// The above copyright notice and this permission notice shall be
// included in all copies or substantial portions of the Software.
//	
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
// EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
// NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
// LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
// OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
// WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 
(function() {

// ##########
// ==========
function Thing(scale) {
	var border = 2;
	this.$el = Main.$("<div>")
		.css({
			position: "absolute",
			width: Main.thingSize,
			height: Main.thingSize,
			background: "rgba(255, 255, 255, 0.5)",
			border: border + "px solid rgba(0, 0, 0, 0.5)",
			"border-radius": (Math.ceil(Main.thingSize / 2) + border) + "px",
			zIndex: 999999,
			"pointer-events": "none" /* here's the magic */
		})
		.appendTo("body");
		
	this.scale(scale);
}

// ==========
Thing.prototype = {
	// ----------
	destroy: function() {
		var self = this;
		this.$el.fadeOut(1000, function() {
			self.$el.remove();
		});
	},

	// ----------
	move: function(pos) {
		this.$el.css({
			left: pos.x - (Main.thingSize / 2), 
			top: pos.y - (Main.thingSize / 2)
		});
	}, 
	
	// ----------
	scale: function(scale) {
		this.$el
			.css({
				/* the translate3d forces GPU; fixes graphic glitches */
				"-webkit-transform": "translate3d(0, 0, 0) scale(" + scale + ")"
			});
	}
};

// ##########
// ==========
var Main = {
	$: null, 
	$container: null,
	thingSize: 30,
	hasTouch: "ontouchstart" in window, 
	id: 1,
	things: {},

	// ----------
	init: function() {
		var self = this;
		
		function jQueryCheck() {
			return ("jQuery" in window && jQuery.fn.jquery == "1.7.1");
		}
		
		if(!jQueryCheck()) {
			this.importScript("http://ajax.googleapis.com/ajax/libs/jquery/1.7.1/jquery.js");
			var interval = setInterval(function () {
				if (jQueryCheck()) {
					clearInterval(interval);
					self.$ = jQuery.noConflict(true);
					self.start();
				}
			}, 200);
		} else {
			self.$ = jQuery;
			this.start();
		}
	},
	
	// ----------
	start: function() {
		var self = this;
		
		var TOUCHSTART = (this.hasTouch) ? "touchstart" : "mousedown";
		var TOUCHEND = (this.hasTouch) ? "touchend" : "mouseup";
		var TOUCHMOVE = (this.hasTouch) ? "touchmove" : "mousemove";
			
		function start(event) {
			var scale = 1 / DetectZoom.zoom();
			if (self.hasTouch) {
				var touches = event.originalEvent.changedTouches;
				self.$.each(touches, function(a, touch) {
					self.things[touch.identifier] = new Thing(scale);
				});
			} else {
				if (self.things[self.id])
					self.things[self.id].destroy();
					
				self.things[self.id] = new Thing(scale);
			}
			
			move(event);
		}
		
		function move(event) {
			if (self.hasTouch) {
				var touches = event.originalEvent.changedTouches;
				self.$.each(touches, function(a, touch) {
					self.things[touch.identifier].move({
						x: touch.pageX,
						y: touch.pageY
					});
				});
			} else if (self.things[self.id]) {
				self.things[self.id].move({
					x: event.pageX,
					y: event.pageY
				});
			}
			
			var scale = 1 / DetectZoom.zoom();
			self.$.each(self.things, function(a, thing) {
				thing.scale(scale);
			});
		}
		
		function end(event) {
			if (self.hasTouch) {
				var touches = event.originalEvent.changedTouches;
				self.$.each(touches, function(a, touch) {
					self.things[touch.identifier].destroy();
					delete self.things[touch.identifier];
				});
			} else if (self.things[self.id]) {
				self.things[self.id].destroy();
				delete self.things[self.id];
			}
		}

		var $document = this.$(document)
			.bind(TOUCHSTART, start)
			.bind(TOUCHMOVE, move)
			.bind(TOUCHEND, end);
			
		if (!this.hasTouch)
			$document.bind("dragstart", end);
	},

	// ----------
	importScript:function(url) {
		var s = document.createElement("script");
		s.src = url;
		document.body.appendChild(s);
	}
};

// ##########
// START detect-zoom ==========
// latest as of July 13, 2012
// detect-zoom is dual-licensed under the WTFPL and MIT license,
// at the recipient's choice.
// https://github.com/yonran/detect-zoom/
var DetectZoom = {
  mediaQueryBinarySearch: function(
      property, unit, a, b, maxIter, epsilon) {
    var matchMedia;
    var head, style, div
    if (window.matchMedia) {
      matchMedia = window.matchMedia;
    } else {
      head = document.getElementsByTagName('head')[0];
      style = document.createElement('style');
      div = document.createElement('div');
      div.className = 'mediaQueryBinarySearch';
      head.appendChild(style);
      div.style.display = 'none';
      document.body.appendChild(div);
      matchMedia = function(query) {
        style.sheet.insertRule('@media ' + query +
                               '{.mediaQueryBinarySearch ' +
                               '{text-decoration: underline} }', 0);
        var matched = getComputedStyle(div, null).textDecoration
            == 'underline';
        style.sheet.deleteRule(0);
        return {matches:matched};
      }
    }
    var r = binarySearch(a, b, maxIter);
    if (div) {
      head.removeChild(style);
      document.body.removeChild(div);
    }
    return r;

    function binarySearch(a, b, maxIter) {
      var mid = (a + b)/2;
      if (maxIter == 0 || b - a < epsilon) return mid;
      var query = "(" + property + ":" + mid + unit + ")";
      if (matchMedia(query).matches) {
        return binarySearch(mid, b, maxIter-1);
      } else {
        return binarySearch(a, mid, maxIter-1);
      }
    }
  },
  _zoomIe7: function() {
    // the trick: body's offsetWidth was in CSS pixels, while
    // getBoundingClientRect() was in system pixels in IE7.
    // Thanks to http://help.dottoro.com/ljgshbne.php
    var rect = document.body.getBoundingClientRect();
    var z = (rect.right-rect.left)/document.body.offsetWidth;
    z = Math.round(z * 100) / 100;
    return {zoom: z, devicePxPerCssPx: z};
  },
  _zoomIe8: function() {
    // IE 8+: no trick needed!
    // TODO: MSDN says that logicalXDPI and deviceXDPI existed since IE6
    // (which didn't even have whole-page zoom). Check to see whether
    // this method would also work in IE7.
    return {
      zoom: screen.systemXDPI / screen.logicalXDPI,
      devicePxPerCssPx: screen.deviceXDPI / screen.logicalXDPI
    };
  },
  _zoomWebkitMobile: function() {
    // the trick: window.innerWIdth is in CSS pixels, while
    // screen.width and screen.height are in system pixels.
    // And there are no scrollbars to mess up the measurement.
    var devicePixelRatio = window.devicePixelRatio != null ? window.devicePixelRatio : 1
      , deviceWidth;
    if ( Math.abs(window.orientation) == 90 ) {
      deviceWidth = screen.height;
    } else {
      deviceWidth = screen.width;
    }
    var z = deviceWidth / window.innerWidth;
    // return immediately; don't round at the end.
    return {zoom: z, devicePxPerCssPx: z*devicePixelRatio};
  },
  _zoomWebkit: function() {
    // the trick: an element's clientHeight is in CSS pixels, while you can
    // set its line-height in system pixels using font-size and
    // -webkit-text-size-adjust:none.
    // device-pixel-ratio: http://www.webkit.org/blog/55/high-dpi-web-sites/

    // Previous trick (used before http://trac.webkit.org/changeset/100847):
    // documentElement.scrollWidth is in CSS pixels, while
    // document.width was in system pixels. Note that this is the
    // layout width of the document, which is slightly different from viewport
    // because document width does not include scrollbars and might be wider
    // due to big elements.

    var devicePixelRatio = window.devicePixelRatio != null ? window.devicePixelRatio : 1;

    // The container exists so that the div will be laid out in its own flow
    // while not impacting the layout, viewport size, or display of the
    // webpage as a whole.
    var container = document.createElement('div')
      , div = document.createElement('div');
    
    // Add !important and relevant CSS rule resets
    // so that other rules cannot affect the results.
    var important = function(str){ return str.replace(/;/g, " !important;"); };
    
    container.setAttribute('style', important('width:0; height:0; overflow:hidden; visibility:hidden; position: absolute;'));
    div.innerHTML = "1<br>2<br>3<br>4<br>5<br>6<br>7<br>8<br>9<br>0";
    div.setAttribute('style', important('font: 100px/1em sans-serif; -webkit-text-size-adjust: none; height: auto; width: 1em; padding: 0; overflow: visible;'));
    
    container.appendChild(div);
    document.body.appendChild(container);
    var z = 1000 / div.clientHeight;
    z = Math.round(z * 100) / 100;
    var r = {
      zoom: z,
      devicePxPerCssPx: devicePixelRatio * z
    };
    document.body.removeChild(container);
    return r;
  },
  _zoomFF35: function() {
    // the trick for FF3.5 ONLY: device-width gives CSS pixels, while
    // screen.width gave system pixels. Thanks to QuirksMode's widths table,
    // which called it a bug. http://www.quirksmode.org/m/widths.html
    var z = screen.width /
      this.mediaQueryBinarySearch('min-device-width', 'px', 0, 6000, 20, .0001);
    z = Math.round(z * 100) / 100;
    return {zoom: z, devicePxPerCssPx: z};
  },
  _zoomFF36: function() {
    // the hack for FF3.6: you can measure scrollbar's width in CSS pixels,
    // while in system pixels it's 15px (verified in Ubuntu).

    // TODO: verify for every platform that a scrollbar is exactly 15px wide.
    var container = document.createElement('div')
      , outerDiv = document.createElement('div');
    // The container exists so that the div will be laid out in its own flow
    // while not impacting the layout, viewport size, or display of the
    // webpage as a whole.
    container.setAttribute('style', 'width:0; height:0; overflow:hidden;' +
        'visibility:hidden; position: absolute');
    outerDiv.style.width = outerDiv.style.height = '500px';  // enough for all the scrollbars
    var div = outerDiv;
    for (var i = 0; i < 10; ++i) {
      var child = document.createElement('div');
      child.style.overflowY = 'scroll';
      div.appendChild(child);
      div = child;
    }
    container.appendChild(outerDiv);
    document.body.appendChild(container);
    var outerDivWidth = outerDiv.clientWidth;
    var innerDivWidth = div.clientWidth;
    var scrollbarWidthCss = (outerDivWidth - innerDivWidth)/10;
    document.body.removeChild(container);
    var scrollbarWidthDevice = 15;  // Mac and Linux: scrollbars are 15px wide
    if (-1 != navigator.platform.indexOf('Win')){
      scrollbarWidthDevice = 17;
    }
    var z = scrollbarWidthDevice / scrollbarWidthCss;
    z = Math.round(z * 100) / 100;
    return {zoom: z, devicePxPerCssPx: z};
  },
  _zoomFF4: function() {
    // no real trick; device-pixel-ratio is the ratio of device dpi / css dpi.
    // (Note that this is a different interpretation than Webkit's device
    // pixel ratio, which is the ratio device dpi / system dpi).
    // TODO: is mozmm vs. mm promising?
    var z = this.mediaQueryBinarySearch(
            'min--moz-device-pixel-ratio',
            '', 0, 10, 20, .0001);
    z = Math.round(z * 100) / 100;
    return {zoom: z, devicePxPerCssPx: z};
  },
  _zoomOperaOlder: function() {
    // 10.00 (or before) to 11.01:
    // the trick: a div with position:fixed;width:100%'s offsetWidth is the
    // viewport width in CSS pixels, while window.innerWidth was in system
    // pixels. Thanks to:
    // http://virtuelvis.com/2005/05/how-to-detect-zoom-level-in-opera/
    // TODO: fix bug: when there is a scrollbar, fixed div does NOT
    // include the scrollbar, while window.outerWidth DOES. This causes the
    // calculation to be off by a few percent.
    var fixedDiv = document.createElement('div');
    fixedDiv.style.position = 'fixed';
    fixedDiv.style.width = '100%';
    fixedDiv.style.height = '100%';
    fixedDiv.style.top = fixedDiv.style.left = '0';
    fixedDiv.style.visibility = 'hidden';
    document.body.appendChild(fixedDiv);
    var z = window.innerWidth / fixedDiv.offsetWidth;
    document.body.removeChild(fixedDiv);
    return {zoom: z, devicePxPerCssPx: z};
  },
  _zoomOpera11: function() {
    // works starting Opera 11.11
    // the trick: outerWidth is the viewport width including scrollbars in
    // system px, while innerWidth is the viewport width including scrollbars
    // in CSS px; 
    var z = window.outerWidth / window.innerWidth;
    z = Math.round(z * 100) / 100;
    return {zoom: z, devicePxPerCssPx: z};
  },
  ratios: function() {
    var r;
    if (! isNaN(screen.logicalXDPI) && ! isNaN(screen.systemXDPI) ) {
      return this._zoomIe8();
    } else if ('ontouchstart' in window && document.body.style.webkitTextSizeAdjust != null) {
      return this._zoomWebkitMobile();
    } else if (document.body.style.webkitTextSizeAdjust != null) {  // webkit
      return this._zoomWebkit();
    } else if (-1 != navigator.userAgent.indexOf('Firefox/3.5')) {
      return this._zoomFF35();
    } else if (-1 != navigator.userAgent.indexOf('Firefox/3.6')) {
      return this._zoomFF36();
    } else if (-1 != navigator.appVersion.indexOf("MSIE 7.")) {
      return this._zoomIe7();
    } else if (-1 != navigator.userAgent.indexOf('Opera')) {
      var versionIdx = navigator.userAgent.indexOf('Version/');
      if (11.01 < parseFloat(navigator.userAgent.substr(versionIdx + 8)))
        return this._zoomOpera11();
      else
        return this._zoomOperaOlder();
    } else if (0.001 < (r = this._zoomFF4()).zoom) {
      return r;
    } else {
      return {zoom: 1, devicePxPerCssPx: 1}
    }
  },
  zoom: function() {
    return this.ratios().zoom;
  },
  device: function() {
    return this.ratios().devicePxPerCssPx;
  }
};
// END detect-zoom ==========

// ##########
// ==========
Main.init();

}());