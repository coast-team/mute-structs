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

/*global console, module, require */
"use strict";

var Identifier = require('./identifier');
var IdentifierInterval = require('./identifierinterval');
var IDFactory = require('./idfactory');
var IteratorHelperIdentifier = require('./iteratorhelperidentifier');
var LogootSAdd = require('./logootsadd');
var LogootSBlock = require('./logootsblock');
var LogootSDel = require('./logootsdel');
var ResponseIntNode = require('./responseintnode');
var RopesNodes = require('./ropesnodes');
var TextDelete = require('./textdelete');
var TextInsert = require('./textinsert');
var TextUtils = require('./textutils');

var leftChildOf = function (aNode) {
    console.assert(aNode instanceof RopesNodes);

    return aNode.left;
};

var rightChildOf = function (aNode) {
    console.assert(aNode instanceof RopesNodes);

    return aNode.right;
};

var LogootSRopes = function (replicaNumber) {
    console.assert(arguments.length === 0 || typeof replicaNumber === "number");

    this.replicaNumber = replicaNumber || 0;
    this.clock = 0;
    this.root = null;
    this.mapBaseToBlock = {};
    this.str = '';
};

LogootSRopes.prototype.getBlock = function (id) {
    console.assert(id instanceof IdentifierInterval);

    var mapBaseToBlock = this.mapBaseToBlock;
    var key = id.base.join(",");
    var result;

    if (mapBaseToBlock.hasOwnProperty(key)) {
        result = mapBaseToBlock[key];
    }
    else {
        result = new LogootSBlock(id);
        this.mapBaseToBlock[key] = result;
    }

    return result;
};


//TODO: implémenter les LogootSOperations
LogootSRopes.prototype.addBlock = function (args) {
    console.assert(typeof args === "object");
    console.assert(typeof args.str === "string");

    var str = args.str;

    if(args.hasOwnProperty("idi")) {
        console.assert(args.idi instanceof IdentifierInterval);
        console.assert(args.from instanceof RopesNodes);
        console.assert(typeof args.startOffset === "number");

        var idi = args.idi;
        var from = args.from;
        var startOffset = args.startOffset;

        var path = [];
        var result = [];
        var con = true;
        var i = startOffset;
        while (con) {
            path.push(from);
            var ihi = new IteratorHelperIdentifier(idi,
                    from.getIdentifierInterval());
            var split;
            switch (ihi.computeResults()) {
            case IteratorHelperIdentifier.Result.B1_AFTER_B2:
                if (from.right === null) {
                    from.right = RopesNodes.leaf(this.getBlock(idi),
                        idi.begin, str.length);
                    i = i + from.leftSubtreeSize() + from.length;
                    result.push(new TextInsert(i, str));
                    con = false;
                }
                else {
                    i = i + from.leftSubtreeSize() + from.length;
                    from = from.right;
                }
                break;
            case IteratorHelperIdentifier.Result.B1_BEFORE_B2:
                if (from.left === null) {
                    from.left = RopesNodes.leaf(this.getBlock(idi),
                        idi.begin, str.length);
                    result.push(new TextInsert(i, str));
                    con = false;
                }
                else {
                    from = from.left;
                }
                break;
            case IteratorHelperIdentifier.Result.B1_INSIDE_B2: // split b2 the object node
                split = Math.min(from.maxOffset(), ihi.nextOffset);
                var rp = RopesNodes.leaf(this.getBlock(idi),
                    idi.begin, str.length);
                path.push(from.split({
                    node: rp,
                    size: split - from.offset + 1
                }));
                i = i + from.leftSubtreeSize();
                result.push(new TextInsert(i + split - from.offset + 1, str));
                con = false;
                break;
            case IteratorHelperIdentifier.Result.B2_INSIDE_B1: // split b1 the node to insert
                var split2 = /* Math.min(idi.getEnd(), */ihi.nextOffset/* ) */;
                var ls = str.substr(0, split2 + 1 - idi.begin);
                var idi1 = new IdentifierInterval(idi.base,
                        idi.begin, split2);
                if (from.left === null) {
                    from.left = RopesNodes.leaf(this.getBlock(idi1),
                        idi1.begin, ls.length);
                    result.push(new TextInsert(i, ls));
                }
                else {
                    Array.prototype.push.apply(result, this.addBlock({
                        idi: idi1,
                        str: ls,
                        from: from.left,
                        startOffset: i
                    }));
                }

                // i=i+ls.size();

                ls = str.substr(split2 + 1 - idi.begin, str.length);
                idi1 = new IdentifierInterval(idi.base, split2 + 1, idi.end);
                i = i + from.leftSubtreeSize() + from.length;
                if (from.right === null) {
                    from.right = RopesNodes.leaf(this.getBlock(idi1),
                        idi1.begin, ls.length);
                    result.push(new TextInsert(i, ls));
                }
                else {
                    Array.prototype.push.apply(result, this.addBlock({
                        idi: idi1,
                        str: ls,
                        from: from.right,
                        startOffset: i
                    }));
                }
                con = false;
                break;
            case IteratorHelperIdentifier.Result.B1_CONCAT_B2: // node to insert concat the node
                if (from.left !== null) {
                    split = from.getIdBegin().minOffsetAfterPrev(
                            from.left.getIdEnd(), idi.begin);
                    var l = str.substr(split - idi.begin, str.length);
                    from.appendBegin(l.length);
                    result.push(new TextInsert(i + from.leftSubtreeSize(), l));

                    this.ascendentUpdate(path, l.length);
                    str = str.substr(0, split - idi.begin);
                    idi = new IdentifierInterval(idi.base, idi.begin, split - 1);

                    // check if previous is smaller or not
                    if (idi.end >= idi.begin) {
                        from = from.left;
                    }
                    else {
                        con = false;
                        break;
                    }
                }
                else {
                    result.push(new TextInsert(i, str));
                    from.appendBegin(str.length);
                    this.ascendentUpdate(path, str.length);
                    con = false;
                    break;
                }

                break;
            case IteratorHelperIdentifier.Result.B2_CONCAT_B1:// concat at end
                if (from.right !== null) {
                    split = from.getIdEnd().maxOffsetBeforeNex(
                            from.right.getIdBegin(), idi.end);
                    var l = str.substr(0, split + 1 - idi.begin);
                    i = i + from.leftSubtreeSize() + from.length;
                    from.appendEnd(l.length);
                    result.push(new TextInsert(i, l));

                    this.ascendentUpdate(path, l.length);
                    str = str.substr(split + 1 - idi.begin, str.length);
                    idi = new IdentifierInterval(idi.base, split + 1, idi.end);
                    if (idi.end >= idi.begin) {
                        from = from.right;
                        i = i + l.length;
                    }
                    else {
                        con = false;
                        break;
                    }
                }
                else {
                    i = i + from.leftSubtreeSize() + from.length;
                    result.push(new TextInsert(i, str));
                    from.appendEnd(str.length);
                    this.ascendentUpdate(path, str.length);
                    con = false;
                    break;
                }

                break;
            default:
                console.log("Not implemented yet");
                return -1;
            }
        }
        this.balance(path);
        return result;
    }
    else {
        console.assert(args.id instanceof Identifier);

        var id = args.id;
        var idi2 = new IdentifierInterval(id.base, id.last,
                id.last + str.length - 1);
        if (this.root === null) {
            var bl = new LogootSBlock(idi2);
            this.mapBaseToBlock[bl.id.base.join(",")] = bl;
            this.root = RopesNodes.leaf(bl, id.last, str.length);
            return [new TextInsert(0, str)];
        }
        else {
            return this.addBlock({
                idi2: idi2,
                str: str,
                from: this.root,
                startOffset: 0
            });
        }
    }
};

LogootSRopes.prototype.searchFull = function (node, id, path) {
    console.assert(node instanceof RopesNodes);
    console.assert(id instanceof Identifier);
    console.assert(path instanceof Array);

    if(node === null) {
        return false;
    }
    path.push(node);
    if(node.getIdBegin().toCompare(id) === 0 ||
        this.searchFull(node.left, id, path) ||
        this.searchFull(node.right, id, path)) {

        return true;
    }
    path.pop();
    return false;
};

LogootSRopes.prototype.mkNode = function (id1, id2, length) {
    console.assert(id1 instanceof Identifier);
    console.assert(id2 instanceof Identifier);
    console.assert(typeof length === "number");
    console.assert(length > 0);

    var base = IDFactory.createBetweenPosition(id1, id2, this.replicaNumber, this.clock++);
    var idi = new IdentifierInterval(base, 0, length - 1);
    var newBlock = new LogootSBlock(idi);
    this.mapBaseToBlock[idi.base.join(",")] = newBlock;
    return RopesNodes.leaf(newBlock, 0, length);
};

LogootSRopes.prototype.insertLocal = function (pos, l) {
    console.assert(typeof pod === "number");
    console.assert(typeof l === "string");
    var n;

    if(this.root === null) {// empty tree
        this.root = this.mkNode(null, null, l.length);
        this.root.block.mine = true;
        this.str = TextUtils.insert(this.str, pos, l);
        return new LogootSAdd(this.root.getIdBegin(), l);
    }
    else {
        var newNode;
        var length = this.viewLength();
        this.str = TextUtils.insert(this.str, pos, l);
        var path;
        if(pos === 0) {// begin of string
            path = [];
            path.push(this.root);
            n = this.getXest(leftChildOf, path);
            if (n.isAppendableBefore()) {
                var id = n.appendBegin(l.length);
                this.ascendentUpdate(path, l.length);
                return new LogootSAdd(id, l);
            }
            else {// add node
                newNode = this.mkNode(null, n.getIdBegin(), l.length);
                newNode.block.mine = true;
                n.left = newNode;
            }
        }
        else if(pos >= length) {// end
            path = [];
            path.push(this.root);
            n = this.getXest(rightChildOf, path);
            if (n.isAppendableAfter()) {// append
                var id3 = n.appendEnd(l.length);
                this.ascendentUpdate(path, l.length);
                return new LogootSAdd(id3, l);
            }
            else {// add at end
                newNode = this.mkNode(n.getIdEnd(), null, l.length);
                newNode.block.mine = true;
                n.right = newNode;
            }
        }
        else {// middle
            var inPos = this.search({
                pos: pos
            });
            if(inPos.i > 0) {// split
                var id1 = inPos.node.block.id.getBaseId(inPos.node.offset + inPos.i - 1);
                var id2 = inPos.node.block.id.getBaseId(inPos.node.offset + inPos.i);
                newNode = this.mkNode(id1, id2, l.length);
                newNode.block.mine = true;
                path = inPos.path;
                path.push(inPos.node.split({
                    size: inPos.i,
                    node: newNode
                }));
            }
            else {
                var prev = this.search({
                    pos: pos - 1
                });
                if(inPos.node.isAppendableBefore() &&
                        inPos.node.getIdBegin().hasPlaceBefore(
                            prev.node.getIdEnd(), l.length)) {// append before

                    var id5 = inPos.node.appendBegin(l.length);
                    this.ascendentUpdate(inPos.path, l.length);

                    return new LogootSAdd(id5, l);
                }
                else if (prev.node.isAppendableAfter() &&
                        prev.node.getIdEnd().hasPlaceAfter(
                            inPos.node.getIdBegin(), l.length)) {// append after

                    var id4 = prev.node.appendEnd(l.length);
                    this.ascendentUpdate(prev.path, l.length);

                    return new LogootSAdd(id4, l);
                }
                else {
                    newNode = this.mkNode(prev.node.getIdEnd(), inPos
                            .node.getIdBegin(), l.length);
                    newNode.block.mine = true;
                    newNode.right = prev.node.right;
                    prev.node.right = newNode;
                    path = prev.path;
                    path.push(newNode);
                }
            }
        }
        this.balance(path);

        return new LogootSAdd(newNode.getIdBegin(), l);
    }
};

LogootSRopes.prototype.getXest = function (aChildOf, aPath) {
    console.assert(aChildOf instanceof Function);
    console.assert(aPath instanceof Array);

    var n = aPath[aPath.length - 1];
    while (aChildOf(n) !== null) {
        n = aChildOf(n);
        aPath[aPath.length] = n;
    }
    return n;
};

LogootSRopes.prototype.search = function (args) {
    console.assert(typeof args === "object");

    if(args.hasOwnProperty("id")) {
        console.assert(args.id instanceof Identifier);
        console.assert(args.path instanceof Array);
        var id = args.id;
        var path = args.path;

        var i = 0;
        var node = this.root;
        while(node !== null) {
            path.push(node);
            if(id.compareTo(node.getIdBegin()) === -1) {
                node = node.left;
            }
            else if(id.compareTo(node.getIdEnd()) === 1) {
                i = i + node.leftSubtreeSize() + node.length;
                node = node.right;
            }
            else {
                return i + node.leftSubtreeSize();
            }
        }
        return -1;
    }
    else {
        console.assert(typeof args.pos === "number");
        var pos = args.pos;

        var node1 = this.root;
        var path1 = [];
        while(node1 !== null) {
            path1.push(node1);

            var before = (node1.left === null) ? 0 : node1.left.sizeNodeAndChildren;

            if(pos < before) {
                node1 = node1.left;
            }
            else if(pos < before + node1.length) {
                return new ResponseIntNode(pos - before, node1, path1);
            }
            else {
                pos -= before + node1.length;
                node1 = node1.right;
            }
        }
        return null;
    }
};

LogootSRopes.prototype.ascendentUpdate = function (path, length) {
    console.assert(path instanceof Array);
    console.assert(typeof length === "number");
    console.assert(length > 0);

    for (var i = path.length - 1; i >= 0; i--) {
        path[i].addString(length);
    }
};

LogootSRopes.prototype.delBlock = function (id) {
    console.assert(id instanceof Identifier);

    var l = [];
    var i;
    while (true) {
        var path = [];
        i = this.search({
            id: id.getBeginId(),
            path: path
        });
        if(i === -1) {
            if (id.begin < id.end) {
                id = new IdentifierInterval(id.base, id.begin + 1,
                        id.end);
            }
            else {
                return l;
            }
        }
        else {
            var node = path[path.length - 1];
            var end = Math.min(id.end, node.maxOffset());
            var pos = i + id.begin - node.offset;
            var length = end - id.begin + 1;
            l.push(new TextDelete(pos, length));
            var t = node.deleteOffsets(id.begin, end);
            if (node.length === 0) {// del node
                this.delNode(path);
            }
            else if (t !== null) {
                path.push(t);
                this.balance(path);
            }
            else {
                this.ascendentUpdate(path, id.begin - end - 1);
            }
            if (end === id.end) {
                break;
            }
            else {
                id = new IdentifierInterval(id.base, end, id.end);
            }
        }
    }
    return l;
};


LogootSRopes.prototype.delLocal = function (begin, end) {
    console.assert(typeof begin === "number");
    console.assert(typeof end === "number");
    console.assert(begin <= end);

    this.str = TextUtils.del(this.str, begin, end);
    var length = end - begin + 1;
    var li = [];
    do {
        var start = this.search({
            pos: begin
        });
        if(start !== null) {
            var be = start.node.offset + start.i;
            var en = Math.min(be + length - 1, start.node.maxOffset());
            li.push(new IdentifierInterval(start.node.block.id.base, be, en));
            var r = start.node.deleteOffsets(be, en);
            length -= en - be + 1;

            if (start.node.length === 0) {
                this.delNode(start.path);
            }
            else if (r !== null) {// node has been splited
                start.path.push(r);
                this.balance(start.path);
            }
            else {
                this.ascendentUpdate(start.path, be - en - 1);
            }
        }
        else {
            length = 0;
        }
    } while (length > 0);

    return new LogootSDel(li);
};

LogootSRopes.prototype.delNode = function (path) {
    console.assert(path instanceof Array);

    var node = path[path.length - 1];
    if (node.block.nbElement === 0) {
        this.mapBaseToBlock[node.block.id.base.join(",")]=null;
    }
    if (node.right === null) {
        if (node === this.root) {
            this.root = node.left;
        } else {
            path.pop();
            path[path.length - 1].replaceChildren(node, node.left);
        }
    } else if (node.left === null) {
        if (node === this.root) {
            this.root = node.right;
        } else {
            path.pop();
            path[path.length - 1].replaceChildren(node, node.right);
        }
    } else {// two children
        path.push(node.right);
        var min = this.getMinPath(path);
        node.become(min);
        path.pop();
        path[path.length - 1].replaceChildren(min, min.right);
    }
    this.balance(path);
};

LogootSRopes.prototype.getMinPath = function (path) {
    console.assert(path instanceof Array);

    var node = path[path.length - 1];
    if (node === null) {
        return null;
    }
    while (node.left !== null) {
        node = node.left;
        path.push(node);
    }
    return node;
};

LogootSRopes.prototype.getLeftest = function (node) {
    if (node === null) {
        return null;
    }
    while (node.left !== null) {
        node = node.left;
    }
    return node;
};

LogootSRopes.prototype.getMinId = function (node) {
    var back = this.getLeftest(node);
    return (back !== null) ? back.getIdBegin() : null;
};

//TODO: Implémenter la balance de Google (voir AVL.js) et vérifier ses performances en comparaison
LogootSRopes.prototype.balance = function (path) {
    console.assert(path instanceof Array);

    var node = path.length === 0 ? null : path.pop();
    var father = path.length === 0 ? null : path[path.length - 1];
    while (node !== null) {
        node.sumDirectChildren();
        var balance = node.balanceScore();
        while (Math.abs(balance) >= 2) {
            if (balance >= 2) {
                if (node.right !== null && node.right.balanceScore() <= -1) {
                    father = this.rotateRL(node, father);// double left
                }
                else {
                    father = this.rotateLeft(node, father);
                }
            }
            else {
                if (node.left !== null && node.left.balanceScore() >= 1) {
                    father = this.rotateLR(node, father);// Double right
                }
                else {
                    father = this.rotateRight(node, father);
                }
            }
            path.push(father);
            balance = node.balanceScore();
        }

        node = path.length === 0 ? null : path.pop();
        father = path.length === 0 ? null : path[path.length - 1];
    }
};

LogootSRopes.prototype.rotateLeft = function (node, father) {
    console.assert(node instanceof RopesNodes);
    console.assert(father instanceof RopesNodes);

    var r = node.right;
    if (node === this.root) {
        this.root = r;
    }
    else {
        father.replaceChildren(node, r);
    }
    node.right = r.left;
    r.left = node;
    node.sumDirectChildren();
    r.sumDirectChildren();
    return r;
};

LogootSRopes.prototype.rotateRight = function (node, father) {
    console.assert(node instanceof RopesNodes);
    console.assert(father instanceof RopesNodes);

    var r = node.left;
    if (node === this.root) {
        this.root = r;
    }
    else {
        father.replaceChildren(node, r);
    }
    node.left = r.right;
    r.right = node;
    node.sumDirectChildren();
    r.sumDirectChildren();
    return r;
};

LogootSRopes.prototype.rotateRL = function (node, father) {
    console.assert(node instanceof RopesNodes);
    console.assert(father instanceof RopesNodes);

    this.rotateRight(node.right, node);
    return this.rotateLeft(node, father);
};

LogootSRopes.prototype.rotateLR = function (node, father) {
    console.assert(node instanceof RopesNodes);
    console.assert(father instanceof RopesNodes);

    this.rotateLeft(node.left, node);
    return this.rotateRight(node, father);
};

LogootSRopes.prototype.getNext = function (path) {
    console.assert(path instanceof Array);

    var node = path[path.length - 1];
    if (node.right === null) {
        if (path.length > 1) {
            var father = path.get(path.length - 2);
            if (father.left === node) {
                path.pop();
                return true;
            }
        }
        return false;
    }
    else {
        path.push(node.right);
        this.getXest(leftChildOf, path);
        return true;
    }
};

LogootSRopes.prototype.duplicate = function (newReplicaNumber) {
    console.assert(typeof newReplicaNumber === "number");
    var copy = this.copy();
    copy.replicaNumber = newReplicaNumber;
    copy.clock = 0;
    return copy;
};

LogootSRopes.prototype.copy = function () {
    var o = new LogootSRopes(this.replicaNumber);
    o.str = this.str;
    o.clock = this.clock;
    o.root = this.root !== null ? this.root.copy() : null;
    o.mapBaseToBlock = {};
    for (var key in this.mapBaseToBlock) {
        if (this.mapBaseToBlock.hasOwnProperty(key)) {
          o.mapBaseToBlock[key] = this.mapBaseToBlock[key];
        }
    }
    return o;
};

LogootSRopes.prototype.copyFromJSON = function(ropes) {
    var mapping = ropes.mapBaseToBlock;
    this.str = ropes.str;

    for(var key in mapping) {
        if (mapping.hasOwnProperty(key)) {
          this.mapBaseToBlock[key] = mapping[key];
        }
    }

    if(ropes.root !== null) {
        this.root = RopesNodes.fromJSON(ropes.root);
    }
};

LogootSRopes.prototype.view = function () {
    return this.str;
};

LogootSRopes.prototype.viewLength = function () {
    return this.str.length;
};

module.exports = LogootSRopes;
