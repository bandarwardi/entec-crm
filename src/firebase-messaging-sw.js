importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyA47tRN9jFa68LzXXKxb9IZCi8JxDARkNc",
  authDomain: "en-tec.firebaseapp.com",
  projectId: "en-tec",
  storageBucket: "en-tec.firebasestorage.app",
  messagingSenderId: "542008011319",
  appId: "1:542008011319:web:8b60860e7ed2fc9a74edb2"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/assets/imgs/logo.jpeg',
    data: payload.data
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
