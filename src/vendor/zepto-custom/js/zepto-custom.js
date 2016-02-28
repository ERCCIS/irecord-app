define(['zepto', 'deferred'], function($, Deferred) {
// Zepto fx.js
// (c) 2010-2016 Thomas Fuchs
// Zepto.js may be freely distributed under the MIT license.

// Zepto fx_methods.js
// (c) 2010-2016 Thomas Fuchs
// Zepto.js may be freely distributed under the MIT license.
  !function(n,t){function i(n){return n.replace(/([a-z])([A-Z])/,"$1-$2").toLowerCase()}function e(n){return s?s+n:n.toLowerCase()}var s,o,a,r,f,c,u,l,d,h,p="",m={Webkit:"webkit",Moz:"",O:"o"},y=document.createElement("div"),g=/^((translate|rotate|scale)(X|Y|Z|3d)?|matrix(3d)?|perspective|skew(X|Y)?)$/i,w={};n.each(m,function(n,i){return y.style[n+"TransitionProperty"]!==t?(p="-"+n.toLowerCase()+"-",s=i,!1):void 0}),o=p+"transform",w[a=p+"transition-property"]=w[r=p+"transition-duration"]=w[c=p+"transition-delay"]=w[f=p+"transition-timing-function"]=w[u=p+"animation-name"]=w[l=p+"animation-duration"]=w[h=p+"animation-delay"]=w[d=p+"animation-timing-function"]="",n.fx={off:s===t&&y.style.transitionProperty===t,speeds:{_default:400,fast:200,slow:600},cssPrefix:p,transitionEnd:e("TransitionEnd"),animationEnd:e("AnimationEnd")},n.fn.animate=function(i,e,s,o,a){return n.isFunction(e)&&(o=e,s=t,e=t),n.isFunction(s)&&(o=s,s=t),n.isPlainObject(e)&&(s=e.easing,o=e.complete,a=e.delay,e=e.duration),e&&(e=("number"==typeof e?e:n.fx.speeds[e]||n.fx.speeds._default)/1e3),a&&(a=parseFloat(a)/1e3),this.anim(i,e,s,o,a)},n.fn.anim=function(e,s,p,m,y){var x,v,b,E={},T="",P=this,$=n.fx.transitionEnd,L=!1;if(s===t&&(s=n.fx.speeds._default/1e3),y===t&&(y=0),n.fx.off&&(s=0),"string"==typeof e)E[u]=e,E[l]=s+"s",E[h]=y+"s",E[d]=p||"linear",$=n.fx.animationEnd;else{v=[];for(x in e)g.test(x)?T+=x+"("+e[x]+") ":(E[x]=e[x],v.push(i(x)));T&&(E[o]=T,v.push(o)),s>0&&"object"==typeof e&&(E[a]=v.join(", "),E[r]=s+"s",E[c]=y+"s",E[f]=p||"linear")}return b=function(t){if("undefined"!=typeof t){if(t.target!==t.currentTarget)return;n(t.target).unbind($,b)}else n(this).unbind($,b);L=!0,n(this).css(w),m&&m.call(this)},s>0&&(this.bind($,b),setTimeout(function(){L||b.call(P)},1e3*(s+y)+25)),this.size()&&this.get(0).clientLeft,this.css(E),0>=s&&setTimeout(function(){P.each(function(){b.call(this)})},0),this},y=null}($),function(n,t){function i(i,e,s,o,a){"function"!=typeof e||a||(a=e,e=t);var r={opacity:s};return o&&(r.scale=o,i.css(n.fx.cssPrefix+"transform-origin","0 0")),i.animate(r,e,null,a)}function e(t,e,s,o){return i(t,e,0,s,function(){a.call(n(this)),o&&o.call(this)})}var s=window.document,o=(s.documentElement,n.fn.show),a=n.fn.hide,r=n.fn.toggle;n.fn.show=function(n,e){return o.call(this),n===t?n=0:this.css("opacity",0),i(this,n,1,"1,1",e)},n.fn.hide=function(n,i){return n===t?a.call(this):e(this,n,"0,0",i)},n.fn.toggle=function(i,e){return i===t||"boolean"==typeof i?r.call(this,i):this.each(function(){var t=n(this);t["none"==t.css("display")?"show":"hide"](i,e)})},n.fn.fadeTo=function(n,t,e){return i(this,n,t,null,e)},n.fn.fadeIn=function(n,t){var i=this.css("opacity");return i>0?this.css("opacity",0):i=1,o.call(this).fadeTo(n,i,t)},n.fn.fadeOut=function(n,t){return e(this,n,null,t)},n.fn.fadeToggle=function(t,i){return this.each(function(){var e=n(this);e[0==e.css("opacity")||"none"==e.css("display")?"fadeIn":"fadeOut"](t,i)})}}($);
//
//// Zepto.js data.js
//// (c) 2010-2016 Thomas Fuchs
//// Zepto.js may be freely distributed under the MIT license.
//  !function(n){function t(t,i){var f=t[u],c=f&&a[f];if(void 0===i)return c||e(t);if(c){if(i in c)return c[i];var h=o(i);if(h in c)return c[h]}return r.call(n(t),i)}function e(t,e,r){var f=t[u]||(t[u]=++n.uuid),c=a[f]||(a[f]=i(t));return void 0!==e&&(c[o(e)]=r),c}function i(t){var e={};return n.each(t.attributes||f,function(t,i){0==i.name.indexOf("data-")&&(e[o(i.name.replace("data-",""))]=n.zepto.deserializeValue(i.value))}),e}var a={},r=n.fn.data,o=n.camelCase,u=n.expando="Zepto"+ +new Date,f=[];n.fn.data=function(i,a){return void 0===a?n.isPlainObject(i)?this.each(function(t,a){n.each(i,function(n,t){e(a,n,t)})}):0 in this?t(this[0],i):void 0:this.each(function(){e(this,i,a)})},n.fn.removeData=function(t){return"string"==typeof t&&(t=t.split(/\s+/)),this.each(function(){var e=this[u],i=e&&a[e];i&&n.each(t||i,function(n){delete i[t?o(this):n]})})},["remove","empty"].forEach(function(t){var e=n.fn[t];n.fn[t]=function(){var n=this.find("*");return"remove"===t&&(n=n.add(this)),n.removeData(),e.call(this)}})}(Zepto);
//
//  $.data = function (element, key, val) {
//    if (!val) {
//      return $(element).data(key);
//    }
//
//    return $(element).data(key, val);
//  };

  return $;
});