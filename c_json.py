""" LICENSE:

pycparser -- A C parser in Python

Copyright (c) 2008-2017, Eli Bendersky
All rights reserved.

Redistribution and use in source and binary forms, with or without modification,
are permitted provided that the following conditions are met:

* Redistributions of source code must retain the above copyright notice, this 
  list of conditions and the following disclaimer.
* Redistributions in binary form must reproduce the above copyright notice, 
  this list of conditions and the following disclaimer in the documentation 
  and/or other materials provided with the distribution.
* Neither the name of Eli Bendersky nor the names of its contributors may 
  be used to endorse or promote products derived from this software without 
  specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND 
ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED 
WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE 
DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE 
LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR 
CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE 
GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) 
HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT 
LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT 
OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
"""

#------------------------------------------------------------------------------
# pycparser: c_json.py
#
# by Michael White (@mypalmike)
#
# This example includes functions to serialize and deserialize an ast
# to and from json format. Serializing involves walking the ast and converting
# each node from a python Node object into a python dict. Deserializing
# involves the opposite conversion, walking the tree formed by the
# dict and converting each dict into the specific Node object it represents.
# The dict itself is serialized and deserialized using the python json module.
#
# The dict representation is a fairly direct transformation of the object
# attributes. Each node in the dict gets one metadata field referring to the
# specific node class name, _nodetype. Each local attribute (i.e. not linking
# to child nodes) has a string value or array of string values. Each child
# attribute is either another dict or an array of dicts, exactly as in the
# Node object representation. The "coord" attribute, representing the
# node's location within the source code, is serialized/deserialized from
# a Coord object into a string of the format "filename:line[:column]".
#
# Example TypeDecl node, with IdentifierType child node, represented as a dict:
#     "type": {
#         "_nodetype": "TypeDecl",
#         "coord": "c_files/funky.c:8",
#         "declname": "o",
#         "quals": [],
#         "type": {
#             "_nodetype": "IdentifierType",
#             "coord": "c_files/funky.c:8",
#             "names": [
#                 "char"
#             ]
#         }
#     }
#------------------------------------------------------------------------------
from __future__ import print_function

import sys
import json
import re

from pycparser import CParser


RE_CHILD_ARRAY = re.compile(r'(.*)\[(.*)\]')
RE_INTERNAL_ATTR = re.compile('__.*__')


class CJsonError(Exception):
    pass


def memodict(fn):
    """ Fast memoization decorator for a function taking a single argument """
    class memodict(dict):
        def __missing__(self, key):
            ret = self[key] = fn(key)
            return ret
    return memodict().__getitem__


@memodict
def child_attrs_of(klass):
    """
    Given a Node class, get a set of child attrs.
    Memoized to avoid highly repetitive string manipulation
    """
    non_child_attrs = set(klass.attr_names)
    all_attrs = set([i for i in klass.__slots__ if not RE_INTERNAL_ATTR.match(i)])
    return all_attrs - non_child_attrs


def to_dict(node):
    """ Recursively convert an ast into dict representation. """
    klass = node.__class__

    result = {}

    # Metadata
    result['_nodetype'] = klass.__name__

    # Local node attributes
    for attr in klass.attr_names:
        result[attr] = getattr(node, attr)

    # Coord object
    if node.coord:
        result['coord'] = str(node.coord)
    else:
        result['coord'] = None

    # Child attributes
    for child_name, child in node.children():
        # Child strings are either simple (e.g. 'value') or arrays (e.g. 'block_items[1]')
        match = RE_CHILD_ARRAY.match(child_name)
        if match:
            array_name, array_index = match.groups()
            array_index = int(array_index)
            # arrays come in order, so we verify and append.
            result[array_name] = result.get(array_name, [])
            if array_index != len(result[array_name]):
                raise CJsonError('Internal ast error. Array {} out of order. '
                    'Expected index {}, got {}'.format(
                    array_name, len(result[array_name]), array_index))
            result[array_name].append(to_dict(child))
        else:
            result[child_name] = to_dict(child)

    # Any child attributes that were missing need "None" values in the json.
    for child_attr in child_attrs_of(klass):
        if child_attr not in result:
            result[child_attr] = None

    return result


def text_to_json(filename, **kwargs):
    """ Load C file into json string representation of ast """
    parser = CParser()
    ast = parser.parse(filename)
    return json.dumps(to_dict(ast), **kwargs)


if __name__ == "__main__":
    print(text_to_json(sys.stdin.read(), sort_keys=True, indent=4))
