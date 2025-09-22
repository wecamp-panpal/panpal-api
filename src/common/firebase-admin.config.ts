import * as admin from 'firebase-admin'

const serviceAccount=require("../../panpal-api-firebase-adminsdk-fbsvc-1bf783f0d4.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

export { admin };
