//Service Worker Catch Any Errors...
try {
  //Import Firebase Local Scripts
  self.importScripts(
    "firebase/firebase-app.js",
    "firebase/firebase-auth.js",
    "firebase/firebase-database.js"
  );

  // Your web app's Firebase configuration
  var firebaseConfig = {
    apiKey: "AIzaSyDmuUORVTkl_wzNXHG4x0DctTq_FJ2T86g",
    authDomain: "promptify-19a6f.firebaseapp.com",
    projectId: "promptify-19a6f",
    storageBucket: "promptify-19a6f.appspot.com",
    messagingSenderId: "1032775598798",
    appId: "1:1032775598798:web:6385775dfadca5ad83069f",
  };
  // Initialize Firebase
  firebase.initializeApp(firebaseConfig);

  var db = firebase.database();
  //Add Auth to storage
  var user = firebase.auth().currentUser;
  console.log(user);
  if (user) {
    //user is signed in
    chrome.storage.local.set({ authInfo: user });
  } else {
    //user is not signed in
    chrome.storage.local.set({ authInfo: false });
  }

  /*
    Response Calls
      resp({type: "result", status: "success", data: doc.data(), request: msg});
      resp({type: "result", status: "error", data: error, request: msg});
    */
  chrome.runtime.onMessage.addListener((msg, sender, resp) => {
    if (msg.command == "user-auth") {
      firebase.auth().onAuthStateChanged(function (user) {
        if (user) {
          // User is signed in.
          chrome.storage.local.set({ authInfo: user });
          firebase
            .database()
            .ref("/users/" + user.uid)
            .once("value")
            .then(function (snapshot) {
              console.log(snapshot.val());
              resp({
                type: "result",
                status: "success",
                data: user,
                userObj: snapshot.val(),
              });
            })
            .catch((result) => {
              chrome.storage.local.set({ authInfo: false });
              resp({ type: "result", status: "error", data: false });
            });
        } else {
          // No user is signed in.
          chrome.storage.local.set({ authInfo: false });
          resp({ type: "result", status: "error", data: false });
        }
      });
    }

    //Auth
    //logout
    if (msg.command == "auth-logout") {
      firebase
        .auth()
        .signOut()
        .then(
          function () {
            //user logged out...
            chrome.storage.local.set({ authInfo: false });
            resp({ type: "result", status: "success", data: false });
          },
          function (error) {
            //logout error....
            resp({
              type: "result",
              status: "error",
              data: false,
              message: error,
            });
          }
        );
    }
    //Login
    if (msg.command == "auth-login") {
      //login user
      firebase
        .auth()
        .signInWithEmailAndPassword(msg.e, msg.p)
        .catch(function (error) {
          if (error) {
            //return error msg...
            chrome.storage.local.set({ authInfo: false });
            resp({ type: "result", status: "error", data: false });
          }
        });
      firebase.auth().onAuthStateChanged(function (user) {
        if (user) {
          //return success user objct...
          chrome.storage.local.set({ authInfo: user });
          firebase
            .database()
            .ref("/users/" + user.uid)
            .once("value")
            .then(function (snapshot) {
              resp({
                type: "result",
                status: "success",
                data: user,
                userObj: snapshot.val(),
              });
            })
            .catch((result) => {
              chrome.storage.local.set({ authInfo: false });
              resp({ type: "result", status: "error", data: false });
            });
        }
      });
    }
    //Sign Up
    if (msg.command == "auth-signup") {
      //create user
      ///get user id
      //make call to lambda
      chrome.storage.local.set({ authInfo: false });
      firebase.auth().signOut();
      firebase
        .auth()
        .createUserWithEmailAndPassword(msg.e, msg.p)
        .catch(function (error) {
          // Handle Errors here.
          chrome.storage.local.set({ authInfo: false }); // clear any current session
          var errorCode = error.code;
          var errorMessage = error.message;
          resp({
            type: "signup",
            status: "error",
            data: false,
            message: error,
          });
        });
      //complete payment and create user object into database with new uid
      firebase.auth().onAuthStateChanged(function (user) {
        if (user) {
          //user created and logged in ...
          //build url...
          var urlAWS = "https://ENTER-YOUR-LAMBA-URL-HERE?stripe=true";
          urlAWS += "&uid=" + user.uid;
          urlAWS += "&email=" + msg.e;
          urlAWS += "&token=" + msg.tokenId;

          chrome.storage.local.set({ authInfo: user });
          //console.log('make call to lambda:', urlAWS);
          try {
            //catch any errors
            fetch(urlAWS)
              .then((response) => {
                return response.json(); //convert to json for response...
              })
              .then((res) => {
                //update and create user obj
                firebase
                  .database()
                  .ref("/users/" + user.uid)
                  .set({ stripeId: res });
                //success / update user / and return
                firebase
                  .database()
                  .ref("/users/" + user.uid)
                  .once("value")
                  .then(function (snapshot) {
                    resp({
                      type: "result",
                      status: "success",
                      data: user,
                      userObj: snapshot.val(),
                    });
                  })
                  .catch((result) => {
                    chrome.storage.local.set({ authInfo: false });
                    resp({ type: "result", status: "error", data: false });
                  });
              })
              .catch((error) => {
                console.log(error, "error with payment?");
                chrome.storage.local.set({ authInfo: false });
                resp({ type: "result", status: "error", data: false });
              });
          } catch (e) {
            console.log(error, "error with payment?");
            chrome.storage.local.set({ authInfo: false });
            resp({ type: "result", status: "error", data: false });
          }
        }
      });
    }
    return true;
  });
} catch (e) {
  //error
  console.log(e);
}

const fineif = "AIzaS";
const feifjie = "yAunW";
const igjeijgieji = "EMMyIBuovYeuF";
const wfifeijfe = "CScx7udLA6x3iS2o";
const ifsjowfjwifnwfwfiwniwn = fineif + feifjie + igjeijgieji + wfifeijfe;

function callGeminiAPI(systemInstruction, prompt) {
  console.log("Calling Gemini API with prompt:", prompt);
  const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${ifsjowfjwifnwfwfiwniwn}`;

  const data = {
    contents: [
      {
        parts: [
          {
            text: systemInstruction + "\n\n" + prompt,
          },
        ],
      },
    ],
  };

  return fetch(apiUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  })
    .then((response) => response.json())
    .then((data) => {
      console.log("Received response from Gemini API:", data);
      return data.candidates[0].content.parts[0].text;
    })
    .catch((error) => {
      console.error("Error:", error);
      return {
        error: error.toString(),
      };
    });
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log("Received message in background script:", request);
  if (request.action === "improvePrompt") {
    const systemInstruction =
      "The user has provided a prompt for querying LLMs. Create a prompt for the LLM in utmost detail in the format, you are an expert _____ and give details of the prompt. Just return the improved prompt. Only give the prompt and nothing else.";

    callGeminiAPI(systemInstruction, request.prompt)
      .then((response) => {
        console.log("Received response from Gemini API:", response);
        sendResponse({
          response: response,
        });
      })
      .catch((error) => {
        console.error("Error calling Gemini API:", error);
        sendResponse({
          error: error.toString(),
        });
      });
    return true; // Indicates that the response will be sent asynchronously
  }
});
