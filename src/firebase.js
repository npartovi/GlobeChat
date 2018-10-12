import firebase from 'firebase/app'
import "firebase/auth"
import "firebase/database"
import "firebase/storage"


var config = {
    apiKey: "AIzaSyDg7gDnO1gLY-KS80FahhAbegJY6EetN4k",
    authDomain: "react-slack-clone-408cf.firebaseapp.com",
    databaseURL: "https://react-slack-clone-408cf.firebaseio.com",
    projectId: "react-slack-clone-408cf",
    storageBucket: "react-slack-clone-408cf.appspot.com",
    messagingSenderId: "311254065401"
  };

  firebase.initializeApp(config);

  export default firebase