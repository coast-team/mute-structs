/*
 *  Copyright 2014 Matthieu Nicolas
 *
 *  This file is part of Mute-structs.
 *
 *  Mute-structs is free software: you can redistribute it and/or modify
 *  it under the terms of the GNU General Public License as published by
 *  the Free Software Foundation, either version 3 of the License, or
 *  (at your option) any later version.
 *
 *  Mute-structs is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *  GNU General Public License for more details.
 *
 *  You should have received a copy of the GNU General Public License
 *  along with Mute-structs.  If not, see <http://www.gnu.org/licenses/>.
 */

var Identifier = function(base, u) {
    this.base = base || null;
    this.last = u || 0;
};

var compareTo = function(s1, s2) {
    while (s1.hasNext() && s2.hasNext()) {
        var b1 = s1.next();
        var b2 = s2.next();
        if (b1 < b2) {
            return -1;
        }
        if (b1 > b2) {
            return 1;
        }
    }
    /* s1 is longer than s2 */
    if (s1.hasNext()) {
        return 1;
    }
    /* s2 is longer than s1 */
    if (s2.hasNext()) {
        return -1;
    }
    // Both identifiers have same size
    return 0;
};

Identifier.prototype.compareTo = function(t) {
    if(t!=null)
        return compareTo(this.iterator(), t.iterator());
};

Identifier.prototype.equals = function(o) {
    if(this == o) return true;
    if(typeof(o) != typeof(this) || o == null) return false;

    if (this.base != null ? !this.base.equals(o.base) : o.base != null) return false;
    if (this.last != null ? this.last != o.last : o.last != null) return false;

    return true;
};

Identifier.prototype.hashCode = function() {
    var result = this.base != null ? this.base.hashCode() : 0;
    result = 31 * result + (this.last != null ? this.last : 0);
    return result;
};

Identifier.prototype.iterator = function() {
    var it = new Iterator(Utils.iterator(this.base), this.last);
    return it;
};

Identifier.prototype.toString = function() {
    return "Identifier{" + this.base + "," + this.last + '}';
};

Identifier.prototype.copy = function() {
    return new Identifier(Utils.copy(this.base), this.last);
};

Identifier.prototype.hasPlaceAfter = function(next, length) {
    var max = length + this.last;

    var i = Utils.iterator(this.base);
    var i2 = next.iterator();
    while(i.hasNext() &&  i2.hasNext()) {
        if(i.next() != i2.next())
            return false
    }

    if(i2.hasNext)
        return i2.next() >= max;
    else
        return true;
};

Identifier.prototype.hasPlaceBefore = function(prev, length) {
    var min = this.last - length;
    var i = Utils.iterator(this.base);
    var i2 = Utils.iterator(prev);
    while (i.hasNext() && i2.hasNext()) {
        if (i.next() != i2.next())
            return true;
    }

    if (i2.hasNext())
        return i2.next() < min;
    else
        return true;
};

Identifier.prototype.minOffsetAfterPrev = function (prev, min) {
    var i = Utils.iterator(this.base);
    var i2 = Utils.iterator(prev.iterator);
    while (i.hasNext() && i2.hasNext()) {
        if (i.next() != i2.next())
            return min;
    }

    if (i2.hasNext()) {
        return Math.max(i2.next(), min + 1);
    }
    else {
        return min;
    }
};

Identifier.prototype.maxOffsetBeforeNex = function (next, max) {
    var i = Utils.iterator(this.base);
    var i2 = Utils.iterator(next);
    while (i.hasNext() && i2.hasNext()) {
        if (i.next() != i2.next()) {
            return max;
        }
    }

    if (i2.hasNext())
        return Math.min(i2.next(), max);
    else
        return max;
};

module.exports = Identifier;
