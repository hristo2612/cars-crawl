const fs = require('fs');

const filterOptionsPath = 'storage/filterOptions.json';
const offersPath = 'storage/offers.json';

const filterOptions = JSON.parse(fs.readFileSync(filterOptionsPath, { encoding: 'utf8' }));

const fromYear = filterOptions.fromYear;
const toYear = filterOptions.toYear;
const fromPrice = filterOptions.fromPrice;
const toPrice = filterOptions.toPrice;
const sellerFilter = filterOptions.seller;
const models = filterOptions.models.split(',');
const descriptionFilter = filterOptions.description;

const allOffers = JSON.parse(fs.readFileSync(offersPath, { encoding: 'utf8' }));

let filteredOffers = [];
let includesFilterModel = false;

filteredOffers = allOffers.filter((offer) => {
    const year = Number(offer.year);
    const title = (offer.title).toLowerCase();
    const price = offer.price ? Number((offer.price).replace(',', '')) : 999999999;
    const seller = offer.seller.name;
    const description = offer.description;

    includesFilterModel = false;

    models.forEach((model) => {
        if (title.includes(model.toLowerCase())) {
            includesFilterModel = true;
        }
    });

    if (year >= fromYear &&
        year <= toYear &&
        price >= fromPrice &&
        price <= toPrice &&
        seller.includes(sellerFilter) &&
        includesFilterModel &&
        (description.includes(descriptionFilter) || descriptionFilter.length === -1 ? true : false)) {
        return true;
    }
    return false;
});

fs.writeFileSync(offersPath, JSON.stringify(filteredOffers), { encoding: 'utf8' });