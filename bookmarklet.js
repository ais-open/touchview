// Copyright (c) 2012 Applied Information Sciences, Inc.
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
function Thing() {
	this.$el = jQuery("<div>")
		.css({
			position: "absolute",
			width: Main.thingSize,
			height: Main.thingSize,
			background: "rgba(255, 255, 255, 0.5)",
			border: "1px solid rgba(0, 0, 0, 0.5)",
			"border-radius": (Main.thingSize / 2) + "px",
			zIndex: 999999,
			"pointer-events": "none" /* here's the magic */
		})
		.appendTo("body");
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
	}
};

// ##########
// ==========
var Main = {
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
					jQuery.noConflict();
					self.start();
				}
			}, 200);
		} else {
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
			if (self.hasTouch) {
				var touches = event.originalEvent.changedTouches;
				jQuery.each(touches, function(a, touch) {
					self.things[touch.identifier] = new Thing();
				});
			} else {
				self.things[self.id] = new Thing();
			}
			
			move(event);
		}
		
		function move(event) {
			if (self.hasTouch) {
				var touches = event.originalEvent.changedTouches;
				jQuery.each(touches, function(a, touch) {
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
		}
		
		function end(event) {
			if (self.hasTouch) {
				var touches = event.originalEvent.changedTouches;
				jQuery.each(touches, function(a, touch) {
					self.things[touch.identifier].destroy();
					delete self.things[touch.identifier];
				});
			} else if (self.things[self.id]) {
				self.things[self.id].destroy();
				delete self.things[self.id];
			}
		}

		var $document = jQuery(document)
			.bind(TOUCHSTART, start)
			.bind(TOUCHMOVE, move)
			.bind(TOUCHEND, end);
	},

	// ----------
	importScript:function(url) {
		try {
			var s = document.createElement("script");
			s.src = url + "?format=jsonp";
			document.body.appendChild(s);
		} catch(e) {
		}
	}
};

// ==========
Main.init();

}());