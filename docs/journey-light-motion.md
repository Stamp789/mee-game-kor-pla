# World Journey — แสงและจังหวะกล้องรอบใหม่

23 ตุลาคม 2026

พรีวิวปัจจุบัน: http://127.0.0.1:4321/

ผู้ใช้เลือกฉากนี้เป็นหน้าแรกแล้ว ใช้ BaseLayout และธีมร่วมกับคลังม็อดและหน้ารายเกม เส้นทางพรีวิวเดิมเปลี่ยนไปหน้าแรก ส่วนดีไซน์ก่อนหน้านี้เก็บสำรองใน `artifacts/design-archive/before-journey-home/` อ่าน [สถานะทั้งเว็บ](world-journey-site.md)

## การเปลี่ยนแปลง

- เพิ่ม key light ฟ้า, fill light ม่วง และประกายทอง ปรับวัสดุ ก ให้เห็นพื้นผิวและขอบสะท้อนชัดขึ้น
- เพิ่มความสว่าง สี และขนาดอนุภาค พร้อมแกนแสงและขอบนุ่ม แยกเป็นชั้นสวนแสง ฉากหลัง และ bokeh ใกล้กล้อง
- ปรับ bloom ให้เน้นส่วนสว่าง และเพิ่มความสว่างภาพเกมในช่วงท้าย
- เปลี่ยนกล้องเป็น Catmull-Rom rail ต่อเนื่อง ใช้ arc-length sampling กับเส้นเวลาเร่ง–ผ่อน และเปลี่ยนมุมมองเล็กน้อยระหว่างเคลื่อนผ่าน
- ใช้สมการ critically damped แบบ analytic ทำให้การตาม scroll คงจังหวะเมื่อ frame rate เปลี่ยน พร้อมลดการกระชากของ parallax เมาส์
- กล้อง การจางฉาก ข้อความ และ chapter ใช้ progress ที่ผ่านการหน่วงตัวเดียวกัน
- ปุ่มพักยังหยุด ambient animation แต่ให้ผู้ชมเลื่อนสำรวจแบบภาพนิ่งได้ คง fallback และ reduced motion

## การตรวจ

- `node scripts/verify-journey-motion.mjs`: ผ่านการทดสอบขอบเขต การหยุดที่เป้าหมาย การกลับทิศ และความสอดคล้องของการคำนวณที่ 30/60/120 Hz
- `npm.cmd run check`: 0 errors / 0 warnings / 0 hints
- Build ผ่าน 36 static pages รวม route พรีวิวและข้อมูลม็อดเดิม 32 เกม
- Browser ขึ้น data-scene=ready; ไม่พบ error/warn ที่ตรวจ
- ช่วงกลาง: target และ displayed progress ลงที่ 0.363 พร้อม chapter 1; ช่วงท้าย 0.815 พร้อม chapter 2
- ทดสอบเลื่อนย้อนกลับ ปุ่มพัก/เปิด และข้ามไปผลงาน
- viewport จำลอง 360, 390, 768, 1440px ไม่มี horizontal overflow ตรวจภาพมือถือ 390px แล้ว

การทดสอบ 30/60/120 Hz เป็นการตรวจคณิตศาสตร์ของ motion ไม่ใช่ค่า FPS ที่วัดจากอุปกรณ์จริง ยังไม่ได้ benchmark โทรศัพท์จริงหรือจำลอง WebGL context loss รอบนี้

ไฟล์หลัก: `journey-scene.ts`, `journey-motion.ts`, `world-journey.ts`, `JourneyPreviewLayout.astro`, `pages/preview/journey.astro` และ `journey.css` ไม่มีการเผยแพร่ production
