# World Journey — ผลตรวจเตรียมใช้งานจริง

23 ตุลาคม 2026 · ดีไซน์ที่ผู้ใช้เลือก · เน้น PC/Mac

## สิ่งที่เก็บรายละเอียด

- คงฉาก แสง สี และกล้องที่เลือกไว้ พร้อมขยายฉากเต็มขอบสำหรับจอที่กว้างกว่า 1920px
- จำกัด WebGL/bloom ที่ประมาณ 2.6 ล้านพิกเซล และปรับคุณภาพลงเมื่อ frame interval สูงต่อเนื่อง กล้องและรูปแบบฉากคงเดิม
- ใช้ reveal ของเนื้อหาในการเข้าหน้า ยกเลิกการจับ snapshot แบบ cross-document view transition หลังพบ InvalidStateError เมื่อสลับหน้าเร็ว เพื่อลดการจับภาพ WebGL และให้พฤติกรรมเหมือนกันข้ามเบราว์เซอร์
- ชั้นอนุภาค 2D จำกัดความละเอียดบัฟเฟอร์ ไม่เขียนค่า CSS ซ้ำเมื่อเลื่อนหรือเมาส์หยุด และคำนวณ hover ใน animation frame
- แก้การวัดพิกัดบนการ์ดที่กำลังเอียง เพื่อลดการสั่นตามขอบภาพ ใช้ compositor เฉพาะการ์ดที่โฮเวอร์
- คืนทรัพยากรฉากเมื่อโหลดภาพไม่สำเร็จ หยุดเมื่อซ่อนแท็บ/พ้นฉาก และรองรับการกลับจาก browser cache
- ค้นหาเมนูและคลังใช้กติกาเดียวกัน: Unicode NFC, ตัวพิมพ์, ช่องว่าง, หลายคำ และ PC/Windows/Mac/macOS ใช้ Ctrl/Cmd+K, ลูกศร และ Enter ได้
- คืนสถานะรายการโปรดหลังย้อนกลับจากรายละเอียด
- Escape ปิดหน้าต่างค้นหาในครั้งเดียวและคืนโฟกัสให้ปุ่มเปิด ป้องกันพฤติกรรมช่อง search ที่ล้างคำก่อนปิด
- ปุ่ม Nexus ทั้งหมดเปิดแท็บ Files โดยตรง แก้เพิ่ม 3 เกมที่ข้อมูลเดิมพาไปหน้าคำอธิบาย โดยไม่แก้ URL ต้นฉบับใน content records
- เพิ่มข้อความว่าต้องเข้าสู่ระบบ Nexus Mods เพื่อรับไฟล์ และชื่อปุ่มสำหรับ screen reader
- เปลี่ยน GitHub Pages workflow จากการคัดลอก static รุ่นเดิมเป็นติดตั้ง/check/test/build/audit Astro แล้วเผยแพร่ dist พร้อม base path, canonical, sitemap, robots และ 404 noindex

## ผลตรวจอัตโนมัติ

- Astro check: 51 ไฟล์, 0 errors / 0 warnings / 0 hints
- Regression: ค้นชื่อไทย/อังกฤษครบ 32 เกม, ค้นหลายคำ/แพลตฟอร์ม, primary download, render budget และ URL หน้า Files
- สมการกล้อง: bounded convergence, กลับทิศ, หยุดที่เป้าหมาย และความสอดคล้องของเวลา 30/60/120 Hz
- Migration: ข้อมูล 32 เกมทุก field และ URL ตรงต้นฉบับ
- Static build: 36 หน้า HTML พร้อม sitemap/robots
- Audit ทั้ง root `/` และ subpath `/mod-preview/`: ลิงก์/asset ภายในประมาณ 3,500 จุด, fragment 343 จุด และปลายทางปุ่มดาวน์โหลด 32 จุดผ่าน

## ผลตรวจในเบราว์เซอร์

- หน้าแรก → Ctrl+K → ค้น `dressmaker macos` → Enter → รายละเอียด → ปุ่มดาวน์โหลด → Nexus Files: พบไฟล์ PC v2.2 และ macOS v2.6
- คลัง → ค้น `tales BERSERIA` → list → รายละเอียด → บันทึก → ย้อนกลับ: คำค้น มุมมอง และรายการโปรดคงอยู่ คืนรายการโปรดที่ใช้ทดสอบแล้ว
- ล้างตัวกรอง เรียง A–Z เปลี่ยนหน้า 2 และกรณีไม่พบผลลัพธ์
- ค้น + กรอง Google Drive → Dragon Star Varnir → ปุ่มรับไฟล์: เปิดไฟล์ ZIP พร้อมปุ่มดาวน์โหลด
- ค้น + กรอง MediaFire → Tavern Keeper → ปุ่มรับไฟล์: เปิดไฟล์ v1.1 พร้อมปุ่ม DOWNLOAD (38.8MB)
- ตรวจปลายทางครบ 32 เกม: Nexus 24 หน้าเห็นรายการไฟล์ (3 หน้าต้องเปิดแท็บ Files เพิ่มก่อนปรับโค้ด), Drive 6 ลิงก์เห็นไฟล์/โฟลเดอร์, MediaFire 2 หน้าเห็นไฟล์และปุ่มรับไฟล์
- ทดสอบ hover/tilt, parallax, เมนูตามหัวข้อ และ anchor วิธีติดตั้ง/รับไฟล์ไม่อยู่ใต้ sticky navigation
- QHD 2560×1440: ฉากเต็มขอบเนื้อที่ 2545px โดยไม่ล้นแนวนอน บัฟเฟอร์จริง 2,597,316 พิกเซล; sample frame interval ในแท็บที่กำลังแสดงประมาณ 16.7ms เป็นการสังเกตบนเครื่องนี้ ไม่ใช่ผลรับประกันทุก GPU

หลักฐานอยู่ใน `artifacts/qa/site-audit.json`, `site-audit-subpath.json`, `download-audit.json` และ `browser-download-audit.json` ผล HEAD พบ 7 ลิงก์เข้าถึงได้และ 25 ลิงก์ต้องตรวจผ่านเบราว์เซอร์ ซึ่งได้ตรวจต่อแล้ว

## ขอบเขตการยืนยัน

การทดสอบเบราว์เซอร์ใช้ Chromium บน Windows ไม่ใช่ Safari บน Mac จริง ไม่ยืนยัน FPS ทุกเครื่อง การตรวจปลายทางสิ้นสุดที่หน้าไฟล์และปุ่มรับไฟล์ ไม่ได้เข้าสู่บัญชี Nexus หรือดาวน์โหลด/ติดตั้ง archive ทั้ง 32 เกม บางไฟล์มีขนาดเกิน 1GB

รายงานนี้บันทึกการตรวจในเครื่องก่อนเผยแพร่ การเผยแพร่ใช้ GitHub Pages เมื่อรวมขึ้น main ตามกระบวนการ repository ตรวจสถานะล่าสุดได้ที่ [Deploy workflow](https://github.com/Stamp789/mee-game-kor-pla/actions/workflows/deploy-pages.yml)

อ้างอิงการตั้งค่า workflow: [setup-node](https://github.com/actions/setup-node), [Configure Pages outputs](https://github.com/actions/configure-pages/blob/main/action.yml)
