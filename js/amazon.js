//Keys must be initialized for this to function.
let AMAZON_PUBLIC_KEY;
let AMAZON_PRIVATE_KEY;
let AMAZON_TAG;

function getAmazonPrice(argsObj, callback) {
  let asin;
  let args = objToArgString(argsObj);
  makeAmazonRequest('ItemSearch', args, (response) => {
    let items = $(response).find('Item');
    let asin = $(items[0]).find('ASIN').text();
    let url = $($(items[0]).find('ItemLink')[0]).find('URL').text();
    makeAmazonRequest('ItemLookup', `ItemId=${asin}`, (lookup) => {
      let price = $(lookup).find('LowestNewPrice>FormattedPrice').text();
      callback({
        'price': price,
        'url': url
      });
    })
  });
}

function objToArgString(argsObj) {
  let args = [];
  if (argsObj.author && argsObj.author.length) {
    let author = argsObj.author.replace(/  /g, ' ');
    let authorI = author.indexOf(',');
    if (authorI >= 0) author = author.splice(0, authorI);
    args.push(author.length ? `Author=${author}` : '');
  }
  if (argsObj.title && argsObj.title.length) {
    args.push(`Title=${argsObj.title}`);
  }
  if (argsObj.isbn && argsObj.isbn.length) {
    args.push(`Isbn=${argsObj.isbn}`);
  }
  args = args.join('&');

  return (args);
}

function fixedEncodeURIComponent(str) {
  return encodeURIComponent(str).replace(/[!'()*]/g, function(c) {
    return '%' + c.charCodeAt(0).toString(16);
  });
}

//example: makeAmazonRequest('ItemSearch','Keywords=the%20hunger%20games&ISBN=0439023483');
function makeAmazonRequest(operation, customArgs, callback) {
  // https://docs.aws.amazon.com/AWSECommerceService/latest/DG/rest-signature.html
  let base = 'http://webservices.amazon.com/onca/xml?';
  let args = generateQueryArgs(operation, customArgs);
  let signature = '&Signature=' + getSignature(args, AMAZON_PRIVATE_KEY);
  let url = base + args + signature;
  completeAmazonRequest(url, callback);
}

function completeAmazonRequest(url, callback) {
  $.get(url)
    .done(callback)
    .fail((e) => {
      if (e.status === 503) {
        setTimeout(completeAmazonRequest(url, callback), (500 + Math.floor(Math.random() * 1000)));
        return true
      } else if (e.status === 403) {
        console.log("Malformed request!" + url);
        console.log(e);
      } else {
        console.log(e);
        console.log($(e.responseText).find('error').text());
      };
    });
}

function generateQueryArgs(operation, customArgs) {
  let standardArgs = `Service=AWSECommerceService&AWSAccessKeyId=${AMAZON_PUBLIC_KEY}&Version=2013-08-01&AssociateTag=${AMAZON_TAG}`;
  //They don't allow price search on kindle books! SearchIndex=KindleStore :(
  if (operation === 'ItemSearch') standardArgs += '&SearchIndex=Books';
  if (operation === 'ItemLookup') standardArgs += '&ResponseGroup=Offers'
  let args = standardArgs + '&Operation=' + operation + '&' + customArgs;
  let timestamp = new Date().toISOString().replace(/(\.)(\d)+/, "");
  args += '&Timestamp=' + timestamp;
  args = args.split('&');
  args = args.map(a => a.split('=')).map(o => o[0] + '=' + fixedEncodeURIComponent(o[1]));
  args = args.sort().join('&').replace(/'/g, '%27');
  return args;
}

function getSignature(argStr, key) {
  let prepend =
    `GET
webservices.amazon.com
/onca/xml
`;
  let stringToSign = prepend + argStr;

  var hash = sha256.hmac.create(key);
  hash.update(stringToSign);
  hash = hash.hex();
  hash = hexToBase64(hash);

  return encodeURIComponent(hash);
}

function hexToBase64(hexstring) {
  return btoa(hexstring.match(/\w{2}/g).map(function(a) {
    return String.fromCharCode(parseInt(a, 16));
  }).join(""));
}