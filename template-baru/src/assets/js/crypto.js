import CryptoJS from "crypto-js";

export async function encryptKey(data) {
    const SECRET = import.meta.env.PUBLIC_SSE_KEY; // sama seperti backend
    // console.log("SECRET:", SECRET);
    const payload = {
        ...data,
        exp: Math.floor(Date.now() / 1000) + 30, // 30 detik masa berlaku
    };
    const text = JSON.stringify(payload);
    // IV HARUS SAMA (atau dikirim bareng token kalau mau dinamis)
    const iv = CryptoJS.enc.Utf8.parse("1234567890123456");
    const key = CryptoJS.enc.Hex.parse(SECRET);

    const encrypted = CryptoJS.AES.encrypt(text, key, {
        iv: iv,
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7
    });

    return encrypted.ciphertext.toString(CryptoJS.enc.Base64);
}
