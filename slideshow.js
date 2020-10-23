(function() {
	"use strict";
	var maker = (function(flag) {
		var fadeOut = {
				validate: () => recur.i <= -51,
				inc: () => recur.i -= 1
			},
			fadeIn = {
				validate: () => recur.i >= 200,
				inc: () => recur.i += 1
			},
			actions = [fadeIn, fadeOut];
		return function() {
			return actions.reverse()[0];
		};
	}());

	function noOp() {
		return function() {};
	}

	function identity(arg) {
		return arg;
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

	function wrap(wrapper, ...argz) {
		var method = this;
		return function(...args) {
			if (wrapper) {
				return wrapper.apply(this, [method.bind(this)].concat(argz).concat(args));
			}
		}
	}
	Function.prototype.wrap = wrap;

	function attrMap(el, map, style) {
		for (let [k, v] of map) {
			if (Array.isArray(v)) {
				v.forEach(prop => {
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
		return el;
	}
	/* EXPECTS VALUE BEFORE KEY ON RIGHT CURRY*/
	function doMap(el, v, k) {
        var arg = v instanceof Map ? v : new Map([
			[k, v]
		]);
        /*
		return attrMap(getResult(el), new Map([
			[k, v]
		]));
        */
        return attrMap(getResult(el), arg);
	}

	function invoke(f, ...args) {
		return f.apply(null, args.map(getResult));
	}

	function lazyVal(v, el, k) {
		return invoke(doMap, el, v, k);
	}

	function loadImage(url, id) {
		return new Promise((resolve, reject) => {
			//dirty way of avoiding adding listener twice 
			let img = $(id).firstChild;
			img = removeElement(img);
			$(id).appendChild(img);
			img.addEventListener('load', e => resolve(img));
			img.addEventListener('error', () => {
				reject(new Error(`Failed to load image's URL: ${url()}`));
			});
			img.src = doParse(url());
		});
	}

	function cat(first, ...rest) {
		if (existy(first)) {
			return first.concat.apply(first, rest);
		} else {
			return [];
		}
	}

	function construct(head, ...tail) {
		return head && cat([head], tail);
	}

	function dispatch(...funcs) {
		var size = funcs.length;
		return function(tgt, ...rest) {
			var ret,
				fn;
			for (fn of funcs) {
				try {
					ret = fn.apply(null, construct(tgt, rest));
					if (existy(ret)) {
						return ret;
					}
				} finally {
					noOp();
				}
			}
			return ret;
		};
	}

	function searcher(obj, ary) {
		/*noticed an issue with parentNode where on supply of an element, the initial value for reduce is the parent
		but THAT parent would get set on the second iteration to ITS parent so. When array has just one item reduce not really required*/
		if (ary && ary[1]) {
			return ary.reduce((acc, cur) => {
				return acc[cur] ? acc[cur] : acc;
			}, obj[ary[0]]);
		}
		return ary[0] ? obj[ary[0]] : obj;
	}
	//note a function that ignores any state of x or y will return the first element if true and last if false
	function best(fun, coll) {
		return [...coll].reduce((champ, contender) => fun(champ, contender) ? champ : contender);
	}

	function composeES5() {
		for (var _len = arguments.length, fns = new Array(_len), _key = 0; _key < _len; _key++) {
			fns[_key] = arguments[_key];
		}
		return fns.reduce(function(f, g) {
			//anon is the iteratee
			return function anon() {
				//expects arguments to first function
				return f(g.apply(void 0, arguments)); //SETS THE NEW f AND g
			};
		});
	}
	//simple version that simply expects the remainder of the arguments on the second call
	function partial(func, ...args) {
		return function(...rest) {
			return func.apply(null, args.concat(rest));
		}
	}

	function negate(predicate) {
		return function() {
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
	class Group {
		constructor() {
			this.members = [];
		}
		add(value) {
			if (!this.has(value)) {
				this.members.push(value);
			}
		}
		delete(value) {
			this.members = this.members.filter(v => v !== value);
		}
		has(value) {
			return this.members.includes(value);
		}
		static from(collection) {
			let group = new Group;
			for (let value of collection) {
				group.add(value);
			}
			return group;
		}
	}
	class LoopIterator {
		constructor(group) {
			this.group = group;
			this.position = 0;
			this.rev = false;
		}
		next(flag) {
			if (!flag && this.rev) {
				return this.previous(true);
			}
			//this.position += 1;
			this.position++;
			this.position = this.position % this.group.members.length;
			let result = {
				value: this.group.members[this.position],
				index: this.position
			};
			return result;
		}
		previous(flag) {
			if (!this.rev || flag) {
				this.group.members = this.group.members.reverse();
				this.position = this.group.members.length - 1 - (this.position);
				this.position = this.position % this.group.members.length;
				this.rev = !this.rev;
				return this.next(this.rev);
			} else {
				return this.next(this.rev);
			}
		}
		current() {
			let result = {
				value: this.group.members[this.position],
				index: this.position
			};
			return result;
		}
		play() {
			return this.next(true).value;
		}
		find(tgt) {
			this.position = this.group.members.findIndex(m => m === tgt);
			let result = {
				value: this.group.members[this.position],
				index: this.position
			};
			return result;
		}
	}
	//https://medium.com/@dtipson/creating-an-es6ish-compose-in-javascript-ac580b95104a
	const eventing = function(type, fn, el, actions = ['preventDefault']) {
		function preventer(wrapped, actions, e) {
			actions.forEach(a => e[a]());
			return wrapped(e);
		}
		fn = fn.wrap(preventer, actions);
		el = getResult(el);
		return {
			render: function() {
				el.addEventListener(type, fn, false);
				return this;
			},
			unrender: function() {
				el.removeEventListener(type, fn, false);
				return this;
			}
		};
	},
          compose = (...fns) => fns.reduce((f, g) => (...args) => f(g(...args))),
		//https://tech.mybuilder.com/partial-application-currying-and-composition-using-javascript-es6/
		curryLeft = (fn, ...args) => {
			let _curry = (args) => args.length < fn.length ? (..._args) => _curry([...args, ..._args]) : fn(...args);
			return _curry(args);
		},
		curryLeftDefer = (fn, ...args) => {
			let _curry = (args) => args.length < fn.length ? (..._args) => _curry([...args, ..._args]) : fn(...args);
			return () => _curry(args);
		},
		always = (arg) => () => arg,
		validateProperty = (o, p) => o & o[p],
		equals = (a, b) => a === b,
		greaterOrEqual = (invoke, (a, b) => a >= b),
		gtEq = curryLeft((a, b) => a >= b),
		doAlt = actions => actions.reverse()[0](),
		defer_once = (f) => (arg) => () => f(arg),
		twice = (f) => (arg1) => (arg2) => f(arg2, arg1),
		twicedefer = (f) => (arg1) => (arg2) => () => f(arg2, arg1),
		thricedefer = (f) => (arg1) => (arg2) => (arg3) => () => f(arg3, arg2, arg1),
		quart = (f) => (arg1) => (arg2) => (arg3) => (arg4) => f(arg4, arg3, arg2, arg1),
		thrice = (f) => (arg1) => (arg2) => (arg3) => f(arg3, arg2, arg1),
		driller = twice(searcher),
		getter = (o, p) => o[p],
		zero = twice(getter)(0),
		setter = thrice((v, o, p) => {
			o[p] = v;
		}),
		caller = (v, o, p) => o[p](v),
		defercall = thricedefer(caller),
		parser = thrice((o, v, p) => o[p](v))('match')(/[^\/]+\.(jpg|png)$/),
		add = (a, b) => a + b,
		subtract = (a, b) => a - b,
		divideBy = twice((a, b) => a / b),
		$ = thrice(caller)('getElementById')(document),
		$$ = thricedefer(caller)('getElementById')(document),
		enable = document.body.classList.add.bind(document.body.classList),
		disable = document.body.classList.remove.bind(document.body.classList),
		lcsp = curryLeftDefer(enable, 'lscp'),
		ptrt = curryLeftDefer(disable, 'lscp'),
		target = twice(getter)('target'),
		text_target = twice(getter)('innerHTML'),
		node_target = twice(getter)('nodeName'),
		text_from_target = thrice((e, s, g) => s(g(e)))(target)(text_target),
		node_from_target = thrice((e, s, g) => s(g(e)))(target)(node_target),
		getChild = compose(getNextElement, driller(['firstChild'])),
		getNewElement = dispatch(document.createElement.bind(document), twice(cloneNode)(true), document.createDocumentFragment.bind(document)),
		setAnchor = (function(render) {
			return function(anchor, refnode, strategy) {
				return compose(partial(partial(invoke, render), anchor, refnode), strategy);
			};
		}((anc, ref, el) => anc.insertBefore(el, ref))),
		append = function(flag) {
			if (flag) {
				return thricedefer(setAnchor)(getNewElement)(null);
			}
			return thrice(setAnchor)(getNewElement)(null);
		},
		insert = function(flag) {
			if (flag) {
				return function(ref, anc) {
					return thricedefer(setAnchor)(getNewElement)(ref)(anc);
				};
			}
			return function(ref, anc) {
				return thrice(setAnchor)(getNewElement)(ref)(anc);
			};
		},
		anCr = append(),
		anCrIn = insert(),
		removeNodeOnComplete = removeElement.wrap(function(f, node) {
			if (validateRemove(node)) {
				return f(node);
			}
		}),
		locator = function(forward, back) {
			var getLoc = (function(div, subtract, isGreaterEq) {
				var getThreshold = compose(div, subtract);
				return function(e) {
					var box = e.target.getBoundingClientRect();
					return isGreaterEq(partial(subtract, e.clientX, box.left), partial(getThreshold, box.right, box.left));
				};
			}(divideBy(2), subtract, greaterOrEqual));
			return function(e) {
				return best(function(agg) {
					return agg[0](e);
				}, [
					[getLoc, forward],
					[always(true), back]
				]);
			};
		},
		myconsole = thrice(caller)('log')(console),
		doParse = compose(zero, parser),
		setCaption = compose(quart((o, v, k, p) => o[p](k, v))('slice')(0)(-4), decodeURIComponent, doParse),
		imgs = [...document.images],
		gallery = document.querySelector('#gallery'),
		getSlideChild = compose(getChild, $$('slide')),
		getBaseChild = compose(getChild, $$('base')),
		getImgSrc = compose(driller(['src']), getBaseChild),
		buttons_cb = (str) => {
			var el = anCr($('controls'))('button');
			[
				["innerHTML", str],
				["id", str]
			].forEach(([k, v]) => el[k] = v);
			return el;
		},
		close_cb = function(ancr) {
			var el = anCr(ancr)('button');
			el.innerHTML = 'close';
			return el;
		},
		close_aside = function() {
			return anCrIn(gallery, document.body)('aside');
		},
		films = new LoopIterator(Group.from(imgs.map(img => img.src))),
		setindex = thrice(caller)('find')(films),
		nextcaller = thricedefer((v, o, p) => o[p]()[v])('next')(films)('value'),
		prevcaller = thricedefer((v, o, p) => o[p]()[v])('previous')(films)('value'),
		showtime = curryLeftDefer(enable, 'showtime'),
		playtime = curryLeftDefer(enable, 'inplay'),
		exitplay = curryLeftDefer(disable, 'inplay'),
		exitshow = curryLeftDefer(disable, 'showtime'),
        setCaptionOn = compose(thrice(lazyVal)('txt')($$('caption')), setCaption),
        setCaptionOnWrap = setCaptionOn.wrap((f,img) => {
              f(img.src);
              return img;
          }),
		observers = [thrice(lazyVal)('txt')($$('caption')), thrice(lazyVal)('href')($$('base'))],
		publish = defercall('forEach')(observers)(function(ptl, i) {
			var val = i ? getImgSrc() : compose(setCaption, getImgSrc);
			return ptl(val);
		}),
		orient = function(l, p) {
			return function(img) {
				best(partial(gtEq, getResult(img).clientWidth, getResult(img).clientHeight), [l, p])();
				return img.src;
			};
		},
		loader = function(caller, id) {
			return loadImage(caller, id).catch(error => console.error(error))
		},
		locate = eventing('click', function(e) {
			locator(twicedefer(loader)('base')(nextcaller), twicedefer(loader)('base')(prevcaller))(e)[1]();
			orient(lcsp, ptrt)(e.target);
			publish();
		}, gallery),
		recur = (function(l, p) {
			var player = maker(),
				cb = (img) => best(partial(gtEq, img.width, img.height), [l, p])();
			return function() {
				if (!recur.t) {
					//swap next image into base because initial pic is a duplicate
					loader(films.play.bind(films), 'base');
				}
				if (player.validate()) {
					if (recur.i <= 0) {
						loader(compose(driller(['src']), getChild, $$('base')), 'slide').then(setCaptionOnWrap).then(cb);
                        /*function(img){
                            setCaptionOn(img.src);
                            return img;
                        }*/
						loader(films.play.bind(films), 'base');
					}
					player = maker();
					recur();
				} else {
					if ($('slide')) {
						var style = new Map([
							['opacity', recur.i / 100]
						]);
                        doMap($('slide'), new Map([
							['style', [style]]
						]));
					}
					player.inc();
					recur.t = window.requestAnimationFrame(recur);
				}
			};
		}(lcsp, ptrt)),
		clear = function(flag) {
			if ($('slide')) {
				var val = flag ? 1 : recur.i / 100,
					style = new Map([
						['opacity', val]
					]);
				 doMap($('slide'), new Map([
                     ['style', [style]]
						]));
			}
			window.cancelAnimationFrame(recur.t);
			recur.t = null;
		},
		machBase = function(source, target) {
			return new Promise((resolve, reject) => {
				var el = anCr($('gallery'))('a'),
					img = anCr(el)('img'),
					ptL = partial(doMap, el);
				[
					['href', doParse(source.src)],
					['id', target]
				].forEach(([k, v]) => ptL(v, k));
				img.addEventListener('load', e => resolve(img));
				img.src = doParse(el.href);
			});
		},
		factory = function() {
			let playbutton = thricedefer(doMap)('txt')('play')($('play')),
				pausebutton = thricedefer(doMap)('txt')('pause')($('play')),
                removePause = compose(removeNodeOnComplete, $$('pause')),
				removeSlide = compose(removeNodeOnComplete, $$('slide')),
				removal = defercall('forEach')([removePause, removeSlide])(getResult),
				doButton = defer_once(doAlt)([playbutton, pausebutton]),
				doSlide = defer_once(doAlt)([clear, recur]),
				doDisplay = defer_once(doAlt)([playtime]),
				machSlide = function(source, target) {
					return new Promise((resolve, reject) => {
						var el = anCr($('gallery'))('a'),
							img = anCr(el)('img'),
							ptL = partial(doMap, el);
						[
							['href', doParse($(source).href)],
							['id', target]
						].forEach(([k, v]) => ptL(v, k));
						img.addEventListener('load', e => resolve(img));
						img.src = doParse(el.href);
					});
				},
				machPause = function(src) {
					return new Promise((resolve, reject) => {
						var el = anCr($('gallery'))('a'),
							img = anCr(el)('img'),
							ptL = partial(doMap, el),
							styleAttrs = new Map([
								["opacity", .5]
							]);
						[
							['id', 'pause'],
							['style', [styleAttrs]]
						].forEach(([k, v]) => ptL(v, k));
                        
						img.addEventListener('load', e => resolve(img));
						img.src = doParse(src);
					});
				},
				unpauser = function() {
					machPause('pause.png').then(el => {
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
				pauser = function() {
					if (!$('slide')) {
						machSlide('base', 'slide').then(el => {
							eventing('click', invoke_player, el).render();
							locate.unrender();
						});
					}
				},
				COR = function(predicate, action) {
					return {
						setSuccessor: function(s) {
							this.successor = s;
						},
						handle: function() {
							if (predicate.apply(this, arguments)) {
								return action.apply(this, arguments);
							} else if (this.successor) {
								return this.successor.handle.apply(this.successor, arguments);
							}
						},
						validate: function(str) {
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
				myplayer = COR(function() {
					pauser();
					return true;
				}, invoke_player);
			myplayer.validate = function() {
				return this;
			};
			mynext.setSuccessor(myprev);
			myprev.setSuccessor(myplayer);
			recur.i = 300;
			return mynext;
		},
		setup = eventing('click', function(e) {
			if (!node_from_target(e).match(/img/i)) {
				return;
			}
			compose(setindex, driller(['target', 'src']))(e);
			compose(thrice(doMap)('id')('controls'), anCrIn(getNextElement(gallery.nextSibling), document.body))('section');
			compose(thrice(doMap)('id')('caption'), anCrIn(getNextElement(gallery.nextSibling), document.body))('aside');
			machBase(e.target, 'base').then(orient(lcsp, ptrt)).then((v) => thrice(doMap)('txt')(setCaption(v))($$('caption'))).then(showtime);
			let buttons = ['previous', 'play', 'next'].map(buttons_cb),
				chain = factory(),
				controls = eventing('click', function(e) {
					let str = text_from_target(e),
						node = node_from_target(e);
					if (node.match(/button/i)) {
						//!!REPLACE the original chain reference, validate will return either the original or brand new instance
						chain = chain.validate(str);
						chain.handle(str);
					}
				}, $('controls')),
				exit = eventing('click', function(e) {
					chain = chain.validate('next');
					chain.handle('next');
					exitshow();
					[this, $('controls'), $('base'), $('slide')].forEach(removeNodeOnComplete);
					locate.unrender();
					setup.render();
				}, compose(close_cb, close_aside));
			//listeners...
			[controls, exit, locate].forEach(o => o.render());
			setup.unrender();
		}, gallery);
	setup.render();
}());