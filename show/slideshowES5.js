/*jslint nomen: true */
/*global window: false */
/*global document: false */
(function () {
	"use strict";

	function noOp() {
		return function () {};
	}

	function existy(x) {
		return x != null;
	}

	function isFunction(func) {
		return func && {}.toString.call(func) === '[object Function]';
	}

	function getResult(arg) {
		return isFunction(arg) ? arg() : arg;
	}

	function doWhen(cond, action) {
		if (getResult(cond)) {
			return action();
		} else {
			return undefined;
		}
	}

	function wrap(wrapper) {
        var method = this,
            _len2 = arguments.length,
            argz = new Array(_len2 > 1 ? _len2 - 1 : 0),
            _key2;
		for (_key2 = 1; _key2 < _len2; _key2++) {
			argz[_key2 - 1] = arguments[_key2];
		}
		return function () {
			if (wrapper) {
                var _len3 = arguments.length,
                    args = new Array(_len3),
                    _key3;
				for (_key3 = 0; _key3 < _len3; _key3++) {
					args[_key3] = arguments[_key3];
				}
				return wrapper.apply(this, [method.bind(this)].concat(argz).concat(args));
			}
		};
	}
	Function.prototype.wrap = wrap;

	function curryFactory(i, defer) {
		var once = {
				imm: function imm(f) {
					return function (arg) {
						return f(arg);
					};
				},
				defer: function defer(f) {
					return function (arg) {
						return function () {
							return f(arg);
						};
					};
				}
			},
			twice = {
				imm: function imm(f) {
					return function (arg1) {
						return function (arg2) {
							return f(arg2, arg1);
						};
					};
				},
				defer: function defer(f) {
					return function (arg1) {
						return function (arg2) {
							return function () {
								return f(arg2, arg1);
							};
						};
					};
				}
			},
			thrice = {
				imm: function imm(f) {
					return function (arg1) {
						return function (arg2) {
							return function (arg3) {
								return f(arg3, arg2, arg1);
							};
						};
					};
				},
				defer: function defer(f) {
					return function (arg1) {
						return function (arg2) {
							return function (arg3) {
								return function () {
									return f(arg3, arg2, arg1);
								};
							};
						};
					};
				}
			},
			quart = {
				imm: function imm(f) {
					return function (arg1) {
						return function (arg2) {
							return function (arg3) {
								return function (arg4) {
									return f(arg4, arg3, arg2, arg1);
								};
							};
						};
					};
				},
				defer: function defer(f) {
					return function (arg1) {
						return function (arg2) {
							return function (arg3) {
								return function (arg4) {
									return function () {
										return f(arg4, arg3, arg2, arg1);
									};
								};
							};
						};
					};
				}
			},
			coll = [once, twice, thrice, quart],
			ret = coll[i];
		return ret && defer ? ret.defer : ret ? ret.imm : function () {};
	}

	function attrMap(el, map, style) {
		var _iterator = _createForOfIteratorHelper(map),
			_step;
		try {
			for (_iterator.s(); !(_step = _iterator.n()).done;) {
				var _step$value = _slicedToArray(_step.value, 2),
					k = _step$value[0],
					v = _step$value[1];
				if (Array.isArray(v)) {
					v.forEach(function (prop) {
						attrMap(el, prop, true);
					});
					break;
				}
				if (k.match(/^te?xt$/)) {
					el.innerHTML = v;
					continue;
				}
				if (!style) {
					el.setAttribute(k, v);
				} else {
					el.style.setProperty(k, v);
				}
			}
		} catch (err) {
			_iterator.e(err);
		} finally {
			_iterator.f();
		}
		return el;
	}
	/* EXPECTS VALUE BEFORE KEY ON RIGHT CURRY*/
	function doMap(el, v, k) {
		var arg = _instanceof(v, Map) ? v : new Map([
			[k, v]
		]);
		return attrMap(getResult(el), arg);
	}

	function invoke(f) {
		for (var _len4 = arguments.length, args = new Array(_len4 > 1 ? _len4 - 1 : 0), _key4 = 1; _key4 < _len4; _key4++) {
			args[_key4 - 1] = arguments[_key4];
		}
		return f.apply(null, args.map(getResult));
	}

	function compare(coll, pred) {
		for (var _len5 = arguments.length, props = new Array(_len5 > 2 ? _len5 - 2 : 0), _key5 = 2; _key5 < _len5; _key5++) {
			props[_key5 - 2] = arguments[_key5];
		}
		return pred(coll[props[0]], coll[props[1]]);
	}

	function lazyVal(v, el, k) {
		return invoke(doMap, el, v, k);
	}

	function allEqual(arr) {
		return arr.every(function (val) {
			return val === arr[0];
		});
	}

	function cat(first) {
		if (existy(first)) {
			for (var _len6 = arguments.length, rest = new Array(_len6 > 1 ? _len6 - 1 : 0), _key6 = 1; _key6 < _len6; _key6++) {
				rest[_key6 - 1] = arguments[_key6];
			}
			return first.concat.apply(first, rest);
		} else {
			return [];
		}
	}

	function construct(head) {
		for (var _len7 = arguments.length, tail = new Array(_len7 > 1 ? _len7 - 1 : 0), _key7 = 1; _key7 < _len7; _key7++) {
			tail[_key7 - 1] = arguments[_key7];
		}
		return head && cat([head], tail);
	}

	function dispatch() {
		for (var _len8 = arguments.length, funcs = new Array(_len8), _key8 = 0; _key8 < _len8; _key8++) {
			funcs[_key8] = arguments[_key8];
		}
		var size = funcs.length;
		return function (tgt) {
			var ret, fn;
			for (var _len9 = arguments.length, rest = new Array(_len9 > 1 ? _len9 - 1 : 0), _key9 = 1; _key9 < _len9; _key9++) {
				rest[_key9 - 1] = arguments[_key9];
			}
			var _iterator2 = _createForOfIteratorHelper(funcs),
				_step2;
			try {
				for (_iterator2.s(); !(_step2 = _iterator2.n()).done;) {
					fn = _step2.value;
					try {
						ret = fn.apply(null, construct(tgt, rest));
						if (existy(ret)) {
							return ret;
						}
					} finally {
						noOp();
					}
				}
			} catch (err) {
				_iterator2.e(err);
			} finally {
				_iterator2.f();
			}
			return ret;
		};
	}

	function searcher(obj, ary) {
		/*noticed an issue with parentNode where on supply of an element, the initial value for reduce is the parent
		but THAT parent would get set on the second iteration to ITS parent so. When array has just one item reduce not really required*/
		if (ary && ary[1]) {
			return ary.reduce(function (acc, cur) {
				return acc[cur] ? acc[cur] : acc;
			}, obj[ary[0]]);
		}
		return ary[0] ? obj[ary[0]] : obj;
	} //note a function that ignores any state of x or y will return the first element if true and last if false
	function best(fun, coll) {
		return _toConsumableArray(coll).reduce(function (champ, contender) {
			return fun(champ, contender) ? champ : contender;
		});
	}

	function composeES5() {
		for (var _len = arguments.length, fns = new Array(_len), _key = 0; _key < _len; _key++) {
			fns[_key] = arguments[_key];
		}
		return fns.reduce(function (f, g) {
			//anon is the iteratee
			return function anon() {
				//expects arguments to first function
				return f(g.apply(void 0, arguments)); //SETS THE NEW f AND g
			};
		});
	} //simple version that simply expects the remainder of the arguments on the second call
	function partial(func) {
		for (var _len10 = arguments.length, args = new Array(_len10 > 1 ? _len10 - 1 : 0), _key10 = 1; _key10 < _len10; _key10++) {
			args[_key10 - 1] = arguments[_key10];
		}
		return function () {
			for (var _len11 = arguments.length, rest = new Array(_len11), _key11 = 0; _key11 < _len11; _key11++) {
				rest[_key11] = arguments[_key11];
			}
			return func.apply(null, args.concat(rest));
		};
	}

	function negate(predicate) {
		return function () {
			return !predicate.apply(this, arguments);
		};
	}

	function getPredicate(cond, predicate) {
		return predicate(getResult(cond)) ? predicate : negate(predicate);
	}

	function getNextElement(node) {
		if (node && node.nodeType === 1) {
			return node;
		}
		if (node && node.nextSibling) {
			return getNextElement(node.nextSibling);
		}
		return null;
	}

	function cloneNode(node, bool) {
		var deep = existy(bool) ? bool : false;
		return node.cloneNode(deep);
	}

	function clone(node) {
		return node.parentNode.parentNode.appendChild(node.parentNode.cloneNode(true));
	}

	function validateRemove(node) {
		return node && node.parentNode;
	}

	function removeElement(node) {
		return node.parentNode.removeChild(node);
	}

	function loadImage(url, id) {
		return new Promise(function (resolve, reject) {
			//remove then append to produce a fresh promise
			var img = $(id).firstChild; //img = removeElement(img);
			//$(id).appendChild(img);
			img.addEventListener('load', function (e) {
				return resolve(img);
			});
			img.addEventListener('error', function () {
				reject(new Error("Failed to load image's URL: ".concat(url())));
			});
			img.src = doParse(url());
		});
	}
	var Group = /*#__PURE__*/ function () {
		function Group() {
			_classCallCheck(this, Group);
			this.members = [];
		}
		_createClass(Group, [{
			key: "add",
			value: function add(value) {
				if (!this.has(value)) {
					this.members.push(value);
				}
			}
		}, {
			key: "delete",
			value: function _delete(value) {
				this.members = this.members.filter(function (v) {
					return v !== value;
				});
			}
		}, {
			key: "has",
			value: function has(value) {
				return this.members.includes(value);
			}
		}], [{
			key: "from",
			value: function from(collection) {
				var group = new Group();
				var _iterator3 = _createForOfIteratorHelper(collection),
					_step3;
				try {
					for (_iterator3.s(); !(_step3 = _iterator3.n()).done;) {
						var value = _step3.value;
						group.add(value);
					}
				} catch (err) {
					_iterator3.e(err);
				} finally {
					_iterator3.f();
				}
				return group;
			}
		}]);
		return Group;
	}();
	var LoopIterator = /*#__PURE__*/ function () {
		function LoopIterator(group) {
			_classCallCheck(this, LoopIterator);
			this.group = group;
			this.position = 0;
			this.rev = false;
		}
		_createClass(LoopIterator, [{
			key: "next",
			value: function next(flag) {
				if (!flag && this.rev) {
					return this.previous(true);
				}
				this.position++;
				this.position = this.position % this.group.members.length;
				var result = {
					value: this.group.members[this.position],
					index: this.position
				};
				return result;
			}
		}, {
			key: "previous",
			value: function previous(flag) {
				if (!this.rev || flag) {
					this.group.members = this.group.members.reverse();
					this.position = this.group.members.length - 1 - this.position;
					this.position = this.position % this.group.members.length;
					this.rev = !this.rev;
					return this.next(this.rev);
				} else {
					return this.next(this.rev);
				}
			}
		}, {
			key: "current",
			value: function current() {
				var result = {
					value: this.group.members[this.position],
					index: this.position
				};
				return result;
			}
		}, {
			key: "play",
			value: function play() {
				return this.next(true).value;
			}
		}, {
			key: "find",
			value: function find(tgt) {
				this.position = this.group.members.findIndex(function (m) {
					return m === tgt;
				});
				var result = {
					value: this.group.members[this.position],
					index: this.position
				};
				return result;
			}
		}]);
		return LoopIterator;
	}(); //https://medium.com/@dtipson/creating-an-es6ish-compose-in-javascript-ac580b95104a
	var eventing = function eventing(type, fn, el) {
			var actions = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : ['preventDefault'];

			function preventer(wrapped, actions, e) {
				actions.forEach(function (a) {
					return e[a]();
				});
				return wrapped(e);
			}
			fn = fn.wrap(preventer, actions);
			el = getResult(el);
			return {
				render: function render() {
					el.addEventListener(type, fn, false);
					return this;
				},
				unrender: function unrender() {
					el.removeEventListener(type, fn, false);
					return this;
				}
			};
		},
		compose = function compose() {
			for (var _len12 = arguments.length, fns = new Array(_len12), _key12 = 0; _key12 < _len12; _key12++) {
				fns[_key12] = arguments[_key12];
			}
			return fns.reduce(function (f, g) {
				return function () {
					return f(g.apply(void 0, arguments));
				};
			});
		},
		//https://tech.mybuilder.com/partial-application-currying-and-composition-using-javascript-es6/
		curryLeft = function curryLeft(fn) {
			var _curry = function _curry(args) {
				return args.length < fn.length ? function () {
					for (var _len14 = arguments.length, _args = new Array(_len14), _key14 = 0; _key14 < _len14; _key14++) {
						_args[_key14] = arguments[_key14];
					}
					return _curry([].concat(_toConsumableArray(args), _args));
				} : fn.apply(void 0, _toConsumableArray(args));
			};
			for (var _len13 = arguments.length, args = new Array(_len13 > 1 ? _len13 - 1 : 0), _key13 = 1; _key13 < _len13; _key13++) {
				args[_key13 - 1] = arguments[_key13];
			}
			return _curry(args);
		},
		curryLeftDefer = function curryLeftDefer(fn) {
			for (var _len15 = arguments.length, args = new Array(_len15 > 1 ? _len15 - 1 : 0), _key15 = 1; _key15 < _len15; _key15++) {
				args[_key15 - 1] = arguments[_key15];
			}
			var _curry = function _curry(args) {
				return args.length < fn.length ? function () {
					for (var _len16 = arguments.length, _args = new Array(_len16), _key16 = 0; _key16 < _len16; _key16++) {
						_args[_key16] = arguments[_key16];
					}
					return _curry([].concat(_toConsumableArray(args), _args));
				} : fn.apply(void 0, _toConsumableArray(args));
			};
			return function () {
				return _curry(args);
			};
		},
		always = function always(arg) {
			return function () {
				return arg;
			};
		},
		validateProperty = function validateProperty(o, p) {
			return o & o[p];
		},
		equals = function equals(a, b) {
			return a === b;
		},
		greaterOrEqual = partial(invoke, function (a, b) {
			return a >= b;
		}),
		gtEq = curryLeft(function (a, b) {
			return a >= b;
		}),
		doAlt = function doAlt(actions) {
			return actions.reverse()[0]();
		},
		defer_once = curryFactory(0, true),
		twice = curryFactory(1),
		twicedefer = curryFactory(1, true),
		thrice = curryFactory(2),
		thricedefer = curryFactory(2, true),
		quart = curryFactory(3),
		driller = twice(searcher),
		getter = function getter(o, p) {
			return o[p];
		},
		zero = twice(getter)(0),
		setter = thrice(function (v, o, p) {
			o[p] = v;
		}),
		caller = function caller(v, o, p) {
			return o[p](v);
		},
		defercall = thricedefer(caller),
		parser = thrice(function (o, v, p) {
			return o[p](v);
		})('match')(/[^\/]+\.(jpg|png)$/),
		add = function add(a, b) {
			return a + b;
		},
		subtract = function subtract(a, b) {
			return a - b;
		},
		divideBy = twice(function (a, b) {
			return a / b;
		}),
		$ = thrice(caller)('getElementById')(document),
		$q = thrice(caller)('querySelector')(document),
		$$ = thricedefer(caller)('getElementById')(document),
		enable = document.body.classList.add.bind(document.body.classList),
		disable = document.body.classList.remove.bind(document.body.classList),
		lcsp = curryLeftDefer(enable, 'lscp'),
		ptrt = curryLeftDefer(disable, 'lscp'),
		target = twice(getter)('target'),
		text_target = twice(getter)('innerHTML'),
		node_target = twice(getter)('nodeName'),
		text_from_target = thrice(function (e, s, g) {
			return s(g(e));
		})(target)(text_target),
		node_from_target = thrice(function (e, s, g) {
			return s(g(e));
		})(target)(node_target),
		getChild = compose(getNextElement, driller(['firstChild'])),
		getNewElement = dispatch(document.createElement.bind(document), twice(cloneNode)(true), document.createDocumentFragment.bind(document)),
		setAnchor = function (render) {
			return function (anchor, refnode, strategy) {
				return compose(partial(partial(invoke, render), anchor, refnode), strategy);
			};
		}(function (anc, ref, el) {
			return anc.insertBefore(el, ref);
		}),
		append = function append(flag) {
			if (flag) {
				return thricedefer(setAnchor)(getNewElement)(null);
			}
			return thrice(setAnchor)(getNewElement)(null);
		},
		insert = function insert(flag) {
			if (flag) {
				return function (ref, anc) {
					return thricedefer(setAnchor)(getNewElement)(ref)(anc);
				};
			}
			return function (ref, anc) {
				return thrice(setAnchor)(getNewElement)(ref)(anc);
			};
		},
		anCr = append(),
		anCrIn = insert(),
		removeNodeOnComplete = removeElement.wrap(function (f, node) {
			if (validateRemove(node)) {
				return f(node);
			}
		}),
		locator = function locator(forward, back) {
			var getLoc = function (div, subtract, isGreaterEq) {
				var getThreshold = compose(div, subtract);
				return function (e) {
					var box = e.target.getBoundingClientRect(),
						res = isGreaterEq(partial(subtract, e.clientX, box.left), partial(getThreshold, box.right, box.left)); //return e.clientX-box.left > (box.right-box.left)/2;
					return res;
				};
			}(divideBy(2), subtract, greaterOrEqual);
			return function (e) {
				return best(function (agg) {
					return agg[0](e);
				}, [
					[getLoc, forward],
					[always(true), back]
				]);
			};
		},
		//myconsole = thrice(caller)('log')(console),
		doParse = compose(zero, parser),
		setCap = compose(quart(function (o, v, k, p) {
			return o[p](k, v);
		})('slice')(0)(-4), decodeURIComponent, doParse),
		setCaption = setCap.wrap(function (f, str) {
			var res = f(str);
			return res.match(/^Is\s.+/i) ? res + '?' : res;
		}),
		imgs = _toConsumableArray(document.images).slice(0, -1),
		//kitchener
		gallery = document.querySelector('.gallery'),
		getSlideChild = compose(getChild, $$('slide')),
		getBaseChild = compose(getChild, $$('base')),
		getImgSrc = compose(driller(['src']), getBaseChild),
		buttons_cb = function buttons_cb(str) {
			var el = anCr($('controls'))('button');
			[
				["innerHTML", str],
				["id", str]
			].forEach(function (_ref) {
				var _ref2 = _slicedToArray(_ref, 2),
					k = _ref2[0],
					v = _ref2[1];
				return el[k] = v;
			});
			return el;
		},
		close_cb = function close_cb(ancr) {
			return ancr; //return compose(thrice(doMap)('class')('contain'), thrice(doMap)('src')('poppy.png'), anCr(ancr))('img');
		},
		close_aside = function close_aside() {
			return compose(thrice(doMap)('id')('close'), anCrIn(gallery, document.querySelector('main')))('aside');
		},
		films = new LoopIterator(Group.from(imgs.map(function (img) {
			return img.src;
		}))),
		setindex = thrice(caller)('find')(films),
		nextcaller = thricedefer(function (v, o, p) {
			return o[p]()[v];
		})('next')(films)('value'),
		prevcaller = thricedefer(function (v, o, p) {
			return o[p]()[v];
		})('previous')(films)('value'),
		showtime = curryLeftDefer(enable, 'showtime'),
		playtime = curryLeftDefer(enable, 'inplay'),
		exitplay = curryLeftDefer(disable, 'inplay'),
		exitshow = curryLeftDefer(disable, 'showtime'),
		setCaptionOn = compose(thrice(lazyVal)('txt')($$('caption')), setCaption),
		setCaptionOnWrap = setCaptionOn.wrap(function (f, img) {
			f(img.src);
			return img;
		}),
		observers = [thrice(lazyVal)('txt')($$('caption')), thrice(lazyVal)('href')($$('base'))],
		publish = defercall('forEach')(observers)(function (ptl, i) {
			var val = i ? getImgSrc() : compose(setCaption, getImgSrc);
			return ptl(val);
		}),
		orient = function orient(l, p) {
			return function (img) {
				best(partial(gtEq, getResult(img).clientWidth, getResult(img).clientHeight), [l, p])();
				return img.src;
			};
		},
		loader = function loader(caller, id) {
			return loadImage(caller, id).catch(function (error) {
				return console.error(error);
			});
		},
		locate = eventing('click', function (e) {
			locator(twicedefer(loader)('base')(nextcaller), twicedefer(loader)('base')(prevcaller))(e)[1]();
			orient(lcsp, ptrt)(e.target);
			publish();
		}, gallery),
		doOpacity = function doOpacity(flag) {
			var style,
				slide = $('slide'),
				val;
			if (slide) {
				val = flag ? 1 : recur.i / 100;
				style = new Map([
					['opacity', val]
				]);
				doMap(slide, new Map([
					['style', [style]]
				]));
			}
		},
		recur = function (l, p) {
			function doBase() {
				loader(films.play.bind(films), 'base').then(paint).then(setPlayer);
			}

			function doSlide() {
				loader(compose(driller(['src']), getChild, $$('base')), 'slide').then(setCaptionOnWrap).then(doFormat);
			}

			function doRecur() {
				player.inc();
				recur.t = window.requestAnimationFrame(recur);
			}
			var doFormat = function doFormat(img) {
					return best(partial(gtEq, img.width, img.height), [l, p])();
				},
				test = function test() {
					return [getBaseChild(), getSlideChild()].map(function (img) {
						return img.width > img.height;
					});
				},
				paint = function paint(str) {
					var coll = test(),
						bool = coll[0] === coll[1],
						m = bool ? 'remove' : 'add';
					document.body.classList[m]('swap');
					return !bool;
				},
				playmaker = function () {
					var fadeOut = {
							validate: function validate() {
								return recur.i <= -81;
							},
							inc: function inc() {
								return recur.i -= 1;
							},
							reset: function reset() {
								doSlide();
								setPlayer(document.body.classList.contains('swap'));
							}
						},
						fadeIn = {
							validate: function validate() {
								return recur.i >= 300;
							},
							inc: function inc() {
								return recur.i += 1;
							},
							reset: function reset() {
								doBase();
							}
						},
						fade = {
							validate: function validate() {
								return recur.i <= -1;
							},
							inc: function inc() {
								return recur.i -= 1;
							},
							reset: function reset() {
								recur.i = 360;
								doSlide();
								doOpacity();
								doBase();
							}
						},
						actions = [fadeIn, fadeOut];
					return function (flag) {
						return flag ? actions.reverse()[0] : fade;
					};
				}(),
				setPlayer = function setPlayer(arg) {
					player = playmaker(arg);
					recur();
				},
				player = playmaker();
			return function () {
				if (!recur.t) {
					//initial
					//swap next image into base because initial pic is a duplicate
					loader(films.play.bind(films), 'base');
				}
				if (player.validate()) {
					player.reset();
				} else {
					doOpacity();
					doRecur();
				}
			};
		}(lcsp, ptrt),
		clear = function clear(flag) {
			doOpacity(flag);
			window.cancelAnimationFrame(recur.t);
			recur.t = null;
		},
		machBase = function machBase(source, target) {
			return new Promise(function (resolve, reject) {
				var el = anCr($q('.gallery'))('a'),
					img = anCr(el)('img'),
					ptL = partial(doMap, el);
				[
					['href', doParse(source.src)],
					['id', target]
				].forEach(function (_ref3) {
					var _ref4 = _slicedToArray(_ref3, 2),
						k = _ref4[0],
						v = _ref4[1];
					return ptL(v, k);
				});
				img.addEventListener('load', function (e) {
					return resolve(img);
				});
				img.src = doParse(el.href);
			});
		},
		factory = function factory() {
			var playbutton = thricedefer(doMap)('txt')('play')($('play')),
				pausebutton = thricedefer(doMap)('txt')('pause')($('play')),
				removePause = compose(removeNodeOnComplete, $$('pause')),
				removeSlide = compose(removeNodeOnComplete, $$('slide')),
				removal = defercall('forEach')([removePause, removeSlide])(getResult),
				doButton = defer_once(doAlt)([playbutton, pausebutton]),
				doSlide = defer_once(doAlt)([clear, recur]),
				doDisplay = defer_once(doAlt)([playtime]),
				machSlide = function machSlide(source, target) {
					return new Promise(function (resolve, reject) {
						var el = anCr($q('.gallery'))('a'),
							img = anCr(el)('img'),
							ptL = partial(doMap, el);
						[
							['href', doParse($(source).href)],
							['id', target]
						].forEach(function (_ref5) {
							var _ref6 = _slicedToArray(_ref5, 2),
								k = _ref6[0],
								v = _ref6[1];
							return ptL(v, k);
						});
						img.addEventListener('load', function (e) {
							return resolve(img);
						});
						img.src = doParse(el.href);
					});
				},
				machPause = function machPause(src) {
					return new Promise(function (resolve, reject) {
						var el = anCr($q('.gallery'))('a'),
							img = anCr(el)('img'),
							ptL = partial(doMap, el),
							styleAttrs = new Map([
								["opacity", .5]
							]);
						[
							['id', 'pause'],
							['style', [styleAttrs]]
						].forEach(function (_ref7) {
							var _ref8 = _slicedToArray(_ref7, 2),
								k = _ref8[0],
								v = _ref8[1];
							return ptL(v, k);
						});
						img.addEventListener('load', function (e) {
							return resolve(img);
						});
						img.src = doParse(src);
						img.id = "pauser";
					});
				},
				unpauser = function unpauser() {
					machPause('pause.png').then(function (el) {
						eventing('click', invoke_player, el).render();
					});
				},
				doPause = defer_once(doAlt)([partial(doWhen, $$('slide'), unpauser), removePause]),
				setOrient = partial(orient(lcsp, ptrt), $$('base')),
				relocate = curryLeftDefer(caller, null, locate, 'render'),
				doReLocate = curryLeftDefer(doWhen, $$('slide'), relocate),
				invoke_player = defercall('forEach')([doSlide, doButton, doDisplay, doPause])(getResult),
				next_driver = defercall('forEach')([defer_once(clear)(true), twicedefer(loader)('base')(nextcaller), playbutton('play'), exitplay, doReLocate, setOrient, publish, removal])(getResult),
				prev_driver = defercall('forEach')([defer_once(clear)(true), twicedefer(loader)('base')(prevcaller), playbutton('play'), exitplay, doReLocate, setOrient, publish, removal])(getResult),
				pauser = function pauser() {
					if (!$('slide')) {
						machSlide('base', 'slide').then(function (el) {
							eventing('click', invoke_player, el).render();
							locate.unrender();
						});
					}
				},
				COR = function COR(predicate, action) {
					return {
						setSuccessor: function setSuccessor(s) {
							this.successor = s;
						},
						handle: function handle() {
							if (predicate.apply(this, arguments)) {
								return action.apply(this, arguments);
							} else if (this.successor) {
								return this.successor.handle.apply(this.successor, arguments);
							}
						},
						validate: function validate(str) {
							if (document.querySelector('.inplay') && recur.t && predicate(str)) {
								//return fresh instance on exiting slideshow IF in play mode
								return factory();
							}
							return this;
						}
					};
				},
				mynext = COR(partial(invoke, equals, 'next'), next_driver),
				myprev = COR(partial(invoke, equals, 'previous'), prev_driver),
				listen,
				myplayer = COR(function () {
					pauser();
					return true;
				}, invoke_player);
			myplayer.validate = function () {
				return this;
			};
			mynext.setSuccessor(myprev);
			myprev.setSuccessor(myplayer);
			recur.i = 300;
			return mynext;
		},
		setup = eventing('click', function (e) {
			if (!node_from_target(e).match(/img/i)) {
				return;
			}
			compose(setindex, driller(['target', 'src']))(e);
			compose(thrice(doMap)('id')('caption'), anCr(document.querySelector('main')))('aside');
			compose(thrice(doMap)('id')('controls'), anCr(document.querySelector('main')))('section');
			machBase(e.target, 'base').then(orient(lcsp, ptrt)).then(function (v) {
				return thrice(doMap)('txt')(setCaption(v))($$('caption'));
			}).then(showtime);
			var buttons = ['previous', 'play', 'next'].map(buttons_cb),
				chain = factory(),
				controls = eventing('click', function (e) {
					var str = text_from_target(e),
						node = node_from_target(e);
					if (node.match(/button/i)) {
						//!!REPLACE the original chain reference, validate will return either the original or brand new instance
						chain = chain.validate(str);
						chain.handle(str);
					}
				}, $('controls')),
				exit = eventing('click', function (e) {
					chain = chain.validate('next');
					chain.handle('next');
					exitshow();
					[this, $('caption'), $('controls'), $('base'), $('slide')].forEach(removeNodeOnComplete);
					locate.unrender();
					setup.render();
				}, compose(close_cb, close_aside)); //listeners...
			[controls, exit, locate].forEach(function (o) {
				return o.render();
			});
			setup.unrender();
		}, gallery);
	setup.render();
	/*
	var x = partial(invoke, gtEq);
	console.log(x(...[22,22]));
	//console.log(x.apply(null,[22,5]));
	*/
})();