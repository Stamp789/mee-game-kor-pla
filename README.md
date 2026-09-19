# มีเกมก็แปล — Thai Game Mods

เว็บคลังม็อดแปลภาษาไทยของ [มีเกมก็แปล](https://www.facebook.com/profile.php?id=61593924362608) แบบ static สำหรับ GitHub Pages มีลิงก์ดาวน์โหลดจาก Nexus Mods และ Google Drive พร้อมแหล่งซื้อเกมแท้ของแต่ละเกม

ข้อมูลในคลังอ้างอิงจากโพสต์สาธารณะของเพจและหน้าม็อดของผู้จัดทำ ประกอบด้วย Absolum, Battle Chef Brigade Deluxe, Death end re;Quest, Vapor World: Over The Mind, The Royal Writ และ Monster Prom

มีส่วนติดตามงานแปล Company of Heroes 2 ที่ความคืบหน้า 70% และส่วนสนับสนุนผู้แปลผ่าน PromptPay

## จุดเด่น

- ค้นหาจากชื่อเกม ชื่อไทย ผู้แปล และแท็ก
- กรองสถานะและแพลตฟอร์ม
- เรียงตามวันที่ ชื่อ หรือความนิยม
- บันทึกม็อดโปรดไว้ในอุปกรณ์ด้วย `localStorage`
- หน้ารายละเอียดพร้อม Game Build, changelog, วิธีติดตั้ง และ SHA-256
- รองรับหน้าจอคอมพิวเตอร์ แท็บเล็ต และมือถือ
- ไม่มีฐานข้อมูลหรือค่าเซิร์ฟเวอร์
- มี GitHub Issue Forms สำหรับรับคำขอม็อดและรายงานบั๊ก

## แก้ข้อมูลม็อด

ข้อมูลม็อดทั้งหมดอยู่ในตัวแปร `mods` ด้านบนของ `app.js` แต่ละรายการรองรับข้อมูลหลักดังนี้:

```js
{
  id: "ชื่อสำหรับลิงก์",
  title: "ชื่อเกมภาษาอังกฤษ",
  thaiTitle: "ชื่อภาษาไทย",
  version: "1.0.0",
  gameBuild: "Steam Build 123456",
  platform: "pc",
  source: "drive",
  cover: "assets/cover-example.jpg",
  purchaseLinks: [
    { label: "ซื้อบน Steam", href: "https://store.steampowered.com/app/.../" }
  ],
  nexus: "ลิงก์หน้าม็อดบน Nexus Mods",
  drive: "ลิงก์ไฟล์บน Google Drive",
  post: "ลิงก์โพสต์ต้นทาง"
}
```

ค่า `source` ที่ใช้อยู่คือ `nexus` และ `drive` ส่วน `purchaseLinks` สามารถเพิ่มแหล่งซื้อหรือแหล่งเปรียบเทียบราคาได้หลายรายการ

## เปิดดูบนเครื่อง

ใช้เว็บเซิร์ฟเวอร์ static ตัวใดก็ได้ เช่น:

```bash
python -m http.server 4173
```

แล้วเปิด `http://localhost:4173`

## เผยแพร่บน GitHub Pages

1. สร้าง repository ใหม่บน GitHub
2. อัปโหลดไฟล์ทั้งหมดในโฟลเดอร์นี้ขึ้น branch `main`
3. ไปที่ **Settings → Pages**
4. ในหัวข้อ **Build and deployment** เลือก Source เป็น **GitHub Actions**
5. Workflow จะเผยแพร่เว็บให้อัตโนมัติทุกครั้งที่ push เข้า `main`

## เช็กลิสต์ก่อนเปิดเว็บจริง

- สร้าง repository และตั้ง branch เริ่มต้นเป็น `main`
- หากใช้โดเมนที่กำหนดเอง ให้เปลี่ยนลิงก์ปุ่ม GitHub ใน `index.html` เป็น URL ของ repository (กรณี URL แบบ `*.github.io` ระบบจะสร้างลิงก์ให้อัตโนมัติ)
- ตรวจลิงก์ดาวน์โหลด แหล่งซื้อเกม และโพสต์ต้นทางอีกครั้ง
- ตรวจชื่อบัญชี PromptPay ในแอปธนาคารก่อนเผยแพร่ QR
- เปิด **Settings → Pages → Source: GitHub Actions**
- ตรวจ workflow ชื่อ **Deploy static site to GitHub Pages** ให้ผ่านครบทุกขั้นตอน

ไฟล์ `.nojekyll` และ workflow สำหรับ GitHub Pages เตรียมไว้แล้ว เว็บไซต์ไม่ต้องมีขั้นตอน build เพิ่มเติม

## ความปลอดภัยและลิขสิทธิ์

- สาขา `main` ใช้ Branch Protection และต้องแก้ไขผ่าน Pull Request
- ปิดการ Force Push และการลบสาขา `main`
- GitHub Secret Scanning และ Push Protection เปิดใช้งานอยู่
- ห้ามเก็บรหัสผ่าน Token, API Secret หรือ Private Key ใน repository
- หลักฐานและ SHA-256 ของโลโก้อยู่ใน `ASSET-PROVENANCE.md`
- โค้ด ดีไซน์ โลโก้ และงานต้นฉบับสงวนลิขสิทธิ์ตามไฟล์ `LICENSE`
