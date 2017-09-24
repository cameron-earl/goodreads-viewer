const USER_INPUT = $('.info-wrapper input[name="goodreads_id"]');
const LOAD_AMAZON_PRICES = true;
const PLACEHOLDER_IMAGE = 'https://s.gr-assets.com/assets/nophoto/book/111x148-bcc042a9c91a29c1d680899eff700a03.png';

let currentUser;
let loadedShelves;
let currentPage;


$(document).ready(() => {
  $("form").submit(submitId);
  $(".main-wrapper").hide();
  $(".splash-wrapper").show();
  $(document).keypress((ev) => {
    if (ev.which === 126) {
      $('input').val(6709088);
    }
  });
});


function submitId(ev) {
  let input = $(ev.target).find('input').val();
  let sanitizedInput = input.replace(/[^0-9]/g, '');
  $('input').val(sanitizedInput);
  if (!$('input').val().length) {
    ev.preventDefault();
    Materialize.toast('Please enter a numeric id first!', 4000, 'error');
    $('input').val('');
  }
  if (sanitizedInput === currentUser) {
    ev.preventDefault();
    $('ul.tabs').tabs('select_tab', 'bookshelves-view');
  }
}

function newUser() {
  let id = $(USER_INPUT).val();
  if (!id.length) id = $('.splash-wrapper input').val();
  id = id.replace(/[^0-9]/g, '')
  if (id.length) {
    $('.thinking-wrapper').show();
    lookupID(id, displayUser);
  } else {
    Materialize.toast('Please enter a numeric id first!', 4000, 'error');
    $('input').val('');
  }
}

function noSuchUser(id) {
  $(USER_INPUT).val(currentUser);
  $('.thinking-wrapper').hide();
  Materialize.toast(`Could not find a user with an id of ${id}!`, 4000, 'error');
}

function corsError() {
  $('.thinking-wrapper').hide();
  Materialize.toast('Make sure your CORS extension is turned on!', 4000, 'error');
}

function noBooks(name) {
  $(USER_INPUT).val(currentUser);
  $('.thinking-wrapper').hide();
  if (!name.length) name = "That user";
  Materialize.toast(`${name} has not added any books!`, 4000, 'error');
}

function genericError() {
  $('.thinking-wrapper').hide();
  Materialize.toast(`There was a problem. Check your API keys and input, and try again.`, 4000, 'error');
}

function displayUser(obj) {
  let user = $(obj).find('user');
  let name = user.children('name').text();
  if (name.length) name = name[0].toUpperCase() + name.substr(1);
  let bookCount = user.children('reviews_count').text();
  if (!+bookCount) noBooks(name);
  else {
    loadedShelves = {};
    $('.main-wrapper').hide();
    $('.info-wrapper').show();
    currentUser = user.children('id').text();
    let imageUrl = user.children('image_url').text();
    $('.user-info img').attr('src', imageUrl);
    $('.user-info h4').text(name);
    $('.user-info p').text(`Book Count: ${bookCount}`);
    displayShelves(user.children('user_shelves').children());
  }
}

function displayShelves(shelves) {
  $('.result-container').html(`<ul class="tabs"><li class="tab col s3"><a href="#bookshelves-view" class='active'>Bookshelves</a></li></ul><div id="bookshelves-view" class="col s12"></div>`);
  let div = $('<div>');
  $(div).addClass('collection shelves');
  for (let shelf of shelves) {
    let shelfName = $(shelf).children('name').text();
    let a = $(`<a>${shelfName}</a>`);
    $(a).addClass('collection-item');
    $(a).attr('id', `${shelfName}-nav`);
    $(a).click(displayShelf);
    div.append(a);
  }
  $('#bookshelves-view').html(div);
}

function displayShelf(ev) {
  let shelfName = ev.target.id;
  shelfName = shelfName.substring(0, shelfName.indexOf('-nav'));
  let shelf = $(`.tab-${shelfName}`);
  if (!loadedShelves[shelfName]) createShelf(shelfName);
  else {
    $(`.shelf-tab`).hide();
    $(`.tab-${shelfName}`).show();
    $('ul.tabs').tabs('select_tab', `shelf-${shelfName}`);
  }
}

function createShelf(shelfName, page = 1) {
  currentPage = page;
  if (loadedShelves[shelfName] === false) { //not falsey, but false
    Materialize.toast(`The ${shelfName} shelf is empty!`, 4000, 'error');
    return;
  };
  $('.thinking-wrapper').show();
  lookupShelf(currentUser, shelfName, page, (obj) => {
    let totalBookCount = +$(obj).find('reviews').attr('total');
    let loadedBooks = $(obj).find('reviews').children();
    if (!totalBookCount) {
      displayEmptyShelf(shelfName);
    } else {
      if (!loadedShelves[shelfName]) $(`#${shelfName}-nav`).append(` (${totalBookCount})`);
      loadedShelves[shelfName] = loadedBooks;
      let view;
      if (!$(`#shelf-${shelfName}`).length) {
        $(`.shelf-tab`).hide();
        let tab = $(`<li class="tab col s3 tab-${shelfName} shelf-tab"><a href="#shelf-${shelfName}">${shelfName} (${totalBookCount})</a></li>`);
        view = $(`<div id="shelf-${shelfName}" class="col s12"></div>`);
        $('.result-container').append(view);
        $(view).append('<div class="collection"></div>');
        view = $(view).find('div');
        let tabs = $('ul.tabs');
        $(tabs).append(tab);
        $(tabs).tabs();
        $(tabs).tabs('select_tab', `shelf-${shelfName}`);
      } else {
        view = $(`#shelf-${shelfName} .collection`);
        $(view).empty();
      }
      for (let book of loadedBooks) {
        insertBook(book, view);
      }
      $(function() {
        $('span.stars').stars();
      });
      $('.thinking-wrapper').hide();

      let pageCount = Math.ceil(totalBookCount / 20);
      paginate(shelfName, pageCount);
    }
  });
}

function paginate(shelfName, pageCount) {
  if (pageCount > 1 && !$(`#shelf-${shelfName} .pagination`).length) {
    let pagination = `<ul class="pagination">
      <li class="disabled"><a href="#"><i class="material-icons">chevron_left</i></a></li>
      <li class="active"><a href="#">1</a></li>`;
    for (let i = 2; i <= pageCount; i++) {
      pagination += `<li class="waves-effect"><a href="#">${i}</a></li>`;
    }
    pagination += '<li class="waves-effect"><a href="#"><i class="material-icons">chevron_right</i></a></li></ul>';
    $(`#shelf-${shelfName}`).append(pagination);

    $('.pagination a').click((ev) => {
      if ($(ev.target).parent().parent().hasClass('disabled') ||
        $(ev.target).text() == currentPage) {
        return;
      }
      $('.thinking-wrapper').show();
      let newPage = ev.target.textContent;
      if (newPage.indexOf('chevron') === -1) {
        newPage = +newPage;
      } else {
        newPage = /right/.test(newPage) ? currentPage + 1 : currentPage - 1;
      }
      let pageLinks = $('.pagination li');
      let disabledLinks = [];
      if (newPage === 1) disabledLinks.push(0);
      if (newPage === pageCount) disabledLinks.push(pageCount + 1);
      for (let i = 0; i < pageLinks.length; i++) {
        let link = $(pageLinks[i]);
        if (i === newPage) {
          link.addClass('active');
          link.removeClass('waves-effect');
        } else if (disabledLinks.includes(i)) {
          link.removeClass('waves-effect');
          link.addClass('disabled');
        } else {
          link.removeClass('active');
          link.removeClass('disabled');
          link.addClass('waves-effect');
        }
      }
      createShelf(shelfName, newPage);
    })
  }
}

function insertBook(book, view) {
  let div = $('<div class="collection-item valign-wrapper">');
  let title = truncateTitle($(book).find('book title').text());
  let rating = $(book).children('rating').text();
  let avgRating = $(book).find('book>average_rating').text();
  let author = stringifyAuthors($(book).find('book authors'));
  let isbn = $(book).find('book isbn').text();
  let imageSrc = $(book).find('book>image_url').text();

  let img = $(`<img src="${imageSrc}" class='book-image'>`);
  $(div).append(img);
  let innerDiv = $('<div class="book-info valign">');
  $(innerDiv).append(`<span>${title} by ${author}</span>`);
  $(div).append(innerDiv);

  if (rating === '0') {
    if (+avgRating) {
      $(innerDiv).append(`<span class="stars avg tooltipped" data-position="top" data-delay="50" data-tooltip="Average Rating: ${avgRating}">${avgRating}</span>`);
    } else {
      $(innerDiv).append('<br>');
    }
  } else {
    $(innerDiv).append(`<span class="stars tooltipped" data-position="top" data-delay="50" data-tooltip="User Rating: ${rating} - Average Rating: ${avgRating}">${rating}</span>`);
  }
  $('.tooltipped').tooltip({
    delay: 50
  });

  if (LOAD_AMAZON_PRICES) {
    let firstAuthor = $(book).find('book authors author:first-child name').text();

    $(innerDiv).append(`<span>Amazon: <span class='price'>loading...</span>`);
    let argsObj = {'title': title, 'author':firstAuthor, 'isbn':isbn};
    requestBookItem(argsObj,amazonItem=>{
      let url = getItemUrl(amazonItem);

      if (imageSrc === PLACEHOLDER_IMAGE) {
        requestImages(amazonItem, (imgObj)=> {
          let url = $(imgObj).find('ItemLookupResponse > Items > Item > ImageSets > ImageSet[Category="primary"] > TinyImage > URL').text();
          $(img).attr('src',url);
        })
      }

      requestItemOffer(amazonItem, offer => {
        let priceContainer = $(div).find('.price');
        let price = getOfferPrice(offer);
        if (price.length) {
          $(priceContainer).html(`<a href=${url} target="_blank">${price}</a>`);
        } else if (url.length) {
          $(priceContainer).html(`<a href=${url} target="_blank">Not available.</a>`);
        } else {
          $(priceContainer).html(`Not available.`);
        }
      });
    });
  }

  $(view).append(div);
}

function stringifyAuthors(authors) {
  let str = '';
  for (let i = 0; i < authors.length; i++) {
    str += $(authors[i]).find('name').text();
    if (i < authors.length - 1) str += ', ';
  }
  return str;
}

function displayEmptyShelf(shelfName) {
  $(`#${shelfName}-nav`).append(' (empty)');
  $('.thinking-wrapper').hide();
  loadedShelves[shelfName] = false;
  Materialize.toast(`The ${shelfName} shelf is empty!`, 4000, 'error');
}

$.fn.stars = function() {
  return $(this).each(function() {
    $(this).html($('<span />').width(Math.max(0, (Math.min(5, parseFloat($(this).html())))) * 16));
  });
}

const truncateTitle = (title) => {
  let i = title.search(/(: )|( \()|( - )/);
  return i >= 0 ? title.slice(0, i) : title;
}
