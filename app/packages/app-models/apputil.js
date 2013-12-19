Apputil = {
  TwoIndex: TwoIndex,

  inspect: function (o) {
    return inspect(o, 4).toString();
  },

  regexEscape: function (s) {
    return s.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
  },

  niceFilename: function (name) {
    return name.toLowerCase().replace(/[^a-zA-Z0-9-]+/g,'-');
  },

  intersectp: function (list1, list2) {
    var set = {};
    for(var i=0;i < list1.length;++i) {
      set[list1[i]]=true;
    }

    for(var i=0;i < list2.length;++i) {
      if (list2[i] in set) return true;
    }
    return false;
  },

  colorOnLight: function (color) {
    var lab = d3.lab(color);

    if (lab.l < 60)
      return color;

    lab.l = 60;
    return lab.toString();
  },

  colorClass: function (color) {
    color = d3.lab(color);
    var l = color.l;

    if (l < 50) {
      color = 'dark';
    } else {
      color = 'light';
    }
    if (l <= 20 || l >= 75) color = 'very ' + color;

    return color;
  },

  contrastColor: function (color,dark,light) {
    color = d3.lab(color);
    dark = dark ? d3.lab(dark) : d3.lab(20, color.a, color.b);
    light = light ? d3.lab(light) : d3.lab(85, dark.a, dark.b);

    var l = color.l;

    if (l < 50) {
      color = light;
      if (l > 20) color.l = 99;
    } else {
      color = dark;
      if (l < 75) color.l = 1;
    }
    return color.toString();
  },

  fade: function (color, amount) {
    var match = /^#(..)(..)(..)$/.exec(color),
        result = 'rgba(';

    for(var i = 1; i<4; ++i) {
      result += parseInt(match[i], 16) + ',';
    }

    return result + (amount/100) + ')';
  },

  humanize: function (name) {
    name = this.uncapitalize(name);
    return name.replace(/[_-]/g,' ').replace(/([A-Z])/g, function (_, m1) {
      return ' '+m1.toLowerCase();
    });
  },

  initials: function (name, count) {
    count = count || 3;

    name = (name || '').split(' ');
    var result = '';
    for(var i=0;count > 1 && i < name.length -1;++i, --count) {
      result += name[i].slice(0,1);
    }
    if (count > 0 && name.length > 0)
      result += name[name.length-1].slice(0,1);

    return result.toUpperCase();
  },

  dasherize: function (name) {
    return this.humanize(name).replace(/[\s_]+/g,'-');
  },

  labelize: function (name) {
    return this.capitalize(this.humanize(name));
  },

  sansId: function (name) {
    return name.replace(/_ids?$/,'');
  },

  capitalize: function (value) {
    if(value == null || value === '')
      return '';

    return value.substring(0,1).toUpperCase() + value.substring(1);
  },

  uncapitalize: function (value) {
    if(value == null || value === '')
      return '';

    return value.substring(0,1).toLowerCase() + value.substring(1);
  },

  titleize: function (value) {
    return this.capitalize(value.replace(/[-._%+A-Z]\w/g, function (w) {
      return ' ' + Apputil.capitalize(w.replace(/^[-._%+]/,''));
    }).trim());
  },

  hashToCss: function (hash) {
    return Object.keys(hash).map(function (key) {
      return key+":"+hash[key];
    }).join(";");
  },

  px: function (value) {
    return Math.round(value)+'px';
  },

  pc: function (value) {
    return Math.round(value*1000000)/10000+'%';
  },

  sansPx: function (value) {
    return value ? typeof value === 'string' ? +value.substring(0, value.length -2) : +value : 0;
  },

  findBy: function (list, value, fieldName) {
    if (!list) return;
    fieldName = fieldName || '_id';
    for(var i=0; i < list.length; ++i) {
      var row = list[i];
      if (row[fieldName] === value)
        return row;
    }
  },

  indexOf: function (list, value, fieldName) {
    if (!list) return;
    fieldName = fieldName || '_id';
    for(var i=0; i < list.length; ++i) {
      var row = list[i];
      if (row[fieldName] === value)
        return i;
    }
    return -1;
  },

  toMap: function (list, keyName, valueName) {
    var result = {};
    if (!list) return result;
    for(var i=0; i < list.length; ++i) {
      if (keyName) {
        result[list[i][keyName]] = ( valueName ?
                                     ( valueName === true ? true : list[i][valueName] ) :
                                     list[i] );
      } else {
        result[list[i]] = true;
      }
    }
    return result;
  },

  mapField: function (list, fieldName) {
    fieldName = fieldName || '_id';
    return list && list.map(function (doc) {
      return doc[fieldName];
    });
  },

  /** Does not deep copy functions */
  deepCopy: function (orig) {
    switch(typeof orig) {
    case 'string':
    case 'number':
    case 'boolean':
    case 'undefined':
    case 'function':
      return orig;
    }

    if (orig === null) return orig;

    switch(Object.prototype.toString.call(orig)) {
    case "[object Date]":
      return new Date(orig);
    case "[object Array]":
      return orig.map(function (item) {
        return Apputil.deepCopy(item);
      });
    }

    var result = {};
    for(var key in orig) {
      result[key] = Apputil.deepCopy(orig[key]);
    }

    return result;
  },

  slice: function (args, from, to) {
    return Array.prototype.slice.call(args, from, to);
  },

  aryEqual: function (a,b) {
    if(a.length !== b.length)
      return false;

    for(var i=0;i < a.length;++i) {
      if(a[i] !== b[i])
        return false;
    }
    return true;
  },

  EMAIL_RE: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,4}$/i,

  parseEmailAddresses: function (input) {
    input = input || "";
    var addresses = [];


    var remainder = input.replace(/([A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,4}|(\w *)+<[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,4}>)[,\s]*/ig, function (_, m1) {
      addresses.push(m1);
      return "";
    });

    return addresses.length > 0 ? {addresses: addresses, remainder: remainder} : null;
  },

  md5sum: function(string) {
	  function RotateLeft(lValue, iShiftBits) {
		  return (lValue<<iShiftBits) | (lValue>>>(32-iShiftBits));
	  }

	  function AddUnsigned(lX,lY) {
		  var lX4,lY4,lX8,lY8,lResult;
		  lX8 = (lX & 0x80000000);
		  lY8 = (lY & 0x80000000);
		  lX4 = (lX & 0x40000000);
		  lY4 = (lY & 0x40000000);
		  lResult = (lX & 0x3FFFFFFF)+(lY & 0x3FFFFFFF);
		  if (lX4 & lY4) {
			  return (lResult ^ 0x80000000 ^ lX8 ^ lY8);
		  }
		  if (lX4 | lY4) {
			  if (lResult & 0x40000000) {
				  return (lResult ^ 0xC0000000 ^ lX8 ^ lY8);
			  } else {
				  return (lResult ^ 0x40000000 ^ lX8 ^ lY8);
			  }
		  } else {
			  return (lResult ^ lX8 ^ lY8);
		  }
 	  }

 	  function F(x,y,z) { return (x & y) | ((~x) & z); }
 	  function G(x,y,z) { return (x & z) | (y & (~z)); }
 	  function H(x,y,z) { return (x ^ y ^ z); }
	  function I(x,y,z) { return (y ^ (x | (~z))); }

	  function FF(a,b,c,d,x,s,ac) {
		  a = AddUnsigned(a, AddUnsigned(AddUnsigned(F(b, c, d), x), ac));
		  return AddUnsigned(RotateLeft(a, s), b);
	  };

	  function GG(a,b,c,d,x,s,ac) {
		  a = AddUnsigned(a, AddUnsigned(AddUnsigned(G(b, c, d), x), ac));
		  return AddUnsigned(RotateLeft(a, s), b);
	  };

	  function HH(a,b,c,d,x,s,ac) {
		  a = AddUnsigned(a, AddUnsigned(AddUnsigned(H(b, c, d), x), ac));
		  return AddUnsigned(RotateLeft(a, s), b);
	  };

	  function II(a,b,c,d,x,s,ac) {
		  a = AddUnsigned(a, AddUnsigned(AddUnsigned(I(b, c, d), x), ac));
		  return AddUnsigned(RotateLeft(a, s), b);
	  };

	  function ConvertToWordArray(string) {
		  var lWordCount;
		  var lMessageLength = string.length;
		  var lNumberOfWords_temp1=lMessageLength + 8;
		  var lNumberOfWords_temp2=(lNumberOfWords_temp1-(lNumberOfWords_temp1 % 64))/64;
		  var lNumberOfWords = (lNumberOfWords_temp2+1)*16;
		  var lWordArray=Array(lNumberOfWords-1);
		  var lBytePosition = 0;
		  var lByteCount = 0;
		  while ( lByteCount < lMessageLength ) {
			  lWordCount = (lByteCount-(lByteCount % 4))/4;
			  lBytePosition = (lByteCount % 4)*8;
			  lWordArray[lWordCount] = (lWordArray[lWordCount] | (string.charCodeAt(lByteCount)<<lBytePosition));
			  lByteCount++;
		  }
		  lWordCount = (lByteCount-(lByteCount % 4))/4;
		  lBytePosition = (lByteCount % 4)*8;
		  lWordArray[lWordCount] = lWordArray[lWordCount] | (0x80<<lBytePosition);
		  lWordArray[lNumberOfWords-2] = lMessageLength<<3;
		  lWordArray[lNumberOfWords-1] = lMessageLength>>>29;
		  return lWordArray;
	  };

	  function WordToHex(lValue) {
		  var WordToHexValue="",WordToHexValue_temp="",lByte,lCount;
		  for (lCount = 0;lCount<=3;lCount++) {
			  lByte = (lValue>>>(lCount*8)) & 255;
			  WordToHexValue_temp = "0" + lByte.toString(16);
			  WordToHexValue = WordToHexValue + WordToHexValue_temp.substr(WordToHexValue_temp.length-2,2);
		  }
		  return WordToHexValue;
	  };

	  function Utf8Encode(string) {
		  string = string.replace(/\r\n/g,"\n");
		  var utftext = "";

		  for (var n = 0; n < string.length; n++) {

			  var c = string.charCodeAt(n);

			  if (c < 128) {
				  utftext += String.fromCharCode(c);
			  }
			  else if((c > 127) && (c < 2048)) {
				  utftext += String.fromCharCode((c >> 6) | 192);
				  utftext += String.fromCharCode((c & 63) | 128);
			  }
			  else {
				  utftext += String.fromCharCode((c >> 12) | 224);
				  utftext += String.fromCharCode(((c >> 6) & 63) | 128);
				  utftext += String.fromCharCode((c & 63) | 128);
			  }

		  }

		  return utftext;
	  };

	  var x=Array();
	  var k,AA,BB,CC,DD,a,b,c,d;
	  var S11=7, S12=12, S13=17, S14=22;
	  var S21=5, S22=9 , S23=14, S24=20;
	  var S31=4, S32=11, S33=16, S34=23;
	  var S41=6, S42=10, S43=15, S44=21;

	  string = Utf8Encode(string);

	  x = ConvertToWordArray(string);

	  a = 0x67452301; b = 0xEFCDAB89; c = 0x98BADCFE; d = 0x10325476;

	  for (k=0;k<x.length;k+=16) {
		  AA=a; BB=b; CC=c; DD=d;
		  a=FF(a,b,c,d,x[k+0], S11,0xD76AA478);
		  d=FF(d,a,b,c,x[k+1], S12,0xE8C7B756);
		  c=FF(c,d,a,b,x[k+2], S13,0x242070DB);
		  b=FF(b,c,d,a,x[k+3], S14,0xC1BDCEEE);
		  a=FF(a,b,c,d,x[k+4], S11,0xF57C0FAF);
		  d=FF(d,a,b,c,x[k+5], S12,0x4787C62A);
		  c=FF(c,d,a,b,x[k+6], S13,0xA8304613);
		  b=FF(b,c,d,a,x[k+7], S14,0xFD469501);
		  a=FF(a,b,c,d,x[k+8], S11,0x698098D8);
		  d=FF(d,a,b,c,x[k+9], S12,0x8B44F7AF);
		  c=FF(c,d,a,b,x[k+10],S13,0xFFFF5BB1);
		  b=FF(b,c,d,a,x[k+11],S14,0x895CD7BE);
		  a=FF(a,b,c,d,x[k+12],S11,0x6B901122);
		  d=FF(d,a,b,c,x[k+13],S12,0xFD987193);
		  c=FF(c,d,a,b,x[k+14],S13,0xA679438E);
		  b=FF(b,c,d,a,x[k+15],S14,0x49B40821);
		  a=GG(a,b,c,d,x[k+1], S21,0xF61E2562);
		  d=GG(d,a,b,c,x[k+6], S22,0xC040B340);
		  c=GG(c,d,a,b,x[k+11],S23,0x265E5A51);
		  b=GG(b,c,d,a,x[k+0], S24,0xE9B6C7AA);
		  a=GG(a,b,c,d,x[k+5], S21,0xD62F105D);
		  d=GG(d,a,b,c,x[k+10],S22,0x2441453);
		  c=GG(c,d,a,b,x[k+15],S23,0xD8A1E681);
		  b=GG(b,c,d,a,x[k+4], S24,0xE7D3FBC8);
		  a=GG(a,b,c,d,x[k+9], S21,0x21E1CDE6);
		  d=GG(d,a,b,c,x[k+14],S22,0xC33707D6);
		  c=GG(c,d,a,b,x[k+3], S23,0xF4D50D87);
		  b=GG(b,c,d,a,x[k+8], S24,0x455A14ED);
		  a=GG(a,b,c,d,x[k+13],S21,0xA9E3E905);
		  d=GG(d,a,b,c,x[k+2], S22,0xFCEFA3F8);
		  c=GG(c,d,a,b,x[k+7], S23,0x676F02D9);
		  b=GG(b,c,d,a,x[k+12],S24,0x8D2A4C8A);
		  a=HH(a,b,c,d,x[k+5], S31,0xFFFA3942);
		  d=HH(d,a,b,c,x[k+8], S32,0x8771F681);
		  c=HH(c,d,a,b,x[k+11],S33,0x6D9D6122);
		  b=HH(b,c,d,a,x[k+14],S34,0xFDE5380C);
		  a=HH(a,b,c,d,x[k+1], S31,0xA4BEEA44);
		  d=HH(d,a,b,c,x[k+4], S32,0x4BDECFA9);
		  c=HH(c,d,a,b,x[k+7], S33,0xF6BB4B60);
		  b=HH(b,c,d,a,x[k+10],S34,0xBEBFBC70);
		  a=HH(a,b,c,d,x[k+13],S31,0x289B7EC6);
		  d=HH(d,a,b,c,x[k+0], S32,0xEAA127FA);
		  c=HH(c,d,a,b,x[k+3], S33,0xD4EF3085);
		  b=HH(b,c,d,a,x[k+6], S34,0x4881D05);
		  a=HH(a,b,c,d,x[k+9], S31,0xD9D4D039);
		  d=HH(d,a,b,c,x[k+12],S32,0xE6DB99E5);
		  c=HH(c,d,a,b,x[k+15],S33,0x1FA27CF8);
		  b=HH(b,c,d,a,x[k+2], S34,0xC4AC5665);
		  a=II(a,b,c,d,x[k+0], S41,0xF4292244);
		  d=II(d,a,b,c,x[k+7], S42,0x432AFF97);
		  c=II(c,d,a,b,x[k+14],S43,0xAB9423A7);
		  b=II(b,c,d,a,x[k+5], S44,0xFC93A039);
		  a=II(a,b,c,d,x[k+12],S41,0x655B59C3);
		  d=II(d,a,b,c,x[k+3], S42,0x8F0CCC92);
		  c=II(c,d,a,b,x[k+10],S43,0xFFEFF47D);
		  b=II(b,c,d,a,x[k+1], S44,0x85845DD1);
		  a=II(a,b,c,d,x[k+8], S41,0x6FA87E4F);
		  d=II(d,a,b,c,x[k+15],S42,0xFE2CE6E0);
		  c=II(c,d,a,b,x[k+6], S43,0xA3014314);
		  b=II(b,c,d,a,x[k+13],S44,0x4E0811A1);
		  a=II(a,b,c,d,x[k+4], S41,0xF7537E82);
		  d=II(d,a,b,c,x[k+11],S42,0xBD3AF235);
		  c=II(c,d,a,b,x[k+2], S43,0x2AD7D2BB);
		  b=II(b,c,d,a,x[k+9], S44,0xEB86D391);
		  a=AddUnsigned(a,AA);
		  b=AddUnsigned(b,BB);
		  c=AddUnsigned(c,CC);
		  d=AddUnsigned(d,DD);
	  }

	  var temp = WordToHex(a)+WordToHex(b)+WordToHex(c)+WordToHex(d);

	  return temp.toLowerCase();
  },
};

function inspect(o, i) {
  if (i <0 || o == null) return typeof o;
  switch(typeof o) {
  case 'function':
    return 'function ' + o.name;
  case 'object':
    if (o instanceof Array)
      return "[" + o.map(function (o2) {
        return inspect(o2, i-1);
      }).join(", ") + "]";

    var r=[];
    for (var p in o){
      r.push(p.toString() + ": " + inspect(o[p], i-1));
    }
    return "{" + r.join(", ") +"}";
  default:
    return o.toString();
  }
}

function TwoIndex() {
  this.ids = Object.create(null);
}

TwoIndex.prototype = {
  constructor: TwoIndex,

  has: function (groupId, id) {
    if (id === undefined) return groupId in this.ids;
    var result = this.ids[groupId];
    return !! (result && id in result);
  },

  get: function (groupId, id) {
    var result = this.ids[groupId];
    if (id === undefined) return result;
    return result && result[id];
  },

  add: function (groupId, id, value) {
    var result = this.ids[groupId];
    if (! result) result = this.ids[groupId] = {};
    return result[id] = value;
  },

  remove: function (groupId, id) {
    if (id === undefined) delete this.ids[groupId];
    var result = this.ids[groupId];
    if (result) {
      delete result[id];
      for (var k in result) return;
      delete this.ids[groupId];
    }
  },
};
