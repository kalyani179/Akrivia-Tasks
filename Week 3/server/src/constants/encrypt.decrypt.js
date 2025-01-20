const CryptoJS = require('crypto-js');

// Encryption
const encrypt = (data, key) => {
  const cipherText = CryptoJS.AES.encrypt(data, key).toString();
  return cipherText;
}

// Decryption 
const decrypt = (cipherText, key) => {
  try {
    const bytes = CryptoJS.AES.decrypt(cipherText, key);
    if (bytes.sigBytes > 0) {
      const originalText = bytes.toString(CryptoJS.enc.Utf8);
      return originalText;
    }
  } catch (err) {
    throw new Error("Invalid key");
  }
}

module.exports = { encrypt, decrypt };