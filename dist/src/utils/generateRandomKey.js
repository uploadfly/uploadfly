"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateRandomKey = void 0;
function generateRandomKey(length) {
    const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let randomKey = "";
    for (let i = 0; i < length; i++) {
        const randomIndex = Math.floor(Math.random() * characters.length);
        randomKey += characters.charAt(randomIndex);
    }
    return randomKey;
}
exports.generateRandomKey = generateRandomKey;
// Written by ChatGPT
// Modified by @xing0x
