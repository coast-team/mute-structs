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
 Utils = require('mute-utils');

Identifier = require('./identifier');
IdentifierInterval = require('./identifierinterval');
IDFactory = require('./idfactory');
InfiniteString = require('./infinitestring');
Iterator = require('./iterator');
IteratorHelperIdentifier = require('./iteratorhelperidentifier');
LogootSAdd = require('./logootsadd');
LogootSBlock = require('./logootsblock');
LogootSDel = require('./logootsdel');
ResponseIntNode = require('./responseintnode');
RopesNodes = require('./ropesnodes');
TextDelete = require('./textdelete');
TextInsert = require('./textinsert');

var LogootSRopes = function (replicaNumber) {
    this.replicaNumber = replicaNumber || 0;
    this.clock = 0;
    this.root = null;
    this.mapBaseToBlock= {};
    this.str = '';
};

LogootSRopes.prototype.getBlock = function (id) {
    var ret = this.mapBaseToBlock[Utils.replaceDots(''+id.base)];
    if(ret==null) {
        ret = new LogootSBlock(id);
        this.mapBaseToBlock[Utils.replaceDots(''+id.base)] = ret;
    }
    return ret;
};


//TODO: implémenter les LogootSOperations
LogootSRopes.prototype.addBlock = function (args) {
    if(args['idi'] != null
        && args['str'] != null
        && args['from'] != null
        && args['startOffset'] != null) {

        var idi = args['idi'];
        var str = args['str'];
        var from = args['from'];
        var startOffset = args['startOffset'];

        var path = [];
        var path2 = [];
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
                if (from.right == null) {
                    var args2 = {
                        'length': str.length,
                        'offset': idi.begin,
                        'block': this.getBlock(idi)
                    };
                    from.right = new RopesNodes(args2);
                    i = i + from.getSizeNodeAndChildren(0) + from.length;
                    result.push(new TextInsert(i, str));
                    con = false;
                }
                else {
                    i = i + from.getSizeNodeAndChildren(0) + from.length;
                    from = from.right;
                }
                break;
            case IteratorHelperIdentifier.Result.B1_BEFORE_B2:
                if (from.left == null) {
                    var args2 = {
                        'length': str.length,
                        'offset': idi.begin,
                        'block': this.getBlock(idi)
                    };
                    from.left = new RopesNodes(args2);
                    result.push(new TextInsert(i, str));
                    con = false;
                }
                else {
                    from = from.left;
                }
                break;
            case IteratorHelperIdentifier.Result.B1_INSIDE_B2: // split b2 the object node
                split = Math.min(from.maxOffset(), ihi.nextOffset);
                var args2 = {
                        'length': str.length,
                        'offset': idi.begin,
                        'block': this.getBlock(idi)
                };
                var rp = new RopesNodes(args2);
                var args2 = {
                    'node': rp,
                    'size': split - from.offset + 1
                };
                path.push(from.split(args2));
                i = i + from.getSizeNodeAndChildren(0);
                result.push(new TextInsert(i + split - from.offset + 1, str));
                con = false;
                break;
            case IteratorHelperIdentifier.Result.B2_INSIDE_B1: // split b1 the node to insert
                var split2 = /* Math.min(idi.getEnd(), */ihi.nextOffset/* ) */;
                var ls = str.substr(0, split2 + 1 - idi.begin);
                var idi1 = new IdentifierInterval(idi.base,
                        idi.begin, split2);
                if (from.left == null) {
                    var args2 = {
                        'length': ls.length,
                        'offset': idi1.begin,
                        'block': this.getBlock(idi1),
                    };
                    from.left = new RopesNodes(args2);
                    result.push(new TextInsert(i, ls));
                }
                else {
                    var args2 = {
                        'idi': idi1,
                        'str': ls,
                        'from': from.left,
                        'startOffset': i
                    };
                    Array.prototype.push.apply(result, this.addBlock(args2));
                }

                // i=i+ls.size();

                ls = str.substr(split2 + 1 - idi.begin, str.length);
                idi1 = new IdentifierInterval(idi.base, split2 + 1, idi.end);
                i = i + from.getSizeNodeAndChildren(0) + from.length;
                if (from.right == null) {
                    var args2 = {
                        'length': ls.length,
                        'offset': idi1.begin,
                        'block': this.getBlock(idi1)
                    };
                    from.right = new RopesNodes(args2);
                    result.push(new TextInsert(i, ls));
                }
                else {
                    var args2 = {
                        'idi': idi1,
                        'str': ls,
                        'from': from.right,
                        'startOffset': i
                    };
                    Array.prototype.push.apply(result, this.addBlock(args2));
                }
                con = false;
                break;
            case IteratorHelperIdentifier.Result.B1_CONCAT_B2: // node to insert concat the node
                if (from.left != null) {
                    path2 = Utils.copy(path);
                    path2.push(from.left);
                    this.getXest(Utils.RopesNodes.RIGHT, path2);

                    split = from.getIdBegin().minOffsetAfterPrev(
                            path2[path2.length - 1].getIdEnd(), idi.begin);
                    var l = str.substr(split - idi.begin, str.length);
                    from.appendBegin(l.length);
                    result.push(new TextInsert(i + from.getSizeNodeAndChildren(0), l));

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
                if (from.right != null) {
                    path2 = Utils.copy(path);
                    path2.push(from.right);
                    this.getXest(Utils.RopesNodes.LEFT, path2);

                    split = from.getIdEnd().maxOffsetBeforeNex(
                            path2[path2.length - 1].getIdBegin(), idi.end);
                    var l = str.substr(0, split + 1 - idi.begin);
                    i = i + from.getSizeNodeAndChildren(0) + from.length;
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
                    i = i + from.getSizeNodeAndChildren(0) + from.length;
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
    else if(args['id'] != null && args['str'] != null) {
        var id = args['id'];
        var str = args['str'];
        var l = [];
        var idi = new IdentifierInterval(id.base, id.last,
                id.last + str.length - 1);
        if (this.root == null) {
            var bl = new LogootSBlock(idi);
            this.mapBaseToBlock[Utils.replaceDots(''+bl.id.base)] = bl;
            var args2 = {
                        'length': str.length,
                        'offset': id.last,
                        'block': bl
            };
            this.root = new RopesNodes(args2);
            l.push(new TextInsert(0, str));
            return l;
        }
        else {
            var args2 = {
                'idi': idi,
                'str': str,
                'from': this.root,
                'startOffset': 0
            };
            return this.addBlock(args2);
        }
    }
};

LogootSRopes.prototype.searchFull = function (node, id, path) {
    if(node == null)
        return false;
    path.push(node);
    if(node.getIdBegin().toCompare(id) == 0
        || this.searchFull(node.left, id, path)
        || this.searchFull(node.right, id, path)) {
        return true;
    }
    path.pop();
    return false;
};

LogootSRopes.prototype.mkNode = function (id1, id2, length) {
    var base = IDFactory.createBetweenPosition(id1, id2, this.replicaNumber, this.clock++);
    var idi = new IdentifierInterval(base, 0, length - 1);
    var newBlock = new LogootSBlock(idi);
    this.mapBaseToBlock[Utils.replaceDots(''+idi.base)] = newBlock;
    var args = {
        'length': length,
        'offset': 0,
        'block': newBlock
    };
    return new RopesNodes(args);
};

LogootSRopes.prototype.insertLocal = function (pos, l) {
    if(this.root == null) {// empty tree
        this.root = this.mkNode(null, null, l.length);
        this.root.block.mine = true;
        this.str = Utils.insert(this.str, pos, l);
        return new LogootSAdd(this.root.getIdBegin(), l);
    }
    else {
        var newNode;
        var length = this.viewLength();
        this.str = Utils.insert(this.str, pos, l);
        var path;
        if(pos == 0) {// begin of string
            path = [];
            path.push(this.root);
            var args = {
                'i': Utils.RopesNodes.LEFT,
                'path': path
            };
            var n = this.getXest(args);
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
            var args = {
                'i': Utils.RopesNodes.RIGHT,
                'path': path
            };
            var n = this.getXest(args);
            if (n.isAppendableAfter()) {// append
                var id = n.appendEnd(l.length);
                this.ascendentUpdate(path, l.length);
                return new LogootSAdd(id, l);
            }
            else {// add at end
                newNode = this.mkNode(n.getIdEnd(), null, l.length);
                newNode.block.mine = true;
                n.right = newNode;
            }
        }
        else {// middle
            var args = {'pos': pos};
            var inPos = this.search(args);
            if(inPos.i > 0) {// split
                var id1 = inPos.node.block.id.getBaseId(inPos.node.offset + inPos.i - 1);
                var id2 = inPos.node.block.id.getBaseId(inPos.node.offset + inPos.i);
                newNode = this.mkNode(id1, id2, l.length);
                newNode.block.mine = true;
                path = inPos.path;
                var args = {
                    'size': inPos.i,
                    'node': newNode
                };
                path.push(inPos.node.split(args));
            }
            else {
                var args = {'pos': pos - 1};
                var prev = this.search(args);
                if(inPos.node.isAppendableBefore()
                        && inPos.node
                                .getIdBegin()
                                .hasPlaceBefore(prev.node.getIdEnd(),
                                        l.length)) {// append before
                    var id = inPos.node.appendBegin(l.length);
                    this.ascendentUpdate(inPos.path, l.length);

                    return new LogootSAdd(id, l);
                }
                else {
                    if (prev.node.isAppendableAfter()
                            && prev.node
                                    .getIdEnd()
                                    .hasPlaceAfter(
                                            inPos.node.getIdBegin(),
                                            l.length)) {// append after
                        var id = prev.node.appendEnd(l.length);
                        this.ascendentUpdate(prev.path, l.length);

                        return new LogootSAdd(id, l);
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
        }
        this.balance(path);

        return new LogootSAdd(newNode.getIdBegin(), l);
    }
};

LogootSRopes.prototype.getXest = function (args) {
    if(args['i']!=null && args['n']!=null)
    {
        var i = args['i'];
        var n = args['n'];
        while (n.getChild(i) != null) {
            n = n.getChild(i);
        }
        return n;
    }
    else if(args['i']!=null && args['path']!=null)
    {
        var i = args['i'];
        var path = args['path'];
        var n = path[path.length-1];
        while (n.getChild(i) != null) {
            n = n.getChild(i);
            path.push(n);
        }
        return n;
    }
};

LogootSRopes.prototype.search = function (args) {
    if(args['id']!=null && args['path']!=null)
    {
        var id = args['id'];
        var path = args['path'];
        var i = 0;

        var node = this.root;
        while(node != null) {
            path.push(node);
            if(id.compareTo(node.getIdBegin()) < 0) {
                node = node.left;
            }
            else if(id.compareTo(node.getIdEnd()) > 0) {
                i = i + node.getSizeNodeAndChildren(0) + node.length;
                node = node.right;
            }
            else {
                i = i + node.getSizeNodeAndChildren(0);
                return i;
            }
        }
        return -1;

    }
    else if(args['pos']!=null)
    {
        var pos = args['pos'];

        var node = this.root;
        var path = [];
        while(node != null) {
            path.push(node);

            var before = node.left == null ? 0 : node.left.sizeNodeAndChildren;

            if(pos < before) {
                node = node.left;
            }
            else if(pos < before + node.length) {
                return new ResponseIntNode(pos - before, node, path);
            }
            else {
                pos -= before + node.length;
                node = node.right;
            }
        }
        return null;
    }
};

LogootSRopes.prototype.ascendentUpdate = function (path, length) {
    for (var i = path.length - 1; i >= 0; i--) {
        path[i].addString(length);
    }
};

LogootSRopes.prototype.delBlock = function (id) {
    var l = [];
    var i;
    while (true) {
        var path = [];
        var args = {
            'id': id.getBeginId(),
            'path': path
        }
        if((i = this.search(args)) == -1) {
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
            if (node.length == 0) {// del node
                this.delNode(path);
            }
            else if (t != null) {
                path.push(t);
                this.balance(path);
            }
            else {
                this.ascendentUpdate(path, id.begin - end - 1);
            }
            if (end == id.end) {
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
    this.str = Utils.del(this.str, begin, end);
    var length = end - begin + 1;
    var li = [];
    do {
        var args = {'pos': begin};
        var start = this.search(args);
        if(start!=null) {
            var be = start.node.offset + start.i;
            var en = Math.min(be + length - 1, start.node.maxOffset());
            li.push(new IdentifierInterval(start.node.block.id.base, be, en));
            var r = start.node.deleteOffsets(be, en);
            length -= en - be + 1;

            if (start.node.length == 0) {
                this.delNode(start.path);
            }
            else if (r != null) {// node has been splited
                start.path.push(r);
                this.balance(start.path);
            }
            else {
                this.ascendentUpdate(start.path, be - en - 1);
            }
        }
        else
            length=0;
    } while (length > 0);

    return new LogootSDel(li);
};

LogootSRopes.prototype.delNode = function (path) {
    var node = path[path.length - 1];
    if (node.block.nbElement == 0) {
        this.mapBaseToBlock[Utils.replaceDots(''+node.block.id.base)]=null;
    }
    if (node.right == null) {
        if (node == this.root) {
            this.root = node.left;
        } else {
            path.pop();
            path[path.length - 1].replaceChildren(node, node.left);
        }
    } else if (node.left == null) {
        if (node == this.root) {
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
    var node = path[path.length - 1];
    if (node == null) {
        return null;
    }
    while (node.left != null) {
        node = node.left;
        path.push(node);
    }
    return node;
};

LogootSRopes.prototype.getLeftest = function (node) {
    if (node == null) {
        return null;
    }
    while (node.left != null) {
        node = node.left;
    }
    return node;
};

LogootSRopes.prototype.getMinId = function (node) {
    var back = this.getLeftest(node);
    return back != null ? back.getIdBegin() : null;
};

//TODO: Implémenter la balance de Google (voir AVL.js) et vérifier ses performances en comparaison
LogootSRopes.prototype.balance = function (path) {
    var node = path.length == 0 ? null : path.pop();
    var father = path.length == 0 ? null : path[path.length - 1];
    while (node != null) {
        node.sumDirectChildren();
        var balance = node.balanceScore();
        while (Math.abs(balance) >= 2) {
            if (balance >= 2) {
                if (node.right != null && node.right.balanceScore() <= -1) {
                    father = this.rotateRL(node, father);// double left
                }
                else {
                    father = this.rotateLeft(node, father);
                }
            }
            else {
                if (node.left != null && node.left.balanceScore() >= 1) {
                    father = this.rotateLR(node, father);// Double right
                }
                else {
                    father = this.rotateRight(node, father);
                }
            }
            path.push(father);
            balance = node.balanceScore();
        }

        node = path.length == 0 ? null : path.pop();
        father = path.length == 0 ? null : path[path.length - 1];
    }
};

LogootSRopes.prototype.rotateLeft = function (node, father) {
    var r = node.right;
    if (node == this.root) {
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
    var r = node.left;
    if (node == this.root) {
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
    this.rotateRight(node.right, node);
    return this.rotateLeft(node, father);
};

LogootSRopes.prototype.rotateLR = function (node, father) {
    this.rotateLeft(node.left, node);
    return this.rotateRight(node, father);
};

LogootSRopes.prototype.getNext = function (path) {
    var node = path[path.length - 1];
    if (node.right == null) {
        if (path.length > 1) {
            var father = path.get(path.length - 2);
            if (father.left == node) {
                path.pop();
                return true;
            }
        }
        return false;
    }
    else {
        path.push(node.right);
        var args = {
            'i': Children.LEFT,
            'path': path
        };
        this.getXest(args);
        return true;
    }
};

LogootSRopes.prototype.duplicate = function (newReplicaNumber) {
    var copy = this.copy();
    copy.replicaNumber = newReplicaNumber;
    copy.clock = 0;
    return copy;
}

LogootSRopes.prototype.copy = function () {
    var o = new LogootSRopes(this.replicaNumber);
    o.str = this.str;
    o.clock = this.clock;
    o.root = this.root != null ? this.root.copy() : null;
    o.mapBaseToBlock = {};
    for (var key in this.mapBaseToBlock)
    {
        o.mapBaseToBlock[key] = this.mapBaseToBlock[key];
    }
    return o;
};

LogootSRopes.prototype.copyFromJSON = function(ropes) {
    var key;

    this.str = ropes.str;
    for(key in ropes.mapBaseToBlock) {
        this.mapBaseToBlock[key] = ropes.mapBaseToBlock[key];
    }
    if(ropes.root !== null && ropes.root !== undefined) {
        var node = ropes.root;
        var args = {
            'block': null,
            'offset': node.offset,
            'length': node.length
        };
        this.root = new RopesNodes(args);
        this.root.copyFromJSON(node);
    }
};

LogootSRopes.prototype.view = function () {
    return this.str;
};

LogootSRopes.prototype.viewLength = function () {
    return this.str.length;
};

module.exports = LogootSRopes;
