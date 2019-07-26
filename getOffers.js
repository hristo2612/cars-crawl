const fs = require('fs');
const request = require('request');
const _ = require('lodash');

const offersPath = './storage/offers.json';
const indexPath = './storage/lastIndex.json';
const keyPath = './storage/notification-key.json';
const encoding = { encoding: 'utf8' };

let notificationBody = '';

// get fcm-key for authorizing server to send notification to recipients
const fcmKey = JSON.parse(fs.readFileSync(keyPath, encoding)).fcm_key;

// get last saved index
const lastCount = JSON.parse(fs.readFileSync(indexPath, encoding)).lastIndex;

const offers = JSON.parse(fs.readFileSync(offersPath), encoding);
// save last item in offers as last index
if (offers.length > 0) {
    fs.writeFileSync(indexPath, JSON.stringify({ lastIndex: offers.length }), encoding);
}

// slice current offers with last index to get offers to send through notification
if (lastCount === offers.length || offers.length === 0) {
    console.log('We don\'t have any new offers!');
} else {
    const offersToSend = offers.length > 1 ? offers.slice(lastCount - 1, offers.length) : offers;

    if (offersToSend.length > 0) {
        console.log('New offers -> ', offersToSend.length);
        constructNotificationBody(offersToSend);

        if (offersToSend.length <= 5) {
            sendNotification(notificationBody, offersToSend);
        } else {
            const chunkedOffers = _.chunk(offersToSend, 5);
            chunkedOffers.forEach((chunk, index) => {
                setTimeout(() => {
                    constructNotificationBody(chunk);
                    sendNotification(notificationBody, chunk);
                }, 1260 * index)
            });
        }
    }
}

function constructNotificationBody(offersToSend) {
    if (offersToSend.length === 1) {
        notificationBody = offersToSend[0].title + ' - ' + offersToSend[0].price + ' лв.';
    } else if (offersToSend.length > 1) {
        notificationBody = offersToSend[0].title + ', ' + offersToSend[1].title + '...'
    }
}


function sendNotification(notificationBody, offersToSend) {
    const options = {
        uri: 'https://fcm.googleapis.com/fcm/send',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `key=${fcmKey}`
        },
        json: true,
        body: {
            notification: {
                title: 'Оферти',
                body: notificationBody,
                sound: 'default',
                click_action: 'FCM_PLUGIN_ACTIVITY',
                icon: 'fcm_push_icon'
            },
            data: {
                landing_page: 'second',
                offers: offersToSend
            },
            to: '/topics/people',
            priority: 'high',
            restricted_package_name: ''
        },
        method: 'POST'
    }
    request.post(options, (err, res) => {
        if (err) {
            console.log('WE HAVE AN ERROR SENDING NOTIFICATION: ', err);
        }
        console.log('NOTIFICATION SENT');
    });
}