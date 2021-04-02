
import { PDFDocument, PDFFont, PDFPage, rgb } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import { AccountQR, ContactQR, MnemonicQR, QRCode } from "symbol-qr-library";
import encodedFont from "./resources/encodedFont";
import encodedBasePdf from "./resources/encodedBasePdf";
import encodedBasePrivateKeyPdf from "./resources/encodedBasePrivateKeyPdf";

/**
 * Default generation hash
 */
const DEFAULT_GENERATION_HASH_SEED =
  "57F7DA205008026C776CB6AED843393F04CD458E0AA2D9F1D5F31A402072B2D6";

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
 * Abstraction for NetworkType sdk interface
 */
export type INetworkType = number;
/**
 * HD Account info interface
 */
export type IHDAccountInfo = {
  mnemonic: string;
  rootAccountPublicKey: string;
  rootAccountAddress: string;
};
/**
 * Account info interface
 */
export type IAccountInfo = {
  name: string;
  address: string;
  publicKey: string;
  privateKey: string;
};

/**
 * TWIX Paper wallet class
 */
class TWIXPaperWallet {
  public hdAccount: IHDAccountInfo;
  public accountInfos: IAccountInfo[];
  public network: INetworkType;
  public generationHashSeed: string;

  constructor(
    hdAccountInfo: IHDAccountInfo,
    accountInfos: IAccountInfo[],
    network: INetworkType,
    generationHashSeed: string = DEFAULT_GENERATION_HASH_SEED
  ) {
    this.hdAccount = hdAccountInfo;
    this.accountInfos = accountInfos;
    this.network = network;
    this.generationHashSeed = generationHashSeed;
  }

  /**
   * Exports as a PDF Uin8Array
   */
  async toPdf(): Promise<Uint8Array> {
    const plainPdfFile = new Buffer(encodedBasePdf, "base64");
    let pdfDoc = await PDFDocument.load(plainPdfFile);
    const notoSansFontBytes = new Buffer(encodedFont, "base64");
    pdfDoc.registerFontkit(fontkit);
    const notoSansFont = await pdfDoc.embedFont(notoSansFontBytes);

    pdfDoc = await this.writeMnemonicPage(pdfDoc, notoSansFont);

    for (let account of this.accountInfos) {
      pdfDoc = await this.writeAccountPage(account, pdfDoc);
    }
    return pdfDoc.save();
  }

  /**
   * Writes the mnemonic page into the given pdfDoc
   * @param pdfDoc
   * @param font
   */
  private async writeMnemonicPage(
    pdfDoc: PDFDocument,
    font: PDFFont
  ): Promise<PDFDocument> {
    const pages = pdfDoc.getPages();
    const page = pages[0];
    await this.writeAddress(this.hdAccount.rootAccountAddress, page, font);

    const mnemonicWords = this.hdAccount.mnemonic.split(" ");
    const firstMnemonic = mnemonicWords.slice(
      0,
      Math.round(mnemonicWords.length / 2)
    );
    const secondMnemonic = mnemonicWords.slice(
      Math.round(mnemonicWords.length / 2),
      mnemonicWords.length
    );
    await this.writePrivateInfo(
      [firstMnemonic.join(" "), secondMnemonic.join(" ")],
      page,
      font
    );

    const plainMnemonicQR = new MnemonicQR(
      this.hdAccount.mnemonic,
      this.network,
      this.generationHashSeed
    );
    await this.writePrivateQR(plainMnemonicQR, pdfDoc, page);

    const contactQR = new ContactQR(
      "Root account",
      this.hdAccount.rootAccountPublicKey,
      this.network,
      this.generationHashSeed
    );
    await this.writePublicQR(contactQR, pdfDoc, page);

    return pdfDoc;
  }

  /**
   * Writes the account page into the given pdfDoc
   * @param account
   * @param pdfDoc
   */
  private async writeAccountPage(
    account: IAccountInfo,
    pdfDoc: PDFDocument
  ): Promise<PDFDocument> {
    const newPlainPdfFile = new Buffer(encodedBasePrivateKeyPdf, "base64");
    const newPdfDoc = await PDFDocument.load(newPlainPdfFile);
    const notoSansFontBytes = new Buffer(encodedFont, "base64");
    newPdfDoc.registerFontkit(fontkit);
    const font = await newPdfDoc.embedFont(notoSansFontBytes);

    let accountPage = newPdfDoc.getPages()[0];
    await this.writeAddress(account.address, accountPage, font);

    await this.writePrivateInfo([account.privateKey], accountPage, font);

    const accountQR = new AccountQR(
      account.privateKey,
      this.network,
      this.generationHashSeed
    );
    await this.writePrivateQR(accountQR, newPdfDoc, accountPage);

    const contactQR = new ContactQR(
      account.name,
      account.publicKey,
      this.network,
      this.generationHashSeed
    );
    await this.writePublicQR(contactQR, newPdfDoc, accountPage);

    [accountPage] = await pdfDoc.copyPages(newPdfDoc, [0]);
    pdfDoc.addPage(accountPage);
    return pdfDoc;
  }

  /**
   * Writes address into the given pdfDoc
   * @param address
   * @param page
   * @param font
   */
  private async writeAddress(
    address: string,
    page: PDFPage,
    font: PDFFont
  ): Promise<PDFPage> {
    page.drawText(address, {
      x: ADDRESS_POSITION.x,
      y: ADDRESS_POSITION.y,
      size: 12,
      font: font,
      color: rgb(61 / 256, 61 / 256, 61 / 256),
    });
    return page;
  }

  /**
   * Writes private info into the pdfDoc
   * @param privateLines
   * @param page
   * @param font
   */
  private async writePrivateInfo(
    privateLines: string[],
    page: PDFPage,
    font: PDFFont
  ): Promise<PDFPage> {
    for (let i = 0; i < privateLines.length; i++) {
      page.drawText(privateLines[i], {
        x: MNEMONIC_POSITION.x,
        y: MNEMONIC_POSITION.y - 16 * i,
        size: 9,
        font: font,
          color: rgb(61 / 256, 61 / 256, 61 / 256),
      });
    }
    return page;
  }

  /**
   * Writes the private QR (mnemonic or private key) into the given pdfDoc
   * @param qr
   * @param pdfDoc
   * @param page
   */
  private async writePrivateQR(
    qr: QRCode,
    pdfDoc: PDFDocument,
    page: PDFPage
  ): Promise<PDFPage> {
    const qrBase64 = await qr.toBase64().toPromise();
    const png = await pdfDoc.embedPng(qrBase64);

    page.drawImage(png, {
      x: MNEMONIC_QR_POSITION.x,
      y: MNEMONIC_QR_POSITION.y,
      width: MNEMONIC_QR_POSITION.width,
      height: MNEMONIC_QR_POSITION.height,
    });
    return page;
  }

  /**
   * Writes the public QR into the given pdfDoc
   * @param qr
   * @param pdfDoc
   * @param page
   */
  private async writePublicQR(
    qr: QRCode,
    pdfDoc: PDFDocument,
    page: PDFPage
  ): Promise<PDFPage> {
    const qrBase64 = await qr.toBase64().toPromise();
    const png = await pdfDoc.embedPng(qrBase64);

    page.drawImage(png, {
      x: ADDRESS_QR_POSITION.x,
      y: ADDRESS_QR_POSITION.y,
      width: ADDRESS_QR_POSITION.width,
      height: ADDRESS_QR_POSITION.height,
    });
    return page;
  }
}

export { TWIXPaperWallet };
