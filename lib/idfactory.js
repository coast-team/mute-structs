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
module.exports = {
    createBetweenPosition: function (id1, id2, replicaNumber, clock) {
        var s1 = new InfiniteString(Number.MIN_VALUE, id1 != null ? id1.iterator() : null);
        var s2 = new InfiniteString(Number.MAX_VALUE, id2 != null ? id2.iterator() : null);



        var sb = [];

        do {
            var b1 = s1.next();
            var b2 = s2.next();
            if (b2 - b1 > 2) {
                //if (replicaNumber <= b1 || replicaNumber >= b2) {
                var r = (Math.random() * (b2 - b1 - 2)) + b1 + 1;
                sb.push(r);
                //}
                break;
            }
            else {
                sb.push(b1);
            }
        } while(true);
        sb.push(replicaNumber);
        sb.push(clock);
        return sb;
    }
};
