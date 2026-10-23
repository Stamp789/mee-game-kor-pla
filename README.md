# มีเกมก็แปล — World Journey

ดีไซน์หลักที่เลือกใช้: ฉาก 3D เต็มจอ แสงฟ้า/ม่วง/ทอง และกล้องตาม native scroll พร้อมคลังและรายละเอียดม็อด 32 เกม เน้นการใช้งานบน PC/Mac

เว็บไซต์หลัก: [มีเกมก็แปล](https://stamp789.github.io/mee-game-kor-pla/)

## พัฒนาและเปิดพรีวิว

ใช้ Node.js 24 และ npm จาก root โปรเจกต์:

```powershell
npm.cmd ci
npm.cmd run dev
```

พรีวิวชุด build: `npm.cmd run build` แล้ว `npm.cmd run preview`

- หน้าแรก: http://127.0.0.1:4321/
- คลัง: http://127.0.0.1:4321/mods/
- รายละเอียดตัวอย่าง: http://127.0.0.1:4321/mods/dressmaker/

## แก้ข้อมูลและตรวจงาน

ข้อมูลหลักอยู่ที่ `src/content/mods/*.json` รูปภาพที่ใช้งานอยู่ใน `public/assets/` หากเปลี่ยนภาพต้นฉบับใน `assets/` ให้รัน `npm.cmd run assets` (ไม่ประมวลผลภาพ QR ซ้ำ)

```powershell
npm.cmd run check
npm.cmd test
npm.cmd run build
npm.cmd run audit:site
```

`audit:site` ตรวจหน้า/ภาพ/ไฟล์ภายใน จุดเลื่อน และปุ่มดาวน์โหลดครบทุกเกม ส่วน `npm.cmd run audit:downloads` ตรวจ HTTP headers ของปลายทางภายนอกโดยไม่โหลดไฟล์ม็อด ระบบป้องกันบอตอาจปฏิเสธ HEAD แม้เปิดหน้าในเบราว์เซอร์ได้

## เผยแพร่

`.github/workflows/deploy-pages.yml` ติดตั้งด้วย lockfile ตรวจงาน แล้ว build Astro ไปที่ `dist/` ก่อนเผยแพร่ผ่าน GitHub Pages โดเมนและ base path ใช้ค่าจาก Configure Pages จึงรองรับทั้งโดเมนหลักและ project subpath รวม canonical, sitemap และ robots

การแก้ไฟล์ในเครื่องยังไม่เผยแพร่จนกว่าจะนำขึ้น `main` หรือเรียก workflow โปรดใช้กระบวนการ PR/Branch Protection ของ repository ตามเดิม

## โครงสร้าง

- `src/pages/` — หน้าแรก คลัง รายเกม 404 และ sitemap/robots
- `src/scenes/hero/` — ฉาก Three.js, กล้อง และงบการเรนเดอร์
- `src/scripts/page-motion.ts` — reveal, แสง hover, tilt, parallax และอนุภาคของหน้าคลัง/รายเกม
- `src/lib/search.ts` — กติกาค้นหาร่วม รองรับไทย/อังกฤษ หลายคำ และชื่อระบบปฏิบัติการ
- `src/styles/universe.css`, `page-motion.css`, `journey.css` — ธีมปัจจุบัน

ฉากโหลดเฉพาะหน้าแรก จำกัดบัฟเฟอร์สำหรับจอ Retina/4K และลดคุณภาพอัตโนมัติเมื่อ frame interval สูงต่อเนื่อง มีภาพสำรอง ปุ่มพัก reduced motion และหยุดวาดเมื่อซ่อนแท็บ

อ่าน [ผลตรวจพร้อมเผยแพร่](docs/production-readiness.md), [รายละเอียดดีไซน์](docs/world-journey-site.md), [คู่มือ static รุ่นเดิม](docs/legacy-static-readme.md) และ [ดราฟต์เก่า](DRAFT-NOTES.md)

## สิทธิ์และที่มา

ข้อมูลและ URL ต้นฉบับคงไว้ทั้งหมด รูปและชื่อเกมเป็นของเจ้าของผลงานแต่ละราย งานต้นฉบับสงวนลิขสิทธิ์ตาม [LICENSE](LICENSE) ดูที่มาโลโก้ใน [ASSET-PROVENANCE.md](ASSET-PROVENANCE.md)
