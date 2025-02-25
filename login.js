import { getAuth, signInWithPopup, GoogleAuthProvider } from "./firebase/firebaseConfig";

const auth = getAuth(app) // import auth instance 

const googleSignIn = async () => {
    try {
        const provider = new GoogleAuthProvider();
        const result = await signInWithPopup(auth, provider)
        const credential = GoogleAuthProvider.credentialFromResult(result);
        const token = credential.accessToken;
        console.log(credential)
    } catch (e) {
        console.log(e.code, e.message)
    }
}