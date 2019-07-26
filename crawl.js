const Nightmare = require('nightmare');
const fs = require('fs');

let startPage = 1;
let lastPage = 10;

const offersPath = './storage/offers.json';

Object.defineProperty(Array.prototype, 'flat', {
    value: function(depth = 1) {
      return this.reduce(function (flat, toFlatten) {
        return flat.concat((Array.isArray(toFlatten) && (depth>1)) ? toFlatten.flat(depth-1) : toFlatten);
      }, []);
    }
});

// return current page to display
function currentPage(pageNumber) {
    return `https://www.cars.bg/?go=cars&search=1&fromhomeu=1&currencyId=1&autotype=1&stateId=1&offersFor4=1&offersFor1=1&filterOrderBy=1&page=${pageNumber}&cref=91636`;
}

let vo = require('vo');

console.log('Ready to crawl the web?');

vo(run)(function(err, res) {
    if (err) throw err;

    if (res && res.length) {
        let offers = JSON.parse(fs.readFileSync(offersPath, { encoding: 'utf8' }));
        let newOffers = res.flat();
        if (offers.length !== -1) {
            offers.forEach((offer) => {
                newOffers = newOffers.filter((newOffer) => {
                    if (offer.title === newOffer.title && offer.description === newOffer.description && offer.year === newOffer.year) {
                        return false;
                    }
                    return true;
                });
            });
            fs.writeFileSync(offersPath, JSON.stringify(offers.concat(newOffers)), { encoding: 'utf8' });
        } else {
            fs.writeFileSync(offersPath, JSON.stringify(newOffers), { encoding: 'utf8' });
        }
    }
});

function *run() {
    let nightmare = Nightmare({ show: false });
    let result = [];
    for (let i = startPage; i <= lastPage; i++) {
        let currentResult = yield nightmare
            .goto(currentPage(i))
            .wait(3420)
            .evaluate(function() {
                let offersInfo = [];
                let offers = document.querySelectorAll('table > tbody > tr.odd, table > tbody > tr.even');
                offers.forEach((offer) => {
                    let title = offer.querySelector('td:nth-child(2) > a > span') ? offer.querySelector('td:nth-child(2) > a > span').innerText : false;
                    let url = offer.querySelector('td:nth-child(2) > a') ? offer.querySelector('td:nth-child(2) > a').href : false;
                    let imgUrl = offer.querySelector('td > a > img') ? offer.querySelector('td > a > img').src : false;
                    let price = offer.querySelector('td:nth-child(4) > span > strong') ? offer.querySelector('td:nth-child(4) > span > strong').innerText : false;
                    let description = offer.querySelector('td:nth-child(2)') ? offer.querySelector('td:nth-child(2)').innerText : false;
                    let year = offer.querySelector('td:nth-child(3) > span.year') ? offer.querySelector('td:nth-child(3) > span.year').innerText : false;

                    let sellerName = offer.querySelector('td:nth-child(5) > a') ? offer.querySelector('td:nth-child(5) > a').innerText : (offer.querySelector('td:nth-child(5)') ? offer.querySelector('td:nth-child(5)').innerText : false);
                    let sellerUrl = offer.querySelector('td:nth-child(5) > a') ? offer.querySelector('td:nth-child(5) > a').href : false;
                    let seller = { name: sellerName, url: sellerUrl };

                    let sellerInfoAndLocation = offer.querySelector('td:nth-child(5)') ? offer.querySelector('td:nth-child(5)').innerText : false;

                    offersInfo.push({ title, url, imgUrl, price, description, year, seller, sellerInfoAndLocation });
                });
                return offersInfo;
            })
        result.push(currentResult);
    }

    yield nightmare.end();

    return result;
}