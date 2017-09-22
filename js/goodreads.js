//Keys must be initialized for this to function.
let GOODREADS_PUBLIC_KEY;

function lookupID(userID, callback) {
  let url = `https://www.goodreads.com/user/show/${userID}.xml?key=${GOODREADS_PUBLIC_KEY}`;
  $.get(url).done(callback).fail((e) => {
    if (e.readyState === 0) {
      corsError();
    } else if (e.status === 404) {
      noSuchUser(userID);
    } else {
      genericError();
    }
  });
}

function lookupShelf(userID, name, page, callback) {
  let url = `https://www.goodreads.com/review/list/${userID}` + `.xml?key=${GOODREADS_PUBLIC_KEY}&v=2&shelf=${name}&sort=rating&order=d&per_page=20&page=${page}`;
  $.get(url).done(callback).fail(console.log);
}