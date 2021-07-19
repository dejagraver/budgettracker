let db;
const request = indexedDB.open('budget_tracker', 1);

request.onupgradeneeded = function (event) {
    const db = event.target.result;
    db.createObjectStore('Transaction', {autoIncrement: true});
}

request.onsuccess = function (event) {
    db = event.target.result;
    if (navigator.onLine) {
        uploadTransaction();
    }
}

request.onerror = function (event) {
    console.log(event.target.errorCode);
}

function saveRecord(record) {
    const transaction = db.transaction(['Transaction'], 'readwrite');
    const transactionObjectStore = transaction.objectStore('Transaction');

    transactionObjectStore.add(record);
}

function uploadTransaction() {
    const transaction = db.transaction(['Transaction'], 'readwrite');
    const transactionObjectStore = transaction.objectStore('Transaction');
    const getAll = transactionObjectStore.getAll();

    getAll.onsuccess = function () {
        if (getAll.result.length > 0) {
            fetch("/api/transaction/bulk", {
                method: 'POST',
                body: JSON.stringify(getAll.result),
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json'
                }
            })
            .then(response => response.json())
            .then(serverResponse => {
                if (serverResponse.message) {
                    throw new Error(serverResponse);
                }

                const transaction = db.transaction(['Transaction'], 'readwrite');
                const transactionObjectStore = transaction.objectStore('Transaction');

                transactionObjectStore.clear();
            })
            .catch(err => console.log(err));
        }
    }
}

window.addEventListener('online', uploadTransaction);