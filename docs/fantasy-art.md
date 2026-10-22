# The Enchanted Archive — artwork and theme

The October 2026 fantasy redesign uses an original AI-generated landscape created with the built-in imagegen tool (not the fallback CLI). The final website asset is `assets/fantasy-sky-realm.webp` (1672 × 941, approximately 320 KiB). The original PNG remains in the Codex generated-images archive.

The image is decorative. Headings, game covers, controls, portal effects, and all interactive content are rendered separately in HTML/CSS/JavaScript. The artwork is not a picture of the website.

## Final generation prompt

Use case: stylized-concept. Asset type: wide cinematic background illustration for a premium Thai game translation website, not a website screenshot. Create an extraordinary luminous high-fantasy sky realm in a wide landscape composition. Towering floating limestone islands, delicate ivory-and-gold ruined arches, opalescent crystals, wisps of cascading waterfalls disappearing into clouds, distant fairy-tale spires, immense celestial moon halo. Ethereal painterly 3D fantasy game key art with rich intricate detail at the far left and far right edges and bottom corners, beautiful layered depth, warm champagne sunlight, lavender and periwinkle sky, turquoise water, blush blossoms and tiny golden stardust. Keep the central 55 percent airy pale lavender sky with very low detail and high luminance, suitable behind dark website typography and separate floating game cards. Frame the scene naturally from both sides, with a grand distant circular magical portal low in the center, never blocking the central upper copy area. Exquisitely art-directed, immersive, theatrical, dreamy and bright. Not dark. No people, no text, no letters, no logos, no UI, no game box covers, no watermark. Full bleed landscape 16:9.

## Implementation

- Active styles: `styles.css` and `theme-fantasy.css`.
- Prior arcade and retro stylesheets are preserved in the repository and Git history.
- The PromptPay artwork and all game cover assets are unchanged.
- Motion can be paused, follows the system reduced-motion preference, and never moves the payment QR.
- Game data, source links, and purchase destinations are unchanged.
