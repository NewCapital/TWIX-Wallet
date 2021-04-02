"use strict";
/*
 * Copyright 2020 NEM (https://nem.io)
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and limitations under the License.
 *
 */
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TWIXPaperWallet = void 0;
const pdf_lib_1 = require("pdf-lib");
const fontkit_1 = __importDefault(require("@pdf-lib/fontkit"));
const symbol_qr_library_1 = require("symbol-qr-library");
const encodedFont_1 = __importDefault(require("./resources/encodedFont"));
const encodedBasePdf_1 = __importDefault(require("./resources/encodedBasePdf"));
const encodedBasePrivateKeyPdf_1 = __importDefault(require("./resources/encodedBasePrivateKeyPdf"));
/**
 * Default generation hash
 */
const DEFAULT_GENERATION_HASH_SEED = "57F7DA205008026C776CB6AED843393F04CD458E0AA2D9F1D5F31A402072B2D6";
/**
 * Printing constants
 */
const MNEMONIC_POSITION = {
    x: 200,
    y: 36,
};
const ADDRESS_POSITION = {
    x: 200,
    y: 90,
};
const MNEMONIC_QR_POSITION = {
    x: 290,
    y: 180,
    width: 120,
    height: 120,
};
const ADDRESS_QR_POSITION = {
    x: 465,
    y: 180,
    width: 120,
    height: 120,
};
/**
 * TWIX Paper wallet class
 */
class TWIXPaperWallet {
    constructor(hdAccountInfo, accountInfos, network, generationHashSeed = DEFAULT_GENERATION_HASH_SEED) {
        this.hdAccount = hdAccountInfo;
        this.accountInfos = accountInfos;
        this.network = network;
        this.generationHashSeed = generationHashSeed;
    }
    /**
     * Exports as a PDF Uin8Array
     */
    toPdf() {
        return __awaiter(this, void 0, void 0, function* () {
            const plainPdfFile = new Buffer(encodedBasePdf_1.default, "base64");
            let pdfDoc = yield pdf_lib_1.PDFDocument.load(plainPdfFile);
            const notoSansFontBytes = new Buffer(encodedFont_1.default, "base64");
            pdfDoc.registerFontkit(fontkit_1.default);
            const notoSansFont = yield pdfDoc.embedFont(notoSansFontBytes);
            pdfDoc = yield this.writeMnemonicPage(pdfDoc, notoSansFont);
            for (let account of this.accountInfos) {
                pdfDoc = yield this.writeAccountPage(account, pdfDoc);
            }
            return pdfDoc.save();
        });
    }
    /**
     * Writes the mnemonic page into the given pdfDoc
     * @param pdfDoc
     * @param font
     */
    writeMnemonicPage(pdfDoc, font) {
        return __awaiter(this, void 0, void 0, function* () {
            const pages = pdfDoc.getPages();
            const page = pages[0];
            yield this.writeAddress(this.hdAccount.rootAccountAddress, page, font);
            const mnemonicWords = this.hdAccount.mnemonic.split(" ");
            const firstMnemonic = mnemonicWords.slice(0, Math.round(mnemonicWords.length / 2));
            const secondMnemonic = mnemonicWords.slice(Math.round(mnemonicWords.length / 2), mnemonicWords.length);
            yield this.writePrivateInfo([firstMnemonic.join(" "), secondMnemonic.join(" ")], page, font);
            const plainMnemonicQR = new symbol_qr_library_1.MnemonicQR(this.hdAccount.mnemonic, this.network, this.generationHashSeed);
            yield this.writePrivateQR(plainMnemonicQR, pdfDoc, page);
            const contactQR = new symbol_qr_library_1.ContactQR("Root account", this.hdAccount.rootAccountPublicKey, this.network, this.generationHashSeed);
            yield this.writePublicQR(contactQR, pdfDoc, page);
            return pdfDoc;
        });
    }
    /**
     * Writes the account page into the given pdfDoc
     * @param account
     * @param pdfDoc
     */
    writeAccountPage(account, pdfDoc) {
        return __awaiter(this, void 0, void 0, function* () {
            const newPlainPdfFile = new Buffer(encodedBasePrivateKeyPdf_1.default, "base64");
            const newPdfDoc = yield pdf_lib_1.PDFDocument.load(newPlainPdfFile);
            const notoSansFontBytes = new Buffer(encodedFont_1.default, "base64");
            newPdfDoc.registerFontkit(fontkit_1.default);
            const font = yield newPdfDoc.embedFont(notoSansFontBytes);
            let accountPage = newPdfDoc.getPages()[0];
            yield this.writeAddress(account.address, accountPage, font);
            yield this.writePrivateInfo([account.privateKey], accountPage, font);
            const accountQR = new symbol_qr_library_1.AccountQR(account.privateKey, this.network, this.generationHashSeed);
            yield this.writePrivateQR(accountQR, newPdfDoc, accountPage);
            const contactQR = new symbol_qr_library_1.ContactQR(account.name, account.publicKey, this.network, this.generationHashSeed);
            yield this.writePublicQR(contactQR, newPdfDoc, accountPage);
            [accountPage] = yield pdfDoc.copyPages(newPdfDoc, [0]);
            pdfDoc.addPage(accountPage);
            return pdfDoc;
        });
    }
    /**
     * Writes address into the given pdfDoc
     * @param address
     * @param page
     * @param font
     */
    writeAddress(address, page, font) {
        return __awaiter(this, void 0, void 0, function* () {
            page.drawText(address, {
                x: ADDRESS_POSITION.x,
                y: ADDRESS_POSITION.y,
                size: 12,
                font: font,
                color: pdf_lib_1.rgb(61 / 256, 61 / 256, 61 / 256),
            });
            return page;
        });
    }
    /**
     * Writes private info into the pdfDoc
     * @param privateLines
     * @param page
     * @param font
     */
    writePrivateInfo(privateLines, page, font) {
        return __awaiter(this, void 0, void 0, function* () {
            for (let i = 0; i < privateLines.length; i++) {
                page.drawText(privateLines[i], {
                    x: MNEMONIC_POSITION.x,
                    y: MNEMONIC_POSITION.y - 16 * i,
                    size: 9,
                    font: font,
                    color: pdf_lib_1.rgb(61 / 256, 61 / 256, 61 / 256),
                });
            }
            return page;
        });
    }
    /**
     * Writes the private QR (mnemonic or private key) into the given pdfDoc
     * @param qr
     * @param pdfDoc
     * @param page
     */
    writePrivateQR(qr, pdfDoc, page) {
        return __awaiter(this, void 0, void 0, function* () {
            const qrBase64 = yield qr.toBase64().toPromise();
            const png = yield pdfDoc.embedPng(qrBase64);
            page.drawImage(png, {
                x: MNEMONIC_QR_POSITION.x,
                y: MNEMONIC_QR_POSITION.y,
                width: MNEMONIC_QR_POSITION.width,
                height: MNEMONIC_QR_POSITION.height,
            });
            return page;
        });
    }
    /**
     * Writes the public QR into the given pdfDoc
     * @param qr
     * @param pdfDoc
     * @param page
     */
    writePublicQR(qr, pdfDoc, page) {
        return __awaiter(this, void 0, void 0, function* () {
            const qrBase64 = yield qr.toBase64().toPromise();
            const png = yield pdfDoc.embedPng(qrBase64);
            page.drawImage(png, {
                x: ADDRESS_QR_POSITION.x,
                y: ADDRESS_QR_POSITION.y,
                width: ADDRESS_QR_POSITION.width,
                height: ADDRESS_QR_POSITION.height,
            });
            return page;
        });
    }
}
exports.TWIXPaperWallet = TWIXPaperWallet;
//# sourceMappingURL=index.js.map