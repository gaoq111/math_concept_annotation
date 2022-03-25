import firebase from "firebase/app";
import "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBsE5Q00pTAEGaA9PVRPlM9ESVJz9XAHN4",
  authDomain: "saint-annotator.firebaseapp.com",
  databaseURL: "https://saint-annotator-default-rtdb.firebaseio.com",
  projectId: "saint-annotator",
  storageBucket: "saint-annotator.appspot.com",
  messagingSenderId: "1015388069670",
  appId: "1:1015388069670:web:2c3f5401327a0d17af2be7",
  measurementId: "G-SC9THEQS6T"
};

firebase.initializeApp(firebaseConfig);
export const db = firebase.firestore();