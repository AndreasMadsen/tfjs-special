
import { FileAST, Node, FuncDef } from '../ast';

const specialFunctions = new Map<string, FuncDef>([
    ['polevlf', new FuncDef({
        '_nodetype': 'FuncDef',
        'body': {
            '_nodetype': 'Compound',
            'block_items': [
                {
                    '_nodetype': 'Decl',
                    'bitsize': null,
                    'coord': 'cephes/polevlf.c:2',
                    'funcspec': [],
                    'init': {
                        '_nodetype': 'ArrayRef',
                        'coord': 'cephes/polevlf.c:2',
                        'name': {
                            '_nodetype': 'ID',
                            'coord': 'cephes/polevlf.c:2',
                            'name': 'coef'
                        },
                        'subscript': {
                            '_nodetype': 'Constant',
                            'coord': 'cephes/polevlf.c:2',
                            'type': 'int',
                            'value': '0'
                        }
                    },
                    'name': 'ans',
                    'quals': [],
                    'storage': [],
                    'type': {
                        '_nodetype': 'TypeDecl',
                        'coord': 'cephes/polevlf.c:2',
                        'declname': 'ans',
                        'quals': [],
                        'type': {
                            '_nodetype': 'IdentifierType',
                            'coord': 'cephes/polevlf.c:2',
                            'names': [
                                'float'
                            ]
                        }
                    }
                },
                {
                    '_nodetype': 'For',
                    'cond': {
                        '_nodetype': 'BinaryOp',
                        'coord': 'cephes/polevlf.c:3',
                        'left': {
                            '_nodetype': 'ID',
                            'coord': 'cephes/polevlf.c:3',
                            'name': 'i'
                        },
                        'op': '<=',
                        'right': {
                            '_nodetype': 'ID',
                            'coord': 'cephes/polevlf.c:3',
                            'name': 'N'
                        }
                    },
                    'coord': 'cephes/polevlf.c:3',
                    'init': {
                        '_nodetype': 'DeclList',
                        'coord': 'cephes/polevlf.c:3',
                        'decls': [
                            {
                                '_nodetype': 'Decl',
                                'bitsize': null,
                                'coord': 'cephes/polevlf.c:3',
                                'funcspec': [],
                                'init': {
                                    '_nodetype': 'Constant',
                                    'coord': 'cephes/polevlf.c:3',
                                    'type': 'int',
                                    'value': '1'
                                },
                                'name': 'i',
                                'quals': [],
                                'storage': [],
                                'type': {
                                    '_nodetype': 'TypeDecl',
                                    'coord': 'cephes/polevlf.c:3',
                                    'declname': 'i',
                                    'quals': [],
                                    'type': {
                                        '_nodetype': 'IdentifierType',
                                        'coord': 'cephes/polevlf.c:3',
                                        'names': [
                                            'int'
                                        ]
                                    }
                                }
                            }
                        ]
                    },
                    'next': {
                        '_nodetype': 'UnaryOp',
                        'coord': 'cephes/polevlf.c:3',
                        'expr': {
                            '_nodetype': 'ID',
                            'coord': 'cephes/polevlf.c:3',
                            'name': 'i'
                        },
                        'op': 'p++'
                    },
                    'stmt': {
                        '_nodetype': 'Compound',
                        'block_items': [
                            {
                                '_nodetype': 'Assignment',
                                'coord': 'cephes/polevlf.c:4',
                                'lvalue': {
                                    '_nodetype': 'ID',
                                    'coord': 'cephes/polevlf.c:4',
                                    'name': 'ans'
                                },
                                'op': '=',
                                'rvalue': {
                                    '_nodetype': 'BinaryOp',
                                    'coord': 'cephes/polevlf.c:4',
                                    'left': {
                                        '_nodetype': 'BinaryOp',
                                        'coord': 'cephes/polevlf.c:4',
                                        'left': {
                                            '_nodetype': 'ID',
                                            'coord': 'cephes/polevlf.c:4',
                                            'name': 'ans'
                                        },
                                        'op': '*',
                                        'right': {
                                            '_nodetype': 'ID',
                                            'coord': 'cephes/polevlf.c:4',
                                            'name': 'xx'
                                        }
                                    },
                                    'op': '+',
                                    'right': {
                                        '_nodetype': 'ArrayRef',
                                        'coord': 'cephes/polevlf.c:4',
                                        'name': {
                                            '_nodetype': 'ID',
                                            'coord': 'cephes/polevlf.c:4',
                                            'name': 'coef'
                                        },
                                        'subscript': {
                                            '_nodetype': 'ID',
                                            'coord': 'cephes/polevlf.c:4',
                                            'name': 'i'
                                        }
                                    }
                                }
                            }
                        ],
                        'coord': 'cephes/polevlf.c:3'
                    }
                },
                {
                    '_nodetype': 'Return',
                    'coord': 'cephes/polevlf.c:6',
                    'expr': {
                        '_nodetype': 'ID',
                        'coord': 'cephes/polevlf.c:6',
                        'name': 'ans'
                    }
                }
            ],
            'coord': 'cephes/polevlf.c:1'
        },
        'coord': 'cephes/polevlf.c:1',
        'decl': {
            '_nodetype': 'Decl',
            'bitsize': null,
            'coord': 'cephes/polevlf.c:1',
            'funcspec': [],
            'init': null,
            'name': 'polevlf',
            'quals': [],
            'storage': [],
            'type': {
                '_nodetype': 'FuncDecl',
                'args': {
                    '_nodetype': 'ParamList',
                    'coord': 'cephes/polevlf.c:1',
                    'params': [
                        {
                            '_nodetype': 'Decl',
                            'bitsize': null,
                            'coord': 'cephes/polevlf.c:1',
                            'funcspec': [],
                            'init': null,
                            'name': 'xx',
                            'quals': [],
                            'storage': [],
                            'type': {
                                '_nodetype': 'TypeDecl',
                                'coord': 'cephes/polevlf.c:1',
                                'declname': 'xx',
                                'quals': [],
                                'type': {
                                    '_nodetype': 'IdentifierType',
                                    'coord': 'cephes/polevlf.c:1',
                                    'names': [
                                        'float'
                                    ]
                                }
                            }
                        },
                        {
                            '_nodetype': 'Decl',
                            'bitsize': null,
                            'coord': 'cephes/polevlf.c:1',
                            'funcspec': [],
                            'init': null,
                            'name': 'coef',
                            'quals': [],
                            'storage': [],
                            'type': {
                                '_nodetype': 'ArrayDecl',
                                'coord': 'cephes/polevlf.c:1',
                                'dim': null,
                                'dim_quals': [],
                                'type': {
                                    '_nodetype': 'TypeDecl',
                                    'coord': 'cephes/polevlf.c:1',
                                    'declname': 'coef',
                                    'quals': [],
                                    'type': {
                                        '_nodetype': 'IdentifierType',
                                        'coord': 'cephes/polevlf.c:1',
                                        'names': [
                                            'float'
                                        ]
                                    }
                                }
                            }
                        },
                        {
                            '_nodetype': 'Decl',
                            'bitsize': null,
                            'coord': 'cephes/polevlf.c:1',
                            'funcspec': [],
                            'init': null,
                            'name': 'N',
                            'quals': [],
                            'storage': [],
                            'type': {
                                '_nodetype': 'TypeDecl',
                                'coord': 'cephes/polevlf.c:1',
                                'declname': 'N',
                                'quals': [],
                                'type': {
                                    '_nodetype': 'IdentifierType',
                                    'coord': 'cephes/polevlf.c:1',
                                    'names': [
                                        'int'
                                    ]
                                }
                            }
                        }
                    ]
                },
                'coord': 'cephes/polevlf.c:1',
                'type': {
                    '_nodetype': 'TypeDecl',
                    'coord': 'cephes/polevlf.c:1',
                    'declname': 'polevlf',
                    'quals': [],
                    'type': {
                        '_nodetype': 'IdentifierType',
                        'coord': 'cephes/polevlf.c:1',
                        'names': [
                            'float'
                        ]
                    }
                }
            }
        },
        'param_decls': null
    })],

    ['p1evlf', new FuncDef({
        '_nodetype': 'FuncDef',
        'body': {
            '_nodetype': 'Compound',
            'block_items': [
                {
                    '_nodetype': 'Decl',
                    'bitsize': null,
                    'coord': 'cephes/polevlf.c:10',
                    'funcspec': [],
                    'init': {
                        '_nodetype': 'BinaryOp',
                        'coord': 'cephes/polevlf.c:10',
                        'left': {
                            '_nodetype': 'ID',
                            'coord': 'cephes/polevlf.c:10',
                            'name': 'xx'
                        },
                        'op': '+',
                        'right': {
                            '_nodetype': 'ArrayRef',
                            'coord': 'cephes/polevlf.c:10',
                            'name': {
                                '_nodetype': 'ID',
                                'coord': 'cephes/polevlf.c:10',
                                'name': 'coef'
                            },
                            'subscript': {
                                '_nodetype': 'Constant',
                                'coord': 'cephes/polevlf.c:10',
                                'type': 'int',
                                'value': '0'
                            }
                        }
                    },
                    'name': 'ans',
                    'quals': [],
                    'storage': [],
                    'type': {
                        '_nodetype': 'TypeDecl',
                        'coord': 'cephes/polevlf.c:10',
                        'declname': 'ans',
                        'quals': [],
                        'type': {
                            '_nodetype': 'IdentifierType',
                            'coord': 'cephes/polevlf.c:10',
                            'names': [
                                'float'
                            ]
                        }
                    }
                },
                {
                    '_nodetype': 'For',
                    'cond': {
                        '_nodetype': 'BinaryOp',
                        'coord': 'cephes/polevlf.c:11',
                        'left': {
                            '_nodetype': 'ID',
                            'coord': 'cephes/polevlf.c:11',
                            'name': 'i'
                        },
                        'op': '<',
                        'right': {
                            '_nodetype': 'ID',
                            'coord': 'cephes/polevlf.c:11',
                            'name': 'N'
                        }
                    },
                    'coord': 'cephes/polevlf.c:11',
                    'init': {
                        '_nodetype': 'DeclList',
                        'coord': 'cephes/polevlf.c:11',
                        'decls': [
                            {
                                '_nodetype': 'Decl',
                                'bitsize': null,
                                'coord': 'cephes/polevlf.c:11',
                                'funcspec': [],
                                'init': {
                                    '_nodetype': 'Constant',
                                    'coord': 'cephes/polevlf.c:11',
                                    'type': 'int',
                                    'value': '1'
                                },
                                'name': 'i',
                                'quals': [],
                                'storage': [],
                                'type': {
                                    '_nodetype': 'TypeDecl',
                                    'coord': 'cephes/polevlf.c:11',
                                    'declname': 'i',
                                    'quals': [],
                                    'type': {
                                        '_nodetype': 'IdentifierType',
                                        'coord': 'cephes/polevlf.c:11',
                                        'names': [
                                            'int'
                                        ]
                                    }
                                }
                            }
                        ]
                    },
                    'next': {
                        '_nodetype': 'UnaryOp',
                        'coord': 'cephes/polevlf.c:11',
                        'expr': {
                            '_nodetype': 'ID',
                            'coord': 'cephes/polevlf.c:11',
                            'name': 'i'
                        },
                        'op': 'p++'
                    },
                    'stmt': {
                        '_nodetype': 'Compound',
                        'block_items': [
                            {
                                '_nodetype': 'Assignment',
                                'coord': 'cephes/polevlf.c:12',
                                'lvalue': {
                                    '_nodetype': 'ID',
                                    'coord': 'cephes/polevlf.c:12',
                                    'name': 'ans'
                                },
                                'op': '=',
                                'rvalue': {
                                    '_nodetype': 'BinaryOp',
                                    'coord': 'cephes/polevlf.c:12',
                                    'left': {
                                        '_nodetype': 'BinaryOp',
                                        'coord': 'cephes/polevlf.c:12',
                                        'left': {
                                            '_nodetype': 'ID',
                                            'coord': 'cephes/polevlf.c:12',
                                            'name': 'ans'
                                        },
                                        'op': '*',
                                        'right': {
                                            '_nodetype': 'ID',
                                            'coord': 'cephes/polevlf.c:12',
                                            'name': 'xx'
                                        }
                                    },
                                    'op': '+',
                                    'right': {
                                        '_nodetype': 'ArrayRef',
                                        'coord': 'cephes/polevlf.c:12',
                                        'name': {
                                            '_nodetype': 'ID',
                                            'coord': 'cephes/polevlf.c:12',
                                            'name': 'coef'
                                        },
                                        'subscript': {
                                            '_nodetype': 'ID',
                                            'coord': 'cephes/polevlf.c:12',
                                            'name': 'i'
                                        }
                                    }
                                }
                            }
                        ],
                        'coord': 'cephes/polevlf.c:11'
                    }
                },
                {
                    '_nodetype': 'Return',
                    'coord': 'cephes/polevlf.c:14',
                    'expr': {
                        '_nodetype': 'ID',
                        'coord': 'cephes/polevlf.c:14',
                        'name': 'ans'
                    }
                }
            ],
            'coord': 'cephes/polevlf.c:9'
        },
        'coord': 'cephes/polevlf.c:9',
        'decl': {
            '_nodetype': 'Decl',
            'bitsize': null,
            'coord': 'cephes/polevlf.c:9',
            'funcspec': [],
            'init': null,
            'name': 'p1evlf',
            'quals': [],
            'storage': [],
            'type': {
                '_nodetype': 'FuncDecl',
                'args': {
                    '_nodetype': 'ParamList',
                    'coord': 'cephes/polevlf.c:9',
                    'params': [
                        {
                            '_nodetype': 'Decl',
                            'bitsize': null,
                            'coord': 'cephes/polevlf.c:9',
                            'funcspec': [],
                            'init': null,
                            'name': 'xx',
                            'quals': [],
                            'storage': [],
                            'type': {
                                '_nodetype': 'TypeDecl',
                                'coord': 'cephes/polevlf.c:9',
                                'declname': 'xx',
                                'quals': [],
                                'type': {
                                    '_nodetype': 'IdentifierType',
                                    'coord': 'cephes/polevlf.c:9',
                                    'names': [
                                        'float'
                                    ]
                                }
                            }
                        },
                        {
                            '_nodetype': 'Decl',
                            'bitsize': null,
                            'coord': 'cephes/polevlf.c:9',
                            'funcspec': [],
                            'init': null,
                            'name': 'coef',
                            'quals': [],
                            'storage': [],
                            'type': {
                                '_nodetype': 'ArrayDecl',
                                'coord': 'cephes/polevlf.c:9',
                                'dim': null,
                                'dim_quals': [],
                                'type': {
                                    '_nodetype': 'TypeDecl',
                                    'coord': 'cephes/polevlf.c:9',
                                    'declname': 'coef',
                                    'quals': [],
                                    'type': {
                                        '_nodetype': 'IdentifierType',
                                        'coord': 'cephes/polevlf.c:9',
                                        'names': [
                                            'float'
                                        ]
                                    }
                                }
                            }
                        },
                        {
                            '_nodetype': 'Decl',
                            'bitsize': null,
                            'coord': 'cephes/polevlf.c:9',
                            'funcspec': [],
                            'init': null,
                            'name': 'N',
                            'quals': [],
                            'storage': [],
                            'type': {
                                '_nodetype': 'TypeDecl',
                                'coord': 'cephes/polevlf.c:9',
                                'declname': 'N',
                                'quals': [],
                                'type': {
                                    '_nodetype': 'IdentifierType',
                                    'coord': 'cephes/polevlf.c:9',
                                    'names': [
                                        'int'
                                    ]
                                }
                            }
                        }
                    ]
                },
                'coord': 'cephes/polevlf.c:9',
                'type': {
                    '_nodetype': 'TypeDecl',
                    'coord': 'cephes/polevlf.c:9',
                    'declname': 'p1evlf',
                    'quals': [],
                    'type': {
                        '_nodetype': 'IdentifierType',
                        'coord': 'cephes/polevlf.c:9',
                        'names': [
                            'float'
                        ]
                    }
                }
            }
        },
        'param_decls': null
    })],

    ['chbevlf', new FuncDef({
        '_nodetype': 'FuncDef',
        'body': {
            '_nodetype': 'Compound',
            'block_items': [
                {
                    '_nodetype': 'Decl',
                    'bitsize': null,
                    'coord': 'cephes/chbevlf.c:2',
                    'funcspec': [],
                    'init': {
                        '_nodetype': 'ArrayRef',
                        'coord': 'cephes/chbevlf.c:2',
                        'name': {
                            '_nodetype': 'ID',
                            'coord': 'cephes/chbevlf.c:2',
                            'name': 'array'
                        },
                        'subscript': {
                            '_nodetype': 'Constant',
                            'coord': 'cephes/chbevlf.c:2',
                            'type': 'int',
                            'value': '0'
                        }
                    },
                    'name': 'b0',
                    'quals': [],
                    'storage': [],
                    'type': {
                        '_nodetype': 'TypeDecl',
                        'coord': 'cephes/chbevlf.c:2',
                        'declname': 'b0',
                        'quals': [],
                        'type': {
                            '_nodetype': 'IdentifierType',
                            'coord': 'cephes/chbevlf.c:2',
                            'names': [
                                'float'
                            ]
                        }
                    }
                },
                {
                    '_nodetype': 'Decl',
                    'bitsize': null,
                    'coord': 'cephes/chbevlf.c:3',
                    'funcspec': [],
                    'init': {
                        '_nodetype': 'Constant',
                        'coord': 'cephes/chbevlf.c:3',
                        'type': 'float',
                        'value': '0.0'
                    },
                    'name': 'b1',
                    'quals': [],
                    'storage': [],
                    'type': {
                        '_nodetype': 'TypeDecl',
                        'coord': 'cephes/chbevlf.c:3',
                        'declname': 'b1',
                        'quals': [],
                        'type': {
                            '_nodetype': 'IdentifierType',
                            'coord': 'cephes/chbevlf.c:3',
                            'names': [
                                'float'
                            ]
                        }
                    }
                },
                {
                    '_nodetype': 'Decl',
                    'bitsize': null,
                    'coord': 'cephes/chbevlf.c:4',
                    'funcspec': [],
                    'init': null,
                    'name': 'b2',
                    'quals': [],
                    'storage': [],
                    'type': {
                        '_nodetype': 'TypeDecl',
                        'coord': 'cephes/chbevlf.c:4',
                        'declname': 'b2',
                        'quals': [],
                        'type': {
                            '_nodetype': 'IdentifierType',
                            'coord': 'cephes/chbevlf.c:4',
                            'names': [
                                'float'
                            ]
                        }
                    }
                },
                {
                    '_nodetype': 'For',
                    'cond': {
                        '_nodetype': 'BinaryOp',
                        'coord': 'cephes/chbevlf.c:5',
                        'left': {
                            '_nodetype': 'ID',
                            'coord': 'cephes/chbevlf.c:5',
                            'name': 'i'
                        },
                        'op': '<',
                        'right': {
                            '_nodetype': 'ID',
                            'coord': 'cephes/chbevlf.c:5',
                            'name': 'n'
                        }
                    },
                    'coord': 'cephes/chbevlf.c:5',
                    'init': {
                        '_nodetype': 'DeclList',
                        'coord': 'cephes/chbevlf.c:5',
                        'decls': [
                            {
                                '_nodetype': 'Decl',
                                'bitsize': null,
                                'coord': 'cephes/chbevlf.c:5',
                                'funcspec': [],
                                'init': {
                                    '_nodetype': 'Constant',
                                    'coord': 'cephes/chbevlf.c:5',
                                    'type': 'int',
                                    'value': '1'
                                },
                                'name': 'i',
                                'quals': [],
                                'storage': [],
                                'type': {
                                    '_nodetype': 'TypeDecl',
                                    'coord': 'cephes/chbevlf.c:5',
                                    'declname': 'i',
                                    'quals': [],
                                    'type': {
                                        '_nodetype': 'IdentifierType',
                                        'coord': 'cephes/chbevlf.c:5',
                                        'names': [
                                            'int'
                                        ]
                                    }
                                }
                            }
                        ]
                    },
                    'next': {
                        '_nodetype': 'UnaryOp',
                        'coord': 'cephes/chbevlf.c:5',
                        'expr': {
                            '_nodetype': 'ID',
                            'coord': 'cephes/chbevlf.c:5',
                            'name': 'i'
                        },
                        'op': 'p++'
                    },
                    'stmt': {
                        '_nodetype': 'Compound',
                        'block_items': [
                            {
                                '_nodetype': 'Assignment',
                                'coord': 'cephes/chbevlf.c:6',
                                'lvalue': {
                                    '_nodetype': 'ID',
                                    'coord': 'cephes/chbevlf.c:6',
                                    'name': 'b2'
                                },
                                'op': '=',
                                'rvalue': {
                                    '_nodetype': 'ID',
                                    'coord': 'cephes/chbevlf.c:6',
                                    'name': 'b1'
                                }
                            },
                            {
                                '_nodetype': 'Assignment',
                                'coord': 'cephes/chbevlf.c:7',
                                'lvalue': {
                                    '_nodetype': 'ID',
                                    'coord': 'cephes/chbevlf.c:7',
                                    'name': 'b1'
                                },
                                'op': '=',
                                'rvalue': {
                                    '_nodetype': 'ID',
                                    'coord': 'cephes/chbevlf.c:7',
                                    'name': 'b0'
                                }
                            },
                            {
                                '_nodetype': 'Assignment',
                                'coord': 'cephes/chbevlf.c:8',
                                'lvalue': {
                                    '_nodetype': 'ID',
                                    'coord': 'cephes/chbevlf.c:8',
                                    'name': 'b0'
                                },
                                'op': '=',
                                'rvalue': {
                                    '_nodetype': 'BinaryOp',
                                    'coord': 'cephes/chbevlf.c:8',
                                    'left': {
                                        '_nodetype': 'BinaryOp',
                                        'coord': 'cephes/chbevlf.c:8',
                                        'left': {
                                            '_nodetype': 'BinaryOp',
                                            'coord': 'cephes/chbevlf.c:8',
                                            'left': {
                                                '_nodetype': 'ID',
                                                'coord': 'cephes/chbevlf.c:8',
                                                'name': 'x'
                                            },
                                            'op': '*',
                                            'right': {
                                                '_nodetype': 'ID',
                                                'coord': 'cephes/chbevlf.c:8',
                                                'name': 'b1'
                                            }
                                        },
                                        'op': '-',
                                        'right': {
                                            '_nodetype': 'ID',
                                            'coord': 'cephes/chbevlf.c:8',
                                            'name': 'b2'
                                        }
                                    },
                                    'op': '+',
                                    'right': {
                                        '_nodetype': 'ArrayRef',
                                        'coord': 'cephes/chbevlf.c:8',
                                        'name': {
                                            '_nodetype': 'ID',
                                            'coord': 'cephes/chbevlf.c:8',
                                            'name': 'array'
                                        },
                                        'subscript': {
                                            '_nodetype': 'ID',
                                            'coord': 'cephes/chbevlf.c:8',
                                            'name': 'i'
                                        }
                                    }
                                }
                            }
                        ],
                        'coord': 'cephes/chbevlf.c:5'
                    }
                },
                {
                    '_nodetype': 'Return',
                    'coord': 'cephes/chbevlf.c:10',
                    'expr': {
                        '_nodetype': 'BinaryOp',
                        'coord': 'cephes/chbevlf.c:10',
                        'left': {
                            '_nodetype': 'Constant',
                            'coord': 'cephes/chbevlf.c:10',
                            'type': 'float',
                            'value': '0.5'
                        },
                        'op': '*',
                        'right': {
                            '_nodetype': 'BinaryOp',
                            'coord': 'cephes/chbevlf.c:10',
                            'left': {
                                '_nodetype': 'ID',
                                'coord': 'cephes/chbevlf.c:10',
                                'name': 'b0'
                            },
                            'op': '-',
                            'right': {
                                '_nodetype': 'ID',
                                'coord': 'cephes/chbevlf.c:10',
                                'name': 'b2'
                            }
                        }
                    }
                }
            ],
            'coord': 'cephes/chbevlf.c:1'
        },
        'coord': 'cephes/chbevlf.c:1',
        'decl': {
            '_nodetype': 'Decl',
            'bitsize': null,
            'coord': 'cephes/chbevlf.c:1',
            'funcspec': [],
            'init': null,
            'name': 'chbevlf',
            'quals': [],
            'storage': [],
            'type': {
                '_nodetype': 'FuncDecl',
                'args': {
                    '_nodetype': 'ParamList',
                    'coord': 'cephes/chbevlf.c:1',
                    'params': [
                        {
                            '_nodetype': 'Decl',
                            'bitsize': null,
                            'coord': 'cephes/chbevlf.c:1',
                            'funcspec': [],
                            'init': null,
                            'name': 'x',
                            'quals': [],
                            'storage': [],
                            'type': {
                                '_nodetype': 'TypeDecl',
                                'coord': 'cephes/chbevlf.c:1',
                                'declname': 'x',
                                'quals': [],
                                'type': {
                                    '_nodetype': 'IdentifierType',
                                    'coord': 'cephes/chbevlf.c:1',
                                    'names': [
                                        'float'
                                    ]
                                }
                            }
                        },
                        {
                            '_nodetype': 'Decl',
                            'bitsize': null,
                            'coord': 'cephes/chbevlf.c:1',
                            'funcspec': [],
                            'init': null,
                            'name': 'array',
                            'quals': [],
                            'storage': [],
                            'type': {
                                '_nodetype': 'ArrayDecl',
                                'coord': 'cephes/chbevlf.c:1',
                                'dim': null,
                                'dim_quals': [],
                                'type': {
                                    '_nodetype': 'TypeDecl',
                                    'coord': 'cephes/chbevlf.c:1',
                                    'declname': 'array',
                                    'quals': [],
                                    'type': {
                                        '_nodetype': 'IdentifierType',
                                        'coord': 'cephes/chbevlf.c:1',
                                        'names': [
                                            'float'
                                        ]
                                    }
                                }
                            }
                        },
                        {
                            '_nodetype': 'Decl',
                            'bitsize': null,
                            'coord': 'cephes/chbevlf.c:1',
                            'funcspec': [],
                            'init': null,
                            'name': 'n',
                            'quals': [],
                            'storage': [],
                            'type': {
                                '_nodetype': 'TypeDecl',
                                'coord': 'cephes/chbevlf.c:1',
                                'declname': 'n',
                                'quals': [],
                                'type': {
                                    '_nodetype': 'IdentifierType',
                                    'coord': 'cephes/chbevlf.c:1',
                                    'names': [
                                        'int'
                                    ]
                                }
                            }
                        }
                    ]
                },
                'coord': 'cephes/chbevlf.c:1',
                'type': {
                    '_nodetype': 'TypeDecl',
                    'coord': 'cephes/chbevlf.c:1',
                    'declname': 'chbevlf',
                    'quals': [],
                    'type': {
                        '_nodetype': 'IdentifierType',
                        'coord': 'cephes/chbevlf.c:1',
                        'names': [
                            'float'
                        ]
                    }
                }
            }
        },
        'param_decls': null
    })]
]);

export function arrayPointerToIndex(ast: FileAST): FileAST {
    return ast.transformChildren(
        function transform<T extends Node, TT extends Node>(
            child: T, parent: TT
        ): T {
            if (child instanceof FuncDef) {
                if (specialFunctions.has(child.decl.name)) {
                    return specialFunctions.get(child.decl.name) as Node as T;
                }
            }

            return child;
        }
    );
}
