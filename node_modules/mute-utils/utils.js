/*
 *	Copyright 2014 Matthieu Nicolas
 *
 *	This program is free software: you can redistribute it and/or modify
 *	it under the terms of the GNU General Public License as published by
 *	the Free Software Foundation, either version 3 of the License, or
 * 	(at your option) any later version.
 *
 *	This program is distributed in the hope that it will be useful,
 *	but WITHOUT ANY WARRANTY; without even the implied warranty of
 *	MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *	GNU General Public License for more details.
 *
 *	You should have received a copy of the GNU General Public License
 *	along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

module.exports = {
	Result: {
		B1AfterB2: 'B1AfterB2',
		B1BeforeB2: 'B1BeforeB2',
		B1InsideB2: 'B1InsideB2',
		B2InsideB1: 'B2InsideB1',
		B1ConcatB2: 'B1ConcatB2',
		B2ConcatB1: 'B2ConcatB1'
	},
	RopesNodes: {
		LEFT: 0,
		RIGHT: 1
	},
	insert: function (s, index, string) {
		if (index > 0) {
			return s.substring(0, index) + string + s.substring(index, s.length);
		}
		return string + s;
	},
	del: function (s, begin, end) {
	    var str = '';
	    if(begin !== 0) {
	        str = s.substring(0, begin);
	    }
		return str + s.substring(end + 1, s.length);
	},
	unset: function (arr, elt) {
		var index = arr.indexOf(elt);
	    if(index > -1) {
	        arr.splice(index, 1);
	    }
	},
	pushAll: function(arr, elts) {
		var i;
		for(i=0; i<elts.length; i++) {
			arr.push(elts[i]);
		}
	},
	iterator: function(arr) {
		var it = {
	    	index: 0,
	    	items: arr, 
	    	first: function() {
	        	this.reset();
	        	return this.next();
		    },
		    next: function() {
		        return this.items[this.index++];
		    },
		    hasNext: function() {
		        return this.index < this.items.length;
		    },
		    reset: function() {
		        this.index = 0;
		    },
	    };
	    return it;
	},
	getLast: function (arr) {
		return arr[arr.length-1];
	},
	copy: function (arr) {
		var copy = [];
		var i;
		for(i=0; i<arr.length; i++) {
			if(typeof arr[i] === "number" || typeof arr[i] === "string") {
				copy.push(arr[i]);
			}
			else if(arr[i].copy !== null && arr[i].copy !== undefined) {
				copy.push(arr[i].copy());
			}
			else {
				copy.push(arr[i]);
			}
		}
		return copy;
	},
	occurrences: function (string, subString, allowOverlapping) {
	    var n;
	    var pos;
	    var step;

	    string += ""; 
	    subString += "";
	    if(subString.length<=0) {
	    	return string.length+1;
	    } 
	    n = 0;
	    pos = 0;
	    step = (allowOverlapping) ? (1) : (subString.length);

	    while(true) {
	        pos = string.indexOf(subString,pos);
	        if(pos>=0) { 
	        	n++; 
	        	pos += step; 
	        } 
	        else {
	        	break;
	        }
	    }
	    return(n);
	}
};