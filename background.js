// Service Worker Catch Any Errors...
try {
  // Import Firebase Local Scripts
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

  // Function to update user state
  function updateUserState(user) {
    if (user) {
      chrome.storage.local.set({ authInfo: user });
    } else {
      chrome.storage.local.set({ authInfo: false });
    }
  }

  // Listen for auth state changes
  firebase.auth().onAuthStateChanged(updateUserState);

  chrome.runtime.onMessage.addListener((msg, sender, resp) => {
    if (msg.command == "user-auth") {
      firebase.auth().onAuthStateChanged(function (user) {
        if (user) {
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
            .catch((error) => {
              resp({ type: "result", status: "error", data: false });
            });
        } else {
          resp({ type: "result", status: "error", data: false });
        }
      });
    }

    // Auth logout
    if (msg.command == "auth-logout") {
      firebase
        .auth()
        .signOut()
        .then(
          function () {
            updateUserState(null);
            resp({ type: "result", status: "success", data: false });
          },
          function (error) {
            resp({
              type: "result",
              status: "error",
              data: false,
              message: error,
            });
          }
        );
    }

    // Auth login
    if (msg.command == "auth-login") {
      firebase
        .auth()
        .signInWithEmailAndPassword(msg.e, msg.p)
        .then(function (userCredential) {
          var user = userCredential.user;
          updateUserState(user);
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
            });
        })
        .catch(function (error) {
          resp({
            type: "result",
            status: "error",
            data: false,
            message: error.message,
          });
        });
    }

    // Auth signup
    if (msg.command == "auth-signup") {
      firebase
        .auth()
        .createUserWithEmailAndPassword(msg.e, msg.p)
        .then(function (userCredential) {
          var user = userCredential.user;
          updateUserState(user);
          firebase
            .database()
            .ref("/users/" + user.uid)
            .set({
              email: user.email,
              createdAt: firebase.database.ServerValue.TIMESTAMP,
            })
            .then(() => {
              resp({
                type: "result",
                status: "success",
                data: user,
                userObj: { email: user.email },
              });
            });
        })
        .catch(function (error) {
          resp({
            type: "signup",
            status: "error",
            data: false,
            message: error.message,
          });
        });
    }

    return true;
  });

  // Gemini API integration (unchanged)
  // ... (keep the existing Gemini API code here)
} catch (e) {
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
